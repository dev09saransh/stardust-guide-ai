# Stardust Financial Vault

Welcome to the Stardust Financial Vault repository!

This project consists of three main components:
1. **Frontend**: A React application for the user interface.
2. **Backend**: A Node.js/Express server providing the main API.
3. **Card Benefits Service**: A Python Flask microservice integrating with generative AI.

## Quick Start

To run the entire application locally, you will need to start all three services in separate terminal windows. Please refer to the specific README files in each directory for detailed setup instructions.

### 1. Backend Server (Node.js)
Navigate to the `backend/` directory and follow the instructions in [`backend/README.md`](./backend/README.md) to install dependencies, set up environment variables, and run the server.

### 2. Card Benefits Service (Python)
Navigate to `backend/card-benefits-service/` and follow the instructions in [`backend/card-benefits-service/README.md`](./backend/card-benefits-service/README.md) to set up the virtual environment, install dependencies, and run the Flask application.

### 3. Frontend App (React)
Navigate to the `frontend/` directory and follow the instructions in [`frontend/README.md`](./frontend/README.md) to install dependencies and run the React development server.

## Directory Structure

```text
coc/
├── backend/                  # Node.js Express backend API
│   ├── card-benefits-service/# Python microservice for AI features
│   ├── src/                  # Main backend source code
│   └── README.md             # Backend setup guide
├── frontend/                 # React frontend application
│   ├── src/                  # Frontend source code
│   └── README.md             # Frontend setup guide
└── README.md                 # This file
```
