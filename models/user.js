const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    companyName: { type: String, required: true },
    companyLogo: { type: String },
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }]
});

module.exports = mongoose.model('User', userSchema);
