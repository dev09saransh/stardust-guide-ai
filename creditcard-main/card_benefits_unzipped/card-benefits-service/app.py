from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os
from dotenv import load_dotenv

# ==============================
# LOAD ENV VARIABLES
# ==============================

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
            model="gemini-2.5-flash",
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
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


# ==============================
# RUN SERVER
# ==============================

if __name__ == "__main__":
    print("Server running on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
