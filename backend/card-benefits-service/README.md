# Card Benefits Service (Python Microservice)

This microservice handles generative AI features for the Stardust Financial Vault. It is built using Python, Flask, and the Google GenAI SDK.

## Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- `pip` (Python package installer)

## Setup Instructions

1. **Navigate to the service directory**
   If you aren't already here:
   ```bash
   cd backend/card-benefits-service
   ```

2. **Create a Virtual Environment**
   It's highly recommended to use a virtual environment to isolate dependencies.
   ```bash
   python3 -m venv .venv
   ```

3. **Activate the Virtual Environment**
   - On macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
   - On Windows:
     ```bash
     .venv\Scripts\activate
     ```

4. **Install Dependencies**
   Install the required Python packages from `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```

5. **Environment Variables Configuration**
   You need set up an `.env` file in this directory to load the correct API credentials.

   Create an `.env` file (if you haven't already):
   ```env
   # Add your specific environment variables here.
   # e.g., GOOGLE_API_KEY=your_gemini_api_key
   ```

6. **Run the Service**
   Start the Flask application:
   ```bash
   python app.py
   ```
   The service will run locally, likely on port 5001 or as defined in `app.py`.
