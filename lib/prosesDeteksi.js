const { PrismaClient } = require("@prisma/client");
const wordExists = require("word-exists");
// const path = require("path");
const fs = require("fs");

const damerauLevenshtein = require("./damerauLevenshtein");
const separateWords = require("./separateWords");

const prisma = new PrismaClient();

function hasCapitalInMiddle(str) {
  const middlePart = str.slice(1, -1); // Mengambil bagian tengah string
  const endPart = str.slice(-1); // Mengambil karakter terakhir

  const hasCapitalInMiddle = /[A-Z]/.test(middlePart); // Cek huruf kapital di tengah
  const hasCapitalAtEnd = /[A-Z]$/.test(endPart); // Cek huruf kapital di akhir

  return hasCapitalInMiddle || hasCapitalAtEnd; // Cek salah satu kondisi
}

function hasSingleDashInMiddle(word) {
  // Memeriksa jika panjang string kurang dari 3
  if (word.length < 3) {
    return false;
  }

  const middlePart = word.slice(1, -1); // Mengambil bagian tengah string
  const regex = /^[^-]+[-|–][^-]+$/; // RegExp untuk simbol '-' di tengah
  return regex.test(middlePart); // Cek apakah cocok dengan pola
}

function hasMoreThanOneDashInMiddle(word) {
  // Memeriksa jika panjang string kurang dari 3
  if (word.length < 3) {
    return false;
  }

  const middlePart = word.slice(1, -1); // Mengambil bagian tengah string

  // Hitung jumlah tanda hubung di bagian tengah
  const dashCount = (middlePart.match(/[-|–]/g) || []).length;

  return dashCount > 1; // Cek apakah ada lebih dari satu tanda hubung
}

