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

    res.json(kataArray);
  } catch (error) {
    res.json({ data: error });
  }
};

const deteksiEjaan = async (req, res) => {
  const { reqInput, kamusDetect } = req.body;

  let preProInput = preprocessing3(reqInput);

  if (kamusDetect.length != 0) {
    preProInput = preProInput.filter((item) => !kamusDetect.includes(item));
  }
  console.log(preProInput);

  const { suggestWord, dictionaryLookup } = await prosesDeteksi(preProInput);

  return res.json({
    suggestWord,
    dictionaryLookup,
  });
};

// custom preprocessing ku
// const filePath = path.join(__dirname, "resultprocessing.js");
// fs.writeFile(
//   filePath,
//   `const result = ${JSON.stringify(preProInput, null, 2)}`,
//   (err) => {
//     if (err) {
//       console.error("Terjadi kesalahan saat menulis ke file:", err);
//     } else {
//       split(suggestWord);
//       console.log("Preprocessing success...");
//     }
//   }
// );

const uploadFile = async (req, res) => {
  if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
  }

  upload(req, res, (err) => {
    if (err) {
      return console.log(err.message);
    } else {
      if (!req.file) {
        return console.log("No file uploaded");
      }

      const fileName = req.file.originalname;
      const filePath = "./uploads/" + fileName;
      mammoth
        .extractRawText({ path: filePath })
        .then(async (result) => {
          const preProInput = preprocessing3(result.value);
          const { suggestWord, dictionaryLookup } = await prosesDeteksi(
            preProInput
          );

          return res.json({
            suggestWord,
            dictionaryLookup,
          });
        })
        .catch((err) => {
          console.error(err);
        });
    }
  });
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

const downloadFile = async (req, res) => {
  const { fileName, saranKata } = req.body;

  const outputPath = path.join(__dirname, "../outputs");
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  // Baca isi dokumen Word sebagai buffer
  const filePath = path.join(__dirname, "../uploads", fileName);
  const content = fs.readFileSync(filePath, "binary");

  // Buat instance Docxtemplater
  const doc = new Docxtemplater(new PizZip(content), {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Data yang akan digunakan untuk mencari dan mengganti kata
  const data = saranKata.filter((item) => item.target != "-");

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

  const contentXml = doc.getZip().file("word/document.xml").asText();
  const $ = cheerio.load(contentXml, { xmlMode: true });

  // Panggil fungsi pencarian dan penggantian kata
  data.forEach((item) => {
    if (kataDitemukan(contentXml, item.str)) {
      console.log(item.str);
      cariDanGanti($, item);
    } else {
      console.log(`'${item.str}' tidak ditemukan dalam dokumen.`);
    }
  });

  // Mengganti konten dokumen dengan konten yang sudah dimodifikasi
  doc.getZip().file("word/document.xml", $.xml());

  // Simpan dokumen yang sudah dimodifikasi
  const outputBuf = doc.getZip().generate({ type: "nodebuffer" });
  fs.writeFileSync(path.join(__dirname, "../outputs/", fileName), outputBuf);

  res.download(path.join(__dirname, "../outputs/", fileName), (err) => {
    if (err) {
      console.log("Gagal mengunduh file:", err);
      res.status(500).send("Gagal mengunduh file");
    }
  });
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
