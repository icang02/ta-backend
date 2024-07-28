const calculateDistance = (valueString, valueTarget) => {
  const string = valueString.toLowerCase();
  const target = valueTarget.toLowerCase();

  const lenString = string.length + 1;
  const lenTarget = target.length + 1;

  let d = Array.from({ length: lenString }, () =>
    Array.from({ length: lenTarget }).fill(0)
  );

  for (let i = 0; i < lenString; i++) d[i][0] = i;
  for (let j = 0; j < lenTarget; j++) d[0][j] = j;

  for (let i = 1; i < lenString; i++) {
    for (let j = 1; j < lenTarget; j++) {
      let cost = string[i - 1] === target[j - 1] ? 0 : 1;
      let x = d[i - 1][j] + 1;
      let y = d[i][j - 1] + 1;
      let z = d[i - 1][j - 1] + cost;

      d[i][j] = Math.min(x, y, z);

      if (
        i > 1 &&
        j > 1 &&
        string[i - 1] === target[j - 2] &&
        string[i - 2] === target[j - 1]
      )
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
    }
  }

  return d[lenString - 1][lenTarget - 1];
};

const damerauLevenshtein = (valueString, valueTarget) => {
  let distance = calculateDistance(valueString, valueTarget);

  let targetHasil;
  if (valueString[0] == valueString[0].toUpperCase()) {
    targetHasil = /^\d/.test(valueString)
      ? valueTarget.toLowerCase()
      : valueTarget[0].toUpperCase() + valueTarget.slice(1).toLowerCase();
  } else {
    targetHasil = valueTarget;
  }

  let pembagi = Math.max(valueString.length, valueTarget.length);
  let similarity = (1 - distance / pembagi) * 100;

  return {
    str: valueString,
    target: targetHasil,
    distance,
    similarity: parseFloat(similarity.toFixed(2)),
  };
};

module.exports = damerauLevenshtein;
