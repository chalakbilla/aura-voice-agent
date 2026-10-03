import os

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from agent import build_summary, respond
from orders import ORDERS

DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
app = Flask(__name__, static_folder=DIST_DIR, static_url_path="")
CORS(app)


@app.get("/api/orders")
def list_orders():
    return jsonify(ORDERS)


@app.post("/api/chat")
def chat():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    return jsonify(respond(text, data.get("context")))


@app.post("/api/summary")
def summary():
    data = request.get_json(force=True, silent=True) or {}
    return jsonify(build_summary(data.get("context")))


@app.get("/")
def index():
    return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
    app.run(port=5000, debug=True)