const prosesDeteksi = async (preProInput, type = 0) => {
  try {
    const kamusData = await prisma.kamus.findMany();

    const kamus = kamusData.map((item) => item.kata);
    const kamusPriority = kamusData
      .filter((item) => item.count != 0)
      .sort((a, b) => b.count - a.count)
      .map((item) => item.kata);
    const kamusNotPriority = kamusData
      .filter((item) => item.count == 0)
      .map((item) => item.kata);

    const suggestWord = [];
    const dictionaryLookup = [];
    const dictionaryLookup2 = [];

    // 1. looping item dari reqInput yang sudah jadi array
    let jumlahKataValid = 0;
    for (const itemPreProInput of preProInput) {
      // 2. pengecekan dictionary lookup
      let kataIsExist = kamus.some(
        (item) => item.toLowerCase() === itemPreProInput.toLowerCase()
      );

      if (
        kataIsExist &&
        hasCapitalInMiddle(itemPreProInput) &&
        itemPreProInput != itemPreProInput.toUpperCase()
      ) {
        let saran = kamus.find(
          (item) => item.toLowerCase() == itemPreProInput.toLowerCase()
        );

        if (saran === itemPreProInput) continue;

        if (
          saran == saran.toLowerCase() &&
          itemPreProInput[0] == itemPreProInput[0].toUpperCase()
        ) {
          saran = saran[0].toUpperCase() + saran.slice(1).toLowerCase();
        }

        suggestWord.push({
          string: itemPreProInput,
          suggestions: saran,
        });
      }

      // skip kata yang benar
      if (kataIsExist) {
        jumlahKataValid++;
        dictionaryLookup.push(itemPreProInput);
        continue;
      }

      // skip kata benar diakhiri "nya"
      if (
        itemPreProInput.slice(-3) == "nya" &&
        kamus.some(
          (item) =>
            item.toLowerCase() ===
            itemPreProInput.slice(0, itemPreProInput.length - 3).toLowerCase()
        )
      ) {
        jumlahKataValid++;
        dictionaryLookup2.push(itemPreProInput);
        continue;
      }

      // skip kata yg valid yg diapit tanda (-)
      if (hasSingleDashInMiddle(itemPreProInput)) {
        let split = itemPreProInput.split(/-|–/);
        let newArray = split.map(function (element) {
          return element.toLowerCase();
        });

        const containsNumber = newArray.some(function (element) {
          return !isNaN(element) && element.trim() !== ""; // Cek apakah elemen bisa dikonversi ke angka
        });
        if (containsNumber) continue;

        let isEnglish = newArray.every((element) => wordExists(element));
        if (isEnglish) continue;

        let isAllInKamus = newArray.every((element) => kamus.includes(element));

        if (isAllInKamus) {
          jumlahKataValid++;
          dictionaryLookup2.push(itemPreProInput);
          continue;
        } else {
          suggestWord.push({
            string: itemPreProInput,
            suggestions: [],
          });
          continue;
        }
      }

      if (hasMoreThanOneDashInMiddle(itemPreProInput)) {
        let split = itemPreProInput.split(/-|–/);
        let newArray = split.map(function (element) {
          return element.toLowerCase();
        });

        let isEnglish = newArray.every((element) => wordExists(element));
        if (isEnglish) continue;
      }

      // skip kata yg valid yg diapit tanda (/)
      if (itemPreProInput.match("/") != -1) {
        let split = itemPreProInput.split("/");
        let newArray = split.map(function (element) {
          return element.toLowerCase();
        });

        if (
          newArray.every((item) =>
            kamus.some(
              (kamusItem) =>
                kamusItem.toLowerCase() ===
                (item.slice(-3) == "nya"
                  ? item.slice(0, item.length - 3).toLowerCase()
                  : item)
            )
          )
        ) {
          jumlahKataValid++;
          dictionaryLookup2.push(itemPreProInput);
          continue;
        }
      }

      // skip kata bahasa inggris
      if (wordExists(itemPreProInput)) {
        continue;
      }

      // 3. hitung nilai DLD nya

      // looping tiap kata di kamus dengan itemPreProInput
      const suggestPerWord = [];

      // Iterasi melalui kamus prioritas dan hitung Damerau-Levenshtein Distance (DLD)
      for (const itemKamus of kamus) {
        const dld = damerauLevenshtein(itemPreProInput, itemKamus);
        suggestPerWord.push(dld);
      }

      // Deklarasi variabel untuk menyimpan hasil akhir
      let resultDLD;
      resultDLD = suggestPerWord
        .filter((item) => item.distance <= 3 && item.similarity >= 60)
        .sort((a, b) => b.similarity - a.similarity);

      if (resultDLD.length > 0) {
        let wordSuggestions;

        if (resultDLD.length > 10) {
          wordSuggestions = resultDLD.splice(0, 10).map((item) => ({
            target: item.target,
            distance: item.distance,
            similarity: item.similarity,
          }));
        } else {
          wordSuggestions = resultDLD.map((item) => ({
            target: item.target,
            distance: item.distance,
            similarity: item.similarity,
          }));
        }

        const resultWordSuggestions = {
          string: resultDLD[0].str,
          suggestions:
            wordSuggestions.length == 1 ? wordSuggestions[0] : wordSuggestions,
        };

        suggestWord.push(resultWordSuggestions);
      } else {
        // else split BM
        let hasilSplitBM = separateWords(
          kamusPriority,
          itemPreProInput.toLowerCase()
        );

        if (
          hasilSplitBM == -1 ||
          hasilSplitBM == itemPreProInput.toLowerCase()
        ) {
          suggestWord.push({
            string: itemPreProInput,
            suggestions: [],
          });
        } else {
          const simpanResulAkhir = [];
          const inputBaru = hasilSplitBM.split(/\s+/);

          for (const itemInputBaru of inputBaru) {
            let simpanPerWord = [];

            for (const itemKamus of kamusPriority) {
              const dld = damerauLevenshtein(
                itemInputBaru.toLowerCase(),
                itemKamus.toLowerCase()
              );
              simpanPerWord.push(dld);
            }

            // Deklarasi variabel untuk menyimpan hasil akhir
            let resultDLD;

            // Cek apakah ada item dengan distance <= 3 di suggestPerWord
            resultDLD = simpanPerWord.sort(
              (a, b) => b.similarity - a.similarity
            );

            resultDLD.sort((a, b) => b.similarity - a.similarity);
            simpanResulAkhir.push(resultDLD[0]);
          }

          const hasil = simpanResulAkhir.map((item) => item.target);
          // console.log(hasil);
          // AKHIR CARI SPLIT HASIL HM

          suggestWord.push({
            string: itemPreProInput,
            suggestions: hasil.join(" "),
            // type: 2,
          });
        }
      }
    }

    // jumlah kata yang benar

    if (type == 1) {
      const data = kamusUpdate(dictionaryLookup);

      data.forEach(async (item) => {
        let word = await prisma.kamus.findFirst({
          where: { kata: item.string },
        });

        await prisma.kamus.update({
          where: { id: word.id },
          data: {
            count: word.count + item.count,
          },
        });
      });
    }

    return {
      suggestWord,
      dictionaryLookup: [...dictionaryLookup, ...dictionaryLookup2],
      jumlahKataValid,
    };
  } catch (error) {
    console.log(error);
  }
};

const kamusUpdate = (dictionaryLookup) => {
  const words = dictionaryLookup.map((item) => item.toLowerCase());

  // Langkah 2: Buat objek untuk menyimpan jumlah kemunculan setiap kata
  const wordCount = {};

  // Langkah 3: Iterasi melalui array kata-kata dan hitung jumlah kemunculan setiap kata
  words.forEach((word) => {
    if (wordCount[word]) {
      wordCount[word]++;
    } else {
      wordCount[word] = 1;
    }
  });

  // Langkah 4: Ubah objek hasil perhitungan menjadi array objek
  const result = Object.keys(wordCount).map((key) => ({
    string: key,
    count: wordCount[key],
  }));

  return result;
};

module.exports = prosesDeteksi;
