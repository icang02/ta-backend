const damerauLevenshtein = (string, stringtTarget) => {
  const strOri = string;

  const str = string.toLowerCase();
  const target = stringtTarget.toLowerCase();

  let lenStr = str.length + 1;
  let lenTarget = target.length + 1;

  // Inisialisasi matriks dengan nilai 0
  let matrix = [];
  for (let i = 0; i < lenStr; i++) {
    matrix[i] = [];
    for (let j = 0; j < lenTarget; j++) {
      matrix[i][j] = 0;
    }
  }

  // Inisialisasi baris pertama dan kolom pertama
  for (let i = 0; i < lenStr; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j < lenTarget; j++) {
    matrix[0][j] = j;
  }

  // Mengisi matriks
  for (let i = 1; i < lenStr; i++) {
    for (let j = 1; j < lenTarget; j++) {
      let cost = str[i - 1] === target[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );

      if (
        i > 1 &&
        j > 1 &&
        str[i - 1] === target[j - 2] &&
        str[i - 2] === target[j - 1]
      ) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost); // Transposition
      }
    }
  }

  let distance = matrix[lenStr - 1][lenTarget - 1]; // jarak damerau

  let targetHasil = "";
  if (
    stringtTarget === stringtTarget.toLowerCase() &&
    strOri[0] === strOri[0].toUpperCase() &&
    str.slice(1) === strOri.slice(1).toLowerCase()
  ) {
    targetHasil = target[0].toUpperCase() + target.slice(1).toLowerCase();
  } else {
    targetHasil = stringtTarget;
  }

  let pembagi = lenStr > lenTarget ? lenStr - 1 : lenTarget - 1;
  let similarity = (1 - distance / pembagi) * 100;

  return {
    str: strOri,
    target: targetHasil,
    distance,
    similarity: parseFloat(similarity.toFixed(2)),
  };
};

module.exports = damerauLevenshtein;
