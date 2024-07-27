// import user model
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { companyName, companyLogo, name, role, email, password } = req.body;
  try {
    const user = new User({
      companyName,
      companyLogo,
      name,
      role,
      email,
      password,
    });
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.find({ email, password });
    if (!user) {
      return res
        .status(401)
        .send({ error: "Login failed! Check authentication credentials" });
    }

    const token = jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: "12h"});

    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = {
  registerUser,
  getUsers,
  loginUser
};
