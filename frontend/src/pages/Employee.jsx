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
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  // Load employees from the backend
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
          throw new Error(
            "Session expired. Please log in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "HR or ADMIN access is required."
          );
        }

        throw new Error("Unable to load employees.");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(
        err.message || "Cannot connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  // Delete an employee
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
        previous.filter(
          (employee) => employee.id !== employeeId
        )
      );
    } catch (err) {
      setError(
        err.message || "Unable to delete employee."
      );
    }
  }

  // Fetch employees when the page opens
  useEffect(() => {
    loadEmployees();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, department]);

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    const employeeName = (
      employee.full_name || ""
    ).toLowerCase();

    const matchesName = employeeName.includes(
      search.trim().toLowerCase()
    );

    const matchesStatus =
      status === "" || employee.status === status;

    const matchesDepartment =
      department === "" ||
      employee.department === department;

    return (
      matchesName &&
      matchesStatus &&
      matchesDepartment
    );
  });

  // Get unique department names
  const departments = [
    ...new Set(
      employees.map((employee) => employee.department)
    ),
  ]
    .filter(Boolean)
    .sort();

  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredEmployees.length / EMPLOYEES_PER_PAGE
    )
  );

  // Keep the current page within the valid range
  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * EMPLOYEES_PER_PAGE;

  const currentEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + EMPLOYEES_PER_PAGE
  );

  return (
    <main style={{ padding: "24px" }}>
      <h1>Employee Management</h1>

      <p>View and manage employee records.</p>

      <button
        onClick={() => navigate("/employees/add")}
      >
        + Add Employee
      </button>

      <hr />

      {/* Search and filters */}
      <section>
        <h2>Search and Filter</h2>

        <input
          type="search"
          placeholder="Search by employee name"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          style={{ marginRight: "8px", padding: "8px" }}
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          style={{ marginRight: "8px", padding: "8px" }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <select
          value={department}
          onChange={(event) =>
            setDepartment(event.target.value)
          }
          style={{ marginRight: "8px", padding: "8px" }}
        >
          <option value="">All departments</option>

          {departments.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <button onClick={loadEmployees}>
          Refresh
        </button>
      </section>

      <hr />

      {/* Loading and error messages */}
      {loading && <p>Loading employees...</p>}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {/* Empty state */}
      {!loading &&
        !error &&
        filteredEmployees.length === 0 && (
          <p>No employees found.</p>
        )}

      {/* Employee cards */}
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

            <p>
              <strong>Employee ID:</strong>{" "}
              {employee.id}
            </p>

            <p>
              <strong>Designation:</strong>{" "}
              {employee.designation}
            </p>

            <p>
              <strong>Department:</strong>{" "}
              {employee.department}
            </p>

            <p>
              <strong>Joining Date:</strong>{" "}
              {employee.joining_date}
            </p>

            <p>
              <strong>Salary:</strong> ₹
              {employee.salary}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {employee.status}
            </p>

            <button
              onClick={() =>
                navigate(
                  `/employees/edit/${employee.id}`
                )
              }
            >
              Edit
            </button>

            {" "}

            <button
              onClick={() =>
                deleteEmployee(employee.id)
              }
            >
              Delete
            </button>
          </article>
        ))}

      {/* Pagination controls */}
      {!loading &&
        !error &&
        filteredEmployees.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <button
              disabled={safeCurrentPage === 1}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(1, page - 1)
                )
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
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
            >
              Next
            </button>
          </div>
        )}

      <p>
        Total employees: {filteredEmployees.length}
      </p>
    </main>
  );
}

export default Employees;
