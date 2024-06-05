const upload = require("../lib/configUpload");
const mammoth = require("mammoth");
const path = require("path");

const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const cheerio = require("cheerio");
const preprocessing3 = require("../lib/preprocessing3");
const prosesDeteksi = require("../lib/prosesDeteksi");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const totalKamus = async (req, res) => {
  let totalKamus = await prisma.kamus.count();

  res.json({ totalKamus });
};

const getKamus = async (req, res) => {
  const { take = 50, skip = 0, abjad = "a", search } = req.query;

  let kamus;
  let totalKamusAbjad;
  let totalKamus;

  try {
    if (search) {
      kamus = await prisma.kamus.findMany({
        where: {
          kata: {
            contains: search,
          },
        },
        orderBy: {
          kata: "asc",
        },
        skip: parseInt(skip),
        take: parseInt(take),
      });

      totalKamusAbjad = await prisma.kamus.count({
        where: {
          kata: {
            contains: search,
          },
        },
      });
    } else {
      kamus = await prisma.kamus.findMany({
        where: {
          kata: {
            startsWith: abjad,
          },
        },
        orderBy: {
          kata: "asc",
        },
        skip: parseInt(skip),
        take: parseInt(take),
      });

      totalKamusAbjad = await prisma.kamus.count({
        where: {
          kata: {
            startsWith: abjad,
          },
        },
      });
    }

    totalKamus = await prisma.kamus.count();

    return res.json({ kamus, totalKamusAbjad, totalKamus });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllKamus = async (req, res) => {
  try {
    const kamus = await prisma.kamus.findMany();
    const kataArray = kamus.map((item) => item.kata);

    res.json({ kataArray, kamus });
  } catch (error) {
    res.json({ data: error });
  }
};

const deteksiEjaan = async (req, res) => {
  const { reqInput, kamusDetect } = req.body;

  let preProInput = preprocessing3(reqInput);

  if (kamusDetect.length != 0) {
    const kamusDetectLower = kamusDetect.map((item) => item.toLowerCase());
    preProInput = preProInput.filter(
      (item) => !kamusDetectLower.includes(item.toLowerCase())
    );
  }

  const { suggestWord, dictionaryLookup } = await prosesDeteksi(preProInput);

  return res.json({
    suggestWord,
    dictionaryLookup,
  });
};

const uploadFile = async (req, res) => {
  if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
  }

  // validasi file

  upload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).send({
          message: "Ukuran file maksimal 1MB.",
        });
      } else {
        return res.status(400).json({ message: err });
      }
    } else {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const timeDeleteFile = 60 * 60 * 1000;
      // Hapus file setelah diupload
      setTimeout(() => {
        const outputPath = "./outputs/" + fileName;
        // Cek apakah file ada sebelum menghapusnya
        const pathFileUpload = fs.existsSync(filePath);
        const pathFileOutput = fs.existsSync(outputPath);

        if (pathFileUpload) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
            } else {
              // console.log("File deleted:", filePath);
            }
          });
        }

        if (pathFileOutput) {
          fs.unlink(outputPath, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
            } else {
              // console.log("File deleted:", filePath);
            }
          });
        }
      }, timeDeleteFile);

      const fileName = req.file.originalname;
      const filePath = "./uploads/" + fileName;

      const fileType = path.extname(req.file.originalname).toLowerCase();

      if (fileType === ".docx") {
        // ================================================================
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
        // ================================================================

        mammoth
          .extractRawText({ path: filePath })
          .then(function (result1) {
            var text = result1.value;

            // Gunakan hasil text dari mammoth pertama di sini
            mammoth
              .extractRawText({ buffer: outputBuf })
              .then(async (result2) => {
                const preProInput = preprocessing3(result2.value, 1, text); // Gunakan text dari mammoth pertama
                const { suggestWord, dictionaryLookup } = await prosesDeteksi(
                  preProInput,
                  1
                );

                return res.json({
                  suggestWord,
                  dictionaryLookup,
                  fileName,
                });
              })
              .catch((err) => {
                console.error(err);
              });
          })
          .catch(function (error) {
            console.error(error);
          });
      } else {
        fs.readFile(filePath, "utf8", async (err, data) => {
          if (err) {
            return res.status(500).json({ message: "Error reading file." });
          }

          const preProInput = preprocessing3(data);
          const { suggestWord, dictionaryLookup } = await prosesDeteksi(
            preProInput
          );

          return res.json({
            suggestWord,
            dictionaryLookup,
            fileName,
          });
        });
      }
    }
  });
};

