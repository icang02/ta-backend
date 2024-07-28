const createBadCharTable = (pattern) => {
  let bmBc = {};
  let m = pattern.length;
  for (let i = 0; i < m; i++) {
    bmBc[pattern[i]] = m - 1 - i;
  }
  console.log(bmBc);
  return bmBc;
};

const createHelperTable = (pattern) => {
  let m = pattern.length;
  let helperTable = {};

  for (let shift = 1; shift <= m - 1; shift++) {
    let pointer1 = m - 1;
    let pointer2 = m - 1 - shift;

    while (pointer2 >= 0) {
      if (pattern[pointer1] === pattern[pointer2]) {
        pointer1--;
        pointer2--;
        if (pointer2 === 0) {
          helperTable[shift] = m - shift;
          break;
        }
      } else {
        helperTable[shift] = m - 1 - shift - pointer2;
        break;
      }
    }
  }
  helperTable[m] = 0;

  return helperTable;
};

const createGoodSuffixTable = (pattern) => {
  let m = pattern.length;
  let bmGs = {};
  bmGs[0] = 1;
  let helperTable = createHelperTable(pattern);

  for (let i = 1; i <= m - 1; i++) {
    bmGs[i] = i + m;
  }

  for (let i = m - 1; i >= 0; i--) {
    if (helperTable[i] > 0) {
      bmGs[helperTable[i]] = i + helperTable[i];
    }
  }

  for (let i = m - 1; i >= 0; i--) {
    if (helperTable[i] + i === m) {
      for (let j = helperTable[i]; j < m - 1; j++) {
        bmGs[j] = Math.min(bmGs[j], j + i);
      }
    }
  }

  return bmGs;
};

const boyerMoore = (text, pattern) => {
  let foundChar = -1;

  let n = text.length;
  let m = pattern.length;

  // If the pattern is empty return -1
  if (m === 0) return (foundChar = -1);

  // Preprocessing the pattern
  let badCharTable = createBadCharTable(pattern);
  let goodSuffixTable = createGoodSuffixTable(pattern);

  badCharTable;
  goodSuffixTable;

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
      break;
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

  foundChar;
  return foundChar;
};

