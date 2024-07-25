const express = require('express');
const { registerProject, getProjects } = require('../controllers/projectController'); // Import getProjects
const router = express.Router();

// Project registration
router.post('/register', registerProject); // Corrected the route path

// Get all projects
router.get('/', getProjects);

module.exports = router;
