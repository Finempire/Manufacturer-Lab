const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findUnique({
        where: { email: "accountant@cashflow.com" }
    });

    console.log(user);

    if (user) {
        const isValid = await bcrypt.compare("Change@123", user.password_hash);
        console.log("Password valid:", isValid);
    }
}

check().finally(() => prisma.$disconnect());
