# ---------------------- #
# app.py (Final Universal Fix - Dual Routes)
# ---------------------- #
import os
import json
import uuid
from datetime import datetime, timedelta
from functools import wraps
import traceback 

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin # Use the official library
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename 

# --- Import project modules ---
try:
    from report_generator import generate_pdf
    HAS_PDF_GEN = True
except ImportError:
    HAS_PDF_GEN = False
    def generate_pdf(*args, **kwargs): pass 
    
try:
    from classify import predict_disease
except ImportError:
    def predict_disease(path): return {"invalid": True, "detail": "Classifier not available."}

try:
    from stage_predictor import predict_stage
except ImportError:
     def predict_stage(path): return {"stage": "N/A"}

# --- Configuration ---
JWT_SECRET = os.environ.get("JWT_SECRET", "supersecretdevkey")
JWT_ALGORITHM = "HS256"
JWT_EXP_HOURS = int(os.environ.get("JWT_EXP_HOURS", "24"))
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
USERS_FILE = os.path.join(BASE_DIR, "users.json")
REPORTS_FILE = os.path.join(BASE_DIR, "reports.json")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
STATIC_FOLDER = os.path.join(BASE_DIR, "static")
OUTPUTS_BASE_FOLDER = os.path.join(STATIC_FOLDER, "outputs") 
REPORTS_OUTPUT_FOLDER = os.path.join(OUTPUTS_BASE_FOLDER, "reports")
GRADCAM_FOLDER = os.path.join(OUTPUTS_BASE_FOLDER, "gradcam") 
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORTS_OUTPUT_FOLDER, exist_ok=True)
os.makedirs(GRADCAM_FOLDER, exist_ok=True)

if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, "w", encoding="utf-8") as f: json.dump([], f, indent=2)
if not os.path.exists(REPORTS_FILE):
    with open(REPORTS_FILE, "w", encoding="utf-8") as f: json.dump([], f, indent=2)

app = Flask(__name__)
app.static_folder = STATIC_FOLDER 

# --- CORS SETUP (Allow Everything) ---
CORS(app, resources={r"/*": {"origins": "*"}})

# --- AUTH DECORATOR ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Let Flask-CORS handle the OPTIONS check automatically
        if request.method == 'OPTIONS':
            return jsonify({"status": "ok"}), 200

        auth_header = request.headers.get("Authorization", None)
        if not auth_header: 
            return jsonify({"error": "Authorization header required"}), 401
        try:
            parts = auth_header.split()
            if parts[0].lower() != "bearer" or len(parts) != 2: 
                raise ValueError("Invalid header")
            token = parts[1]
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.user = data 
        except: 
            return jsonify({"error": "Invalid token"}), 401
        
        return f(*args, **kwargs)
    return decorated

# --- Helpers ---
def load_users(): 
    try: with open(USERS_FILE, "r") as f: return json.load(f)
    except: return []
def save_users(users): 
    try: with open(USERS_FILE, "w") as f: json.dump(users, f, indent=2)
    except: pass
def load_reports(): 
    try: with open(REPORTS_FILE, "r") as f: return json.load(f)
    except: return []
def save_reports(reports):
    try: with open(REPORTS_FILE, "w") as f: json.dump(reports, f, indent=2)
    except: pass
def create_token(payload):
    payload["exp"] = datetime.utcnow() + timedelta(hours=JWT_EXP_HOURS)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
def safe_float(v):
    try: return float(v)
    except: return 0.0
def to_full_url(path):
    if not path: return ""
    clean_path = path.replace("\\", "/").strip("/")
    if "static/outputs/" in clean_path:
        filename = clean_path.split("static/outputs/")[-1]
        host = os.environ.get("FLASK_RUN_HOST", "https://smart-diagnostic-tool.onrender.com").rstrip('/')
        return f"{host}/outputs/{filename}"
    return ""

@app.route('/outputs/<path:filename>')
def serve_output_file(filename):
    return send_from_directory(OUTPUTS_BASE_FOLDER, filename)

# --- ROUTES (Supporting BOTH /api and root paths) ---

@app.route("/signup", methods=["POST"])
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").lower()
    password = data.get("password")
    name = data.get("name")
    if not email or not password: return jsonify({"error": "Missing data"}), 400
    
    users = load_users()
    if any(u["email"] == email for u in users): return jsonify({"error": "User exists"}), 400
    
    uid = uuid.uuid4().hex
    users.append({
        "id": uid, "name": name, "email": email,
        "password_hash": generate_password_hash(password), "is_admin": False
    })
    save_users(users)
    token = create_token({"id": uid, "email": email, "name": name})
    return jsonify({"token": token, "user": {"id": uid, "name": name, "email": email}}), 201

