const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true // e.g., "VLE Platform", "Team Formation"
    },
    views: {
        type: Number,
        default: 0 // Most popular nikalne ke liye kaam aayega
    },
    status: {
        type: String,
        default: 'Solved'
    }
}, { timestamps: true });

module.exports = mongoose.model('Faq', faqSchema);
