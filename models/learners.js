const mongoose = require('mongoose');

const learnerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dob: String,
  gender: String,
  email: { type: String, unique: true },
  password: String,
  mobile: String,
  onboarding: {
    profilePic: String,
    sector: String,
    domains: [String],
    experience: String,
    academic: {
      institute: String,
      branch: String,
      batch: String,
      cgpa: String,
      achievements: String
    },
    softSkills: [String]
  }
});

module.exports = mongoose.model('Learner', learnerSchema);
