require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Make sure this is at the top of your file

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------- MongoDB Connection ----------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

// ---------------- Middleware ----------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- Mongoose Schema ----------------
const learnerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dob: String,
  gender: String,
  email: { type: String, unique: true },
  password: String,
  mobile: String,

  // Onboarding details
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
});

const Learner = mongoose.model('Learner', learnerSchema);

const employerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dob: String,
  gender: String,
  email: { type: String, unique: true },
  password: String,
  jobPosition: String,
  company: String
});

const Employer=mongoose.model('Employer',employerSchema);

// ---------------- Routes ----------------

// Serve home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register learner
app.post('/api/learners/register', async (req, res) => {
  try {
    const { firstName, lastName, dob, gender, email, password, mobile } = req.body;

    if (!firstName || !lastName || !email || !password || !mobile) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await Learner.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // ✅ Secure password

    const newLearner = new Learner({
      firstName,
      lastName,
      dob,
      gender,
      email,
      password: hashedPassword, // ✅ Save hashed password
      mobile
    });

    await newLearner.save();

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


//Employer register
app.post('/api/employers/register', async (req, res) => {
  try {
    const { firstName, lastName, dob, gender, email, password, jobPosition, company } = req.body;

    if (!firstName || !lastName || !email || !password || !jobPosition || !company) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    const existing = await Employer.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10); // ✅ Secure password

    const newEmployer = new Employer({
      firstName, lastName, dob, gender, email, password:hashedPassword, jobPosition, company
    });

    await newEmployer.save();
    res.status(201).json({ message: "Registered successfully" });

  } catch (err) {
    console.error("Employer Register Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


//Learner login
app.post('/api/learners/login', async (req, res) => {
  try{
  const { email, password } = req.body;
  const learner = await Learner.findOne({ email });

  if (!learner) return res.status(400).json({ message: "User not found." });

  const match = await bcrypt.compare(password, learner.password);
  if (!match) return res.status(401).json({ message: "Incorrect password." });

  res.json({ message: "Login successful", firstName: learner.firstName });
}
catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



//Employer login
app.post('/api/employers/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const employer = await Employer.findOne({ email });

    if (!employer) return res.status(400).json({ message: "User not found." });
    const match=await bcrypt.compare(password, employer.password);
     if (!match) return res.status(401).json({ message: "Incorrect password." });

    res.json({ message: "Login successful", email: employer.email });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Learner onboarding
app.post('/api/learners/onboard', async (req, res) => {
  try {
    const {
      email, profilePic, sector, domains, experience, academic, softSkills
    } = req.body;

    const learner = await Learner.findOne({ email });
    if (!learner) {
      return res.status(404).json({ error: "Learner not found" });
    }

    learner.profilePic = profilePic;
    learner.sector = sector;
    learner.domains = domains;
    learner.experience = experience;
    learner.academic = academic;
    learner.softSkills = softSkills;

    await learner.save();
    res.status(200).json({ message: "Onboarding complete" });
  } catch (err) {
    console.error("Onboarding error:", err);
    res.status(500).json({ error: "Server error during onboarding" });
  }
});

// ---------------- Start Server ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
