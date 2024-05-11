const { query, conn } = require("../database/conn");
const preprocessing = require("../lib/preprocessing");
const damerauLevenshtein = require("../lib/damerauLevenshtein");
const boyerMoore = require("../lib/boyerMoore");
const upload = require("../lib/configUpload");
const mammoth = require("mammoth");
const path = require("path");
const wordExists = require("word-exists");

const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const cheerio = require("cheerio");
const preprocessing2 = require("../lib/preprocessing2");
const split = require("../data/split");

const totalKamus = async (req, res) => {
  let totalKamus = await query(`SELECT COUNT(*) as total FROM kamus`);
  totalKamus = totalKamus[0]["total"];

  res.json({ totalKamus });
};
const getKamus = async (req, res) => {
  const { take = 50, skip = 0, abjad = "a", search } = req.query;
  let kamus, totalKamusAbjad, totalKamus;

  if (search) {
    kamus = await query(
      `SELECT * 
      FROM Kamus
      WHERE kata LIKE '%${search}%'
      ORDER BY kata ASC
      LIMIT ${Math.abs(parseInt(skip))}, ${parseInt(take)}`
    );
    totalKamusAbjad = await query(
      `SELECT COUNT(*) as total FROM kamus WHERE kata like '%${search}%'`
    );
    totalKamusAbjad = totalKamusAbjad[0]["total"];
  } else {
    kamus = await query(
      `SELECT * 
      FROM Kamus
      WHERE huruf='${abjad}'
      ORDER BY kata ASC
      LIMIT ${Math.abs(parseInt(skip))}, ${parseInt(take)}`
    );
    totalKamusAbjad = await query(
      `SELECT COUNT(*) as total FROM kamus WHERE huruf='${abjad}'`
    );
    totalKamusAbjad = totalKamusAbjad[0]["total"];
  }

  totalKamus = await query(`SELECT COUNT(*) as total FROM kamus`);
  totalKamus = totalKamus[0]["total"];

  return res.json({ kamus, totalKamusAbjad, totalKamus });
};

const getAllKamus = async (req, res) => {
  try {
    const kamus = await query(`SELECT * FROM kamus`);
    const kataArray = kamus.map((item) => item.kata);

    res.json(kataArray);
  } catch (error) {
    res.json({ data: error });
  }
};

const deteksiEjaan = async (req, res) => {
  const { reqInput } = req.body;

  const preProInput = preprocessing(reqInput);

  try {
    const kamusData = await query("SELECT * FROM kamus");

    const kamus = kamusData.map((item) => item.kata);
    const suggestWord = [];
    const dictionaryLookup = [];

    // 1. looping item dari reqInput yang sudah jadi array
    for (const itemPreProInput of preProInput) {
      // 2. pengecekan dictionary lookup
      if (kamus.includes(itemPreProInput.toLowerCase())) {
        dictionaryLookup.push(itemPreProInput.toLowerCase());
        continue;
      }

      // jika kata tidak ditemukan dalam kamus maka :
      const defaultDld = [
        {
          str: itemPreProInput,
          target: "-",
          distance: "-",
          similarity: "-",
        },
      ];

      // 3. hitung nilai DLD nya
      const suggestPerWord = [];

      // looping tiap kata di kamus dengan itemPreProInput
      for (const itemKamus of kamus) {
        const dld = damerauLevenshtein(itemPreProInput, itemKamus);
        suggestPerWord.push(dld);
      }

      const isDistanceBelowTwo = suggestPerWord.some(
        (item) => item.distance !== "-" && parseInt(item.distance) <= 2
      );

      // if (!isDistanceBelowTwo) {
      //   function tambahkanSpasi(string, kata, index) {
      //     let newString = string.substring(0, index);
      //     newString += " " + kata + " ";
      //     newString += string.substring(index + kata.length);
      //     return newString;
      //   }

      //   let input = itemPreProInput;

      //   kamus.map((item) => {
      //     let index = boyerMoore(input, item);

      //     if (index != -1) {
      //       console.log(item);
      //       let kata = input.substring(index, index + item.length);
      //       input = tambahkanSpasi(input, kata, index);
      //     }
      //   });
      //   console.log(input);
      // }

      // ambil nilai distance <= 2
      const dibawahDua = suggestPerWord
        .filter((item, i) => item.distance <= 2 && item.similarity >= 70)
        .sort((a, b) => b.similarity - a.similarity);

      if (dibawahDua.length > 0) {
        suggestWord.push(dibawahDua);
      } else {
        suggestWord.push(defaultDld);
      }
    }

    // console.log(suggestWord);
    return res.json({
      message: "true",
      suggestWord,
      dictionaryLookup,
    });
  } catch (error) {
    res.json(error);
  }
};

