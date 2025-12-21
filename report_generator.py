# report_generator.py
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
# Removed UnicodeCIDFont and pdfmetrics imports as we won't use custom fonts
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# ---------- Fonts ----------
# --- FIX: Use a standard built-in font ---
# Removed the HeiseiMin-W3 logic. We will explicitly use 'Helvetica'.
FONT_NAME = "Helvetica"
FONT_BOLD = "Helvetica-Bold" # Use bold variant where needed

# ---------- Header & Footer ----------
def _header_footer(canvas, doc):
    canvas.saveState()
    page_w, page_h = A4
    logo_path = os.path.join(os.getcwd(), "static", "logo.png")
    if os.path.exists(logo_path):
        canvas.drawImage(
            logo_path,
            x=36, y=page_h - 90,
            width=60, height=60,
            preserveAspectRatio=True, mask='auto'
        )
    # --- FIX: Explicitly set standard font ---
    canvas.setFont(FONT_NAME, 13)
    canvas.drawString(110, page_h - 50, "Smart Diagnostic Tool – Medical Report")
    canvas.setLineWidth(0.7)
    canvas.setStrokeColorRGB(0.7, 0.7, 0.7)
    canvas.line(36, page_h - 96, page_w - 36, page_h - 96)
    # --- FIX: Explicitly set standard font ---
    canvas.setFont(FONT_NAME, 9)
    now_text = datetime.now().strftime("Generated on %Y-%m-%d %H:%M")
    canvas.setFillColorRGB(0.35, 0.35, 0.35)
    canvas.drawString(36, 28, now_text)
    canvas.drawRightString(page_w - 36, 28, f"Page {doc.page}")
    canvas.restoreState()


def _kv_table(title, rows):
    cleaned = [[str(k or "-"), str(v or "-")] for k, v in rows]
    
    # --- FIX: Use FONT_BOLD for the section title ---
    data = [[Paragraph(f"<b>{title}</b>", ParagraphStyle(
            name="SecTitle", fontName=FONT_BOLD, fontSize=11, leading=14 # Changed fontName
        )), ""]]
    
    # --- FIX: Apply standard font to cell content ---
    # Wrap cell text in Paragraphs to ensure correct font rendering
    styled_cleaned = [
        [Paragraph(k, ParagraphStyle(name="TableCellKey", fontName=FONT_NAME, fontSize=10)), 
         Paragraph(v, ParagraphStyle(name="TableCellValue", fontName=FONT_NAME, fontSize=10))]
        for k, v in cleaned
    ]
    data.extend(styled_cleaned)

    table = Table(data, colWidths=[140, 360])
    table.setStyle(TableStyle([
        ("SPAN", (0, 0), (-1, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.94, 0.96, 0.98)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        # Removed FONTNAME global setting, handled by Paragraphs now
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 1), (-1, -1), "TOP"), # Align text to top of cell
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
    ]))
    return table


def generate_pdf(output_path, patient_name, disease, confidence, stage, explanation, gradcam_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=108,  
        bottomMargin=48 
    )
    styles = getSampleStyleSheet()
    # --- FIX: Update styles to use standard fonts ---
    styles.add(ParagraphStyle(
        name="TitleStyle", fontName=FONT_BOLD, fontSize=15, leading=18, # Changed font
        alignment=TA_CENTER, spaceAfter=8
    ))
    styles.add(ParagraphStyle(
        name="Body", fontName=FONT_NAME, fontSize=10.5, leading=14,
        alignment=TA_LEFT, spaceAfter=6
    ))
    # Added a specific style for bold body text
    styles.add(ParagraphStyle(
        name="BodyBold", fontName=FONT_BOLD, fontSize=10.5, leading=14, # Changed font
        alignment=TA_LEFT, spaceAfter=0 
    ))
    styles.add(ParagraphStyle(
        name="Caption", fontName=FONT_NAME, fontSize=9.5, leading=12,
        textColor=colors.grey, spaceBefore=3, spaceAfter=6,
    ))

    elems = []
    elems.append(Paragraph("Diagnostic Report", styles["TitleStyle"]))
    elems.append(Spacer(1, 6))

    report_id = datetime.now().strftime("%Y%m%d%H%M%S")
    patient_table = _kv_table(
        "Patient / Report Information",
        [
            ("Patient / User", patient_name),
            ("Report ID", report_id),
            ("Report Date", datetime.now().strftime("%Y-%m-%d %H:%M")),
        ],
    )
    elems.append(patient_table)
    elems.append(Spacer(1, 8))
    
    try:
        conf_val = float(confidence)
    except Exception:
        conf_val = 0.0
    results_table = _kv_table(
        "Result Summary",
        [
            ("Predicted Disease", disease),
            ("Stage", stage),
            ("Confidence", f"{conf_val:.2f}%"),
        ],
    )
    elems.append(results_table)
    elems.append(Spacer(1, 10))
    
    # --- FIX: Use BodyBold style for section titles ---
    elems.append(Paragraph("Explanation", styles["BodyBold"]))
    explanation_text = explanation or "No explanation available."
    elems.append(Paragraph(explanation_text, styles["Body"]))
    
    if gradcam_path:
        img_path = gradcam_path if os.path.isabs(gradcam_path) else os.path.join(os.getcwd(), gradcam_path.lstrip(os.sep))
        if os.path.exists(img_path):
            try:
                max_w = doc.width
                max_h = 5.5 * inch
                img = Image(img_path) 
                img._restrictSize(max_w, max_h)
                elems.append(Spacer(1, 8))
                 # --- FIX: Use BodyBold style for section titles ---
                elems.append(Paragraph("Grad-CAM Visualization", styles["BodyBold"]))
                elems.append(img)
                elems.append(Paragraph("Model heatmap highlighting regions that influenced the prediction.", styles["Caption"]))
            except Exception as e:
                print(f"Error attaching Grad-CAM image: {e}")
                elems.append(Spacer(1, 6))
                elems.append(Paragraph("(Grad-CAM image could not be attached.)", styles["Caption"]))
        else:
            elems.append(Spacer(1, 6))
            elems.append(Paragraph(f"(Grad-CAM image not found at path: {img_path})", styles["Caption"]))

    doc.build(elems, onFirstPage=_header_footer, onLaterPages=_header_footer)

