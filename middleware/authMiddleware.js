const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    console.log("Token:", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded:", decoded);
    const user = await User.findOne({
      email: decoded.email,
    });

    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please authenticate." });
  }
};

module.exports = { authMiddleware };
