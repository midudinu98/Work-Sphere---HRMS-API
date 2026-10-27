import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";
const EMPLOYEES_PER_PAGE = 5;

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("");
  const [attendance, setAttendance] = useState("");
  const [performance, setPerformance] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  async function loadEmployees() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Please log in first.");
      }

      const response = await fetch(`${API_URL}/employees/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }

        if (response.status === 403) {
          throw new Error("HR or ADMIN access is required.");
        }

        throw new Error("Unable to load employees.");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message || "Cannot connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteEmployee(employeeId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Please log in first.");
      }

      const response = await fetch(
        `${API_URL}/employees/${employeeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete employee."
        );
      }

      setEmployees((previous) =>
        previous.filter((employee) => employee.id !== employeeId)
      );
    } catch (err) {
      setError(err.message || "Unable to delete employee.");
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    status,
    department,
    designation,
    role,
    attendance,
    performance,
  ]);

  // Dropdown options from existing employee records
  const departments = [
    ...new Set(employees.map((employee) => employee.department)),
  ]
    .filter(Boolean)
    .sort();

  const designations = [
    ...new Set(employees.map((employee) => employee.designation)),
  ]
    .filter(Boolean)
    .sort();

  // Apply filters using the backend-supported query parameters
  const filteredEmployees = employees.filter((employee) => {
    const employeeName = (employee.full_name || "").toLowerCase();

    const matchesName = employeeName.includes(
      search.trim().toLowerCase()
    );

    const matchesDepartment =
      !department || employee.department === department;

    const matchesDesignation =
      !designation || employee.designation === designation;

    const matchesStatus =
      !status || employee.status === status;

    // User role is returned by the backend only if EmployeeResponse
    // includes a role field.
    const matchesRole =
      !role || employee.role === role;

    // These filters need corresponding data in the employee response.
    const matchesAttendance =
      !attendance || employee.attendance_status === attendance;

    const matchesPerformance =
      !performance ||
      Number(employee.performance_rating) === Number(performance);

    return (
      matchesName &&
      matchesDepartment &&
      matchesDesignation &&
      matchesStatus &&
      matchesRole &&
      matchesAttendance &&
      matchesPerformance
    );
  });

  function clearFilters() {
    setSearch("");
    setStatus("");
    setDepartment("");
    setDesignation("");
    setRole("");
    setAttendance("");
    setPerformance("");
    setCurrentPage(1);
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * EMPLOYEES_PER_PAGE;

  const currentEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + EMPLOYEES_PER_PAGE
  );

  const inputStyle = {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    width: "100%",
    boxSizing: "border-box",
  };

  const fieldStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Employee Management</h1>
      <p>Search, filter, and manage employee records.</p>

      <button onClick={() => navigate("/employees/add")}>
        + Add Employee
      </button>

      <section
        style={{
          marginTop: "24px",
          marginBottom: "24px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
        }}
      >
        <h2>Advanced Search & Filters</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
          }}
        >
          <label style={fieldStyle}>
            Search by name
            <input
              type="search"
              placeholder="Enter employee name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            Department
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              style={inputStyle}
            >
              <option value="">All departments</option>
              {departments.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            Designation
            <select
              value={designation}
              onChange={(event) => setDesignation(event.target.value)}
              style={inputStyle}
            >
              <option value="">All designations</option>
              {designations.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            User role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              style={inputStyle}
            >
              <option value="">All roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label style={fieldStyle}>
            Employee status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              style={inputStyle}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          <label style={fieldStyle}>
            Attendance status
            <select
              value={attendance}
              onChange={(event) => setAttendance(event.target.value)}
              style={inputStyle}
            >
              <option value="">All attendance statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half day</option>
            </select>
          </label>

          <label style={fieldStyle}>
            Performance rating
            <select
              value={performance}
              onChange={(event) => setPerformance(event.target.value)}
              style={inputStyle}
            >
              <option value="">All ratings</option>
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Very good</option>
              <option value="3">3 - Good</option>
              <option value="2">2 - Needs improvement</option>
              <option value="1">1 - Poor</option>
            </select>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "20px",
          }}
        >
          <button onClick={clearFilters}>Clear Filters</button>
          <button onClick={loadEmployees} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </section>

      {loading && <p>Loading employees...</p>}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && filteredEmployees.length === 0 && (
        <p>No employees found. Try changing or clearing your filters.</p>
      )}

      {!loading &&
        !error &&
        currentEmployees.map((employee) => (
          <article
            key={employee.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "12px",
            }}
          >
            <h2>{employee.full_name}</h2>

            <p><strong>Employee ID:</strong> {employee.id}</p>
            <p><strong>Designation:</strong> {employee.designation}</p>
            <p><strong>Department:</strong> {employee.department}</p>
            <p><strong>Joining Date:</strong> {employee.joining_date}</p>
            <p><strong>Salary:</strong> ₹{employee.salary}</p>
            <p><strong>Status:</strong> {employee.status}</p>

            <p>
              <strong>Role:</strong>{" "}
              {employee.role || "Not available"}
            </p>

            <p>
              <strong>Attendance:</strong>{" "}
              {employee.attendance_status || "Not available"}
            </p>

            <p>
              <strong>Performance Rating:</strong>{" "}
              {employee.performance_rating ?? "Not available"}
            </p>

            <button
              onClick={() => navigate(`/employees/edit/${employee.id}`)}
            >
              Edit
            </button>{" "}

            <button onClick={() => deleteEmployee(employee.id)}>
              Delete
            </button>
          </article>
        ))}

      {!loading && !error && filteredEmployees.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          <button
            disabled={safeCurrentPage === 1}
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
            }
          >
            Previous
          </button>

          <span>
            Page {safeCurrentPage} of {totalPages}
          </span>

          <button
            disabled={safeCurrentPage >= totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
          >
            Next
          </button>
        </div>
      )}

      <p>
        Showing {filteredEmployees.length} of {employees.length} employees
      </p>
    </main>
  );
}

export default Employees;
