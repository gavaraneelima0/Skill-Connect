//learner schema (learner.js)

const mongoose = require('mongoose');

const LearnerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: String,
  password: String,
  mobile: String,

  learnerIndex: {
    type: Number,
    unique: true,
    index: true
  },

  profilePic: String,
  gender: String,
  dob: String,
  sector: String,
  experience: String,

  education: [
    {
      level: String,
      institute: String,
      yearPassing: String,
      percentage: String
    }
  ],

  // ✅ Combined domain and skills in one structure
  domainSkills: [
    {
      domain: String,
      skills: [
        {
          name: String,
          percentage: Number,
          verified: Boolean
        }
      ]
    }
  ],

  overallProgress: [
    {
      domain: String,
      percentage: Number
    }
  ],

  certs: [
    {
      title: String,
      issuer: String,
      date: Date,
      file: String
    }
  ],

  languages: [
    {
      name: String,
      proficiency: String
    }
  ],

  work: [
    {
      desc: String
    }
  ],
  appliedJobs: [
    {
      id: String,
      postedByEmail: String
    }
  ],

  profileLink: String,
  about: String
});

module.exports = mongoose.model('Learner', LearnerSchema);




