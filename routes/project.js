const express = require('express');
const { registerProject, getProjects } = require('../controllers/projectController'); // Import getProjects
const router = express.Router();
const {authMiddleware} = require('../middleware/authMiddleware');

// Project registration
router.post('/register', authMiddleware, registerProject); 
// Get all projects
router.get('/', getProjects);

module.exports = router;
