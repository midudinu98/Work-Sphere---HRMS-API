import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./EmployeeDashboard.css";

const API_URL = "http://127.0.0.1:8000";

function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${API_URL}/analytics/employee-dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(
            result.detail || "Unable to load employee dashboard."
          );
        }

        setData(await response.json());
      } catch (err) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <p className="employee-loading">Loading dashboard...</p>;

  if (error) return <p className="employee-error">{error}</p>;

  if (!data) return <p>No dashboard data available.</p>;

  const { profile, attendance, leaves, payroll } = data;
  const latestSalary = payroll?.[0];

  return (
    <main className="employee-dashboard">
      <header className="employee-welcome">
        <div>
          <h1>Welcome, {profile.full_name}!</h1>
          <p>Your WorkSphere Employee Self-Service Portal</p>
        </div>
        <span className="employee-status">{profile.status}</span>
      </header>

      <section className="employee-profile-summary">
        <h2>My Details</h2>
        <p><strong>Designation:</strong> {profile.designation}</p>
        <p><strong>Department:</strong> {profile.department}</p>
        <p><strong>Employee ID:</strong> {profile.employee_id}</p>
        <Link to="/profile">View Full Profile</Link>
      </section>

      <section className="employee-stat-grid">
        <article className="employee-stat-card">
          <h3>Attendance Records</h3>
          <p>{attendance.total_records}</p>
          <small>Present: {attendance.present} | Absent: {attendance.absent}</small>
          <Link to="/attendance">View Attendance</Link>
        </article>

        <article className="employee-stat-card">
          <h3>Pending Leaves</h3>
          <p>{leaves.pending}</p>
          <small>Approved: {leaves.approved} | Rejected: {leaves.rejected}</small>
          <Link to="/leaves/status">Track Leave Requests</Link>
        </article>

        <article className="employee-stat-card">
          <h3>Latest Net Salary</h3>
          <p>
            {latestSalary
              ? `₹${latestSalary.net_salary.toLocaleString("en-IN")}`
              : "N/A"}
          </p>
          <small>{latestSalary?.month || "No payroll record yet"}</small>
          <Link to="/payroll">View Payroll</Link>
        </article>
      </section>

      <section className="employee-quick-links">
        <h2>Quick Actions</h2>
        <Link to="/leaves/apply">Apply for Leave</Link>
        <Link to="/leaves/status">Check Leave Status</Link>
        <Link to="/profile">View My Profile</Link>
        <Link to="/attendance">Attendance History</Link>
      </section>
    </main>
  );
}

export default EmployeeDashboard;
