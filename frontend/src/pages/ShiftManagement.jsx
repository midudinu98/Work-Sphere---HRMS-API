import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function ShiftManagement() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [name, setName] = useState("Morning");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [employeeId, setEmployeeId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  async function loadData() {
    try {
      const [shiftResponse, employeeResponse, assignmentResponse] =
        await Promise.all([
          fetch(`${API_URL}/shifts/`, { headers }),
          fetch(`${API_URL}/employees/`, { headers }),
          fetch(`${API_URL}/shifts/assignments`, { headers }),
        ]);

      const shiftData = await shiftResponse.json();
      const employeeData = await employeeResponse.json();
      const assignmentData = await assignmentResponse.json();

      if (!shiftResponse.ok) {
        throw new Error(shiftData.detail || "Unable to load shifts.");
      }

      setShifts(Array.isArray(shiftData) ? shiftData : []);

      if (employeeResponse.ok) {
        setEmployees(
          Array.isArray(employeeData) ? employeeData : employeeData.items || []
        );
      }

      if (assignmentResponse.ok) {
        setAssignments(
          Array.isArray(assignmentData) ? assignmentData : []
        );
      }
    } catch (err) {
      setError(err.message || "Unable to load shift information.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createShift(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/shifts/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to create shift.");
      }

      setMessage("Shift created successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to create shift.");
    }
  }

  async function assignShift(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/shifts/assign`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          employee_id: Number(employeeId),
          shift_id: Number(shiftId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to assign shift.");
      }

      setMessage("Shift assigned successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to assign shift.");
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Shift Management</h1>
      <p>Create work shifts and assign them to employees.</p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={{ marginBottom: "32px" }}>
        <h2>Create Shift</h2>

        <form onSubmit={createShift}>
          <label>
            Shift Name
            <select
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            >
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </label>

          <label style={{ marginLeft: "12px" }}>
            Start Time
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
            />
          </label>

          <label style={{ marginLeft: "12px" }}>
            End Time
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
            />
          </label>

          <button type="submit" style={{ marginLeft: "12px" }}>
            Create Shift
          </button>
        </form>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2>Available Shifts</h2>

        {shifts.length === 0 ? (
          <p>No shifts available yet.</p>
        ) : (
          <table cellPadding="10" border="1">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Start Time</th>
                <th>End Time</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>{shift.id}</td>
                  <td>{shift.name}</td>
                  <td>{String(shift.start_time).slice(0, 5)}</td>
                  <td>{String(shift.end_time).slice(0, 5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2>Assign Shift to Employee</h2>

        <form onSubmit={assignShift}>
          <label>
            Employee
            <select
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              required
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name || `Employee ${employee.id}`} (ID:{" "}
                  {employee.id})
                </option>
              ))}
            </select>
          </label>

          <label style={{ marginLeft: "12px" }}>
            Shift
            <select
              value={shiftId}
              onChange={(event) => setShiftId(event.target.value)}
              required
            >
              <option value="">Select shift</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={{ marginLeft: "12px" }}>
            Assign Shift
          </button>
        </form>
      </section>

      <section>
        <h2>Employee Shift Assignments</h2>

        {assignments.length === 0 ? (
          <p>No shift assignments available.</p>
        ) : (
          <table cellPadding="10" border="1">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Shift ID</th>
                <th>Shift Name</th>
                <th>Start Time</th>
                <th>End Time</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.employee_id}</td>
                  <td>{assignment.shift_id}</td>
                  <td>{assignment.shift?.name || "N/A"}</td>
                  <td>
                    {String(assignment.shift?.start_time || "").slice(0, 5)}
                  </td>
                  <td>
                    {String(assignment.shift?.end_time || "").slice(0, 5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default ShiftManagement;
