import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password_hash = await bcrypt.hash("Change@123", 12);

  // Create users for all 7 roles
  const roles = [
    { email: "accountant@cashflow.com", name: "Ravi Kumar", role: "ACCOUNTANT" },
    { email: "sample.pm@cashflow.com", name: "Amit Verma", role: "SENIOR_MERCHANDISER" },
    { email: "production@cashflow.com", name: "Suresh Patel", role: "PRODUCTION_MANAGER" },
    { email: "merch@cashflow.com", name: "Priya Sharma", role: "MERCHANDISER" },
    { email: "manager@cashflow.com", name: "Anil Gupta", role: "STORE_MANAGER" },
    { email: "runner@cashflow.com", name: "Vikram Singh", role: "RUNNER" },
    { email: "ceo@cashflow.com", name: "Rajesh Mehta", role: "CEO" },
  ];

  for (const r of roles) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: { role: r.role as any },
      create: {
        email: r.email,
        name: r.name,
        role: r.role as any,
        password_hash,
        must_change_password: true,
      },
    });
  }

  const accountant = await prisma.user.findUnique({
    where: { email: "accountant@cashflow.com" },
  });

  if (!accountant) throw new Error("Accountant not found");

  // Create buyers with full details
  const buyers = [
    {
      name: "HM India",
      brand_code: "HM-IN",
      address: "Connaught Place, Delhi",
      email: "orders@hm-india.com",
      contact_person: "Neha Kapoor",
      phone: "9876543210",
    },
    {
      name: "Zara UK",
      brand_code: "ZR-UK",
      address: "London, UK",
      email: "orders@zara.co.uk",
      contact_person: "James Wilson",
      phone: "+44-7890123456",
    },
    {
      name: "M&S",
      brand_code: "MS-UK",
      address: "Manchester, UK",
      email: "orders@ms.co.uk",
      contact_person: "Sarah Thompson",
      phone: "+44-7890123457",
    },
  ];

  const createdBuyers: Record<string, string> = {};
  for (const b of buyers) {
    const buyer = await prisma.buyer.upsert({
      where: { brand_code: b.brand_code },
      update: {
        address: b.address,
        email: b.email,
        contact_person: b.contact_person,
        phone: b.phone,
      },
      create: {
        ...b,
        created_by_user_id: accountant.id,
      },
    });
    createdBuyers[b.brand_code] = buyer.id;
  }

  // Create styles
  const styles = [
    { style_code: "ST-001", style_name: "Men's Formal Shirt", category: "SHIRTS" },
    { style_code: "ST-002", style_name: "Women's Trouser", category: "TROUSERS" },
    { style_code: "ST-003", style_name: "Kids Jacket", category: "JACKETS" },
  ];

  const createdStyles: Record<string, string> = {};
  for (const s of styles) {
    const style = await prisma.style.upsert({
      where: { style_code: s.style_code },
      update: {},
      create: {
        ...s,
        created_by_user_id: accountant.id,
      },
    });
    createdStyles[s.style_code] = style.id;
  }

  // Create vendors
  const vendors = [
    {
      name: "Sharma Fabrics",
      gstin: "07AABCS1234Z1Z5",
      contact_person: "Mohan Sharma",
      phone: "9876543210",
      address: "Chandni Chowk, Delhi",
    },
    {
      name: "Mittal Traders",
      gstin: "07AABCM5678Z2Z1",
      contact_person: "Rakesh Mittal",
      phone: "9876543211",
      address: "Karol Bagh, Delhi",
    },
    {
      name: "Delhi Trim House",
      gstin: "07AABCD9012Z3Z7",
      contact_person: "Karthik R",
      phone: "9876543212",
      address: "Nehru Place, Delhi",
    },
  ];

  for (const v of vendors) {
    const existing = await prisma.vendor.findFirst({ where: { name: v.name } });
    if (!existing) {
      await prisma.vendor.create({
        data: { ...v, created_by_user_id: accountant.id },
      });
    }
  }

  // Create materials
  const materials = [
    {
      description: "Cotton Fabric 60\"",
      category: "FABRIC",
      unit_of_measure: "meters",
      default_rate: 250,
      sku_code: "MAT-001",
    },
    {
      description: "Denim 12oz",
      category: "FABRIC",
      unit_of_measure: "meters",
      default_rate: 380,
      sku_code: "MAT-002",
    },
    {
      description: "YKK Zipper 18cm",
      category: "TRIM",
      unit_of_measure: "pieces",
      default_rate: 15,
      sku_code: "MAT-003",
    },
  ];

  for (const m of materials) {
    const existing = await prisma.material.findFirst({
      where: { description: m.description },
    });
    if (!existing) {
      await prisma.material.create({
        data: { ...m, created_by_user_id: accountant.id },
      });
    }
  }

  // Create sample orders
  const existingOrder1 = await prisma.order.findUnique({
    where: { order_no: "ORD-2026-0001" },
  });

  if (!existingOrder1) {
    await prisma.order.create({
      data: {
        order_no: "ORD-2026-0001",
        buyer_id: createdBuyers["HM-IN"],
        order_date: new Date("2026-03-01"),
        shipping_date: new Date("2026-04-15"),
        order_type: "SAMPLE",
        total_amount: 15000,
        remarks: "Sample order for Spring Collection 2026",
        status: "ORDER_RECEIVED",
        created_by: accountant.id,
        lines: {
          create: [
            {
              style_id: createdStyles["ST-001"],
              description: "Formal Shirt - White",
              quantity: 50,
              rate: 200,
              amount: 10000,
            },
            {
              style_id: createdStyles["ST-003"],
              description: "Kids Jacket - Navy",
              quantity: 25,
              rate: 200,
              amount: 5000,
            },
          ],
        },
      },
    });
  }

  const existingOrder2 = await prisma.order.findUnique({
    where: { order_no: "ORD-2026-0002" },
  });

  if (!existingOrder2) {
    await prisma.order.create({
      data: {
        order_no: "ORD-2026-0002",
        buyer_id: createdBuyers["ZR-UK"],
        order_date: new Date("2026-03-05"),
        shipping_date: new Date("2026-05-01"),
        order_type: "PRODUCTION",
        total_amount: 125000,
        remarks: "Bulk production order - Summer 2026",
        status: "ORDER_RECEIVED",
        created_by: accountant.id,
        lines: {
          create: [
            {
              style_id: createdStyles["ST-001"],
              description: "Formal Shirt - Blue Check",
              quantity: 500,
              rate: 150,
              amount: 75000,
            },
            {
              style_id: createdStyles["ST-002"],
              description: "Women's Trouser - Black",
              quantity: 250,
              rate: 200,
              amount: 50000,
            },
          ],
        },
      },
    });
  }

  console.log("Seed data created successfully");
  console.log("");
  console.log("Login credentials (all use password: Change@123):");
  console.log("  Accountant:  accountant@cashflow.com");
  console.log("  Sample PM:   sample.pm@cashflow.com");
  console.log("  Production:  production@cashflow.com");
  console.log("  Merchandiser: merch@cashflow.com");
  console.log("  Store Mgr:   manager@cashflow.com");
  console.log("  Runner:      runner@cashflow.com");
  console.log("  CEO:         ceo@cashflow.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
