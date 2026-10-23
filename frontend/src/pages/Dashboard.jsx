
import { useEffect, useState } from "react";
import {
 ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "./Dashboard.css";

const API_URL = "http://127.0.0.1:8000";

const CHART_COLORS = ["#2563eb", "#16a34a", "#dc2626"];

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Please log in to view the dashboard.");
        }

        const response = await fetch(
          `${API_URL}/analytics/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }

        if (response.status === 403) {
          throw new Error(
            "Access denied. An HR or Admin account is required."
          );
        }

        if (!response.ok) {
          throw new Error(
            `Failed to load analytics. Status: ${response.status}`
          );
        }

        const result = await response.json();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-message">
        Loading dashboard analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-message">
        No analytics data available.
      </div>
    );
  }

  const cards = [
    {
      title: "Total Employees",
      value: data.employees.total,
      subtitle: `${data.employees.active} active employees`,
      icon: "👥",
    },
    {
      title: "Present Today",
      value: data.attendance.present,
      subtitle: `${data.attendance.total_records} attendance records`,
      icon: "✅",
    },
    {
      title: "Pending Leaves",
      value: data.leaves.pending,
      subtitle: `${data.leaves.total} total requests`,
      icon: "📅",
    },
    {
      title: "Monthly Payroll",
      value: `₹${Number(
        data.payroll.total_net_salary
      ).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: `${data.payroll.payroll_records} payroll records`,
      icon: "💰",
    },
  ];

  const attendanceChartData = [
    {
      name: "Present",
      count: data.attendance.present,
    },
    {
      name: "Absent",
      count: data.attendance.absent,
    },
    {
      name: "On Leave",
      count: data.attendance.on_leave,
    },
  ];

  const leaveChartData = [
    {
      name: "Pending",
      value: data.leaves.pending,
    },
    {
      name: "Approved",
      value: data.leaves.approved,
    },
    {
      name: "Rejected",
      value: data.leaves.rejected,
    },
  ];

  const formattedDate = new Date(
    `${data.date}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>HR Dashboard</h1>
          <p>WorkSphere workforce overview</p>
        </div>

        <span className="dashboard-date">
          {formattedDate}
        </span>
      </header>

      {/* KPI Cards */}
      <section className="kpi-grid">
        {cards.map((card) => (
          <article className="kpi-card" key={card.title}>
            <div className="kpi-card-top">
              <span className="kpi-title">
                {card.title}
              </span>

              <span className="kpi-icon">
                {card.icon}
              </span>
            </div>

            <h2 className="kpi-value">
              {card.value}
            </h2>

            <p className="kpi-subtitle">
              {card.subtitle}
            </p>
          </article>
        ))}
      </section>

      {/* Attendance Summary */}
      <section className="dashboard-section">
        <h2>Attendance Summary</h2>

        <div className="summary-grid">
          <div className="summary-item">
            <span>Present</span>
            <strong>{data.attendance.present}</strong>
          </div>

          <div className="summary-item">
            <span>Absent</span>
            <strong>{data.attendance.absent}</strong>
          </div>

          <div className="summary-item">
            <span>On Leave</span>
            <strong>{data.attendance.on_leave}</strong>
          </div>
        </div>
      </section>

      {/* Leave Summary */}
      <section className="dashboard-section">
        <h2>Leave Statistics</h2>

        <div className="summary-grid">
          <div className="summary-item">
            <span>Pending</span>
            <strong>{data.leaves.pending}</strong>
          </div>

          <div className="summary-item">
            <span>Approved</span>
            <strong>{data.leaves.approved}</strong>
          </div>

          <div className="summary-item">
            <span>Rejected</span>
            <strong>{data.leaves.rejected}</strong>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="charts-grid">
        <article className="dashboard-section chart-card">
          <h2>Today's Attendance</h2>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={attendanceChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis dataKey="name" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Bar
                  dataKey="count"
                  name="Employees"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-section chart-card">
          <h2>Leave Status Distribution</h2>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={leaveChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  paddingAngle={3}
                  label
                >
                  {leaveChartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index]}
                    />
                  ))}
                </Pie>

                <Tooltip />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {/* Payroll Report */}
      <section className="dashboard-section payroll-report">
        <h2>Payroll Overview</h2>

        <div className="payroll-details">
          <div>
            <span>Payroll Month</span>
            <strong>{data.payroll.month}</strong>
          </div>

          <div>
            <span>Payroll Records</span>
            <strong>{data.payroll.payroll_records}</strong>
          </div>

          <div>
            <span>Total Net Salary</span>
            <strong>
              ₹
              {Number(
                data.payroll.total_net_salary
              ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
