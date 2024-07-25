// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const connectDB = require('./config'); // Import the database connection function
const userRoutes = require('./routes/user'); // Import user routes
const projectRoutes = require('./routes/project'); // Import project routes

// Initialize the Express application
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Define routes for user-related API endpoints
app.use('/api/users', userRoutes);

// Define routes for project-related API endpoints
app.use('/api/projects', projectRoutes);

// Define a route for predictions
app.post('/api/predict', (req, res) => {
    const imagePath = req.body.image_path;

    // Spawn a new Python process to run the prediction script
    const pythonProcess = spawn('python', ['ml/predict.py', imagePath]);

    // Collect data from the Python process
    pythonProcess.stdout.on('data', (data) => {
        res.json(JSON.parse(data.toString()));
    });

    // Handle error
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Error: ${data.toString()}`);
        res.status(500).send(data.toString());
    });
});

// Start the server and listen on the specified port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
