from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

# Initialize Gemini client
client = genai.Client(api_key=API_KEY)

# ==============================
# CREATE FLASK APP
# ==============================

app = Flask(__name__)
CORS(app)

# Initialize Limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# ==============================
# HEALTH CHECK
# ==============================

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "AI Card Benefits Service Running"})

# ==============================
# MAIN ENDPOINT
# ==============================

@app.route("/card-benefits", methods=["POST"])
@limiter.limit("5 per minute") # Strict limit for AI generation
def card_benefits():
    print("POST /card-benefits hit")

    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    bank = data.get("bank", "")
    network = data.get("network", "")
    variant = data.get("variant", "")

    if not bank:
        return jsonify({"error": "Bank name is required"}), 400

    prompt = f"""
    You are a professional financial assistant.

    Explain the benefits of the {bank} {variant} credit card on the {network} network.

    - Provide exactly 5 concise, one-sentence bullet points.
    - Do not use asterisks or any other special characters for emphasis.
    - Keep language simple and clear.
    - Mention who it is best suited for in one of the points.
    - If unsure, give typical category benefits.
    """

    try:
        print("Calling Gemini...")

        response = client.models.generate_content(
            model="models/gemini-flash-latest",
            contents=prompt
        )

        print("Gemini returned response")

        benefits_text = response.text  # ← SAFE extraction

        if not benefits_text:
            return jsonify({"error": "AI returned empty response"}), 500

        return jsonify({
            "bank": bank,
            "benefits": benefits_text
        })

    except Exception as e:
        error_msg = str(e)
        print("Error:", error_msg)
        
        # Handle Quota Exceeded (429) specifically
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return jsonify({
                "error": "Gemini API Quota Exceeded. Please try again in 1 minute or check your Google AI Studio plan."
            }), 429
            
        return jsonify({"error": error_msg}), 500


# ==============================
# RUN SERVER
# ==============================

if __name__ == "__main__":
    print("Server running on http://localhost:5005")
    app.run(host="0.0.0.0", port=5005, debug=True)
