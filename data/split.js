const fs = require("fs");
const path = require("path");

function split(data) {
  const listKamus = require("./list_1.0.0");

  const hasilDamerau = data.map((item) => item[0].str);

  const AdaDiKamus = hasilDamerau
    .filter((kata) => {
      const lowerCaseKata = kata.toLowerCase();
      return listKamus
        .map((kataKamus) => kataKamus.toLowerCase())
        .includes(lowerCaseKata);
    })
    .map((item) => item.toLowerCase());

  fs.writeFile(
    path.join(__dirname, "list_baru.js"),
    `const listBaru = ${JSON.stringify(
      [...new Set(AdaDiKamus)],
      null,
      2
    )}; module.exports = listBaru`,
    (err) => {
      if (err) {
        console.error("Terjadi kesalahan saat menulis ke file:", err);
      } else {
        console.log("Sukses...");
      }
    }
  );
}

module.exports = split;
