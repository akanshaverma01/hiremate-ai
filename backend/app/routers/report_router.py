import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/api/report", tags=["Report"])


@router.get("/{analysis_id}")
def download_report(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.id == analysis_id, models.AnalysisResult.user_id == current_user.id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="Analysis result not found")

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 60

    def line(text, size=11, gap=20, bold=False):
        nonlocal y
        c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        c.drawString(50, y, text)
        y -= gap

    line("HireMate AI - ATS Analysis Report", 16, 30, bold=True)
    line(f"Resume: {result.resume.filename if result.resume else 'N/A'}")
    line(f"Job Title: {result.job_description.title if result.job_description else 'N/A'}")
    line(f"Date: {result.created_at.strftime('%Y-%m-%d %H:%M')}")
    line("")
    line(f"ATS Score: {result.ats_score}/100", 14, 25, bold=True)
    line("")
    line("Matched Skills:", bold=True)
    line(result.matched_skills or "None", gap=25)
    line("Missing Skills:", bold=True)
    line(result.missing_skills or "None", gap=25)
    line("Recommended Skills:", bold=True)
    line(result.recommended_skills or "None", gap=25)
    line("Suggestions:", bold=True)

    # wrap suggestions text
    text_obj = c.beginText(50, y)
    text_obj.setFont("Helvetica", 10)
    import textwrap
    for chunk in textwrap.wrap(result.suggestions or "", 95):
        text_obj.textLine(chunk)
    c.drawText(text_obj)

    c.showPage()
    c.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=analysis_{analysis_id}_report.pdf"},
    )
