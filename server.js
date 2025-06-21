require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Make sure this is at the top of your file
const multer = require('multer');
const fs = require('fs');
const app = express();
const compression = require('compression');

const PORT = process.env.PORT || 3000;

// ---------------- MongoDB Connection ----------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

// ---------------- Middleware ----------------
app.use(express.json({ limit: '5mb' }));       // or larger if needed
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);
app.use('/uploads', express.static(uploadsPath));


// ---------------- Mongoose Schema ---------------

const LearnerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: String,
  profilePic: String, // base64 image

  // 🔐 Auth
  password: String, // hashed

  // 📞 Basic Info
  phone: String,
  gender: String,

  // 🧠 Onboarding Data
  sector: String,
  domains: [String],
  experience: String,

  // 🎓 Education
  education: {
    level: String,
    institute: String,
    yearPassing: String,
    percentage: String
  },

  // 🧠 Skills
  skills: [
    {
      name: String,
      verified: { type: Boolean, default: false }
    }
  ],

  // 📄 Certificates
  certs: [
    {
      name: String,
      org: String,
      file: String // certificate filename or base64
    }
  ],

  // 🌐 Languages
  languages: [
    {
      name: String,
      proficiency: String
    }
  ],

  // 💼 Experience
  work: [
    {
      title: String,
      company: String,
      start: Date,
      end: Date,
      desc: String
    }
  ],
  mobile: String,
  profileLink: String

});
const Learner = mongoose.model('Learner', LearnerSchema);

const employerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  jobs: [{
    id: String,
    title: String,
    desc: String,
    skills: String,
    qualification: String,
    experience: String,
    salary: String,
    link: String,
    status: String,
    postedOn: Date,
    applicants: [{
      name: String,
      email: String,
      profileLink: String, // e.g., "/learner_profile.html?email=..."
      appliedOn: Date
    }]
  }]
});

const Employer=mongoose.model('Employer',employerSchema);


// Multer setup for profile pictures and certificates
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'certificate' ? 'uploads/certificates' : 'uploads/profiles';
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });
// ---------------- Routes ----------------

// Serve home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register learner
app.post('/api/learners/register', async (req, res) => {
  try {
    const { firstName, lastName, dob, email, password, mobile } = req.body;

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

//learner login
app.post('/api/learners/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const learner = await Learner.findOne({ email });

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const match = await bcrypt.compare(password, learner.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({ message: "Login successful", email: learner.email });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
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

//onboard learner
// Learner onboarding - backend
app.post('/api/learners/onboard', async (req, res) => {
  try {
    const {
      email,            // Make sure this is passed in the payload!
      profilePic,
      personalInfo,
      education,
      sector,
      domains,
      experience
    } = req.body;

    // 🔍 Validate
    if (!email) return res.status(400).json({ error: "Email is required" });

    const learner = await Learner.findOne({ email });
    if (!learner) return res.status(404).json({ error: "Learner not found" });

    // 📥 Update learner data
    learner.profilePic = profilePic || learner.profilePic;
    learner.dob = personalInfo?.dob || learner.dob;
    learner.education = education || learner.education;
    learner.sector = sector || learner.sector;
    learner.domains = Array.isArray(domains) ? domains : learner.domains;
    learner.experience = experience || learner.experience;

    await learner.save();

    res.json({ message: "Onboarding complete" });
  } catch (err) {
    console.error("❌ Onboarding Error:", err);
    res.status(500).json({ error: "Server error during onboarding" });
  }
});


// GET learner profile
app.get('/:email/profile', async (req, res) => {
  const learner = await Learner.findOne({ email: req.params.email });
  if (!learner) return res.status(404).json({ error: 'Learner not found' });
  res.json(learner);
});

// UPDATE base info
app.put('/:email/profile', async (req, res) => {
  const updated = await Learner.findOneAndUpdate(
    { email: req.params.email },
    { $set: req.body },
    { new: true, upsert: true }
  );
  res.json(updated);
});

// ADD to a section
app.post('/:email/profile/:section', async (req, res) => {
  const section = req.params.section;
  const updated = await Learner.findOneAndUpdate(
    { email: req.params.email },
    { $push: { [section]: req.body } },
    { new: true }
  );
  res.json(updated[section]);
});

// DELETE item by index
app.delete('/:email/profile/:section/:index', async (req, res) => {
  const learner = await Learner.findOne({ email: req.params.email });
  if (!learner) return res.status(404).json({ error: 'Learner not found' });

  learner[req.params.section].splice(req.params.index, 1);
  await learner.save();
  res.json({ message: 'Item deleted' });
});

// MARK skill as verified
app.put('/:email/profile/verify-skill/:index', async (req, res) => {
  const learner = await Learner.findOne({ email: req.params.email });
  learner.skills[req.params.index].verified = true;
  await learner.save();
  res.json({ message: 'Skill verified' });
});


//Pst jobs
app.post('/api/employers/:email/jobs', async (req, res) => {
  const { title, desc, skills, qualification, experience, salary, link, status } = req.body;
  const employer = await Employer.findOne({ email: req.params.email });
  if (!employer) return res.status(404).json({ error: 'Employer not found' });
  const job = { id: Date.now().toString(), title, desc, skills, qualification, experience, salary, link, status, postedOn: new Date() };
  employer.jobs = employer.jobs || [];
  employer.jobs.push(job);
  await employer.save();
  res.json(job);
});


//fetch jobs
app.get('/api/employers/:email/jobs', async (req, res) => {
  const emp = await Employer.findOne({ email: req.params.email });
  if (!emp) return res.status(404).json({ error: 'Not found' });
  res.json(emp.jobs || []);
});

//update job
app.put('/api/employers/:email/jobs/:jobId', async (req, res) => {
  const { email, jobId } = req.params;
  const updatedData = req.body;

  try {
    const employer = await Employer.findOne({ email });

    if (!employer) {
      return res.status(404).json({ error: 'Employer not found' });
    }

    const jobIndex = employer.jobs.findIndex(job => job.id === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ error: 'Job not found' });
    }

    employer.jobs[jobIndex] = {
      ...employer.jobs[jobIndex],
      ...updatedData
    };

    await employer.save();
    res.json({ message: 'Job updated successfully', job: employer.jobs[jobIndex] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating job' });
  }
});

//delete job
app.delete('/api/employers/:email/jobs/:jobId', async (req, res) => {
  const { email, jobId } = req.params;

  try {
    const employer = await Employer.findOne({ email });

    if (!employer) {
      return res.status(404).json({ error: 'Employer not found' });
    }

    const jobIndex = employer.jobs.findIndex(job => job.id === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ error: 'Job not found' });
    }

    employer.jobs.splice(jobIndex, 1);
    await employer.save();

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while deleting job' });
  }
});

//view job applicants
app.get('/api/employers/:email/jobs/:jobId/applicants', async (req, res) => {
  const { email, jobId } = req.params;

  try {
    const employer = await Employer.findOne({ email });

    if (!employer) return res.status(404).json({ error: 'Employer not found' });

    const job = employer.jobs.find(j => j.id === jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    res.json({ applicants: job.applicants || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching applicants' });
  }
});


// ---------------- Start Server ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
