// Function to build the Bad Match Table for Boyer-Moore algorithm
const buildBadMatchTable = (str) => {
  const tableObj = {}; // Initialize an empty object to store bad match table
  const strLength = str.length; // Length of the pattern
  // Loop through the pattern characters
  for (let i = 0; i < strLength - 1; i++) {
    // Store the distance from the end of the pattern for each character
    tableObj[str[i]] = strLength - 1 - i;
  }
  // If the last character is not present in the table, add it with the full pattern length
  if (tableObj[str[strLength - 1]] === undefined) {
    tableObj[str[strLength - 1]] = strLength;
  }
  return tableObj; // Return the built bad match table
};

// Function to perform Boyer-Moore string search
const boyerMoore = (str, pattern) => {
  const badMatchTable = buildBadMatchTable(pattern); // Build the Bad Match Table for the pattern
  let offset = 0; // Initialize offset for string traversal
  const patternLastIndex = pattern.length - 1; // Index of the last character in the pattern
  const maxOffset = str.length - pattern.length; // Maximum offset to avoid unnecessary comparisons

  // Iterate through the string until the maximum offset is reached
  while (offset <= maxOffset) {
    let scanIndex = 0; // Initialize index for pattern traversal
    // Compare characters of pattern with characters of string starting from current offset
    while (pattern[scanIndex] === str[scanIndex + offset]) {
      // If all characters of pattern match with substring of string starting from offset
      if (scanIndex === patternLastIndex) {
        // Return the starting index of pattern in the string
        return offset;
      }
      scanIndex++; // Move to next character in pattern
    }
    const badMatchString = str[offset + patternLastIndex]; // Character causing mismatch in string
    // If bad match character is present in the table, move offset accordingly
    if (badMatchTable[badMatchString]) {
      offset += badMatchTable[badMatchString];
    } else {
      offset++; // Move one position to the right in the string
    }
  }
  return -1; // Return -1 if pattern is not found in the string
};

const getLongestPattern = (data) => {
  let longestPattern = "";
  data.map((item) => {
    if (item.kata.length > longestPattern.length) {
      longestPattern = item.kata;
    }
  });
  return data.find((item) => item.kata == longestPattern);
};

// Main code
const kamusOri = require("../data/kamus");
// let inputan = "apakhbagaimanamengapa";
let inputan = "rapatsedang";

const arr = [];
kamusOri.map((item) => {
  let index = boyerMoore(inputan, item);
  if (index != -1) {
    arr.push({
      i: index,
      j: index + item.length - 1,
      kata: item,
    });
  }
});

// urutkan pattern yang ditemukan
arr.sort((a, b) => a.i - b.i);

// mencari pattern terpanjang
const longestPattern = getLongestPattern(arr);

// filter data tanpa longestPattern
const exceptLongPattern = arr.filter(
  (item) => item.kata !== longestPattern.kata
);

// hapus data yang memuat i-j longestPattern
const filteredData = exceptLongPattern.filter(
  (item) => item.i < longestPattern.i || item.j > longestPattern.j
);
filteredData.push(longestPattern);
filteredData.sort((a, b) => a.i - b.i); // sort berdasarkan index terkecil

// console.log(filteredData);

// replace dan tambah spasinya
inputan = filteredData.reduce((acc, item) => {
  return acc.replace(item.kata, ` ${item.kata} `);
}, inputan);

inputan = inputan.trim(); // trim spasi diawal dan diakhir

// pecah inputan jadi array
const inputanArr = inputan.split(/\s+/);

// console.log(inputanArr);

// cari kata yang tidak ada di filteredData
let notInFilteredData = inputanArr.filter(
  (item) => !filteredData.map((item) => item.kata).includes(item)
);

// console.log(notInFilteredData);

// cari letak index data yang tidak ada di filteredData
notInFilteredData.map((item) => {
  // console.log(inputanArr.indexOf(item));
});

// gabungkan data yang tidak ada ke index sebelum/setelahnya
// inputanArr.splice(0, 2, inputanArr.slice(0, 2).join("")); // masih manual belum da otomatis

// jika di index sebelumnya bernilai undefined
if (inputanArr[inputanArr.indexOf(notInFilteredData[0]) - 1] == undefined) {
  inputanArr.splice(
    inputanArr.indexOf(notInFilteredData[0]),
    inputanArr.indexOf(notInFilteredData[0]) + 2,
    inputanArr
      .slice(
        inputanArr.indexOf(notInFilteredData[0]),
        inputanArr.indexOf(notInFilteredData[0]) + 2
      )
      .join("")
  );
  //
}
// jika di index sebelumnya ada nilainya
else {
  inputanArr.splice(
    inputanArr.indexOf(notInFilteredData[0]) - 1,
    inputanArr.indexOf(notInFilteredData[0]) + 1,
    inputanArr
      .slice(
        inputanArr.indexOf(notInFilteredData[0]) - 1,
        inputanArr.indexOf(notInFilteredData[0]) + 1
      )
      .join("")
  );
}

// console.log(inputanArr);
