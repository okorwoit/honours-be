const express = require('express');
const { registerProject, getProjects, uploadProjectImage } = require('../controllers/projectController'); // Import getProjects
const router = express.Router();
const {authMiddleware} = require('../middleware/authMiddleware');
const upload = require('../upload');

router.post('/register', authMiddleware, registerProject); 
router.get('/', authMiddleware, getProjects);

router.post('/:id/upload', authMiddleware, upload.single('image'), uploadProjectImage);

module.exports = router;
