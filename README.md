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

5. **Payroll Management:** Manage employee payroll records.

6. **Dashboard Analytics:** Display HR and employee-related statistics.

7. **Notifications:** Notify users about relevant HR activities.

## Installation and Setup

### 1. Start the Backend

Open a new terminal:  <br>
**cd backend** <br>
**python -m venv venv**

Activate the virtual environment: <br>
**venv\Scripts\activate**

Install dependencies and start the server: <br>
**pip install -r requirements.txt** <br>
**uvicorn app.main:app --reload** 

### 2. Start the Frontend

Open a new terminal:  <br>
**cd frontend**  <br>
**npm install**  <br>
**npm run dev**

## API Documentation

Once the backend is running, access Swagger UI at: <br>
**http://127.0.0.1:8000/docs**

## Modules and Features

### Module 1: Authentication and Authorization
* User registration and login
* JWT-based authentication
* Role-based access control
* Protected routes and logout functionality

### Module 2: Employee Management
* Create and manage employee records
* View employee details
* Update employee information
* Restrict access based on user roles

### Module 3: Attendance Management
* Employee check-in and check-out
* Calculate working hours
* View attendance history
* Prevent duplicate check-ins
* Restrict access to employee attendance records

### Module 4: Leave Management
* Apply for leave
* View leave requests and status
* Approve or reject leave applications
* Manage different leave types

### Module 5: Payroll Management
* Manage employee payroll records
* Retrieve payroll information
* Restrict payroll access to authorized users

### Module 6: Dashboard and Analytics
* Display HR dashboard statistics
* View employee and attendance summaries
* Present relevant HR information for monitoring

### Module 7: Notification System
* Generate notifications for relevant HR activities
* Store notifications in the database
* Support communication of important updates
