# Project Setup Guide  
Smart API Failure Detection & Auto-Recovery System (MERN)

This document explains how to set up the project locally for development.
These steps can be reused for similar Node.js + Express + React projects.

---

## 🧱 Prerequisites

Make sure the following are installed on your system:

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)
- Git
- A code editor (VS Code recommended)

To check versions:
```bash
node -v
npm -v
git --version

#folder structure 
smart-api-failure-detection/
│
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── node_modules/
│   └── .gitignore
│
├── frontend/
│   └── (empty initially)
│
├── README.md
└── README.setup.md




📁 Project Structure

smart-api-failure-detection/
│
├── backend/        # Node.js + Express backend
├── frontend/       # React frontend (added later)
└── README.setup.md




🚀 Backend Setup (Node.js + Express)

1️⃣ Clone the repository
git clone <repository-url>
cd smart-api-failure-detection

2️⃣ Navigate to backend folder
cd backend

3️⃣ Install backend dependencies
npm install

(above command will install:
express
axios
node-cron
other required packages)

4️⃣ Run the backend server
node index.js

If setup is correct, you should see:
Server running on port 3000

Test in browser:
http://localhost:3000


🌐 Frontend Setup (React)
(Frontend will be added later in the project)

When frontend is available:
cd frontend
npm install
npm start


Frontend usually runs on:
http://localhost:3001 or http://localhost:3000




🔁 Common Git Workflow (For Team Projects)

Pull latest changes:
git pull


After making changes:
git add .
git commit -m "Meaningful commit message"
git push











# Smart API Failure Detection & Auto-Recovery System

## 🚀 Project Setup – From Scratch (Reference for Future Me)

This section documents the exact steps used to set up this project initially.
It can be reused as a reference for future Node.js / MERN projects.

---

## 📁 Step 1: Create Project Folder

```bash
mkdir smart-api-failure-detection
cd smart-api-failure-detection```

##📂 Step 2: Create Backend and Frontend Folders
```bash
mkdir backend frontend```


##⚙️ Step 3: Initialize Node.js Project (Backend)
```bash
cd backend
npm init -y```

This creates package.json.

##📦 Step 4: Install Backend Dependencies
```bash
npm install express axios node-cron```

Purpose of packages:
express → backend server & routing
axios → making HTTP requests to APIs
node-cron → background scheduled health checks

🧠 Step 5: Create Basic Express Server
Create file:
backend/index.js


Add the following code:

``` const express = require("express");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Smart API Failure Detection System is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); ```



## ▶️ Step 6: Run Backend Server

```bash
node index.js```

Open browser:
http://localhost:3000

Expected output:
Smart API Failure Detection System is running


##🌱 Step 7: Initialize Git Repository
From project root:
```bash
git init```


##🚫 Step 8: Add .gitignore
Create file:
backend/.gitignore

Add:
node_modules
.env


##🧾 Step 9: First Git Commit
```bash
git add .
git commit -m "Initial backend setup with Node.js and Express"```


##🌐 Step 10: Create GitHub Repository

Create a new repository on GitHub
Name: smart-api-failure-detection
Do NOT add README or .gitignore from GitHub UI

##🔗 Step 11: Connect Local Repo to GitHub
```bash
git remote add origin <repository-url>
git branch -M main
git push -u origin main```

##🤝 Step 12: Add Collaborator (Team Setup)

Go to GitHub repo → Settings → Collaborators
Add teammate’s GitHub username
Teammate accepts invite

