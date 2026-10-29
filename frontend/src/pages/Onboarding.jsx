import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function Onboarding() {
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("access_token");

  const fetchTasks = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/onboarding/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load onboarding tasks.");
      }

      const data = await response.json();
      setTasks(data);

      if (data.length > 0) {
        const employeeId = data[0].employee_id;

        const progressResponse = await fetch(
          `${API_URL}/onboarding/progress/${employeeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (progressResponse.ok) {
          setProgress(await progressResponse.json());
        } else {
          setProgress(null);
        }
      } else {
        setProgress(null);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateStatus = async (taskId, status) => {
    setUpdatingId(taskId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/onboarding/${taskId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || "Unable to update task.");
      }

      await fetchTasks();
    } catch (err) {
      setError(err.message || "Unable to update task.");
    } finally {
      setUpdatingId(null);
    }
  };

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const pendingTasks = tasks.length - completedTasks;

  const percentage = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  if (loading) {
    return <p style={{ padding: 24 }}>Loading onboarding tasks...</p>;
  }

  return (
    <div style={styles.container}>
      <h1>Employee Onboarding</h1>
      <p style={styles.subtitle}>
        Track your onboarding checklist and task completion.
      </p>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.cards}>
        <div style={styles.card}>
          <h3>Total Tasks</h3>
          <p style={styles.number}>{tasks.length}</p>
        </div>

        <div style={styles.card}>
          <h3>Completed</h3>
          <p style={styles.number}>{completedTasks}</p>
        </div>

        <div style={styles.card}>
          <h3>Pending</h3>
          <p style={styles.number}>{pendingTasks}</p>
        </div>
      </div>

      <div style={styles.progressBox}>
        <div style={styles.progressHeader}>
          <h3>Onboarding Progress</h3>
          <strong>{percentage}%</strong>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${percentage}%`,
            }}
          />
        </div>
      </div>

      <h2>My Onboarding Checklist</h2>

      {tasks.length === 0 ? (
        <p>No onboarding tasks have been assigned yet.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Task</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td style={styles.td}>{task.task_name}</td>
                  <td style={styles.td}>
                    {task.due_date || "Not set"}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(task.status === "COMPLETED"
                          ? styles.completed
                          : styles.pending),
                      }}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {task.status === "PENDING" ? (
                      <button
                        style={styles.button}
                        disabled={updatingId === task.id}
                        onClick={() =>
                          updateStatus(task.id, "COMPLETED")
                        }
                      >
                        {updatingId === task.id
                          ? "Updating..."
                          : "Mark Completed"}
                      </button>
                    ) : (
                      <span>Done ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button style={styles.refreshButton} onClick={fetchTasks}>
        Refresh Tasks
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
    color: "#1f2937",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "24px",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#ffffff",
  },
  number: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "8px 0 0",
  },
  progressBox: {
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    marginBottom: "28px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  progressTrack: {
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
    marginTop: "12px",
  },
  progressFill: {
    height: "100%",
    background: "#16a34a",
    borderRadius: "10px",
    transition: "width 0.3s ease",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "12px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
  badge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  completed: {
    background: "#dcfce7",
    color: "#166534",
  },
  pending: {
    background: "#fef3c7",
    color: "#92400e",
  },
  button: {
    padding: "8px 12px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  refreshButton: {
    marginTop: "20px",
    padding: "10px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },
  error: {
    color: "#b91c1c",
    background: "#fee2e2",
    padding: "12px",
    borderRadius: "6px",
  },
};

export default Onboarding;
