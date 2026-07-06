# Vicharanashala Lab for Education Design (VLED) — FAQ Hub

A responsive and dynamic FAQ management hub and onboarding platform for the **Vicharanashala Lab Internship** program at **IIT Ropar**. The application features an interactive FAQ database, voice-assisted searching, an AI-powered conversational chatbot (Yaksha-mini), and a secure user authentication system linked to a cloud-based **Turso DB** backend.

---

## 🚀 Key Features

* **Dynamic FAQ Explorer**: Filters and displays FAQ items by category sections, view counts, or keyword relevance with real-time text highlighting.
* **Voice Search Integration**: Seamlessly search through intern doubts using speech-to-text recognition directly in the browser.
* **Yaksha-mini Chatbot**: An embedded chatbot widget capable of parsing user queries and fetching matching responses from the database.
* **Secure Auth Flow**: Hashed password registration and login endpoints utilizing `bcryptjs` to authenticate users.
* **Session Persistence**: Client-side session maintenance that dynamically updates headers across all pages with user-customized greetings (`Hi, [Name]`) and action buttons.
* **Turso Database Integration**: A cloud-hosted SQLite-compatible server database built on `libsql` for fast, lightweight data loading.

---

## 📂 Project Structure

```bash
VLED/
├── VLED-backend/            # Node.js backend server
│   ├── config/              # Configuration (database client setup)
│   │   └── db.js            # Turso DB client initialization
│   ├── controllers/         # API endpoint logic handlers
│   │   └── faqController.js # Handles FAQ views, searches, chatbots, and user registration/login
│   ├── models/              # Data schema helpers
│   │   └── Faq.js
│   ├── routes/              # Express endpoint routing
│   │   ├── authRoutes.js    # Routes for user authentication (/signup, /login)
│   │   └── faqRoutes.js     # Routes for FAQ actions and chatbot (/chat, /add, /category, etc.)
│   ├── .env                 # Port and database token environments
│   ├── seed.js              # Database migration and sample FAQ datasets setup script
│   ├── server.js            # API server configuration and entrypoint
│   └── package.json         # Node server dependencies list
│
├── Yaksha.png               # Brand logo asset
├── index.html               # Main FAQ Hub explorer page
├── home.html                # Project overview and statistics dashboard
├── welcome.html             # Onboarding guidance and badging layout
├── login.html               # User sign-in screen
├── signup.html              # Account creation screen
│
├── style.css                # Global design system style variables and typography
├── home.css                 # Specific styles for the home layout
├── welcome.css              # Statistics counters and animations styles
├── login.css                # Glassmorphic forms and field styling
│
├── script.js                # Frontend actions, search, and chat widget controller
├── auth.js                  # Frontend auth routing client and nav header session controller
└── README.md                # Project documentation
```

---

## 🛠️ Setup & Installation

### Prerequisities
Make sure you have [Node.js](https://nodejs.org/) (version 16 or above) installed on your system.

### 1. Database Configuration
The backend is configured to connect to a Turso database client. Inside `VLED-backend/.env`, verify that your credentials are set:
```env
PORT=5000
TURSO_DATABASE_URL=your_libsql_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
```

### 2. Install Server Dependencies
Navigate to the backend directory and install the required modules:
```bash
cd VLED-backend
npm install
```

### 3. Initialize & Seed Database
Ensure the tables (`faqs`, `community_faqs`, `users`) exist and seed the default program FAQ guidelines into the Turso database:
```bash
node seed.js
```

### 4. Run the API Server
Start the Express server on port `5000`:
```bash
node server.js
```

### 5. Access the Frontend
Open `index.html` or `home.html` in your web browser. You can serve them using a static file server or double-click to run locally.

---

## 💻 Tech Stack

* **Frontend**: Vanilla HTML5, CSS3 Custom Properties (Variables), JavaScript (ES6)
* **Backend**: Node.js, Express.js
* **Database**: Turso DB (LibSQL Client)
* **Encryption**: BcryptJS
* **APIs**: Web Speech Recognition API (Speech-to-Text)