@app.route("/login", methods=["POST"])
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").lower()
    password = data.get("password")
    users = load_users()
    user = next((u for u in users if u["email"] == email), None)
    
    if user and check_password_hash(user.get("password_hash"), password):
        token = create_token({"id": user["id"], "email": email, "name": user["name"]})
        return jsonify({"token": token, "user": {"id": user["id"], "name": user["name"]}}), 200
    return jsonify({"error": "Invalid credentials"}), 401

# --- CLASSIFY ROUTE (Dual Path) ---
@app.route("/classify", methods=["POST"])
@app.route("/api/classify", methods=["POST"])
@token_required
def classify_route():
    if "file" not in request.files: return jsonify({"error": "No file"}), 400
    file = request.files["file"]
    
    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)
    
    try:
        # Prediction
        res = predict_disease(save_path)
        if res.get("invalid"): return jsonify({"error": "Invalid Image"}), 400
        
        disease = res.get("class_name", "Unknown")
        conf = safe_float(res.get("confidence"))
        if conf > 1: conf = conf  
        else: conf = conf * 100
        
        # Stage & PDF
        stage = "N/A"
        if disease == "ALL":
             stage = predict_stage(save_path).get("stage", "Unknown")
             
        report_id = uuid.uuid4().hex
        pdf_name = f"report_{report_id}.pdf"
        pdf_path = os.path.join(REPORTS_OUTPUT_FOLDER, pdf_name)
        
        gradcam_rel = res.get("gradcam_url", "")
        # Fix gradcam path logic
        gradcam_abs = ""
        if gradcam_rel:
            clean_gc = gradcam_rel.replace("\\", "/").split("gradcam/")[-1]
            gradcam_abs = os.path.join(GRADCAM_FOLDER, clean_gc)
            gradcam_rel = f"static/outputs/gradcam/{clean_gc}"

        if HAS_PDF_GEN:
            try: generate_pdf(pdf_path, request.user.get("name"), disease, conf, stage, res.get("explanation"), gradcam_abs)
            except: pass
            
        # Response
        final_pdf_rel = f"static/outputs/reports/{pdf_name}" if os.path.exists(pdf_path) else ""
        
        report_entry = {
            "id": report_id, "username": request.user.get("id"), "disease": disease,
            "confidence": conf, "stage": stage, "date": datetime.now().isoformat(),
            "gradcam": gradcam_rel, "pdf": final_pdf_rel
        }
        reports = load_reports()
        reports.append(report_entry)
        save_reports(reports)
        
        return jsonify({
            "prediction": disease, "confidence": conf, "stage": stage,
            "explanation": res.get("explanation"),
            "gradcam_url": to_full_url(gradcam_rel),
            "pdf_url": to_full_url(final_pdf_rel)
        }), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/reports", methods=["GET"])
@app.route("/api/reports", methods=["GET"])
@token_required
def get_reports():
    user_id = request.user.get("id")
    reports = load_reports()
    my_reports = [r for r in reports if r.get("username") == user_id]
    
    final = []
    for r in my_reports:
        final.append({
            "id": r.get("id"), "disease": r.get("disease"), "confidence": r.get("confidence"),
            "stage": r.get("stage"), "date": r.get("date"),
            "gradcam_url": to_full_url(r.get("gradcam")),
            "pdf_url": to_full_url(r.get("pdf"))
        })
    return jsonify(final), 200

@app.route("/profile", methods=["GET", "PUT"])
@app.route("/api/profile", methods=["GET", "PUT"])
@token_required
def profile_route():
    user_id = request.user.get("id")
    users = load_users()
    idx = next((i for i, u in enumerate(users) if u["id"] == user_id), -1)
    
    if request.method == "GET":
        if idx == -1: return jsonify({"error": "User not found"}), 404
        u = users[idx]
        return jsonify({k: u.get(k, "") for k in ["name", "email", "hospital", "specialization", "phone", "location", "about"]}), 200
        
    if request.method == "PUT":
        if idx == -1: return jsonify({"error": "User not found"}), 404
        data = request.get_json(silent=True) or {}
        for k in ["name", "hospital", "specialization", "phone", "location", "about"]:
            if k in data: users[idx][k] = data[k]
        save_users(users)
        return jsonify({"success": True}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))