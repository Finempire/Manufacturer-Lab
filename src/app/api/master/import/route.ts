import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import * as XLSX from "xlsx";

type EntityType = "buyers" | "vendors" | "materials" | "styles";

interface RowResult {
  row: number;
  data: Record<string, string>;
  status: "success" | "error" | "duplicate";
  error?: string;
}

const REQUIRED_FIELDS: Record<EntityType, string[]> = {
  buyers: ["name", "brand_code"],
  vendors: ["name"],
  materials: ["description", "unit_of_measure"],
  styles: ["style_code", "style_name"],
};

const VALID_FIELDS: Record<EntityType, string[]> = {
  buyers: ["name", "brand_code", "contact_person", "phone", "shipping_address", "notes"],
  vendors: ["name", "contact_person", "phone", "address", "gstin", "notes"],
  materials: ["description", "unit_of_measure", "category", "sku_code"],
  styles: ["style_code", "style_name", "description", "category"],
};

export async function POST(req: Request) {
  const auth = await requireRole(["ACCOUNTANT"]);
  if (!auth.authorized) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entity_type") as EntityType;
    const mode = formData.get("mode") as string; // "preview" or "commit"

    if (!file || !entityType) {
      return NextResponse.json(
        { error: "File and entity_type are required" },
        { status: 400 }
      );
    }

    if (!REQUIRED_FIELDS[entityType]) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }

    // Parse Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: "",
    });

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: "File is empty or has no data rows" },
        { status: 400 }
      );
    }

    // Normalize headers
    const rows = rawData.map((row) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
        if (VALID_FIELDS[entityType].includes(normalizedKey)) {
          normalized[normalizedKey] = String(value).trim();
        }
      }
      return normalized;
    });

    // Validate rows
    const results: RowResult[] = [];
    const required = REQUIRED_FIELDS[entityType];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const missingFields = required.filter((f) => !row[f]);

      if (missingFields.length > 0) {
        results.push({
          row: i + 2, // Excel row (1-indexed + header)
          data: row,
          status: "error",
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
        continue;
      }

      // Check for duplicates in DB
      const isDuplicate = await checkDuplicate(entityType, row);
      if (isDuplicate) {
        results.push({
          row: i + 2,
          data: row,
          status: "duplicate",
          error: `Duplicate: ${isDuplicate}`,
        });
        continue;
      }

      results.push({
        row: i + 2,
        data: row,
        status: "success",
      });
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;
    const duplicateCount = results.filter(
      (r) => r.status === "duplicate"
    ).length;

    // Preview mode - just return validation results
    if (mode !== "commit") {
      return NextResponse.json({
        mode: "preview",
        totalRows: rows.length,
        successCount,
        errorCount,
        duplicateCount,
        results,
      });
    }

    // Commit mode - insert valid rows
    const toInsert = results.filter((r) => r.status === "success");
    let inserted = 0;

    for (const item of toInsert) {
      try {
        await insertRow(entityType, item.data);
        inserted++;
      } catch (err) {
        item.status = "error";
        item.error = err instanceof Error ? err.message : "Insert failed";
      }
    }

    return NextResponse.json({
      mode: "commit",
      totalRows: rows.length,
      inserted,
      errorCount: results.filter((r) => r.status === "error").length,
      duplicateCount,
      results,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to process import file" },
      { status: 500 }
    );
  }
}

// GET endpoint to download templates
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entity_type") as EntityType;

  if (!entityType || !VALID_FIELDS[entityType]) {
    return NextResponse.json(
      { error: "Invalid entity_type" },
      { status: 400 }
    );
  }

  const headers = VALID_FIELDS[entityType].map((f) =>
    f
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  // Set column widths
  ws["!cols"] = headers.map(() => ({ width: 20 }));

  XLSX.utils.book_append_sheet(wb, ws, entityType);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${entityType}_import_template.xlsx"`,
    },
  });
}

async function checkDuplicate(
  entityType: EntityType,
  row: Record<string, string>
): Promise<string | null> {
  switch (entityType) {
    case "buyers": {
      const existing = await prisma.buyer.findFirst({
        where: {
          OR: [
            { name: { equals: row.name, mode: "insensitive" } },
            { brand_code: { equals: row.brand_code, mode: "insensitive" } },
          ],
        },
      });
      return existing
        ? `Buyer "${existing.name}" (${existing.brand_code}) already exists`
        : null;
    }
    case "vendors": {
      const existing = await prisma.vendor.findFirst({
        where: { name: { equals: row.name, mode: "insensitive" } },
      });
      return existing ? `Vendor "${existing.name}" already exists` : null;
    }
    case "materials": {
      const existing = await prisma.material.findFirst({
        where: { description: { equals: row.description, mode: "insensitive" } },
      });
      return existing
        ? `Material "${existing.description}" already exists`
        : null;
    }
    case "styles": {
      const existing = await prisma.style.findFirst({
        where: { style_code: { equals: row.style_code, mode: "insensitive" } },
      });
      return existing
        ? `Style "${existing.style_code}" already exists`
        : null;
    }
    default:
      return null;
  }
}

async function insertRow(
  entityType: EntityType,
  data: Record<string, string>
) {
  switch (entityType) {
    case "buyers":
      await prisma.buyer.create({
        data: {
          name: data.name,
          brand_code: data.brand_code,
          contact_person: data.contact_person || null,
          phone: data.phone || null,
          email: data.email || null,
          shipping_address: data.shipping_address || null,
          notes: data.notes || null,
        },
      });
      break;
    case "vendors":
      await prisma.vendor.create({
        data: {
          name: data.name,
          contact_person: data.contact_person || null,
          phone: data.phone || null,
          address: data.address || null,
          gstin: data.gstin || null,
          notes: data.notes || null,
        },
      });
      break;
    case "materials":
      await prisma.material.create({
        data: {
          description: data.description,
          unit_of_measure: data.unit_of_measure,
          category: data.category || "GENERAL",
          sku_code: data.sku_code || null,
        },
      });
      break;
    case "styles":
      await prisma.style.create({
        data: {
          style_code: data.style_code,
          style_name: data.style_name,
          description: data.description || null,
          category: data.category || null,
        },
      });
      break;
  }
}
