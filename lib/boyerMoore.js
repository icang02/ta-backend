console.clear();

function boyerMoore(text, pattern) {
  let foundChar = -1;

  let n = text.length;
  let m = pattern.length;

  // If the pattern is empty return 0
  if (m === 0) return foundChar = -1;

  // Preprocessing the pattern
  let badCharTable = buildBadCharTable(pattern);
  let goodSuffixTable = buildGoodSuffixTable(pattern);

  let textPointer = m - 1; // Search from the end of the pattern

  while (textPointer < n) {
    let patternPointer = m - 1;

    // If current characters match and there are characters left for matching in the pattern
    // shift both pointers to the left by one character
    while (
      patternPointer >= 0 &&
      text[textPointer] === pattern[patternPointer]
    ) {
      textPointer--;
      patternPointer--;
    }

    // There are no characters left for matching in the pattern
    if (patternPointer < 0) {
      foundChar = textPointer + 1;
      break
    }

    // Determining shift size
    // Bad character rule
    let badCharShift = badCharTable[text[textPointer]] || m;
    // Good suffix rule
    let suffixLength = m - 1 - patternPointer; // Length of the matched suffix
    let goodSuffixShift = goodSuffixTable[suffixLength]; // Look up for the shift size

    // Update the text pointer
    textPointer += Math.max(badCharShift, goodSuffixShift);
  }

  return foundChar;
}

function buildBadCharTable(pattern) {
  let bmBc = {};
  let m = pattern.length;
  for (let i = 0; i < m; i++) {
    bmBc[pattern[i]] = m - 1 - i;
  }
  return bmBc;
}

function buildGoodSuffixTable(pattern) {
  let m = pattern.length;
  let bmGs = {};
  bmGs[0] = 1; // Default for |t| = 0
  let helperTable = createHelperTable(pattern);

  // Initially fill the table using m+|t|
  for (let i = 1; i < m; i++) {
    bmGs[i] = i + m;
  }

  // Update the table if the suffix t is available elsewhere
  for (let i = m - 1; i >= 0; i--) {
    if (helperTable[i] > 0) {
      bmGs[helperTable[i]] = i + helperTable[i];
    }
  }

  // Update the table if there is any suffix that matches the prefix
  for (let i = m - 1; i >= 0; i--) {
    if (helperTable[i] + i === m) {
      for (let j = helperTable[i]; j < m - 1; j++) {
        bmGs[j] = Math.min(bmGs[j], j + i);
      }
    }
  }

  // console.log(bmGs)
  return bmGs;
}

function createHelperTable(pattern) {
  let m = pattern.length;
  let helperTable = {};

  for (let shift = 1; shift < m; shift++) {
    let pointer1 = m - 1; // Pointer for the pattern
    let pointer2 = m - 1 - shift; // Pointer for the shifted pattern

    while (pointer2 >= 0) {
      // If the characters match, we move the pointers to the left
      if (pattern[pointer1] === pattern[pointer2]) {
        pointer1--;
        pointer2--;
        if (pointer2 < 0) {
          // If all characters of the shifted pattern match
          helperTable[shift] = m - shift;
          break;
        } else {
          
        }
      } else {
        helperTable[shift] = m - shift - (pointer2 + 1);
        break;
      }
    }
  }
  helperTable[m] = 0; // There is no match if we shift the whole pattern

  return helperTable;
}


// createGoodSuffixTable("BCACBCBC");
// const result = boyerMoore('BCAXDDBCACBCBCFSD', 'BCACBCBC');
// console.log(result);

module.exports = boyerMoore;
