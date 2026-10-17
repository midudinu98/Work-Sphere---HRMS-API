
import { useEffect, useState } from "react";
import "./Payroll.css";

const API_URL = "http://127.0.0.1:8000";

function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        setLoading(true);
        setError("");

        // Get the JWT token saved during login
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token");

        if (!token) {
          throw new Error(
            "You are not logged in. Please log in again."
          );
        }

        const response = await fetch(`${API_URL}/payroll/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          throw new Error(
            "Session expired or invalid token. Please log in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view payroll records."
          );
        }

        if (!response.ok) {
          const message = await response.text();
          throw new Error(
            message || `Failed to load payroll (${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected payroll response from server.");
        }

        setPayrolls(data);
      } catch (err) {
        setError(
          err.message || "Unable to load payroll records."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
  }, []);

  const formatCurrency = (amount) =>
    `₹${Number(amount ?? 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const totalPayroll = payrolls.reduce(
    (total, item) => total + Number(item.net_salary ?? 0),
    0
  );

  if (loading) {
    return (
      <div className="payroll-page">
        <h1>Payroll Dashboard</h1>
        <p>Loading payroll records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payroll-page">
        <h1>Payroll Dashboard</h1>
        <p role="alert" className="payroll-error">
          {error}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="payroll-page">
      <h1>Payroll Dashboard</h1>

      <p>View employee salary and monthly payroll details.</p>

      <div className="payroll-summary">
        <h3>Total Net Salary</h3>

        <h2>{formatCurrency(totalPayroll)}</h2>

        <p>{payrolls.length} payroll record(s)</p>
      </div>

      <h2>Payroll Records</h2>

      {payrolls.length === 0 ? (
        <p>No payroll records found.</p>
      ) : (
        <div className="payroll-table-container">
          <table>
            <thead>
              <tr>
                <th>Payroll ID</th>
                <th>Employee ID</th>
                <th>Month</th>
                <th>Basic Salary</th>
                <th>Deductions</th>
                <th>Bonus</th>
                <th>Net Salary</th>
              </tr>
            </thead>

            <tbody>
              {payrolls.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.employee_id}</td>
                  <td>{item.month}</td>
                  <td>{formatCurrency(item.basic_salary)}</td>
                  <td>{formatCurrency(item.deductions)}</td>
                  <td>{formatCurrency(item.bonus)}</td>
                  <td>
                    <strong>
                      {formatCurrency(item.net_salary)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Payroll;
