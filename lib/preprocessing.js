const preprocessing = (input, typeFile = 0) => {
  const removeMail = /[A-Za-z0-9._%+-]+@[A-Za-z0-9]+\.[A-Za-z]{2,}/gi; // xxxxx@xxx.xx
  const removeLink =
    /(?:https?:\/\/)?[a-z0-9.-]+\.(?:com|co\.id|org|net|edu|co|id|info|biz|me|ac\.id|git)/gi; //
  const regCustom1 = /[\w]+\([\d\w\.\,\s]{0,}\)/gi; // xx(xxx)
  const removeRumus = /[\w]+\[[\d\w\.\,\s]{0,}\]/gi; // xx[xxx]
  const regCustom2 = /ke-[\w\d]{0,}/gi; // ke- | ke-1 | ke-i
  const removeRomawi = /\b(I{1,3}|IV|V|VI{0,3}|IX|X)\b/gi; // IV | iv
  const removeSimbolDiakhir = /[\w+-]+[.,:;/?!]/g; // xxx. | xxx, | xxx: | xxx/ | xxx? | xxx!
  const removeBacktik = /[‘’“”()]/g;

  const removeNumberHeading = /^\d+[\.\,]+.*/g; // 1.xxx
  const removeNumber = /^\d+$/g; // 1234
  const removeHanyaSimbolAngka = /^[^a-zA-Z]+$/g;

  const preProInput = input
    .trim()
    .replace(removeMail, "")
    .replace(removeLink, "")
    .replace(regCustom1, "")
    .replace(removeRumus, "")
    .replace(regCustom2, "")
    .replace(removeRomawi, "")
    .replace(removeSimbolDiakhir, "")
    .replace(removeNumber, "")
    .replace(removeBacktik, "")
    .split(/\s+/)
    .map((item) => item.replace(removeNumberHeading, ""))
    .map((item) =>
      item.match(removeSimbolDiakhir)
        ? item.replace(removeSimbolDiakhir, item.slice(0, item.length - 1))
        : item
    )
    .map((item) =>
      item.match(removeNumber) ? item.replace(removeNumber, "") : item
    )
    .map((item) =>
      item.match(removeHanyaSimbolAngka)
        ? item.replace(removeHanyaSimbolAngka, "")
        : item
    )
    .filter((str) => str.length > 1);

  // input file
  if (typeFile == 1) {
    const daftar = preProInput.lastIndexOf("DAFTAR");
    const pustaka = preProInput.lastIndexOf("PUSTAKA");

    if (daftar + 1 == pustaka) {
      return [...new Set(preProInput.slice(0, daftar))];
    }
  }

  // input text
  return [...new Set(preProInput)];
};

module.exports = preprocessing;
