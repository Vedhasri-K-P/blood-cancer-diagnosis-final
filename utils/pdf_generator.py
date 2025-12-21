# backend/utils/pdf_generator.py
from fpdf import FPDF
import os
from datetime import datetime

# Resolve backend root to allow relative paths to static files
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

class PDF(FPDF):
    def header(self):
        # Title
        self.set_font("Helvetica", 'B', 18)
        self.set_text_color(30, 30, 30)
        self.cell(0, 12, "Smart Diagnostic Tool — Report", ln=True, align='C')
        self.set_draw_color(0, 102, 204)
        self.set_line_width(0.8)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", 'I', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"Page {self.page_no()} of {{nb}}", align='C')

    def section_title(self, title):
        self.set_font("Helvetica", 'B', 14)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, title, ln=True)
        self.set_text_color(0, 0, 0)

    def kv(self, key, value):
        self.set_font("Helvetica", '', 12)
        self.cell(50, 8, f"{key}:", border=0)
        self.multi_cell(0, 8, str(value) if value is not None else "N/A")

def _abs(path_like: str) -> str:
    if not path_like:
        return ""
    p = path_like.lstrip("/\\")
    if os.path.isabs(path_like):
        return path_like
    return os.path.join(BASE_DIR, p)

def generate_pdf(
    output_path: str,
    patient_name: str,
    disease: str,
    confidence: float,
    stage: str,
    explanation: str,
    gradcam_path: str = ""
):
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()

    # Patient / meta
    pdf.section_title("Patient / User")
    pdf.kv("Name / Email", patient_name)
    pdf.kv("Generated On", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    pdf.ln(2)

    # Diagnosis
    pdf.section_title("Diagnosis Summary")
    pdf.kv("Disease", disease or "N/A")
    pdf.kv("Confidence", f"{confidence:.2f}%")
    pdf.kv("Stage", stage or "N/A")
    pdf.ln(2)

    # Explanation
    if explanation:
        pdf.section_title("Model Explanation")
        pdf.set_font("Helvetica", '', 12)
        pdf.multi_cell(0, 8, explanation)
        pdf.ln(2)

    # Grad-CAM
    abs_gradcam = _abs(gradcam_path)
    if abs_gradcam and os.path.exists(abs_gradcam):
        pdf.section_title("Grad-CAM Visualization")
        # Scale image to fit width
        max_w = 170
        pdf.image(abs_gradcam, x=20, w=max_w)
        pdf.ln(4)
        pdf.set_font("Helvetica", 'I', 11)
        pdf.multi_cell(
            0, 6,
            "Highlight shows regions most influential to the prediction (for interpretability)."
        )

    # Output
    out_abs = _abs(output_path)
    out_dir = os.path.dirname(out_abs)
    os.makedirs(out_dir, exist_ok=True)
    pdf.output(out_abs)
    print(f"✅ PDF saved: {out_abs}")
