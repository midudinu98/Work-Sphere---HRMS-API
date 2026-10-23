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

8. **Role-Based Access Control:** Secure access to features based on employee, HR, and admin roles.

9. **Employee Self-Service Portal:** Allow employees to access their profiles, attendance, leave, and payroll information.

10. **Leave Policies & Balances:** Track leave entitlements, usage, and remaining balances.

11. **Payroll Enhancements:** Provide salary breakdowns, monthly summaries, payslips, and payroll history.

12. **Admin Controls & User Management:** Manage user roles, account activation, and deactivation.

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

### 3. Access the Application

Frontend: <br>
**http://localhost:5173/**

Backend: <br>
**http://127.0.0.1:8000/**

Swagger UI: <br>
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

### Module 8: Role-Based Access Control (RBAC)
* Enforce permissions for EMPLOYEE, HR, and ADMIN roles
* Protect API endpoints using JWT authentication
* Validate user roles and token authorization
* Restrict access to employee-owned records
* Apply HR and admin permissions to protected operations
* Support administrative user listing and role management

### Module 9: Employee Self-Service Portal
* View personal employee profile
* Access employee dashboard and summary
* View personal attendance history
* Apply for leave and track leave requests
* View personal payroll records
* Enforce employee data ownership and payroll access restrictions
* Support HR and admin access according to permissions

### Module 10: Advanced Attendance Controls
* Manage attendance check-in and check-out operations
* Validate attendance records and working hours
* Apply attendance-related restrictions and authorization
* Support attendance history and employee-specific access
* Improve attendance data validation and control

### Module 11: Leave Policies and Balances
* Define and manage leave policies
* Track employee leave balances
* Calculate leave usage and remaining entitlement
* Update balances based on approved leave requests
* Prevent leave applications that exceed permitted balances
* Display leave policies, balances, and history in the employee portal

### Module 12: Payroll Enhancements
* Manage detailed salary breakdowns
* Include basic salary, allowances and deductions where applicable
* Calculate net salary
* Generate employee payslip details
* View payroll history
* Display monthly payroll summaries
* Track total payroll, deductions and net payroll amounts

### Module 13: Admin Controls and User Management
* Provide administrative user-management APIs
* View and manage registered users
* Assign and update EMPLOYEE, HR, and ADMIN roles
* Activate and deactivate user accounts
* Prevent inactive users from logging in
* Validate account status during token-protected operations
* Provide a User Management page in the React frontend
* Integrate user management with application routing and navigation
* Restrict administrative features to authorized users

## API Documentation

FastAPI automatically provides interactive API documentation through Swagger UI. <br>
Start the backend server and visit: <br>
**http://127.0.0.1:8000/docs**

## Security

* JWT-based authentication
* Role-based authorization
* Protected API endpoints
* Employee data ownership validation
* Restricted HR and admin operations
* User account activation and deactivation controls
