# ---------------------- #
# app.py (Final CORS & Route Fix - v4)
# ---------------------- #

import os
import json
import uuid
from datetime import datetime, timedelta
from functools import wraps
import traceback # For better error logging

# --- FIX: Import send_from_directory ---
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_cors import CORS
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename # For safer filenames

# --- Import project modules with error handling ---
try:
    from report_generator import generate_pdf
    HAS_PDF_GEN = True
    print("--- app.py: report_generator imported successfully ---")
except ImportError as e:
    print(f"--- app.py: Warning: PDF generation disabled. Import Error: {e} ---")
    HAS_PDF_GEN = False
    def generate_pdf(*args, **kwargs): pass # Dummy function
    
try:
    from classify import predict_disease
    print("--- app.py: classify imported successfully ---")
except ImportError as e:
    print(f"--- app.py: Error: classify.py import failed: {e} ---")
    def predict_disease(path): 
        print("--- app.py: Warning: Using dummy predict_disease function. ---")
        return {"invalid": True, "detail": "Classifier not available."}

try:
    from stage_predictor import predict_stage
    print("--- app.py: stage_predictor imported successfully ---")
except ImportError as e:
     print(f"--- app.py: Warning: stage_predictor.py import failed: {e} ---")
     def predict_stage(path):
         print("--- app.py: Warning: Using dummy predict_stage function. ---")
         return {"stage": "N/A"}

# --- Configuration ---
JWT_SECRET = os.environ.get("JWT_SECRET", "supersecretdevkey")
JWT_ALGORITHM = "HS256" # Standard algorithm
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

# --- CRITICAL FIX: Allow All Origins for CORS ---
# This ensures Vercel can talk to Render without being blocked.
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.after_request
def add_cors_headers(resp):
    # Redundant backup, just in case
    origin = request.headers.get("Origin", "*")
    resp.headers["Access-Control-Allow-Origin"] = origin
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    resp.headers["Access-Control-Expose-Headers"] = "Content-Type, Authorization"
    return resp

# --- Helpers ---
def load_json_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f: content = f.read(); return json.loads(content) if content else []
    except FileNotFoundError: return []
    except Exception as e: print(f"Error loading {filepath}: {e}"); return []
def save_json_file(filepath, data):
    try:
        with open(filepath, "w", encoding="utf-8") as f: json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e: print(f"Error saving {filepath}: {e}")
def load_users(): return load_json_file(USERS_FILE)
def save_users(users): save_json_file(USERS_FILE, users)
def load_reports(): return load_json_file(REPORTS_FILE)
def save_reports(reports): save_json_file(REPORTS_FILE, reports)
def create_token(payload):
    exp = datetime.utcnow() + timedelta(hours=JWT_EXP_HOURS); payload_copy = payload.copy(); payload_copy.update({"exp": exp})
    return jwt.encode(payload_copy, JWT_SECRET, algorithm=JWT_ALGORITHM)
