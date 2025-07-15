# Business Nexus Backend

![Business Nexus Logo](https://placehold.co/800x200?text=Business-Nexus-Backend&font=roboto)  
*Empowering Connections Between Entrepreneurs and Investors*

Welcome to the **Business Nexus Backend**, a robust Node.js-based API designed to manage user data, requests, and messages for a platform connecting entrepreneurs and investors. This backend provides a scalable foundation with MongoDB integration, supporting full CRUD (Create, Read, Update, Delete) operations. Whether you're a developer looking to explore, contribute, or deploy this project, this README will guide you through everything you need to know.

---

## 🚀 Overview

The Business Nexus Backend is a RESTful API built with Express.js, leveraging MongoDB for data persistence. It serves as the core service for managing user profiles (investors and entrepreneurs), their requests, and communication messages. This backend is designed to be independent, allowing integration with any frontend or third-party application via its well-documented endpoints.

- **Language**: JavaScript (Node.js)
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Deployment**: Render (cloud platform)
- **Status**: Active Development

---

## 📋 Features

- **User Management**: Create, read, update, and delete user profiles with roles (investor, entrepreneur).
- **Request Handling**: Manage requests between users.
- **Message System**: Facilitate communication via messages.
- **CORS Support**: Enable cross-origin requests for secure API access.
- **Scalable Design**: Modular routes and models for easy extension.

---

## 📦 Project Structure

The project is organized for clarity and maintainability:

```
business-nexus-backend/
│
├── /models/              # Mongoose schemas (e.g., User, Request, Message)
│   ├── User.js
│   ├── Request.js
│   └── Message.js
│
├── /routes/              # API route definitions
│   ├── users.js
│   ├── requests.js
│   └── messages.js
│
├── /data/                # Sample data for initial setup
│   └── data.json
│
├── import-data.js        # Script to import initial data into MongoDB
├── server.js             # Main application entry point
├── package.json          # Project dependencies and scripts
├── .env.example          # Example environment variable configuration
└── README.md             # This file!
```

---

## 🛠️ Prerequisites

Before setting up the backend, ensure you have the following installed:

- **Node.js** (v14.x or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local instance or MongoDB Atlas account)
- **Git** (for version control)

---

## 🚀 Getting Started

Follow these steps to set up and run the backend locally.

### 1. Clone the Repository
```bash
git clone https://github.com/thisisnotasad/business-nexus-backend
cd business-nexus-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory based on the example:
- Copy `.env.example` to `.env`.
- Update with your MongoDB URI:
  ```
  MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/startup_platform?retryWrites=true&w=majority
  PORT=3000
  ```
- Keep `PORT` as `3000` or adjust as needed.

### 4. Import Initial Data
Run the script to populate the database with sample data:
```bash
node import-data.js
```
- This imports users, requests, and messages from `data/data.json`.

### 5. Start the Server
```bash
node server.js
```
- The server will start on `http://localhost:3000`. Check the console for confirmation.

### 6. Test the API
Use a tool like Postman, cURL, or PowerShell to test endpoints:
```bash
Invoke-WebRequest -Uri http://localhost:3000/users | Select-Object -ExpandProperty Content
```
- Expected response: A JSON array of users.

---

## 🔧 API Endpoints

All endpoints are prefixed with `/`. Below are the available routes:

### Users
- **GET /users**  
  Retrieve all users (optional `role` query parameter: `investor` or `entrepreneur`).
  - Example: `http://localhost:3000/users?role=investor`
  - Response: `[{ "id": "1", "email": "john@investor.com", ... }]`

- **GET /users/:id**  
  Retrieve a user by ID.
  - Example: `http://localhost:3000/users/1`
  - Response: `{ "id": "1", "email": "john@investor.com", ... }`

- **GET /users/email/:email**  
  Retrieve a user by email.
  - Example: `http://localhost:3000/users/email/john@investor.com`
  - Response: `{ "id": "1", "email": "john@investor.com", ... }` or `{ "error": "User not found" }`

- **POST /users**  
  Create a new user.
  - Body: `{ "id": "2", "email": "jane@investor.com", "password": "Invest456!", "role": "investor", "name": "Jane Smith", "bio": "Investor", "interests": ["GreenTech"], "portfolio": [] }`
  - Response: `201 Created` with the new user data.

- **PUT /users/:id**  
  Update a user by ID.
  - Body: `{ "bio": "Updated bio" }`
  - Response: Updated user data.

- **DELETE /users/:id**  
  Delete a user by ID.
  - Example: `http://localhost:3000/users/1`
  - Response: `{ "message": "User deleted" }`

### Requests
- **GET /requests**  
  Retrieve all requests.
- **POST /requests**  
  Create a new request.
- **PUT /requests/:id**  
  Update a request.
- **DELETE /requests/:id**  
  Delete a request.

### Messages
- **GET /messages**  
  Retrieve all messages.
- **POST /messages**  
  Create a new message.
- **PUT /messages/:id**  
  Update a message.
- **DELETE /messages/:id**  
  Delete a message.

**Note**: Replace `:id` and `:email` with actual values. All endpoints return JSON and use standard HTTP status codes (e.g., `200`, `201`, `404`, `500`).

---

## 🛡️ Security

- **CORS**: Configured to allow requests from `http://localhost:5173` and `https://<your-frontend>.netlify.app`. Update `server.js` with your frontend URL.
- **Environment Variables**: Sensitive data (e.g., `MONGODB_URI`) is stored in `.env` and excluded from version control.
- **Plain-Text Passwords**: Currently uses plain-text passwords for simplicity. Consider adding `bcrypt` for hashing in production.

---

## 🌐 Deployment

This backend is deployed on Render for scalability. To deploy your own instance:

1. **Push to GitHub**:
   - Initialize a repository and push your code.
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/business-nexus-backend.git
   git push -u origin main
   ```

2. **Set Up Render**:
   - Sign up at [render.com](https://render.com).
   - Create a new Web Service.
   - Connect your GitHub repository.
   - Set environment variables (`MONGODB_URI`, `PORT`).
   - Deploy and note the generated URL (e.g., `https://business-nexus-backend.onrender.com`).

3. **Verify**:
   - Test endpoints with the deployed URL.

---

## 🧪 Testing

Test the API locally using PowerShell, cURL, or Postman:
- **Create User**:
  ```bash
  Invoke-WebRequest -Uri http://localhost:3000/users -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"id":"4","email":"new@investor.com","password":"New123!","role":"investor","name":"New User","bio":"New investor","interests":["AI"],"portfolio":["NewTech"]}'
  ```
- **Read User**:
  ```bash
  Invoke-WebRequest -Uri http://localhost:3000/users/email/new@investor.com | Select-Object -ExpandProperty Content
  ```
- **Update User**:
  ```bash
  Invoke-WebRequest -Uri http://localhost:3000/users/4 -Method PUT -Headers @{"Content-Type"="application/json"} -Body '{"bio":"Updated bio"}'
  ```
- **Delete User**:
  ```bash
  Invoke-WebRequest -Uri http://localhost:3000/users/4 -Method DELETE
  ```

---

## 🤝 Contributing

We welcome contributions! To contribute:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/new-feature`.
3. Commit changes: `git commit -m "Add new feature"`.
4. Push to the branch: `git push origin feature/new-feature`.
5. Open a Pull Request.

---

