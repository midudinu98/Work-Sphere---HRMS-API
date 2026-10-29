import { useEffect, useState } from "react";
import "./Payroll.css";

const API_URL = "http://127.0.0.1:8000";

function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [month, setMonth] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    `₹${Number(amount ?? 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("token");

        if (!token) {
          throw new Error("Please log in again.");
        }

        const query = month
          ? `?month=${encodeURIComponent(month)}`
          : "";

        const response = await fetch(
          `${API_URL}/payroll/${query}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.detail || `Failed to load payroll (${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected payroll response.");
        }

        setPayrolls(data);
      } catch (err) {
        setError(err.message || "Unable to load payroll.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
  }, [month]);

  useEffect(() => {
    const fetchSummary = async () => {
      setSummary(null);

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token || !month) return;

      try {
        const response = await fetch(
          `${API_URL}/payroll/summary/monthly?month=${encodeURIComponent(month)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setSummary(await response.json());
        }
      } catch {
        // Employee accounts cannot access the HR/Admin summary.
      }
    };

    fetchSummary();
  }, [month]);

  const totalNetSalary = payrolls.reduce(
    (total, item) => total + Number(item.net_salary ?? 0),
    0
  );

  if (loading) {
    return (
      <main className="payroll-page">
        <h1>Payroll Dashboard</h1>
        <p>Loading payroll records...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="payroll-page">
        <h1>Payroll Dashboard</h1>
        <p role="alert" className="payroll-error">{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="payroll-page">
      <header className="payroll-header">
        <h1>Payroll Dashboard</h1>
        <p>Review salary breakdown, monthly summaries, and payroll history.</p>
      </header>

      <section className="payroll-filter">
        <label htmlFor="payroll-month">Filter by month</label>
        <input
          id="payroll-month"
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
        <button type="button" onClick={() => setMonth("")}>
          Show All History
        </button>
      </section>

      <section className="payroll-summary">
        <h2>{month ? `Payroll for ${month}` : "Payroll Summary"}</h2>
        <div className="payroll-summary-grid">
          <article>
            <h3>Total Net Salary</h3>
            <p>{formatCurrency(totalNetSalary)}</p>
          </article>
          <article>
            <h3>Payroll Records</h3>
            <p>{payrolls.length}</p>
          </article>
          {summary && (
            <>
              <article>
                <h3>Employees Paid</h3>
                <p>{summary.employees_paid}</p>
              </article>
              <article>
                <h3>Total Basic Salary</h3>
                <p>{formatCurrency(summary.total_basic_salary)}</p>
              </article>
              <article>
                <h3>Total Allowances</h3>
                <p>{formatCurrency(summary.total_allowances)}</p>
              </article>
              <article>
                <h3>Total Deductions</h3>
                <p>{formatCurrency(summary.total_deductions)}</p>
              </article>
            </>
          )}
        </div>
      </section>

      <section className="payroll-records">
        <h2>Payroll History &amp; Payslips</h2>

        {payrolls.length === 0 ? (
          <p>No payroll records found for this selection.</p>
        ) : (
          <div className="payroll-table-container">
            <table>
              <thead>
                <tr>
                  <th>Payroll ID</th>
                  <th>Employee ID</th>
                  <th>Month</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
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
                    <td>{formatCurrency(item.allowances)}</td>
                    <td>{formatCurrency(item.deductions)}</td>
                    <td>
                      <strong>{formatCurrency(item.net_salary)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Payroll;
