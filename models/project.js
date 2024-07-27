const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema({
  projectName: { type: String, required: true },
  numberOfTrees: { type: Number, required: true },
  polygonCoordinates: { type: [[Number]], required: true },
  treeTypes: { type: [String], required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  analysisResults: [{ type: Object, required: true }],
});

module.exports = mongoose.model("Project", projectSchema);
