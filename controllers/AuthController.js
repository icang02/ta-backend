const { query } = require("../database/conn");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await query(
      `SELECT * FROM user WHERE username='${username}' LIMIT 1`
    );

    if (user.length == 0) {
      return res.status(404).json({ message: "Username tidak ditemukan." });
    }

    const matchPassword = await bcrypt.compare(password, user[0].password);
    if (!matchPassword) {
      return res.status(404).json({ message: "Password invalid atau salah." });
    }

    const token = jwt.sign(
      { name: user.name, username: user.username },
      "secret_key",
      { expiresIn: "1d" }
    );

    return res.json({ message: "Berhasil login.", token });
  } catch (error) {
    return res.json(error);
  }
};

module.exports = { Login };
