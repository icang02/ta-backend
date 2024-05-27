const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const Login = async (req, res) => {
  const { username, password } = req.body;

  const user = await prisma.user.findFirst({ where: { username: username } });
  console.log(user);

  if (!user) {
    return res.status(404).json({ message: "Username tidak ditemukan." });
  }

  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    return res.status(404).json({ message: "Password invalid atau salah." });
  }

  const token = jwt.sign(
    { name: user.name, username: user.username },
    "secret_key",
    { expiresIn: "1d" }
  );

  return res.json({ message: "Berhasil login.", token });
};

module.exports = { Login };
