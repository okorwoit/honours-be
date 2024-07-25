const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    projectName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    projectStatus: { type: String, enum: ['planning', 'ongoing', 'complete'], required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    country: { type: String, required: true },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    numberOfTrees: { type: Number, required: true },
    polygonCoordinates: { type: [[Number]], required: true },
    projectArea: { type: Number, required: true },
    treeTypes: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    analysisResult: { type: Object, required: true }
});

module.exports = mongoose.model('Project', projectSchema);
