# ---------------------- #
# app.py (Final "Lite" Version for Free Tier)
# ---------------------- #
import os
import json
import uuid
import datetime
from functools import wraps

# --- MEMORY OPTIMIZATION START ---
# Turn off heavy TF logs and OneDNN to save RAM
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
# --- MEMORY OPTIMIZATION END ---

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename 

# --- Import project modules ---
try:
    from report_generator import generate_pdf
    HAS_PDF_GEN = True
except:
    HAS_PDF_GEN = False
    def generate_pdf(*args, **kwargs): pass 

# Lazy load classifier to prevent crash on startup
def get_prediction(path):
    try:
        from classify import predict_disease
        return predict_disease(path)
    except ImportError:
        return {"invalid": True, "detail": "Classifier missing"}
    except Exception as e:
        print(f"Prediction Error: {e}")
        return {"invalid": True, "detail": "Server memory low"}

try:
    from stage_predictor import predict_stage
except:
     def predict_stage(path): return {"stage": "N/A"}

# --- Config ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
STATIC_FOLDER = os.path.join(BASE_DIR, "static")
OUTPUTS_FOLDER = os.path.join(STATIC_FOLDER, "outputs")
REPORTS_FOLDER = os.path.join(OUTPUTS_FOLDER, "reports")
GRADCAM_FOLDER = os.path.join(OUTPUTS_FOLDER, "gradcam")
USERS_FILE = os.path.join(BASE_DIR, "users.json")
REPORTS_FILE = os.path.join(BASE_DIR, "reports.json")

for d in [UPLOAD_FOLDER, REPORTS_FOLDER, GRADCAM_FOLDER]:
    os.makedirs(d, exist_ok=True)
for f in [USERS_FILE, REPORTS_FILE]:
    if not os.path.exists(f):
        with open(f, 'w') as file: json.dump([], file)

app = Flask(__name__)
app.static_folder = STATIC_FOLDER
CORS(app) # Simple, standard CORS

JWT_SECRET = os.environ.get("JWT_SECRET", "secret")

# --- Helpers ---
def load_data(file):
    try:
        with open(file, 'r') as f: return json.load(f)
    except: return []

def save_data(file, data):
    try:
        with open(file, 'w') as f: json.dump(data, f, indent=2)
    except: pass

def get_full_url(path):
    if not path: return ""
    clean = path.replace("\\", "/").strip("/")
    if "outputs/" in clean:
        fname = clean.split("outputs/")[-1]
        host = os.environ.get("FLASK_RUN_HOST", "https://smart-diagnostic-tool.onrender.com").rstrip('/')
        return f"{host}/outputs/{fname}"
    return ""

# --- Routes ---

@app.route('/')
def home():
    return jsonify({"status": "Online", "message": "Backend is running!"})

@app.route('/outputs/<path:filename>')
def serve_file(filename):
    return send_from_directory(OUTPUTS_FOLDER, filename)

@app.route('/api/signup', methods=['POST'])
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').lower()
    password = data.get('password')
    name = data.get('name')
    
    users = load_data(USERS_FILE)
    if any(u['email'] == email for u in users):
        return jsonify({"error": "User exists"}), 400
        
    uid = uuid.uuid4().hex
    users.append({
        "id": uid, "name": name, "email": email, 
        "password_hash": generate_password_hash(password)
    })
    save_data(USERS_FILE, users)
    
    token = jwt.encode({
        "id": uid, 
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, JWT_SECRET, algorithm="HS256")
    
    return jsonify({"token": token, "user": {"id": uid, "name": name}}), 201

@app.route('/api/login', methods=['POST'])
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').lower()
    password = data.get('password')
    
    users = load_data(USERS_FILE)
    user = next((u for u in users if u['email'] == email), None)
    
    if user and check_password_hash(user.get('password_hash'), password):
        token = jwt.encode({
            "id": user['id'], 
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, JWT_SECRET, algorithm="HS256")
        return jsonify({"token": token, "user": {"id": user['id'], "name": user['name']}}), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/classify', methods=['POST'])
@app.route('/classify', methods=['POST'])
def classify():
    # Verify Token manually to avoid decorator overhead
    auth = request.headers.get("Authorization")
    if not auth: return jsonify({"error": "No token"}), 401
    
    try:
        if 'file' not in request.files: return jsonify({"error": "No file"}), 400
        file = request.files['file']
        
        fname = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
        fpath = os.path.join(UPLOAD_FOLDER, fname)
        file.save(fpath)
        
        # Run Prediction (Lazy Loaded)
        res = get_prediction(fpath)
        
        if res.get('invalid'):
            return jsonify({"error": "Analysis failed", "detail": res.get('detail')}), 400
            
        disease = res.get('class_name', 'Unknown')
        conf = float(res.get('confidence', 0))
        if conf <= 1: conf *= 100
        
        # Prepare Result
        gradcam_url = get_full_url(res.get('gradcam_url', ''))
        pdf_name = f"report_{uuid.uuid4().hex}.pdf"
        
        # Try PDF Gen (Fail silently if memory low)
        try:
            if HAS_PDF_GEN:
                pdf_full_path = os.path.join(REPORTS_FOLDER, pdf_name)
                generate_pdf(pdf_full_path, "User", disease, conf, "N/A", res.get('explanation'), "")
        except: pdf_name = ""
        
        pdf_url = get_full_url(f"static/outputs/reports/{pdf_name}") if pdf_name else ""
        
        return jsonify({
            "prediction": disease,
            "confidence": conf,
            "stage": "N/A",
            "explanation": res.get('explanation', ''),
            "gradcam_url": gradcam_url,
            "pdf_url": pdf_url
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Server error processing image"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))