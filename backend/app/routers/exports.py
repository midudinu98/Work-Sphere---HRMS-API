import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate,Table,TableStyle,Paragraph,Spacer
from reportlab.lib.styles import getSampleStyleSheet
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.user import User, UserRole
from app.models import Employee, Attendance, Leave, Payroll

from app.routers.auth import get_current_user

router = APIRouter(prefix="/exports", tags=["Report Exports"])

def require_hr_admin(user: User):
    
    if user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(status_code=403,detail="Only HR and Admin can export reports")


def get_report_data(report_type: str, db: Session):
    
    if report_type == "employees":
        rows = db.query(Employee).all()
        headers = ["ID", "User ID", "Full Name", "Designation",
            "Department", "Joining Date", "Salary", "Status"]
        data = [[row.id,
                row.user_id,
                row.full_name,
                row.designation,
                row.department,
                str(row.joining_date or ""),
                str(row.salary or ""),
                row.status,
            ]for row in rows]

    elif report_type == "attendance":
        rows = db.query(Attendance).all()
        headers = ["ID", "Employee ID", "Date",
            "Check In", "Check Out", "Status"]
        data = [[row.id,
                row.employee_id,
                str(row.date or ""),
                str(row.check_in or ""),
                str(row.check_out or ""),
                row.status,
            ]for row in rows]

    elif report_type == "leaves":
        rows = db.query(Leave).all()
        headers = ["ID", "Employee ID", "Leave Type",
            "Start Date", "End Date", "Status"]
        data = [[row.id,
                row.employee_id,
                str(getattr(row, "leave_type", "") or ""),
                str(getattr(row, "start_date", "") or ""),
                str(getattr(row, "end_date", "") or ""),
                str(row.status or ""),
            ]for row in rows]

    elif report_type == "payroll":
        rows = db.query(Payroll).all()
        headers = ["ID", "Employee ID", "Month",
            "Basic Salary", "Deductions", "Net Salary"]
        data = [[row.id,
                row.employee_id,
                str(row.month or ""),
                str(row.basic_salary or ""),
                str(row.deductions or ""),
                str(row.net_salary or ""),
            ]for row in rows]

    else:
        raise HTTPException(status_code=400,detail="Unsupported report type")

    return headers, data

@router.get("/{report_type}/csv")
def export_csv(report_type: str,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    require_hr_admin(current_user)

    headers, rows = get_report_data(report_type, db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)

    output.seek(0)

    return StreamingResponse(iter([output.getvalue()]),media_type="text/csv",headers={"Content-Disposition":f'attachment; filename="{report_type}_report_{date.today()}.csv"'})

@router.get("/{report_type}/pdf")
def export_pdf(report_type: str,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    require_hr_admin(current_user)

    headers, rows = get_report_data(report_type, db)
    buffer = io.BytesIO()
    document = SimpleDocTemplate(buffer,pagesize=landscape(A4))
    styles = getSampleStyleSheet()
    elements = [Paragraph(f"{report_type.title()} Report",styles["Title"]),Spacer(1, 12)]
    table_data = [headers] + rows
    table = Table(table_data, repeatRows=1)

    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1D4ED8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#EFF6FF")]),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4) ]))

    elements.append(table)
    document.build(elements)

    buffer.seek(0)

    return StreamingResponse(buffer,media_type="application/pdf",headers={"Content-Disposition":f'attachment; filename="{report_type}_report_{date.today()}.pdf"'})