const uploadFile = async (req, res) => {
  // check folder if already exist
  if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
  }

  // get data kamus
  const kamusData = await query("SELECT * FROM kamus");

  upload(req, res, (err) => {
    if (err) {
      res.status(400).json({ message: err.message });
    } else {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // extract docx text file
      const fileName = req.file.originalname;
      const filePath = "./uploads/" + fileName;
      mammoth
        .extractRawText({ path: filePath })
        .then((result) => {
          // mulai deteksi ejaan
          const preProInput = preprocessing2(result.value);

          // kamus dari database karna bentuknya objectt ubah dulu ke bentuk array
          const kamus = kamusData.map((item) => item.kata);
          const suggestWord = [];

          // 1. looping item dari reqInput yang sudah jadi array
          for (const itemPreProInput of preProInput) {
            // 2. pengecekan dictionary lookup
            let kataIsExist = kamus.some(
              (item) => item.toLowerCase() === itemPreProInput.toLowerCase()
            );

            if (kataIsExist) continue;

            if (
              itemPreProInput.slice(-3) == "nya" &&
              itemPreProInput.slice(0, itemPreProInput.length - 3)
            )
              continue;

            if (itemPreProInput.match("-") != -1) {
              let split = itemPreProInput.split("-");
              let newArray = split.map(function (element) {
                return element.toLowerCase();
              });

              if (
                newArray.every((item) =>
                  kamus.some(
                    (kamusItem) =>
                      kamusItem.toLowerCase() === item.toLowerCase()
                  )
                )
              )
                continue;
            }
            if (wordExists(itemPreProInput)) {
              // cek kata bahasa inggris
              continue;
            }

            // jika kata tidak ditemukan dalam kamus maka :
            const defaultDld = [
              {
                str: itemPreProInput,
                target: "-",
                distance: "-",
                similarity: "-",
              },
            ];

            // 3. hitung nilai DLD nya
            const suggestPerWord = [];

            // looping tiap kata di kamus dengan itemPreProInput
            for (const itemKamus of kamus) {
              const dld = damerauLevenshtein(itemPreProInput, itemKamus);
              suggestPerWord.push(dld);
            }

            // ambil nilai distance <= 2
            const dibawahDua = suggestPerWord
              .filter((item, i) => item.distance <= 2 && item.similarity >= 70)
              .sort((a, b) => b.similarity - a.similarity);
            if (dibawahDua.length > 0) {
              suggestWord.push(dibawahDua);
            } else {
              suggestWord.push(defaultDld);
            }
          }

          // custom preprocessing ku
          // const filePath = path.join(__dirname, "resultprocessing.js");
          // fs.writeFile(
          //   filePath,
          //   // `${result.value}`,
          //   `const result = ${JSON.stringify(preProInput, null, 2)}`,
          //   (err) => {
          //     if (err) {
          //       console.error("Terjadi kesalahan saat menulis ke file:", err);
          //     } else {
          //       console.log("Preprocessing success...");
          //     }
          //   }
          // );

          split(suggestWord);

          return res.json({
            message: "hasil saran",
            fileName: fileName,
            suggestWord,
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("Failed to extract text from the Word file.");
        });
    }
  });
};

const TambahKata = async (req, res) => {
  const { inputs } = req.body;

  const kamusData = await query("SELECT * FROM kamus");
  const kamus = kamusData.map((item) => item.kata);

  const valuesInputsInKamus = inputs.filter((input) => kamus.includes(input));

  if (valuesInputsInKamus.length > 0) {
    return res.status(404).json({
      message: `Data duplikat: ${valuesInputsInKamus.join(", ")}`,
    });
  }

  inputs.forEach((value) => {
    const sql = "INSERT INTO kamus (kata, huruf) VALUES (?, ?)";
    conn.query(sql, [value, value[0]], (err, result) => {
      if (err) throw err;
    });
  });

  res.json({ message: "Data berhasil ditambahkan." });
};

const HapusKata = async (req, res) => {
  const id = req.params.id;
  await query(`DELETE FROM kamus WHERE id=${id}`);

  res.json({ message: "Berhasil dihapus." });
};

const UpdateKata = async (req, res) => {
  const id = req.params.id;
  const kata = req.body.kata;

  try {
    // Periksa apakah kata sudah ada di database
    const existingKata = await query(
      `SELECT * FROM kamus WHERE kata='${kata}'`
    );
    if (existingKata.length > 0) {
      return res.status(409).json({ message: "Kata sudah ada di database." });
    }

    // Lakukan update jika kata tidak ada di database
    await query(`UPDATE kamus SET kata='${kata}' WHERE id=${id}`);

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
