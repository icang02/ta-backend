const preprocessing2 = (input) => {
  const preProInput = input
    .trim()
    .split(/\s+/)
    .filter((item) => !/^[^a-zA-Z]*$/.test(item)) // hanya abjad
    .filter((item) => !/[=|<|>]./.test(item)) // hapus yg memuat simbol (=,<,>)
    .map((item) => {
      let pola1 = item.match(/^[^a-zA-Z]+([a-zA-Z-]+)[^a-zA-Z]+$/); // ##xxx##
      let pola2 = item.match(/^([^a-zA-Z]+)([a-zA-Z]+)$/); // ##xxx
      let pola3 = item.match(/^([a-zA-Z]+)([^a-zA-Z]+)$/); //   xxx##

      if (pola1) {
        return pola1[1];
      } else if (pola2) {
        return pola2[2];
      } else if (pola3) {
        return pola3[1];
      } else {
        return item;
      }
    })
    .filter((item) => item.length > 1);

  const daftar = preProInput.lastIndexOf("DAFTAR");
  const pustaka = preProInput.lastIndexOf("PUSTAKA");

  if (daftar + 1 == pustaka) {
    return [...new Set(preProInput.slice(0, daftar))];
  }
  return [...new Set(preProInput)];
};

module.exports = preprocessing2;
