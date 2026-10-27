import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./Reports.css";

const API_URL = "http://127.0.0.1:8000/analytics";

function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [departmentReports, setDepartmentReports] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = () =>
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const loadReports = async () => {
    const token = getToken();

    if (!token) {
      setError("Please log in to view analytics reports.");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be later than end date.");
      return;
    }

    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (department) params.set("department", department);

    const query = params.toString();
    const suffix = query ? `?${query}` : "";

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const endpoints = [
        "attendance-trends",
        "leave-trends",
        "department-reports",
        "performance",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`${API_URL}/${endpoint}${suffix}`, { headers })
        )
      );

      const failedResponse = responses.find(
        (response) => !response.ok
      );

      if (failedResponse) {
        if (
          failedResponse.status === 401 ||
          failedResponse.status === 403
        ) {
          throw new Error(
            "Access denied. Please log in with an HR or Admin account."
          );
        }

        throw new Error(
          `Failed to load reports (HTTP ${failedResponse.status}).`
        );
      }

      const [
        attendanceData,
        leaveData,
        departmentData,
        performanceData,
      ] = await Promise.all(
        responses.map((response) => response.json())
      );

      setAttendance(attendanceData.trends || []);
      setLeaves(leaveData.trends || []);
      setDepartmentReports(departmentData.departments || []);
      setPerformance(performanceData.performance || []);

      setDepartments((current) => {
        const names = departmentData.departments
          .map((item) => item.department)
          .filter(Boolean);

        return [...new Set([...current, ...names])].sort();
      });
    } catch (err) {
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setDepartment("");
  };

  const totalEmployees = departmentReports.reduce(
    (sum, item) => sum + item.total_employees,
    0
  );

  const totalPresent = attendance.reduce(
    (sum, item) => sum + item.present,
    0
  );

  const totalLeaveRequests = leaves.reduce(
    (sum, item) => sum + item.total,
    0
  );

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Advanced Analytics & Reports</h1>
          <p>
            Monitor attendance, leave trends, employee punctuality,
            and department statistics.
          </p>
        </div>

        <button
          className="reports-refresh"
          onClick={loadReports}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Reports"}
        </button>
      </div>

      <section className="reports-filters">
        <div className="report-filter">
          <label htmlFor="report-start-date">Start Date</label>
          <input
            id="report-start-date"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="report-filter">
          <label htmlFor="report-end-date">End Date</label>
          <input
            id="report-end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <div className="report-filter">
          <label htmlFor="report-department">Department</label>
          <select
            id="report-department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="reports-apply"
          onClick={loadReports}
          disabled={loading}
        >
          Apply Filters
        </button>

        <button
          className="reports-reset"
          onClick={resetFilters}
          disabled={loading}
        >
          Reset
        </button>
      </section>

      {error && (
        <div className="reports-error" role="alert">
          {error}
        </div>
      )}

      <section className="reports-summary">
        <div className="report-stat">
          <span>Total Employees</span>
          <strong>{totalEmployees}</strong>
        </div>

        <div className="report-stat">
          <span>Present Records</span>
          <strong>{totalPresent}</strong>
        </div>

        <div className="report-stat">
          <span>Leave Requests</span>
          <strong>{totalLeaveRequests}</strong>
        </div>

        <div className="report-stat">
          <span>Departments</span>
          <strong>{departmentReports.length}</strong>
        </div>
      </section>

      {loading && (
        <p className="reports-loading">Loading analytics reports...</p>
      )}

      <section className="reports-chart-grid">
        <div className="report-card">
          <h2>Attendance Trends</h2>
          <p>Daily attendance records within the selected date range.</p>

          <div className="report-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke="#16a34a"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  name="Absent"
                  stroke="#dc2626"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="half_day"
                  name="Half Day"
                  stroke="#d97706"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card">
          <h2>Leave Trends</h2>
          <p>Monthly leave requests grouped by approval status.</p>

          <div className="report-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaves}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" name="Approved" fill="#16a34a" />
                <Bar dataKey="pending" name="Pending" fill="#d97706" />
                <Bar dataKey="rejected" name="Rejected" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card report-card-wide">
          <h2>Department-wise Reports</h2>
          <p>Compare employee counts across departments.</p>

          <div className="report-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentReports}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total_employees"
                  name="Total Employees"
                  fill="#2563eb"
                />
                <Bar
                  dataKey="active_employees"
                  name="Active Employees"
                  fill="#16a34a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="report-card report-performance">
        <h2>Employee Performance Insights</h2>
        <p>
          Attendance and punctuality indicators for the selected filters.
          These metrics do not represent overall job performance.
        </p>

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Half Day</th>
                <th>Attendance Rate</th>
                <th>Late (min)</th>
                <th>Early Exit (min)</th>
              </tr>
            </thead>

            <tbody>
              {performance.length === 0 ? (
                <tr>
                  <td colSpan="8" className="reports-empty">
                    No employee performance records found.
                  </td>
                </tr>
              ) : (
                performance.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td>{employee.full_name}</td>
                    <td>{employee.department}</td>
                    <td>{employee.present_days}</td>
                    <td>{employee.absent_days}</td>
                    <td>{employee.half_days}</td>
                    <td>
                      {employee.attendance_rate_percent == null
                        ? "N/A"
                        : `${employee.attendance_rate_percent}%`}
                    </td>
                    <td>{employee.total_late_minutes}</td>
                    <td>{employee.total_early_checkout_minutes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Reports;