// cek kata
function kataDitemukan(teks, kata) {
  return new RegExp(`\\b${kata}\\b`, "g").test(teks);
}

// Fungsi untuk melakukan pencarian dan penggantian kata
function cariDanGanti($, data) {
  // Melakukan pencarian dan penggantian kata dalam konten XML
  $("w\\:t").each(function () {
    const textContent = $(this).text();

    const newTextContent = textContent.replace(
      new RegExp(`\\b${data.str}\\b`, "g"),
      data.target
    );

    $(this).text(newTextContent);
  });
}

const downloadFile = async (req, res) => {
  const { fileName, saranKata } = req.body;
  console.log(fileName);

  const outputPath = path.join(__dirname, "../outputs");
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  const filePath = path.join(__dirname, "../uploads", fileName);
  const fileType = path.extname(filePath).toLowerCase();
  const data = saranKata.filter((item) => item.target != "-");

  if (fileType == ".docx") {
    const content = fs.readFileSync(filePath, "binary");

    // Buat instance Docxtemplater
    const doc = new Docxtemplater(new PizZip(content), {
      paragraphLoop: true,
      linebreaks: true,
    });

    const contentXml = doc.getZip().file("word/document.xml").asText();
    const $ = cheerio.load(contentXml, { xmlMode: true });

    // Panggil fungsi pencarian dan penggantian kata
    data.forEach((item) => {
      // console.log(item);
      cariDanGanti($, item);
    });

    // Mengganti konten dokumen dengan konten yang sudah dimodifikasi
    doc.getZip().file("word/document.xml", $.xml());

    // Simpan dokumen yang sudah dimodifikasi
    const outputBuf = doc.getZip().generate({ type: "nodebuffer" });
    fs.writeFileSync(path.join(__dirname, "../outputs/", fileName), outputBuf);

    return res.download(
      path.join(__dirname, "../outputs/", fileName),
      (err) => {
        if (err) {
          console.log("Gagal mengunduh file:", err);
          res.status(500).send("Gagal mengunduh file");
        }
      }
    );
  } else {
    fs.readFile(filePath, "utf8", (err, text) => {
      if (err) {
        return res.status(500).send("Error reading file.");
      }
      let dataText = text;

      data.forEach((item) => {
        if (kataDitemukan(dataText, item.str)) {
          // console.log(item.str);

          dataText = dataText.replace(
            new RegExp(`\\b${item.str}\\b`, "g"),
            item.target
          );
        } else {
          // console.log(`'${item.str}' tidak ditemukan dalam dokumen.`);
        }
      });
      // console.log(dataText);

      const updatedFilePath = path.join(__dirname, "../outputs/", fileName);
      fs.writeFile(updatedFilePath, dataText, "utf8", (err) => {
        if (err) {
          return res.status(500).send("Error writing file.");
        }

        // Kirim file untuk di-download
        return res.download(updatedFilePath, fileName, (err) => {
          if (err) {
            return res.status(500).send("Error downloading file.");
          }
        });
      });
    });
  }
};

const TambahKata = async (req, res) => {
  const { inputs } = req.body;

  const kamusData = await prisma.kamus.findMany();
  const kamus = kamusData.map((item) => item.kata);

  const valuesInputsInKamus = inputs.filter((input) => kamus.includes(input));

  if (valuesInputsInKamus.length > 0) {
    return res.status(404).json({
      message: `Data duplikat: ${valuesInputsInKamus.join(", ")}`,
    });
  }

  for (const value of inputs) {
    await prisma.kamus.create({
      data: {
        kata: value,
      },
    });
  }

  res.json({ message: "Data berhasil ditambahkan." });
};

const HapusKata = async (req, res) => {
  const id = req.params.id;
  await prisma.kamus.delete({
    where: {
      id: parseInt(id),
    },
  });

  res.json({ message: "Berhasil dihapus." });
};

const UpdateKata = async (req, res) => {
  const id = req.params.id;
  const kata = req.body.kata;

  try {
    // Periksa apakah kata sudah ada di database
    const existingKata = await prisma.kamus.count({
      where: { kata: kata },
    });
    if (existingKata > 0) {
      return res.status(409).json({ message: "Kata sudah ada di database." });
    }

    // Lakukan update jika kata tidak ada di database
    await prisma.kamus.update({
      where: {
        id: parseInt(id),
      },
      data: { kata: kata },
    });

    res.status(200).json({ message: "Berhasil diupdate." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getKamus,
  deteksiEjaan,
  getAllKamus,
  uploadFile,
  TambahKata,
  UpdateKata,
  HapusKata,
  totalKamus,
  downloadFile,
};
