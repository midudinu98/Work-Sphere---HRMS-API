
import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function getMonthStart() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
}

function getMonthEnd() {
  const today = new Date();
  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function TeamLeaveCalendar() {
  const [leaves, setLeaves] = useState([]);
  const [startDate, setStartDate] = useState(getMonthStart);
  const [endDate, setEndDate] = useState(getMonthEnd);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!startDate || !endDate) return;

    if (startDate > endDate) {
      setLeaves([]);
      setError("Start date cannot be after end date.");
      return;
    }

    const controller = new AbortController();

    async function fetchLeaves() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLeaves([]);
        setError("Please log in as HR or Admin.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/leaves/calendar?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Session expired. Please log in again.");
          }

          if (response.status === 403) {
            throw new Error(
              "Only HR/Admin can view the team leave calendar."
            );
          }

          throw new Error("Unable to load team leaves.");
        }

        const data = await response.json();
        setLeaves(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setLeaves([]);
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchLeaves();

    return () => controller.abort();
  }, [startDate, endDate]);

  const uniqueEmployees = new Set(
    leaves.map((leave) => leave.employee_id)
  ).size;

  const sickCount = leaves.filter(
    (leave) => leave.leave_type === "SICK"
  ).length;

  const casualCount = leaves.filter(
    (leave) => leave.leave_type === "CASUAL"
  ).length;

  const paidCount = leaves.filter(
    (leave) => leave.leave_type === "PAID"
  ).length;

  const dailyAvailability = (() => {
    if (!startDate || !endDate || startDate > endDate) {
      return [];
    }

    const results = [];
    const current = new Date(`${startDate}T12:00:00`);
    const last = new Date(`${endDate}T12:00:00`);

    while (current <= last && results.length < 366) {
      const day = [
        current.getFullYear(),
        String(current.getMonth() + 1).padStart(2, "0"),
        String(current.getDate()).padStart(2, "0"),
      ].join("-");

      const employeesOnLeave = new Set(
        leaves
          .filter(
            (leave) =>
              leave.start_date <= day && leave.end_date >= day
          )
          .map((leave) => leave.employee_id)
      );

      results.push({
        date: day,
        employeesOnLeave: employeesOnLeave.size,
      });

      current.setDate(current.getDate() + 1);
    }

    return results;
  })();

  const cardStyle = {
    padding: "18px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
  };

  const headingStyle = {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #ddd",
    whiteSpace: "nowrap",
  };

  const cellStyle = {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #eee",
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>Team Leave Calendar</h2>
      <p>View approved employee leaves and team availability.</p>

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <label>
          Start date
          <br />
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>

        <label>
          End date
          <br />
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
      </div>

      {error && (
        <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>
      )}

      {loading && <p>Loading team leaves...</p>}

      {!loading && !error && (
        <>
          <h3>Team Availability Dashboard</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div style={cardStyle}>
              <h4>Employees on Leave</h4>
              <h2>{uniqueEmployees}</h2>
            </div>

            <div style={cardStyle}>
              <h4>Approved Leave Records</h4>
              <h2>{leaves.length}</h2>
            </div>

            <div style={cardStyle}>
              <h4>Sick Leave Records</h4>
              <h2>{sickCount}</h2>
            </div>

            <div style={cardStyle}>
              <h4>Casual Leave Records</h4>
              <h2>{casualCount}</h2>
            </div>

            <div style={cardStyle}>
              <h4>Paid Leave Records</h4>
              <h2>{paidCount}</h2>
            </div>
          </div>

          <h3>Daily Team Availability</h3>

          {dailyAvailability.length > 0 && (
            <div style={{ overflowX: "auto", marginBottom: "28px" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    <th style={headingStyle}>Date</th>
                    <th style={headingStyle}>Employees on Leave</th>
                  </tr>
                </thead>

                <tbody>
                  {dailyAvailability.map((day) => (
                    <tr key={day.date}>
                      <td style={cellStyle}>{day.date}</td>
                      <td
                        style={{
                          ...cellStyle,
                          color:
                            day.employeesOnLeave > 0
                              ? "#b45309"
                              : "#15803d",
                          fontWeight: "bold",
                        }}
                      >
                        {day.employeesOnLeave > 0
                          ? `${day.employeesOnLeave} employee(s) on leave`
                          : "No approved leave"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3>Approved Team Leaves</h3>

          {leaves.length === 0 ? (
            <p>No approved leaves found for this period.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    {[
                      "Employee",
                      "Department",
                      "Leave Type",
                      "Start Date",
                      "End Date",
                      "Status",
                    ].map((heading) => (
                      <th key={heading} style={headingStyle}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.leave_id}>
                      <td style={cellStyle}>{leave.employee_name}</td>
                      <td style={cellStyle}>
                        {leave.department || "—"}
                      </td>
                      <td style={cellStyle}>{leave.leave_type}</td>
                      <td style={cellStyle}>{leave.start_date}</td>
                      <td style={cellStyle}>{leave.end_date}</td>
                      <td
                        style={{
                          ...cellStyle,
                          color: "#15803d",
                          fontWeight: "bold",
                        }}
                      >
                        {leave.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TeamLeaveCalendar;
