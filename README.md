# WorkSphere – Human Resource Management System (HRMS)

## Project Overview

WorkSphere is a web-based Human Resource Management System (HRMS) designed to simplify employee management, attendance tracking, leave management, payroll processing, performance management, document management, employee onboarding, task tracking, and other HR operations.

The application provides role-based access for Employees, HR, and Administrators, along with employee self-service features and administrative controls.

## Technologies Used

* **Backend:** Python, FastAPI
* **Frontend:** React, Vite
* **Database:** SQLite
* **ORM:** SQLAlchemy
* **Authentication:** JWT (JSON Web Tokens)
* **API Documentation:** Swagger UI
* **Integrations:** Google Calendar, SMTP email, CSV and PDF exports

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

13. **Automated Attendance & Shift Management:** Assign employee shifts and support attendance monitoring.

14. **Team Leave Calendar:** View and monitor employee leave schedules.

15. **Document Management:** Manage employee-related documents.

16. **Performance Management:** Maintain and manage employee performance records.

17. **Advanced Analytics & Reports:** Generate HR reports and analyze workforce information.

18. **Smart Notifications:** Provide relevant notifications for HR activities.

19. **Employee Search & Filtering:** Search and filter employee records efficiently.

20. **Enhanced HR Operations:** Extend employee and HR management workflows with additional controls and reporting.
21. **Employee Onboarding System:** Assign onboarding tasks, track completion progress, and monitor pending activities.

22. **Resignation & Exit Management:** Submit resignation requests, track request statuses, and manage exit approvals.

23. **Internal Announcements System:** Publish and view organization-wide announcements with role-based access control.

24. **Task Assignment & Tracking:** Assign tasks to employees, update task statuses, and monitor completion progress.

25. **Third-Party Integrations:** Integrate Google Calendar, support SMTP email functionality, and export employee, attendance, leave, and payroll reports in CSV and PDF formats.

26. **Employee Feedback System:** Allow employees to submit feedback and ratings and enable HR/Admin to review submissions.

27. **Profile & Settings Management:** Update profile details, change passwords securely, and manage email, attendance, leave, and payroll notification preferences.

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

### Module 14: Automated Attendance and Shift Management
* Define employee shifts, including morning, evening, and night shifts.
* Manage shift details such as start and end times.
* Assign shifts to employees.
* View employee shift schedules.
* Support attendance monitoring based on shift timings.
* Detect late arrivals and early departures where implemented.
* Apply attendance validation and authorization rules.

### Module 15: Team Leave Calendar
* Display employee leave schedules in a calendar view.
* Retrieve leave calendar information through the backend API.
* View approved leave requests and relevant schedule information.
* Support team-level leave planning.
* Validate calendar date ranges.
* Provide a React frontend page for viewing the team leave calendar.

### Module 16: Document Management
* Manage employee-related documents.
* Support document records and associated employee information.
* Provide backend document-management functionality.
* Integrate document management with the application.
* Apply appropriate authentication and access controls to document operations.

### Module 17: Employee Performance Management
* Maintain employee performance records.
* Create and manage performance-related information.
* Associate performance records with employees.
* Retrieve performance information for authorized users.
* Integrate performance management with the HRMS backend and frontend.

### Module 18: Advanced Analytics and Reports
* Provide advanced HR analytics and reporting functionality.
* Display employee-related statistics and summaries.
* Analyze attendance and leave information.
* Generate payroll-related summaries and reports.
* Present relevant workforce information through the reporting dashboard.
* Validate report API responses and frontend report displays.

### Module 19: Smart Notification System
* Generate notifications for relevant HR activities.
* Support automated notifications based on application events.
* Store notification information in the database.
* Retrieve notifications through backend APIs.
* Integrate notification functionality with the frontend.
* Support communication of important employee and HR updates.

### Module 20: Employee Search and Filtering
* Search employee records using supported search criteria.
* Filter employee lists to find relevant records.
* Retrieve employee information through the backend API.
* Display search and filter results in the React frontend.
* Support pagination for employee lists.
* Improve employee record navigation and usability.

### Module 21: Employee Onboarding System
* Manage employee onboarding tasks.
* Assign and list onboarding activities.
* Track task status and completion progress.
* Display total, completed, and pending tasks.
* Show task due dates and status information.
* Provide a React-based onboarding checklist and progress page.

### Module 22: Resignation and Exit Management
* Allow employees to submit resignation or exit requests.
* Record resignation reasons and notice periods.
* Track request statuses: PENDING, APPROVED, and REJECTED.
* Allow authorized users to review and approve or reject requests.
* Provide frontend functionality for resignation submission and exit-status tracking.

### Module 23: Internal Announcements System
* Allow HR and Admin users to publish announcements.
* Store announcement titles, messages, creator information, and creation timestamps.
* Allow users to view announcements.
* Provide an announcement board and announcement-detail functionality.
* Restrict announcement publishing to authorized roles.

### Module 24: Task Assignment and Tracking
* Assign tasks to employees.
* Allow employees to view their assigned tasks.
* Support task status updates and completion tracking.
* Display pending and completed task counts.
* Apply role-based access controls to task operations.
* Provide frontend functionality for task assignment and progress monitoring.

### Module 25: Third-Party Integrations
* Export employee, attendance, leave, and payroll reports to CSV and PDF formats.
* Support SMTP email integration and email notification functionality.
* Provide an Integrations page in the frontend.
* Connect to Google Calendar and display connection status.
* Create test events in the connected Google Calendar.
* Refresh the integration status and disconnect the calendar when required.

### Module 26: Employee Feedback System
* Allow authenticated employees to submit feedback.
* Support feedback ratings on a scale of 1–5.
* Validate feedback input and store submissions in the database.
* Associate feedback with the submitting employee.
* Provide HR and Admin users with a feedback dashboard.
* Display feedback submissions in a table and support refreshing the results.
* Apply authentication, role-based access, and input validation.

### Module 27: Profile and Settings Management
* Retrieve and update the authenticated user's account profile.
* Allow username and email updates with duplicate-value validation.
* Allow users to change their passwords after verifying the current password.
* Validate new passwords and prevent reuse of the current password.
* Store notification preferences for email, attendance, leave, and payroll notifications.
* Provide a frontend page for profile details, password management, and notification settings.
* Display employee employment details where available.
* Apply authentication, data isolation, and access controls.

## API Documentation

FastAPI automatically provides interactive API documentation through Swagger UI. <br>
Start the backend server and visit: <br>
**http://127.0.0.1:8000/docs**

## Security

* JWT-based authentication.
* Role-based authorization for EMPLOYEE, HR, and ADMIN roles.
* Protected API endpoints.
* Employee data ownership validation.
* Restricted HR and Admin operations.
* User account activation and deactivation controls.
* Password hashing and current-password verification during password changes.
* Validation of user permissions before accessing restricted resources.
* Input validation for supported API operations.
* Authentication and authorization for profile, feedback, task, announcement, and other protected management operations.
