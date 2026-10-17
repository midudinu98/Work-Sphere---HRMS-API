# WorkSphere – Human Resource Management System (HRMS)

## Project Overview

WorkSphere is a web-based Human Resource Management System (HRMS) designed to simplify employee management, attendance tracking, leave management, payroll processing, and HR operations.

## Technologies Used

* **Backend:** Python, FastAPI
* **Frontend:** React, Vite
* **Database:** SQLite
* **ORM:** SQLAlchemy
* **Authentication:** JWT (JSON Web Tokens)
* **API Documentation:** Swagger UI

## Key Features

1. **Authentication & Authorization:** User registration, login, JWT authentication, and role-based access control.

2. **Employee Management:** Create, view, update, and manage employee records.

3. **Attendance Management:** Check-in, check-out, working-hours calculation, and attendance history.

4. **Leave Management:** Apply for leave and manage approval statuses.

5. ** Payroll Management:** Manage employee payroll records.

6. ** Dashboard Analytics:** Display HR and employee-related statistics.

7. **Notifications:** Notify users about relevant HR activities.

## Installation and Setup

1. Clone the Repository

git clone <your-repository-url>
cd WorkSphere

2. Start the Backend

cd backend
python -m venv venv

Activate the virtual environment:

Windows

venv\Scripts\activate

Install dependencies and start the server:

pip install -r requirements.txt
uvicorn app.main:app --reload

3. Start the Frontend

Open a new terminal:

cd frontend
npm install
npm run dev
