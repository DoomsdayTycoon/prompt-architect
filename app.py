"""
Prompt Architect — Professional AI Prompt Generator
Local dev server. For production, deploy to Vercel as a static site.

Run locally:  python app.py
"""

from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder="static")


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


@app.route("/health")
def health():
    return {"status": "ok"}, 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
