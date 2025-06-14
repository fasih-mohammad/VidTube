# VidTube
# 📺 VideoTube Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?logo=mongodb)](https://www.mongodb.com/)
[![Postman Tested](https://img.shields.io/badge/Tested%20With-Postman-orange?logo=postman)](https://www.postman.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🎯 A scalable backend API service for a full-featured video-sharing platform like YouTube. Built using Node.js, Express, MongoDB, and Cloudinary.

---

## 🚀 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (Access & Refresh Tokens)
- **Media Handling:** Cloudinary (for video/image storage)
- **Testing Tool:** Postman

---

## 📁 Folder Structure

src/
│
├── controllers/ # Feature-wise route logic
├── db/ # MongoDB connection
├── middlewares/ # JWT & error handling middleware
├── models/ # Mongoose schemas
├── routes/ # API endpoints
├── utils/ # Reusable utility functions
└── app.js # Express app entry point


---

## 🔐 Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
PORT=8000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Clone the repository
git clone https://github.com/fasih-mohammad/videotube-backend.git
cd videotube-backend

# Install dependencies
npm install

# Start the server
npm start

📦 Features
🔐 User Signup/Login

📹 Video Upload and Watch History

👍 Like/Unlike for Videos, Comments, Tweets

💬 Comment System

📜 Playlist Management (Add, Remove Videos)

👤 Channel Subscriptions

📊 Dashboard: Stats & Video Listings

🧪 API Testing
All routes are tested using Postman. You can import the Postman collection via the link below:

🔗 Postman collection link coming soon...

🗃️ .gitignore
.env, node_modules, logs, etc. are all excluded from version control via a .gitignore file.

📄 License
This project is licensed under the MIT License – feel free to use and modify it.

✍️ Author
Fasih Mohammad Khan
🌐 https://github.com/fasih-mohammad/ 

📌 Future Improvements

Swagger API Documentation

Rate Limiting & Caching

Email Verification & Password Reset

Admin Role & Moderation Tools
