const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ==========================================
// 1. Get All FAQs (Search aur General list ke liye)
// ==========================================
exports.getAllFaqs = async (req, res) => {
    try {
        const official = await db.execute('SELECT id, category, question, answer FROM faqs');
        const community = await db.execute("SELECT id, category, question, answer FROM community_faqs WHERE status = 'approved'");
        
        // Dono ko mix kar diya
        res.json([...official.rows, ...community.rows]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ==========================================
// 2. Add New FAQ
// ==========================================
exports.addFaq = async (req, res) => {
    const { category, question, answer } = req.body;
    try {
        const finalAnswer = answer && answer.trim() !== '' ? answer : "Answer will be updated soon by mentors.";
        await db.execute({
            sql: "INSERT INTO community_faqs (category, question, answer, status) VALUES (?, ?, ?, 'approved')",
            args: [category, question, finalAnswer]
        });
        res.json({ message: "FAQ added successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ==========================================
// 3. Get Trending FAQs (Most Popular)
// ==========================================
exports.getTrendingFaqs = async (req, res) => {
    try {
        // Naye FAQs (asli views ke sath)
        const community = await db.execute("SELECT id, category, question, answer, views FROM community_faqs WHERE status = 'approved'");
        
        // Purane FAQs (Inko default 50 views diye taaki list me aage rahein)
        const official = await db.execute("SELECT id, category, question, answer FROM faqs");
        const officialWithViews = official.rows.map(faq => ({ ...faq, views: 50 }));
        
        // Dono mix karke views ke hisab se sort (highest pehle)
        let allFaqs = [...community.rows, ...officialWithViews];
        allFaqs.sort((a, b) => b.views - a.views);
        
        res.json(allFaqs.slice(0, 10)); // Top 10 return
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ==========================================
// 4. Get Recent FAQs (Abhi add hue)
// ==========================================
exports.getRecentFaqs = async (req, res) => {
    try {
        const community = await db.execute("SELECT id, category, question, answer FROM community_faqs WHERE status = 'approved' ORDER BY created_at DESC");
        const official = await db.execute("SELECT id, category, question, answer FROM faqs LIMIT 5"); // Purane kuch FAQs bhi dikhane ke liye
        
        // Naye wale hamesha list me upar rahenge
        const allFaqs = [...community.rows, ...official.rows];
        res.json(allFaqs.slice(0, 10));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ==========================================
// 5. Get FAQs by Category (ALL CATEGORIES - PERFECT MIX)
// ==========================================
exports.getCategoryFaqs = async (req, res) => {
    const { categoryName } = req.params;
    try {
        // Purani table se is category ke FAQs nikalenge
        const official = await db.execute({
            sql: "SELECT id, category, question, answer FROM faqs WHERE category = ?",
            args: [categoryName]
        });
        
        // Nayi table se is category ke approved FAQs nikalenge
        const community = await db.execute({
            sql: "SELECT id, category, question, answer FROM community_faqs WHERE category = ? AND status = 'approved'",
            args: [categoryName]
        });
        
        // Dono ka data milakar frontend ko bhej diya
        res.json([...official.rows, ...community.rows]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ==========================================
// 6. Increase Views Count
// ==========================================
exports.increaseViews = async (req, res) => {
    const { id } = req.params;
    try {
        if (!isNaN(id)) { // Naye FAQs ki ID number hoti hai, unke hi views update honge
            await db.execute({
                sql: "UPDATE community_faqs SET views = views + 1 WHERE id = ?",
                args: [id]
            });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ==========================================
// 7. SMART CHATBOT API (Yaksha)
// ==========================================
exports.chatDummy = async (req, res) => {
    const { message } = req.body;
    if (!message) return res.json({ reply: "Kripya apna sawal type karein." });

    const lowerMsg = message.toLowerCase().trim();

    // Greetings
    const greetings = ['hi', 'hello', 'hey', 'hii', 'helo'];
    if (greetings.some(word => lowerMsg === word || lowerMsg.startsWith(`${word} `))) {
        return res.json({ reply: "Hello! 👋 Main Yaksha hu. Aap Vicharanashala internship ke baare mein kya janna chahte hain?" });
    }

    // Endings
    const endings = ['bye', 'thanks', 'thank you', 'ok', 'dhanyawad'];
    if (endings.some(word => lowerMsg.includes(word))) {
        return res.json({ reply: "You're welcome! 😊 Agar internship se juda koi aur doubt ho toh kabhi bhi pooch sakte hain. Happy Learning!" });
    }

    // Search in Database
    try {
        const official = await db.execute("SELECT question, answer FROM faqs");
        const community = await db.execute("SELECT question, answer FROM community_faqs WHERE status = 'approved'");
        const allFaqs = [...official.rows, ...community.rows];
        
        const words = lowerMsg.split(' ').filter(w => w.length > 3);
        
        let bestMatch = null;
        for (const faq of allFaqs) {
            const lowerQuestion = faq.question.toLowerCase();
            if (words.some(word => lowerQuestion.includes(word))) {
                bestMatch = faq;
                break;
            }
        }

        if (bestMatch) {
            return res.json({ reply: `Mujhe ye mila:\n\n**${bestMatch.question}**\n${bestMatch.answer}` });
        } else {
            return res.json({ reply: "Maaf kijiyega, mujhe iska exact answer nahi mila. Kripya apna sawal thoda alag shabdon me poochein ya upar 'Search Bar' ka istemal karein." });
        }

    } catch (err) {
        return res.json({ reply: "Abhi server me thodi dikkat hai, kripya kuch der baad try karein." });
    }
};
exports.signup = async (req, res) => {
    const { fullname, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute({
            sql: "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)",
            args: [fullname, email, hashedPassword]
        });
        res.status(201).json({ message: "Account created!" });
    } catch (err) {
        res.status(400).json({ error: "Email already exists or error!" });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [email]
        });
        if (result.rows.length === 0) return res.status(400).json({ error: "User nahi mila" });
        
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Password galat hai" });
        
        res.json({ message: "Login successful", user: { fullname: user.fullname } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
