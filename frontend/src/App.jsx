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

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
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
        {"|"}
        <Link to="/notifications" title="Notifications">Notifications</Link>
      </nav>

      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard"element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>

        <Route path="/employees"element={<ProtectedRoute><Employees /></ProtectedRoute>}/>

        <Route path="/employees/add"element={<ProtectedRoute><AddEmployee /></ProtectedRoute>}/>

        <Route path="/employees/edit/:employeeId"element={<ProtectedRoute><EditEmployee /></ProtectedRoute>}/>

        <Route path="/attendance"element={<ProtectedRoute><Attendance /></ProtectedRoute>}/>

        <Route path="/leaves/apply"element={<ProtectedRoute><LeaveApplication /></ProtectedRoute>}/>

        <Route path="/leaves/status"element={<ProtectedRoute><LeaveStatus /></ProtectedRoute>}/>    
        
        <Route path="/leaves/approval"element={<ProtectedRoute><LeaveApproval /></ProtectedRoute>}/>
         
        <Route path="/payroll"element={<Payroll />} />  

        <Route path="/notifications"element={<ProtectedRoute><Notifications /></ProtectedRoute>}/>

        <Route path="*" element={<Navigate to="/login" replace />} />
        
        </Routes>

    </BrowserRouter>
  );
}

export default App;
