const multer = require("multer");
const path = require("path");

// set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Fungsi untuk memeriksa tipe file
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /txt|docx/; // Note: Adjust the regex to be stricter

  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // Check mime
  const allowedMimes = [
    "text/plain", // .txt files
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx files
  ];
  const mimetype = allowedMimes.includes(file.mimetype);

  // console.log(
  //   "File Extension: ",
  //   path.extname(file.originalname).toLowerCase()
  // );
  // console.log("MIME Type: ", file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    // return cb(new Error("Upload file dengan format .txt atau .docx."));
    return cb("Upload file dengan format .txt atau .docx.");
    // return cb(new Error("Upload file dengan format .txt atau .docx."));
  }
}

// init upload
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
}).single("file");

module.exports = upload;
