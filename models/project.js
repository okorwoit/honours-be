const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema({
  projectName: { type: String, required: true },
  projectStartDate: { type: Date, required: true },
  projectEndDate: { type: Date, required: true },
  numberOfTrees: { type: Number, required: true },
  polygonCoordinates: { type: [[Number]], required: true },
  treeTypes: { type: [String], required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  records: [
    {
      date: { type: Date, required: true },
      numberOfTrees: { type: Number, required: true },
      originalImageUrl: { type: String, required: true },
      annotatedImageUrl: { type: String, required: true },
    }
  ]
});


module.exports = mongoose.model("Project", projectSchema);
