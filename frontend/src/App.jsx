import { useEffect, useState } from "react";
import {BrowserRouter,Routes,Route,Navigate,Link,} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Employees from "./pages/Employee";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";

import Attendance from "./pages/Attendance";

import LeaveApplication from "./pages/LeaveApplication";
import LeaveStatus from "./pages/LeaveStatus";
import LeaveApproval from "./pages/LeaveApproval";

import Payroll from "./pages/Payroll";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import UserManagement from "./pages/UserManagement";

import ShiftManagement from "./pages/ShiftManagement";
import MySchedule from "./pages/MySchedule";

import TeamLeaveCalendar from "./pages/TeamLeaveCalendar";

import Documents from "./pages/Documents";
import Performance from "./pages/Performance";
import Reports from "./pages/Reports";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("user_role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RoleBasedDashboard() {
  const role = localStorage.getItem("user_role");

  if (role === "EMPLOYEE") {
    return <EmployeeDashboard />;
  }

  if (role === "HR" || role === "ADMIN") {
    return <Dashboard />;
  }

  return <Navigate to="/login" replace />;
}

function Navigation() {
  const [unreadCount, setUnreadCount] = useState(0);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/notifications/unread-count",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 && isMounted) {
            setUnreadCount(0);
          }
          return;
        }

        const data = await response.json();

        if (isMounted) {
          const count =
            typeof data === "number"
              ? data
              : data.unread_count ?? data.count ?? 0;

          setUnreadCount(Number(count) || 0);
        }
      } catch (error) {
        console.error("Unable to fetch unread notifications:", error);
      }
    };

    fetchUnreadCount();

    const intervalId = setInterval(fetchUnreadCount, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [token]);

  return (
    <nav style={{ display: "flex", flexWrap: "wrap", gap: "12px", padding: "12px" }}>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/employees">Employee Management</Link>
      <Link to="/attendance">Attendance</Link>

      <Link to="/notifications" title="Notifications">
        🔔 Notifications
        {unreadCount > 0 && (
          <span
            style={{
              marginLeft: "5px",
              padding: "2px 7px",
              borderRadius: "12px",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      <Link to="/profile">My Profile</Link>
      <Link to="/admin/users">User Management</Link>
      <Link to="/shifts">Shift Management</Link>
      <Link to="/my-schedule">My Schedule</Link>
      <Link to="/team-leave-calendar">Team Leave Calendar</Link>
      <Link to="/documents">Documents</Link>
      <Link to="/performance">Performance Management</Link>
      <Link to="/reports">Advanced Reports</Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard"element={<ProtectedRoute><RoleBasedDashboard /></ProtectedRoute>}/>

        <Route path="/employees"element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]}><Employees /></ProtectedRoute>}/>

        <Route path="/employees/add"element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]}><AddEmployee /></ProtectedRoute>}/>

        <Route path="/employees/edit/:employeeId"element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]}><EditEmployee /></ProtectedRoute>}/>

        <Route path="/attendance"element={<ProtectedRoute><Attendance /></ProtectedRoute>}/>

        <Route path="/leaves/apply"element={<ProtectedRoute><LeaveApplication /></ProtectedRoute>}/>

        <Route path="/leaves/status"element={<ProtectedRoute><LeaveStatus /></ProtectedRoute>}/>

        <Route path="/leaves/approval"element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]}><LeaveApproval /></ProtectedRoute>}/>

        <Route path="/payroll"element={<ProtectedRoute><Payroll /></ProtectedRoute>}/>

        <Route path="/notifications"element={<ProtectedRoute><Notifications /></ProtectedRoute>}/>

        <Route path="/profile"element={<ProtectedRoute><Profile /></ProtectedRoute>}/>

        <Route path="/employee-dashboard"element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><EmployeeDashboard /></ProtectedRoute>}/>

        <Route path="/admin/users"element={<ProtectedRoute allowedRoles={["ADMIN"]}><UserManagement /></ProtectedRoute>}/>

        <Route path="/shifts"element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]}><ShiftManagement /></ProtectedRoute>}/>

        <Route path="/my-schedule"element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><MySchedule /></ProtectedRoute>}/>

        <Route path="/team-leave-calendar"element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]}><TeamLeaveCalendar /></ProtectedRoute>}/>

        <Route path="/documents"element={<ProtectedRoute><Documents /></ProtectedRoute>}/>

        <Route path="/performance"element={<ProtectedRoute><Performance /></ProtectedRoute>}/>

        <Route path="/reports"element={<ProtectedRoute><Reports /></ProtectedRoute>}/>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
