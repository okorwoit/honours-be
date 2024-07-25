const Project = require('../models/project');
const User = require('../models/user');
const fetchAndSaveSatelliteImage = require('../utils/satelliteUtils');
const { exec } = require('child_process');
const path = require('path');

// Project registration
const registerProject = async (req, res) => {
    const { userId, projectName, startDate, endDate, projectStatus, city, province, country, latitude, longitude, numberOfTrees, polygonCoordinates, projectArea, treeTypes } = req.body;
    
    try {
        // Fetch and save the satellite image
        const imagePath = await fetchAndSaveSatelliteImage(polygonCoordinates, projectName);

        // Call Python script to create image and predict
        const command = `python Backend/predict.py ${projectName}.png`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                return res.status(500).send({ error: 'Error processing image' });
            }
            if (stderr) {
                console.error(`Python script stderr: ${stderr}`);
                return res.status(500).send({ error: 'Error processing image' });
            }
            const analysisResult = JSON.parse(stdout);

            // Create a new project instance
            const project = new Project({ 
                projectName, 
                startDate, 
                endDate, 
                projectStatus, 
                city, 
                province, 
                country, 
                latitude, 
                longitude, 
                numberOfTrees, 
                polygonCoordinates, 
                projectArea, 
                treeTypes, 
                user: userId,
                analysisResult // Save the analysis result in the project document
            });
            
            // Save the project to the database
            project.save().then(() => {
                User.findById(userId).then((user) => {
                    if (!user) {
                        return res.status(404).send({ error: 'User not found' });
                    }
                    user.projects.push(project);
                    user.save().then(() => {
                        res.status(201).send(project);
                    }).catch((error) => {
                        res.status(400).send({ error: error.message });
                    });
                }).catch((error) => {
                    res.status(400).send({ error: error.message });
                });
            }).catch((error) => {
                res.status(400).send({ error: error.message });
            });
        });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};

const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('user');
        res.send(projects);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

module.exports = {
    registerProject,
    getProjects
};
