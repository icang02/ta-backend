console.clear();
const fs = require("fs");

const kamus = require("../data/kamus");
const path = require("path");

const input = [];

const result = [...new Set(input.concat(kamus))]
  .sort((a, b) => a.localeCompare(b))
  .filter((item) => item != "");

const filePath = path.join(__dirname, "../data/kamus.js");
fs.writeFile(
  filePath,
  `const kamus = ${JSON.stringify(result, null, 2)}; module.exports = kamus`,
  (err) => {
    if (err) {
      console.error("Terjadi kesalahan saat menulis ke file:", err);
    } else {
      console.log("Data baru ditambahkan...");
    }
  }
);
