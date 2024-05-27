const preprocessing3 = (input) => {
  const inputText = input;

  const reg = /[\.,:;()\[\]+_~=*“”‘’><\d]/g;
  const mail = /[A-Za-z0-9._%+-]+@[A-Za-z0-9]+\.[A-Za-z]{2,}/g;
  const link = /https?:\/\/[a-z0-9\./_-]+/gi;

  const preProInput = input
    .trim()
    .replace(link, "")
    .replace(mail, "")
    .replace(reg, "")
    .split(/\s+/);

  const resultPro = [...new Set(preProInput)].filter((item) => item.length > 1);
  const finalResult = [];

  resultPro.forEach((item) => {
    let reg = new RegExp(`\\b${item}\\b`);

    if (inputText.match(reg)) {
      finalResult.push(item);
    }
  });

  return finalResult;
};

module.exports = preprocessing3;
