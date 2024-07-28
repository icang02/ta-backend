const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, "../data/kamus.js");
  const fetchKamus = await prisma.kamus.findMany();
  const kamusNotId = fetchKamus.map((item) => ({
    kata: item.kata,
    count: item.count,
  }));

  let kamus = kamusNotId;
  const input = [
    'InnoDB','peroleh',
  ];

  input.forEach((item) => {
    kamus.push({ kata: item, count: 0 });
  });

  kamus.sort((a, b) => {
    if (a.kata.toLowerCase() < b.kata.toLowerCase()) {
      return -1;
    }
    if (a.kata.toLowerCase() > b.kata.toLowerCase()) {
      return 1;
    }
    return 0;
  });

  const kamusUnique = [
    ...new Map(kamus.map((item) => [item.kata, item])).values(),
  ];

  fs.writeFile(
    filePath,
    `const kamus = ${JSON.stringify(
      kamusUnique,
      null,
      2
    )}; module.exports = kamus`,
    (err) => {
      if (err) {
        console.error("Terjadi kesalahan saat menulis ke file:", err);
      } else {
        console.log("Data baru ditambahkan...");
      }
    }
  );
}

main();
