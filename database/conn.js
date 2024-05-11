const mysql = require("mysql2");

// Buat koneksi ke database
const conn = mysql.createConnection({
  // host: "202.52.146.247",
  // user: "prakteko_root",
  // password: "Icang@2002",
  // database: "prakteko_ta",
  host: "localhost",
  user: "root",
  password: "",
  database: "db_project2",
});

const util = require("util");
const query = util.promisify(conn.query).bind(conn);

module.exports = { query, conn };
