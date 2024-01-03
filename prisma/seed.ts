const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    const csvFilePath = path.resolve(__dirname, "shelter-ishikawa.csv");
    const csvData = fs.readFileSync(csvFilePath, "utf-8");

    const rows = csvData.split("\n");
    for (const row of rows) {
      const columns = row.split(",");
      const name = columns[3].trim();
      const location = columns[4].trim();

      await prisma.shelter.create({
        data: {
          name: name,
          location: location,
          capacity: 0,
        },
      });
    }

    console.log("Prisma seeds created successfully");
  } catch (error) {
    console.error("Error creating Prisma seeds:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
