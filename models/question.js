// questions schema  (question.js)

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  skill: { type: String, required: true },
  question: { type: String, required: true },
  options: [String], // Only used for MCQ
  answer: mongoose.Schema.Types.Mixed, // Can be index, string, or array
  type: { type: String, enum: ['mcq', 'fill-blank'], required: true }
});

module.exports = mongoose.model('Question', questionSchema);
