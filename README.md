# 🛠️ ShohojMart+ Server

This is the **backend server** of [ShohojMart+](https://shohojmart-f8a93.web.app) — a modern e-commerce platform built using the MERN stack. It manages user authentication, product data, orders, and payments via a secure and scalable RESTful API.

---

## 🌐 Live Links

- 🛒 **Client (Frontend)**: [https://shohojmart-f8a93.web.app](https://shohojmart-f8a93.web.app)
- 🔗 **API Base URL**: [https://shohojmart-server.vercel.app](https://shohojmart-server.vercel.app)
- 📁 **Frontend Repo**: [GitHub - ShohojMart+ Client](https://github.com/Hayder987/shohoj-mart)
- 📁 **Backend Repo**: [GitHub - ShohojMart+ Server](https://github.com/Hayder987/shohoj-mart-server)

---

## 🚀 Features

- 🔐 JWT-based authentication with role-based access (Admin/User)
- 👤 Secure user management
- 🛍️ Product CRUD operations
- 📦 Order tracking and history
- 💳 Stripe payment integration
- 📄 RESTful API endpoints
- 🧩 Middleware for security and validation
- 🌐 CORS configuration for frontend communication
- 🍪 Cookie-based token handling

---

## 📁 Project Structure

---

## 🛠️ Technologies Used

### 🔧 Core Packages

| Package             | Description                                |
|----------------------|--------------------------------------------|
| **express**          | Fast, unopinionated web framework          |
| **mongodb**          | NoSQL database to store all data           |
| **jsonwebtoken**     | Handles JWT-based authentication           |
| **cookie-parser**    | Parses cookies from requests               |
| **cors**             | Enables Cross-Origin Resource Sharing      |
| **dotenv**           | Loads environment variables                |
| **stripe**           | Integrates Stripe for payments             |
| **nodemon**          | Auto-restarts server on file changes       |

---

## 📦 Installed Dependencies

```json
"cookie-parser": "^1.4.7",
"cors": "^2.8.5",
"dotenv": "^16.4.7",
"express": "^5.1.0",
"jsonwebtoken": "^9.0.2",
"mongodb": "^6.15.0",
"nodemon": "^3.1.9",
"stripe": "^18.0.0"
