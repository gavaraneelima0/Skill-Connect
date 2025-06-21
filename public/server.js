require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Make sure this is at the top of your file
const multer = require('multer');
const fs = require('fs');
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
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);
app.use('/uploads', express.static(uploadsPath));


// ---------------- Mongoose Schema ----------------
const learnerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: { type: String, required: true },
  profilePic: String,
   profileLink: String,
  about: String,
  skills: [{ name: String, verified: Boolean }],
  certifications: [{
    title: String,
    issuer: String,
    date: String,
    filePath: String
  }],
  experience: [{
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  academic: [{
    institute: String,
    branch: String,
    batch: String,
    cgpa: String,
    achievements: String
  }]
 
});

const Learner = mongoose.model('Learner', learnerSchema);

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


app.post('/api/learners/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await Learner.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({ message: "Login successful", email: user.email });
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
app.post('/api/learners/onboard', async (req, res) => {
  try {
    const { email, profilePic, sector, domains, experience, academic, softSkills } = req.body;

    const learner = await Learner.findOne({ email });
    if (!learner) return res.status(404).json({ error: "Learner not found" });

    learner.profilePic = profilePic || learner.profilePic;
    learner.sector = sector || learner.sector;
    learner.domains = Array.isArray(domains) ? domains : learner.domains;

    if (Array.isArray(experience)) {
      learner.experience = experience;
    }

    if (academic && typeof academic === 'object') {
      learner.academic = academic;
    }

    learner.softSkills = Array.isArray(softSkills) ? softSkills : learner.softSkills;

    await learner.save();
    res.json({ message: "Onboarding complete" });
  } catch (err) {
    console.error("🛑 Onboarding error:", err);
    res.status(500).json({ error: "Server error during onboarding" });
  }
});


// Get Learner Data
app.get('/api/learner/:email', async (req, res) => {
  const learner = await Learner.findOne({ email: req.params.email });
  if (!learner) return res.status(404).json({ error: "Learner not found" });
  res.json(learner);
});

// Update Learner Data
app.put('/api/learner/:email', async (req, res) => {
  try {
    const learner = await Learner.findOneAndUpdate(
      { email: req.params.email },
      { $set: req.body },
      { new: true }
    );
    if (!learner) return res.status(404).json({ error: "Learner not found" });
    res.json(learner);
  } catch (err) {
    res.status(500).json({ error: "Error updating learner" });
  }
});

// Upload profile picture
app.post('/api/learner/:email/upload-profile', upload.single('profile'), async (req, res) => {
  const profilePic = `/uploads/profiles/${req.file.filename}`;
  const profileLink = `http://localhost:${PORT}/profile/${req.params.email}`;
  const learner = await Learner.findOneAndUpdate(
    { email: req.params.email },
    { profilePic, profileLink },
    { new: true }
  );
  res.json({ profilePic, profileLink });
});


// Upload certificate
app.post('/api/learner/:email/upload-certificate', upload.single('certificate'), async (req, res) => {
  const learner = await Learner.findOne({ email: req.params.email });
  if (!learner) return res.status(404).json({ error: "User not found" });

  const { name, date } = req.body;
  const fileUrl = `/uploads/certificates/${req.file.filename}`;
  learner.certifications.push({ name, date, fileUrl });
  await learner.save();
  res.json(learner.certifications);
});

// Add Skill
app.post('/api/learner/:email/addSkill', async (req, res) => {
  const { name } = req.body;
  const learner = await Learner.findOne({ email: req.params.email });
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const exists = learner.skills.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (exists) return res.status(409).json({ error: "Skill already exists" });

  learner.skills.push({ name, verified: false });
  await learner.save();
  res.json({ message: "Skill added", skills: learner.skills });
});

// Verify Skill
app.post('/api/learner/:email/verifySkill', async (req, res) => {
  const { name } = req.body;
  const learner = await Learner.findOne({ email: req.params.email });
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const skill = learner.skills.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (!skill) return res.status(404).json({ error: "Skill not found" });

  skill.verified = true;
  await learner.save();
  res.json({ message: "Skill verified", skill });
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
