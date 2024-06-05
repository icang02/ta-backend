const { PrismaClient } = require("@prisma/client");
const wordExists = require("word-exists");
const path = require("path");
const fs = require("fs");

const damerauLevenshtein = require("./damerauLevenshtein");
const splitBM = require("./splitBM");

const prisma = new PrismaClient();

const prosesDeteksi = async (preProInput, type = 0) => {
  try {
    const kamusData = await prisma.kamus.findMany();

    console.log(wordExists("what"));

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

    // 1. looping item dari reqInput yang sudah jadi array
    let jumlah = 0;
    for (const itemPreProInput of preProInput) {
      // 2. pengecekan dictionary lookup
      let kataIsExist = kamus.some(
        (item) => item.toLowerCase() === itemPreProInput.toLowerCase()
      );

      // skip kata yang benar
      if (kataIsExist) {
        jumlah++;
        dictionaryLookup.push(itemPreProInput);
        continue;
      }

      // skip kata benar diakhiri "nya"
      if (
        itemPreProInput.slice(-3) == "nya" &&
        itemPreProInput.slice(0, itemPreProInput.length - 3)
      ) {
        jumlah++;
        continue;
      }

      // skip kata yg valid yg diapit tanda (-)
      if (itemPreProInput.match("-") != -1) {
        let split = itemPreProInput.split("-");
        let newArray = split.map(function (element) {
          return element.toLowerCase();
        });

        if (
          newArray.every((item) =>
            kamus.some(
              (kamusItem) => kamusItem.toLowerCase() === item.toLowerCase()
            )
          )
        ) {
          jumlah++;
          continue;
        }
      }

      if (itemPreProInput.match("–") != -1) {
        let split = itemPreProInput.split("–");
        let newArray = split.map(function (element) {
          return element.toLowerCase();
        });

        if (
          newArray.every((item) =>
            kamus.some(
              (kamusItem) => kamusItem.toLowerCase() === item.toLowerCase()
            )
          )
        ) {
          jumlah++;
          continue;
        }
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
              (kamusItem) => kamusItem.toLowerCase() === item.toLowerCase()
            )
          )
        ) {
          jumlah++;
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
        let hasilSplitBM = splitBM(
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
          console.log(hasil);
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
    console.log(`jumlah kata benar : ${jumlah}`);

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
      dictionaryLookup,
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
