const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const kamusData = require("../data/kamus");

const prisma = new PrismaClient();

async function main() {
  const rawQuery1 = `TRUNCATE TABLE kamus`;
  const rawQuery2 = `TRUNCATE TABLE user`;

  // execution truncate table
  await prisma.$executeRawUnsafe(rawQuery1);
  await prisma.$executeRawUnsafe(rawQuery2);

  // user seed
  await prisma.user.create({
    data: {
      name: "Adminstrator",
      username: "admin",
      password: await bcrypt.hash("admin123", 10),
    },
  });

  // kamus seed
  const sortKamusData = kamusData.sort((a, b) => a.localeCompare(b));
  for (const item of sortKamusData) {
    try {
      await prisma.kamus.create({
        data: {
          kata: item,
          huruf: item[0].toLowerCase(),
        },
      });
    } catch (error) {
      console.log("seeding failed..");
      console.log("duplikat : " + item);
    }
  }

  console.log("seeding successfully..");
}

main();

// cek duplikat
// const data = kamusData.map((item) => item.toLowerCase());
// for (let i = 1; i < kamusData.length; i++) {
//   if (data[i] == data[i - 1]) console.log(data[i]);
// }
