const boyerMoore2 = require("./boyerMoore2");
// const kamus = require("../data/kamus");

function splitBM(kamus, text) {
  const kamusBM = kamus.map((item) => item.toLowerCase());
  // console.log(kamusBM);

  let kumpul = [];

  kamusBM.forEach((pattern) => {
    let BM = boyerMoore2(text, pattern);

    if (BM != -1) {
      kumpul.push({ start: BM, end: BM + pattern.length - 1, word: pattern });
    }
  });

  if (kumpul.length == 0) {
    return -1;
  }

  kumpul.sort((a, b) => a.start - b.start);
  // console.log(kumpul);

  const rentangToRemove2 = [];

  for (let i = 0; i < kumpul.length; i++) {
    let x = kumpul[i];

    let filter = kumpul.filter((item) => {
      return x.word != item.word;
    });

    filter.map((item) => {
      if (x.start <= item.start && x.end >= item.end) {
        rentangToRemove2.push({
          start: item.start,
          end: item.end,
          word: item.word,
        });
      }
    });
  }
  // console.log(rentangToRemove2);
  const set = new Set(rentangToRemove2.map(JSON.stringify));
  const rentangToRemove = Array.from(set).map(JSON.parse);

  const isInRemoveRange = (item, ranges) => {
    return ranges.some(
      (range) => item.start >= range.start && item.end <= range.end
    );
  };

  // hasil mencari kata terpanjang dengan boyer moore
  const hasil = kumpul.filter(
    (item) => !isInRemoveRange(item, rentangToRemove)
  );

  // proses menghilangkan kata yang berada dalam rentang start-end pada data lain
  let resultFinal = [];
  let lastEnd = -1;

  for (let i = 0; i < hasil.length; i++) {
    if (hasil[i].start > lastEnd) {
      resultFinal.push(hasil[i]);
      lastEnd = hasil[i].end;
    }
  }

  let ftext = text;
  resultFinal.forEach((item) => {
    ftext = ftext.replace(item.word, "*".repeat(item.word.length));
  });

  const notExist = ftext.split(/\*+/).filter((item) => item !== "");
  const resultNotExist = [];

  notExist.forEach((pattern) => {
    let BM = boyerMoore2(ftext, pattern);

    if (BM != -1) {
      resultNotExist.push({
        start: BM,
        end: BM + pattern.length - 1,
        word: pattern,
      });

      ftext = ftext.replace(pattern, "*".repeat(pattern.length));
    }
  });

  const finalSekali = [...resultFinal, ...resultNotExist].sort(
    (a, b) => a.start - b.start
  );

  // console.log("input : " + text);
  // console.log("---------------------");
  // console.log(finalSekali);
  // console.log("---------------------");

  // join kata
  const finalSekaliArr = finalSekali.map((item) => item.word);
  let hasilnya = [...finalSekaliArr];

  // console.log(hasilnya);

  let index = 0;
  while (true) {
    let adaSemuaDiKamus = hasilnya.every((value) => kamus.includes(value));
    if (adaSemuaDiKamus) break;

    if (!kamus.includes(hasilnya[index])) {
      if (index == 0) {
        let combined = hasilnya[index] + hasilnya[index + 1];
        hasilnya.splice(index, index + 2, combined);
      } else {
        if (index != hasilnya.length - 1) {
          let before = hasilnya[index - 1];
          let after = hasilnya[index + 1];

          if (kamus.includes(before)) {
            let combined = hasilnya[index] + hasilnya[index + 1];
            hasilnya.splice(index, 2, combined);
            // console.log(index);
            // console.log("before");
          } else if (kamus.includes(after)) {
            let combined = hasilnya[index - 1] + hasilnya[index];
            hasilnya.splice(index - 1, 2, combined);
            // console.log(index);
            // console.log("after");
          } else if (kamus.includes(before) && kamus.includes(after)) {
            let combined = hasilnya[index - 1] + hasilnya[index];
            hasilnya.splice(index - 1, 2, combined);
            // console.log(index);
            // console.log("before & after");
          } else {
            // console.log(index);
            let combined = hasilnya[index - 1] + hasilnya[index];
            hasilnya.splice(index - 1, 2, combined);
            // console.log("else");
          }
        } else {
          // console.log("akhir arr");
          // console.log(index);

          let before = hasilnya[index - 1];
          let now = hasilnya[index];

          // console.log(!kamus.includes(before));
          // console.log(!kamus.includes(now));

          if (
            (!kamus.includes(before) && !kamus.includes(now)) ||
            now.length <= 3
          ) {
            let combined = hasilnya[index - 1] + hasilnya[index];
            hasilnya.splice(index - 1, 2, combined);
          }
        }
      }

      // console.log(hasilnya);

      if (index >= hasilnya.length - 1) {
        break;
      }
    }

    index++;
  }

  // remove value NaN
  const filteredArray = hasilnya.filter((item) => !Number.isNaN(item));

  // console.log("---------------------");
  // console.log(filteredArray.join(" "));
  return filteredArray.join(" ");
}

module.exports = splitBM;
