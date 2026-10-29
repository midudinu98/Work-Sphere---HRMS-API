import { useEffect, useState } from "react";
import "./Attendance.css";

const API_URL = "http://127.0.0.1:8000";

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getArrivalStatus(record) {
  if (record.status === "ABSENT" || !record.check_in) {
    return "ABSENT";
  }

  // Use the backend value when available.
  if (record.arrival_status) {
    return record.arrival_status;
  }

  // Fallback for older attendance records.
  const checkIn = new Date(record.check_in);
  const minutes = checkIn.getHours() * 60 + checkIn.getMinutes();

  return minutes > 9 * 60 + 15 ? "LATE" : "ON_TIME";
}

function StatusBadge({ status }) {
  const styles = {
    ON_TIME: "on-time",
    LATE: "late",
    ABSENT: "absent",
    PRESENT: "present",
    HALF_DAY: "half-day",
  };

  const labels = {
    ON_TIME: "On-time",
    LATE: "Late",
    ABSENT: "Absent",
    PRESENT: "Present",
    HALF_DAY: "Half-day",
  };

  return (
    <span className={`status-badge ${styles[status] || "unknown"}`}>
      {labels[status] || status || "Unknown"}
    </span>
  );
}

function Attendance() {
  const [employeeId, setEmployeeId] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  async function loadHistory(id) {
    if (!id) {
      setError("Please enter your employee ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/attendance/history?employee_id=${encodeURIComponent(id)}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load attendance history."
        );
      }

      const records = data.attendance || [];
      setHistory(records);

      const todayRecord =
        records.find((record) => record.date === getLocalDate()) || null;

      setAttendance(todayRecord);
    } catch (err) {
      setError(err.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
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
        `${API_URL}/attendance/${action}?employee_id=${encodeURIComponent(employeeId)}`,
        {
          method: "POST",
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Attendance request failed."
        );
      }

      setAttendance(data);

      if (action === "check-in") {
        setMessage(
          `Check-in successful! Arrival status: ${
            data.arrival_status === "LATE" ? "Late" : "On-time"
          }.`
        );
      } else {
        setMessage(
          `Check-out successful! Working hours: ${
            data.working_hours ?? 0
          }.`
        );
      }

      // Reload history without clearing the success message.
      const historyResponse = await fetch(
        `${API_URL}/attendance/history?employee_id=${encodeURIComponent(employeeId)}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      const historyData = await historyResponse.json();

      if (historyResponse.ok) {
        const records = historyData.attendance || [];
        setHistory(records);

        setAttendance(
          records.find((record) => record.date === getLocalDate()) || data
        );
      }
    } catch (err) {
      setError(err.message || "Attendance request failed.");
    } finally {
      setLoading(false);
    }
  }

  const arrivalStatus = attendance
    ? getArrivalStatus(attendance)
    : null;

  return (
    <div className="attendance-page">
      <div className="attendance-heading">
        <div>
          <h1>Attendance Dashboard</h1>
          <p>Track daily attendance, punctuality and working hours.</p>
        </div>
      </div>

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
            className="check-in-button"
            onClick={() => markAttendance("check-in")}
            disabled={loading || !employeeId || !!attendance?.check_in}
          >
            {loading ? "Please wait..." : "Check In"}
          </button>

          <button
            className="check-out-button"
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
            className="refresh-button"
            onClick={() => loadHistory(employeeId)}
            disabled={loading || !employeeId}
          >
            Refresh
          </button>
        </div>

        {message && (
          <div className="attendance-alert success-message" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="attendance-alert error-message" role="alert">
            {error}
          </div>
        )}

        {attendance ? (
          <div className="today-attendance">
            <h2>Today's Attendance</h2>

            <div className="attendance-detail">
              <span>Attendance status</span>
              <StatusBadge status={attendance.status} />
            </div>

            <div className="attendance-detail">
              <span>Arrival status</span>
              <StatusBadge status={arrivalStatus} />
            </div>

            <div className="attendance-detail">
              <span>Check-in</span>
              <strong>{formatTime(attendance.check_in)}</strong>
            </div>

            <div className="attendance-detail">
              <span>Check-out</span>
              <strong>{formatTime(attendance.check_out)}</strong>
            </div>

            <div className="attendance-detail">
              <span>Working hours</span>
              <strong>{attendance.working_hours ?? 0} hours</strong>
            </div>

            {arrivalStatus === "LATE" && (
              <p className="attendance-note late-note">
                You checked in after the 9:15 AM cutoff.
              </p>
            )}

            {arrivalStatus === "ABSENT" && (
              <p className="attendance-note absent-note">
                No check-in was recorded for this day.
              </p>
            )}

            {arrivalStatus === "ON_TIME" && (
              <p className="attendance-note on-time-note">
                Your arrival was on time.
              </p>
            )}
          </div>
        ) : (
          <div className="empty-attendance">
            <h3>No attendance record for today</h3>
            <p>
              If you have not checked in, use the Check In button.
              An absent status appears after an authorized absent-marking
              process creates today's record.
            </p>
          </div>
        )}
      </div>

      <h2 className="history-heading">Attendance History</h2>

      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Working Hours</th>
              <th>Attendance</th>
              <th>Arrival</th>
            </tr>
          </thead>

          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-table">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{formatTime(record.check_in)}</td>
                  <td>{formatTime(record.check_out)}</td>
                  <td>{record.working_hours ?? 0} hours</td>
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                  <td>
                    <StatusBadge status={getArrivalStatus(record)} />
                  </td>
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
