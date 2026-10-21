import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.patch.upsert({
    where: { slug: "parche-1" },
    update: {},
    create: { slug: "parche-1", name: "Parche 1", notes: "Parche inicial de la wiki." },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
