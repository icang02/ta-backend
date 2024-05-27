const { PrismaClient } = require("@prisma/client");
const wordExists = require("word-exists");

const damerauLevenshtein = require("./damerauLevenshtein");
const splitBM = require("./splitBM");

const prisma = new PrismaClient();

const prosesDeteksi = async (preProInput) => {
  try {
    const kamusData = await prisma.kamus.findMany();

    const kamus = kamusData.map((item) => item.kata);
    const suggestWord = [];
    const dictionaryLookup = [];

    // 1. looping item dari reqInput yang sudah jadi array
    for (const itemPreProInput of preProInput) {
      // 2. pengecekan dictionary lookup
      let kataIsExist = kamus.some(
        (item) => item.toLowerCase() === itemPreProInput.toLowerCase()
      );

      if (kataIsExist) {
        dictionaryLookup.push(itemPreProInput);
        continue;
      }

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
              (kamusItem) => kamusItem.toLowerCase() === item.toLowerCase()
            )
          )
        )
          continue;
      }
      if (wordExists(itemPreProInput)) {
        // cek kata bahasa inggris
        continue;
      }

      // 3. hitung nilai DLD nya
      const suggestPerWord = [];

      // looping tiap kata di kamus dengan itemPreProInput
      for (const itemKamus of kamus) {
        const dld = damerauLevenshtein(itemPreProInput, itemKamus);
        suggestPerWord.push(dld);
      }

      // ambil nilai distance <= 3
      const dibawahDua = suggestPerWord
        .filter((item, i) => item.distance <= 3 && item.similarity >= 60)
        .sort((a, b) => b.similarity - a.similarity);

      if (dibawahDua.length > 0) {
        let wordSuggestions;

        if (dibawahDua.length > 10) {
          wordSuggestions = dibawahDua.splice(0, 10).map((item) => ({
            target: item.target,
            distance: item.distance,
            similarity: item.similarity,
          }));
        } else {
          wordSuggestions = dibawahDua.map((item) => ({
            target: item.target,
            distance: item.distance,
            similarity: item.similarity,
          }));
        }

        const resultWordSuggestions = {
          string: dibawahDua[0].str,
          suggestions:
            wordSuggestions.length == 1 ? wordSuggestions[0] : wordSuggestions,
          type: 1,
        };

        suggestWord.push(resultWordSuggestions);
      } else {
        let hasilSplitBM = splitBM(kamus, itemPreProInput.toLowerCase());

        if (
          hasilSplitBM == -1 ||
          hasilSplitBM == itemPreProInput.toLowerCase()
        ) {
          suggestWord.push({
            string: itemPreProInput,
            suggestions: [],
            type: 3,
          });
        } else {
          const simpanResulAkhir = [];

          const inputBaru = hasilSplitBM.split(/\s+/);

          for (const itemInputBaru of inputBaru) {
            let simpanPerWord = [];

            for (const itemKamus of kamus) {
              const dld = damerauLevenshtein(
                itemInputBaru.toLowerCase(),
                itemKamus.toLowerCase()
              );
              simpanPerWord.push(dld);
            }

            simpanPerWord.sort((a, b) => b.similarity - a.similarity);
            simpanResulAkhir.push(simpanPerWord[0]);
          }

          const hasil = simpanResulAkhir.map((item) => item.target);

          // AKHIR CARI SPLIT HASIL HM

          suggestWord.push({
            string: itemPreProInput,
            suggestions: hasil.join(" "),
            type: 2,
          });
        }
      }
    }

    return {
      suggestWord,
      dictionaryLookup,
    };
  } catch (error) {
    console.log(error);
  }
};

module.exports = prosesDeteksi;
