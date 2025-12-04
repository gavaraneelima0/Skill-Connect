//employer schema (employer.js)

const mongoose = require('mongoose');

// Skill Schema
const skillSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  proficiency: { type: Number, min: 0, max: 100 }
}, { _id: false });

// Applicant Schema
const applicantSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  profileLink: String,
  skills: [skillSchema],
  appliedOn: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'rejected', 'shortlisted'],
    default: 'pending'
  }
}, { _id: false });

// Job Schema
const jobSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Unique job ID
  title: { type: String, required: true },
  description: { type: String, required: true },
  skills: [skillSchema],
  qualification: String,
  experience: String,
  salary: String,
  applicationLink: String,
  status: { 
    type: String, 
    enum: ['active', 'closed'], 
    default: 'active' 
  },
  postedDate: { type: Date, default: Date.now },
  applicants: [applicantSchema]
}, { _id: false });

// Employer Schema
const employerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dob: String,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email']
  },
  password: { type: String, required: true },
  jobPosition: { type: String, required: true },
  company: { type: String, required: true },
  jobs: [jobSchema]
}, { timestamps: true });

module.exports = mongoose.model('Employer', employerSchema);


