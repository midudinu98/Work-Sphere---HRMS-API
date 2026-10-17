import { useEffect, useState } from "react";
import "./Attendance.css";

const API_URL = "http://127.0.0.1:8000";

function Attendance() {
  const [employeeId, setEmployeeId] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  async function loadHistory(id) {
    if (!id) return;

    try {
      const response = await fetch(
        `${API_URL}/attendance/history?employee_id=${id}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load attendance");
      }

      setHistory(data.attendance || []);
      setAttendance(
        (data.attendance || []).find(
          (record) => record.date ===
            new Date().toLocaleDateString("en-CA")
        ) || null
      );
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const savedEmployeeId = localStorage.getItem("employee_id");

    if (savedEmployeeId) {
      setEmployeeId(savedEmployeeId);
      loadHistory(savedEmployeeId);
    }
  }, []);

  async function markAttendance(action) {
    if (!employeeId) {
      setError("Please enter your employee ID.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/attendance/${action}?employee_id=${employeeId}`,
        {
          method: "POST",
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Attendance request failed");
      }

      setAttendance(data);
      setMessage(
        action === "check-in"
          ? "Check-in successful!"
          : "Check-out successful!"
      );

      await loadHistory(employeeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="attendance-page">
      <h1>Attendance Dashboard</h1>
      <p>Track your daily attendance and working hours.</p>

      <div className="attendance-card">
        <label htmlFor="employeeId">Employee ID</label>
        <input
          id="employeeId"
          type="number"
          min="1"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="Enter employee ID"
        />

        <div className="attendance-actions">
          <button
            onClick={() => markAttendance("check-in")}
            disabled={loading || !employeeId || !!attendance?.check_in}
          >
            Check In
          </button>

          <button
            onClick={() => markAttendance("check-out")}
            disabled={
              loading ||
              !employeeId ||
              !attendance?.check_in ||
              !!attendance?.check_out
            }
          >
            Check Out
          </button>

          <button
            onClick={() => loadHistory(employeeId)}
            disabled={loading || !employeeId}
          >
            Refresh
          </button>
        </div>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        {attendance && (
          <div>
            <h3>Today's Attendance</h3>
            <p>Status: {attendance.status}</p>
            <p>
              Check-in:{" "}
              {attendance.check_in
                ? new Date(attendance.check_in).toLocaleTimeString()
                : "Not checked in"}
            </p>
            <p>
              Check-out:{" "}
              {attendance.check_out
                ? new Date(attendance.check_out).toLocaleTimeString()
                : "Not checked out"}
            </p>
            <p>Working hours: {attendance.working_hours ?? 0} hours</p>
          </div>
        )}
      </div>

      <h2>Attendance History</h2>

      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Working Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="5">No attendance records found.</td>
              </tr>
            ) : (
              history.map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>
                    {record.check_in
                      ? new Date(record.check_in).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td>
                    {record.check_out
                      ? new Date(record.check_out).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td>{record.working_hours} hours</td>
                  <td>{record.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Attendance;


