const fs = require("fs");
const path = require("path");
const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
const cheerio = require("cheerio");
const mammoth = require("mammoth");

const revSubSupScript = (fileName) => {
  const filePath = path.join(__dirname, "../", `/uploads/${fileName}`);
  const content = fs.readFileSync(filePath, "binary");

  // Buat instance Docxtemplater
  const doc = new Docxtemplater(new PizZip(content), {
    paragraphLoop: true,
    linebreaks: true,
  });

  const contentXml = doc.getZip().file("word/document.xml").asText();
  const $ = cheerio.load(contentXml, { xmlMode: true });

  // Temukan dan hapus kata yang mengandung subscript
  $("w\\:r").each(function () {
    let $run = $(this);
    let hasSubscript =
      $run.find("w\\:vertAlign[w\\:val='subscript']").length > 0;
    let hasSuperscript =
      $run.find("w\\:vertAlign[w\\:val='superscript']").length > 0;

    // Jika ditemukan subscript atau superscript, hapus seluruh teks di dalam elemen <w:r>
    if (hasSubscript || hasSuperscript) {
      $run.find("w\\:t").text("");
    }
  });

  // generate file word
  doc.getZip().file("word/document.xml", $.xml());

  // Simpan dokumen yang sudah dimodifikasi
  const outputBuf = doc.getZip().generate({ type: "nodebuffer" });

  mammoth
    .extractRawText({ buffer: outputBuf })
    .then(function (result) {
      return result.value;
    })
    .catch(function (err) {
      console.log(err);
    });
};

// revSubSupScript("jurnal.docx");

module.exports = revSubSupScript;
