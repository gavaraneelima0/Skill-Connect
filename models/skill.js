//skill schema (skill.js)

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  skills: {
    type: [String],
    required: true
  }
});

module.exports = mongoose.model('Skill', skillSchema);
