const { default: axios } = require("axios");
const Project = require("../models/project");
const User = require("../models/user");
const generateMapImage = require("../utils/satelliteUtils");
const { exec } = require("child_process");
const path = require("path");
const FormData = require('form-data');
const fs = require('fs');

// Project registration
const registerProject = async (req, res) => {
  const { projectName, projectStartDate, projectEndDate, numberOfTrees, polygonCoordinates, treeTypes } =
    req.body;

    const _polygonCoordinates = JSON.parse(polygonCoordinates);

  const userId = req.user._id;

  try {
    // Create a new project instance
    const project = new Project({
      projectName,
      numberOfTrees,
      polygonCoordinates: _polygonCoordinates,
      treeTypes,
      user: userId,
      projectStartDate,
      projectEndDate,
    });

    // Save the project to the database
    project
      .save()
      .then(() => {
        User.findById(userId)
          .then((user) => {
            if (!user) {
              return res.status(404).send({ error: "User not found" });
            }
            user.projects.push(project);
            user
              .save()
              .then(() => {
                res.status(201).send(project);
              })
              .catch((error) => {
                res.status(400).send({ error: error.message });
              });
          })
          .catch((error) => {
            res.status(400).send({ error: error.message });
          });
      })
      .catch((error) => {
        res.status(400).send({ error: error.message });
      });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const AVERAGE_CARBON_SEQUESTRATION_RATE = 21.7; 

const calculateProjectStats = (project) => {
  const initialTreeCount = project.numberOfTrees;
  let survivalRates = [];
  let treeGrowthData = [
    {
      date: project.projectStartDate,
      treeCount: initialTreeCount
    }
  ];

  const sortedRecords = project.records.sort((a, b) => a.date - b.date);

  let totalTreeYears = 0;
  let previousDate = project.projectStartDate;
  let previousTreeCount = initialTreeCount;

  sortedRecords.forEach((record, index) => {
    const survivalRate = (record.numberOfTrees / initialTreeCount) * 100;
    survivalRates.push(survivalRate);

    treeGrowthData.push({
      date: record.date,
      treeCount: record.numberOfTrees
    });

    const yearDiff = (record.date - previousDate) / (365 * 24 * 60 * 60 * 1000);
    totalTreeYears += (previousTreeCount * yearDiff);

    previousDate = record.date;
    previousTreeCount = record.numberOfTrees;
  });

  const lastRecordToEndYearDiff = (project.projectEndDate - previousDate) / (365 * 24 * 60 * 60 * 1000);
  totalTreeYears += (previousTreeCount * lastRecordToEndYearDiff);

  const averageSurvivalRate = survivalRates.length > 0 
    ? survivalRates.reduce((a, b) => a + b, 0) / survivalRates.length 
    : 100; // If no records, assume 100% survival

  const totalCarbonSequestrated = totalTreeYears * AVERAGE_CARBON_SEQUESTRATION_RATE;

  return {
    averageSurvivalRate,
    treeGrowthData,
    carbonSequestrated: totalCarbonSequestrated
  };
};

const getProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({user: userId}).populate("user", "name email");
    
    const projectsWithStats = projects.map(project => {
      const { averageSurvivalRate, treeGrowthData, carbonSequestrated } = calculateProjectStats(project);
      
      return {
        ...project.toObject(),
        averageSurvivalRate,
        treeGrowthData,
        carbonSequestrated
      };
    });

    res.json({ projects: projectsWithStats });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const uploadProjectImage = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    const form = new FormData();
    
    // Append the file buffer directly
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await axios.post('http://127.0.0.1:8000/predict', form, {
      headers: {
        ...form.getHeaders(),
        'Content-Length': form.getLengthSync(),
      },
      maxBodyLength: Infinity,
    });

    if (response.data) {
      const record = {
        date: new Date(),
        numberOfTrees: response.data.number_of_trees,
        originalImageUrl: response.data.original_image_url,
        annotatedImageUrl: response.data.annotated_image_url,
      };
      project.records.push(record);
      await project.save();
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  registerProject,
  getProjects,
  uploadProjectImage
};
