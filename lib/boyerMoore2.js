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
const boyerMoore2 = (str, pattern) => {
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

module.exports = boyerMoore2;