def decode_token(token): return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None);
        if not auth_header: return jsonify({"error": "Authorization header required"}), 401
        try:
            parts = auth_header.split();
            if parts[0].lower() != "bearer" or len(parts) != 2: raise ValueError("Invalid header format")
            token = parts[1]; data = decode_token(token); request.user = data 
        except jwt.ExpiredSignatureError: return jsonify({"error": "Token expired"}), 401
        except Exception as e: print(f"Token error: {e}"); return jsonify({"error": f"Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated
def safe_float_from_conf(conf):
    if conf is None: return 0.0 
    try:
        if isinstance(conf, str): s = conf.strip('% '); v = float(s)
        else: v = float(conf)
        return round(v, 2) if v > 1 else round(v * 100, 2) 
    except: return 0.0 
def to_full_url(stored_path):
    if not stored_path: return ""
    stored_path = str(stored_path).replace(os.sep, '/').lstrip('/')
    path_prefix = 'static/outputs/'
    if stored_path.startswith(path_prefix): filename_for_endpoint = stored_path[len(path_prefix):] 
    else: filename_for_endpoint = stored_path
    if not filename_for_endpoint: return "" 
    try: return url_for('serve_output_file', filename=filename_for_endpoint, _external=True)
    except RuntimeError: host = os.environ.get("FLASK_RUN_HOST", "http://localhost:5000").rstrip('/'); return f"{host}/outputs/{filename_for_endpoint}"

@app.route('/outputs/<path:filename>')
def serve_output_file(filename):
    try:
        abs_path = os.path.abspath(os.path.join(OUTPUTS_BASE_FOLDER, filename))
        if not abs_path.startswith(os.path.abspath(OUTPUTS_BASE_FOLDER)): return jsonify({"error": "Access denied"}), 403
        if not os.path.isfile(abs_path): return jsonify({"error": "File not found physically on server"}), 404
        return send_from_directory(OUTPUTS_BASE_FOLDER, filename, as_attachment=False)
    except Exception as e: print(f"Error serving {filename}: {e}"); return jsonify({"error": "Server error serving file"}), 500

# --- AUTH ROUTES ---
@app.route("/signup", methods=["POST"])
def signup():
    data=request.get_json(silent=True) or {}; name=data.get("name","").strip(); email=data.get("email","").strip().lower(); password=data.get("password")
    if not name or not email or not password: return jsonify({"error":"Name, email, password required"}), 400
    if '@' not in email or '.' not in email: return jsonify({"error":"Invalid email"}), 400
    users=load_users();
    if any(u.get("email")==email for u in users): return jsonify({"error":"User exists"}), 400
    try:
        pwd_hash=generate_password_hash(password); user_id=uuid.uuid4().hex
        user_obj={"id":user_id,"name":name,"email":email,"password_hash":pwd_hash,"is_admin":False,"created_at":datetime.utcnow().isoformat()}
        users.append(user_obj); save_users(users); token=create_token({"id":user_id,"email":email,"name":name})
        user_safe={"id":user_id,"name":name,"email":email,"is_admin":False}
        return jsonify({"message":"User created","user":user_safe,"token":token}), 201
    except Exception as e: print(f"Signup Error:{e}"); return jsonify({"error":"Failed to create user"}), 500

@app.route("/login", methods=["POST"])
def login():
    data=request.get_json(silent=True) or {}; email=data.get("email","").strip().lower(); password=data.get("password","")
    if not email or not password: return jsonify({"error":"Email/password required"}), 400
    users=load_users(); user=next((u for u in users if u.get("email")==email),None)
    if not user or not check_password_hash(user.get("password_hash",""),password): return jsonify({"error":"Invalid credentials"}), 401
    try:
        payload={"id":user.get("id"),"email":email,"name":user.get("name"),"is_admin":user.get("is_admin",False)}
        token=create_token(payload); user_safe={k:user.get(k) for k in ["id","name","email","is_admin"]}
        return jsonify({"message":"Login successful","user":user_safe,"token":token}), 200
    except Exception as e: print(f"Login Error:{e}"); return jsonify({"error":"Login failed"}), 500

# ----------------------
# CLASSIFY ROUTE
# ----------------------
@app.route("/classify", methods=["POST"])
@token_required
def classify_route():
    print("\n--- app.py: Received POST /classify ---") 
    if "file" not in request.files: print("--- app.py: Error - No file part ---"); return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if not file or file.filename == "": print("--- app.py: Error - No selected file ---"); return jsonify({"error": "No selected file"}), 400
    
    token_user = getattr(request, "user", {}); user_identifier = token_user.get("id") or token_user.get("email") or "anonymous"
    print(f"--- app.py: Request from user: {user_identifier} ---")
    
    original_filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    upload_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    print(f"--- app.py: Saving upload to: {upload_path} ---")
    
    try: file.save(upload_path)
    except Exception as e: print(f"--- app.py: Error saving upload: {e} ---"); return jsonify({"error": "Failed to save upload"}), 500

    gradcam_rel_path = ""; pdf_rel_path = "" 
    
    try:
        print("--- app.py: Calling predict_disease... ---")
        disease_result = predict_disease(upload_path) 
        print(f"--- app.py: predict_disease returned: {disease_result} ---") 
        
        if disease_result.get("invalid"): 
             print(f"--- app.py: Invalid image detected by classify.py ---")
             if os.path.exists(upload_path): os.remove(upload_path) 
             return jsonify({"error": "INVALID_IMAGE", "message": disease_result.get("detail", "Invalid image.")}), 400

        class_name = disease_result.get("class_name", "Unknown")
        conf_num = safe_float_from_conf(disease_result.get("confidence")) 
        explanation = disease_result.get("explanation", "N/A")
        gradcam_rel_path = disease_result.get("gradcam_url", "") 
        
        if gradcam_rel_path:
            gradcam_rel_path = gradcam_rel_path.replace(os.sep, '/').lstrip('/')
            if not gradcam_rel_path.startswith('static/outputs/'):
                 print(f"Warning: Adjusting unexpected gradcam path: {gradcam_rel_path}")
                 if 'gradcam/' in gradcam_rel_path: gradcam_rel_path = 'static/outputs/' + gradcam_rel_path.split('gradcam/', 1)[1]
                 else: gradcam_rel_path = ""

        stage = "N/A"; 
        if class_name == "ALL": 
            print("--- app.py: Disease is ALL, calling predict_stage... ---")
            try: 
                stage_result = predict_stage(upload_path)
                stage = stage_result.get("stage", "Stage Unknown")
                print(f"--- app.py: Stage prediction result: {stage} ---")
            except Exception as e: print(f"--- app.py: ERROR stage prediction: {e} ---"); stage = "Stage Error"
        else: stage = "No stages specified" 

        report_id = uuid.uuid4().hex; pdf_filename = f"report_{report_id}.pdf"
        pdf_abs_path = os.path.join(REPORTS_OUTPUT_FOLDER, pdf_filename)
        pdf_rel_path = os.path.join("static", "outputs", "reports", pdf_filename).replace(os.sep, "/") 
        
        if HAS_PDF_GEN:
            print(f"--- app.py: Attempting PDF generation for report {report_id} ---")
            gradcam_abs_path_for_pdf = ""
            if gradcam_rel_path:
                try: 
                    gradcam_abs_path_for_pdf = os.path.abspath(os.path.join(BASE_DIR, gradcam_rel_path))
                    if not os.path.exists(gradcam_abs_path_for_pdf):
                        print(f"--- app.py: Warning - PDF GradCAM path not found: {gradcam_abs_path_for_pdf} ---")
                        gradcam_abs_path_for_pdf = "" 
                except Exception as path_e: print(f"--- app.py: Error resolving PDF GradCAM path: {path_e} ---"); gradcam_abs_path_for_pdf = ""
            try:
                print(f"--- app.py: Calling generate_pdf with gradcam_path={gradcam_abs_path_for_pdf} ---")
                generate_pdf(
                    output_path=pdf_abs_path, patient_name=user_identifier, disease=class_name, confidence=conf_num,
                    stage=stage, explanation=explanation, gradcam_path=gradcam_abs_path_for_pdf
                )
                if os.path.exists(pdf_abs_path): print(f"--- app.py: PDF generated: {pdf_rel_path} ---")
                else: print(f"--- app.py: ERROR - PDF file not found after generation: {pdf_abs_path} ---"); pdf_rel_path = ""
            except Exception as e: 
                print(f"--- app.py: ERROR during PDF generation: {e} ---"); traceback.print_exc(); pdf_rel_path = ""
        else: print("--- app.py: PDF gen disabled ---"); pdf_rel_path = ""

        now_iso = datetime.now().isoformat() 
        new_report_entry = {
            "id": report_id, "username": user_identifier, "disease": class_name, "confidence": f"{conf_num:.2f}%", 
            "stage": stage, "date": now_iso, "gradcam": gradcam_rel_path, "pdf": pdf_rel_path, 
            "status": "Completed" if gradcam_rel_path or pdf_rel_path else "Processing Error" 
        }
        print(f"--- app.py: Saving report entry: {new_report_entry} ---")
        reports_data = load_reports(); reports_data.append(new_report_entry); save_reports(reports_data)
        
        # --- Prepare Final Response ---
        response_json = {
            "prediction": class_name, "confidence": conf_num, "stage": stage, "explanation": explanation,
            "gradcam_url": to_full_url(gradcam_rel_path), 
            "pdf_url": to_full_url(pdf_rel_path),       
            "report_id": report_id 
        }
        
        print(f"--- app.py: Final JSON response being sent:\n{json.dumps(response_json, indent=2)} ---") 

        return jsonify(response_json), 200
        
    except Exception as e:
        print(f"--- app.py: !!! UNEXPECTED GLOBAL ERROR /classify !!! ---"); print(f"    Error: {e}"); traceback.print_exc() 
        if os.path.exists(upload_path):
             try: os.remove(upload_path) 
             except Exception as del_e: print(f"    Failed cleanup: {del_e}")
        return jsonify({"error": f"Unexpected server error."}), 500

# ----------------------
# Other endpoints (Unchanged)
# ----------------------
@app.route("/reports", methods=["GET"])
@token_required
def get_reports():
    token_user = getattr(request, "user", {}); user_identifier = token_user.get("id") or token_user.get("email")
    is_admin = token_user.get("is_admin", False); fetch_all = request.args.get("all", "false").lower() in ("true", "1", "yes") 
    reports_data = load_reports(); user_reports = []
    for report in reports_data:
        if (is_admin and fetch_all) or report.get("username") == user_identifier:
            conf_num = safe_float_from_conf(report.get("confidence")) 
            report_entry = {
                "id": report.get("id", ""), "username": report.get("username", "N/A"), "disease": report.get("disease", "N/A"),
                "confidence": conf_num, "stage": report.get("stage", "N/A"), "date": report.get("date", "N/A"), 
                "gradcam_url": to_full_url(report.get("gradcam", "")), 
                "pdf_url": to_full_url(report.get("pdf", "")),         
                "status": report.get("status", "N/A")
            }
            user_reports.append(report_entry)
    user_reports.sort(key=lambda x: x.get("date", ""), reverse=True)
    return jsonify(user_reports), 200

@app.route("/ping", methods=["GET"])
def ping(): return jsonify({"message": "pong - Service running"}), 200

@app.route("/profile", methods=["GET"])
@token_required
def get_profile_route():
    token_user = getattr(request, "user", {}); user_identifier = token_user.get("id") or token_user.get("email") 
    if not user_identifier: return jsonify({"error": "User ID/Email not in token"}), 401
    users = load_users(); 
    user = next((u for u in users if u.get("id") == user_identifier or u.get("email") == user_identifier), None)
    if not user: return jsonify({"error": "Profile not found"}), 404
    profile = {k: user.get(k, "") for k in ["id","name","email","hospital","specialization","phone","location","about"]}
    profile["is_admin"] = user.get("is_admin", False) 
    return jsonify(profile), 200

@app.route("/profile", methods=["PUT"])
@token_required
def update_profile_route():
    token_user = getattr(request, "user", {}); user_identifier = token_user.get("id") or token_user.get("email")
    if not user_identifier: return jsonify({"error": "User ID/Email not in token"}), 401
    data = request.get_json(silent=True) or {}; 
    if not data: return jsonify({"error": "No update data"}), 400
    users = load_users(); user_index = -1
    for i, u in enumerate(users):
        if u.get("id") == user_identifier or u.get("email") == user_identifier: user_index = i; break
    if user_index == -1: return jsonify({"error": "User not found"}), 404
    updated_profile = users[user_index].copy(); update_occurred = False; allowed = ["name","hospital","specialization","phone","location","about"]
    for field in allowed:
        if field in data:
            new_val = str(data[field]).strip() if data[field] is not None else ""
            if updated_profile.get(field, "") != new_val: updated_profile[field] = new_val; update_occurred = True
    if update_occurred:
        users[user_index] = updated_profile; save_users(users);
        profile_resp = {k: updated_profile.get(k, "") for k in ["id","name","email","hospital","specialization","phone","location","about"]}
        profile_resp["is_admin"] = updated_profile.get("is_admin", False)
        return jsonify({"success": True, "message": "Profile updated", "profile": profile_resp}), 200
    else:
        profile_resp = {k: users[user_index].get(k, "") for k in ["id","name","email","hospital","specialization","phone","location","about"]}
        profile_resp["is_admin"] = users[user_index].get("is_admin", False)
        return jsonify({"success": False, "message": "No changes detected", "profile": profile_resp }), 200 

if __name__ == "__main__":
    host = os.environ.get("FLASK_RUN_HOST", "0.0.0.0"); port = int(os.environ.get("FLASK_RUN_PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "1") == "1" 
    print(f"--- Starting Flask Server ---"); print(f"Host: {host}"); print(f"Port: {port}"); print(f"Debug: {debug_mode}")
    print(f"Static Folder: {app.static_folder}"); print(f"Outputs Base: {OUTPUTS_BASE_FOLDER}"); print(f"-----------------------------")
    app.run(host=host, port=port, debug=debug_mode)