// import user model
const User = require('../models/user');

// User registration
const registerUser = async (req, res) => {
    const { companyName, companyLogo, name, role, email, password } = req.body;
    try {
        const user = new User({ companyName, companyLogo, name, role, email, password });
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Get all
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
    getUsers
};