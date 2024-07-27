const Project = require("../models/project");
const User = require("../models/user");
const generateMapImage = require("../utils/satelliteUtils");
const { exec } = require("child_process");
const path = require("path");

// Project registration
const registerProject = async (req, res) => {
  const { projectName, numberOfTrees, polygonCoordinates, treeTypes } =
    req.body;

  const userId = req.user._id;

  try {
    // Fetch and save the satellite image
    const imagePath = await generateMapImage(
      polygonCoordinates,
      projectName
    );

    // Create a new project instance
    const project = new Project({
      projectName,
      numberOfTrees,
      polygonCoordinates,
      treeTypes,
      user: userId,
      analysisResult:null
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

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("user");
    res.send(projects);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = {
  registerProject,
  getProjects,
};
