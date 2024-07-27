const fs = require("fs");
const preprocessing3 = (input, type = 0, text = "") => {
  const simbol = /[\.?!,:;()\[\]+_~=*“”‘’><\d]/g;
  const mail = /[A-Za-z0-9._%+-]+@[A-Za-z0-9]+\.[A-Za-z]{2,}/g;
  const link = /https?:\/\/[a-z0-9\./_-]+/gi;
  const romawi =
  /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/i;
  const angka_huurf = /([a-z]+-)|(-[a-z]+)/i;

  const preProInput = input
    .trim().replace(link, "").replace(mail, "").replace(simbol, "")
    .split(/\s+/);

  let resultPro = preProInput
    .map((item) => {
      if (romawi.test(item)) return "";
      if (angka_huurf.test(item)) return "";
      return item;
    })
    .filter((item) => item.length > 1);

  // remove daftar pustaka
  if (type == 1) {
    let found = -1;

    for (let i = resultPro.length - 1; i >= 0; i--) {
      if (
        resultPro[i].toLowerCase() == "daftar" &&
        resultPro[i + 1].toLowerCase() == "pustaka"
      ) {
        found = i;
        break;
      }
    }

    if (found != -1) 
      resultPro = resultPro.slice(0, found);
    
    resultPro = resultPro.filter((item) => {
      const uppercaseRegex = /^[A-Z]+$/;
      return !uppercaseRegex.test(item);
    });
  }

  resultPro = [...new Set(resultPro)];
  const finalResult = [];
  if (type == 0) 
    text = input;

  resultPro.forEach((item) => {
    let reg = new RegExp(`\\b${item}\\b`);
    if (reg.test(text)) 
      finalResult.push(item);
  });

  return finalResult;
};

module.exports = preprocessing3;
