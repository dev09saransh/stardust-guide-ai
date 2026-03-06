# Node.js Backend Server

This is the main backend server for the Stardust Financial Vault project, built with Node.js and Express.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A running MySQL database instance.

## Setup Instructions

1. **Navigate to the backend directory**
   If you aren't already here:
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   Run the following command to download and install all required Node.js packages:
   ```bash
   npm install
   ```

3. **Environment Variables Configuration**
   You need an `.env` file in this directory (`backend/`) to store your configuration secrets (database credentials, JWT secret, Twilio keys, etc.).

   If you don't have an `.env` file yet, create one and populate it with the necessary variables:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=your_database_name

   # JWT Secret for authentication
   JWT_SECRET=your_jwt_secret_key

   # Twilio keys (for OTP)
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=...

   # Add other required environment variables here
   ```
   *(Check with your team if there is a `.env.example` to refer to.)*

4. **Start the Server**
   Start the application in development mode:
   ```bash
   npm start
   ```
   The backend will typically run on `http://localhost:5000` or the port specified in your `.env` file.
