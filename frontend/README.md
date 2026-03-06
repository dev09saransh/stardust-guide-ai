# React Frontend App

This is the frontend application for the Stardust Financial Vault project, built using React and styled with TailwindCSS.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Setup Instructions

1. **Navigate to the frontend directory**
   If you aren't already here:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**
   Run the following command to download and install all required Node.js packages:
   ```bash
   npm install
   ```

3. **Environment Variables (Optional but common)**
   If the React app requires custom environment variables (e.g., API base URL), create a `.env` file in this directory.
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the Development Server**
   Start the application in development mode:
   ```bash
   npm start
   ```

   This will open the app in your default web browser, usually at [http://localhost:3000](http://localhost:3000). The page will reload automatically if you make edits. You will also see any lint errors in the console.

## Available Scripts

In the project directory, you can also run:

- `npm run build`: Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.
- `npm test`: Launches the test runner in the interactive watch mode.
