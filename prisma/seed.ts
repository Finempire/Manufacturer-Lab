import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const password_hash = await bcrypt.hash("Change@123", 12);

    // Create users for all 6 roles
    const roles = [
        { email: "accountant@cashflow.com", name: "Ravi Kumar", role: "ACCOUNTANT" },
        { email: "production@cashflow.com", name: "Suresh Patel", role: "PRODUCTION_MANAGER" },
        { email: "merch@cashflow.com", name: "Priya Sharma", role: "MERCHANDISER" },
        { email: "manager@cashflow.com", name: "Anil Gupta", role: "STORE_MANAGER" },
        { email: "runner@cashflow.com", name: "Vikram Singh", role: "RUNNER" },
        { email: "ceo@cashflow.com", name: "Rajesh Mehta", role: "CEO" },
    ];

    for (const r of roles) {
        await prisma.user.upsert({
            where: { email: r.email },
            update: {},
            create: {
                email: r.email,
                name: r.name,
                role: r.role,
                password_hash,
            },
        });
    }

    // Create sample buyers
    const buyers = [
        { name: "H&M India", brand_code: "HM-IN", contact_details: "hm@example.com" },
        { name: "Zara Export", brand_code: "ZARA-EX", contact_details: "zara@example.com" },
        { name: "Marks & Spencer", brand_code: "MNS", contact_details: "mns@example.com" },
    ];

    for (const b of buyers) {
        await prisma.buyer.upsert({
            where: { brand_code: b.brand_code },
            update: {},
            create: b,
        });
    }

    // Get a user for vendor creation
    const accountant = await prisma.user.findUnique({ where: { email: "accountant@cashflow.com" } });

    if (accountant) {
        // Create sample vendors
        const vendors = [
            { name: "Shree Textile Mills", gstin: "27AABCS1234Z1Z5", contact_person: "Mohan Lal", phone: "9876543210" },
            { name: "Gujarat Fabrics Pvt Ltd", gstin: "24AABCG5678Z2Z1", contact_person: "Dinesh Shah", phone: "9876543211" },
            { name: "Sri Balaji Trims", gstin: "33AABCS9012Z3Z7", contact_person: "Karthik R", phone: "9876543212" },
        ];

        for (const v of vendors) {
            const existing = await prisma.vendor.findFirst({ where: { name: v.name } });
            if (!existing) {
                await prisma.vendor.create({
                    data: { ...v, created_by_user_id: accountant.id },
                });
            }
        }

        // Create sample materials
        const materials = [
            { description: "Cotton Fabric 60\" Width", category: "FABRIC", unit_of_measure: "MTR", default_rate: 250 },
            { description: "Polyester Lining", category: "FABRIC", unit_of_measure: "MTR", default_rate: 120 },
            { description: "YKK Zipper 7\"", category: "TRIM", unit_of_measure: "PCS", default_rate: 15 },
            { description: "Buttons 4-Hole 20mm", category: "TRIM", unit_of_measure: "GRS", default_rate: 180 },
            { description: "Sewing Thread 5000m", category: "CONSUMABLE", unit_of_measure: "CON", default_rate: 85 },
        ];

        for (const m of materials) {
            const existing = await prisma.material.findFirst({ where: { description: m.description } });
            if (!existing) {
                await prisma.material.create({
                    data: { ...m, created_by_user_id: accountant.id },
                });
            }
        }
    }

    console.log("✅ Seed data created successfully");
    console.log("📧 Login credentials for all roles: <email>@cashflow.com / Change@123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
