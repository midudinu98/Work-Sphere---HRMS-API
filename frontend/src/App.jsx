import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

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

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        {" | "}
        <Link to="/employees">Employee Management</Link>
        {" | "}
        <Link to="/attendance">Attendance</Link>
        {" | "}
        <Link to="/notifications" title="Notifications">
          Notifications
        </Link>
        {" | "}
        <Link to="/profile">My Profile</Link>
        {" | "}
        <Link to="/admin/users">User Management</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

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

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
</BrowserRouter>
  );
}

export default App;
