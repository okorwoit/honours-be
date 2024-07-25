const express = require('express');
const router = express.Router();

// Import user controller
const { registerUser, getUsers } = require('../controllers/userController');

// User registration
router.post('/register', registerUser);

// Get all users
router.get('/', getUsers);

module.exports = router;
