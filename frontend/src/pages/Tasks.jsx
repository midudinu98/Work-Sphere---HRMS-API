import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    assigned_to: "",
    title: "",
    description: "",
    due_date: "",
  });

  const [role, setRole] = useState("");
  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  async function loadTasks() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/tasks/`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Unable to load tasks. Please log in again.");
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserAndEmployees() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers,
      });

      if (!response.ok) return;

      const user = await response.json();
      setRole(user.role);

      if (["HR", "ADMIN"].includes(user.role)) {
        const employeeResponse = await fetch(
          `${API_URL}/employees/`,
          { headers }
        );

        if (employeeResponse.ok) {
          const data = await employeeResponse.json();
          setEmployees(Array.isArray(data) ? data : data.items || []);
        }
      }
    } catch {
      setError("Unable to load user information.");
    }
  }

  useEffect(() => {
    loadTasks();
    loadUserAndEmployees();
  }, []);

  async function assignTask(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/tasks/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...form,
          assigned_to: Number(form.assigned_to),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to assign task.");
      }

      setMessage("Task assigned successfully.");
      setForm({
        assigned_to: "",
        title: "",
        description: "",
        due_date: "",
      });

      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(taskId, newStatus) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update task.");
      }

      setMessage("Task status updated successfully.");
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  const pendingCount = tasks.filter(
    (task) => task.status === "PENDING"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const isManager = ["HR", "ADMIN"].includes(role);

  return (
    <div style={styles.page}>
      <h1>Task Management</h1>
      <p style={styles.subtitle}>
        Assign tasks, monitor progress, and track deadlines.
      </p>

      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.success}>{message}</p>}

      <div style={styles.stats}>
        <div style={styles.card}>
          <span>Total Tasks</span>
          <h2>{tasks.length}</h2>
        </div>

        <div style={styles.card}>
          <span>Pending</span>
          <h2>{pendingCount}</h2>
        </div>

        <div style={styles.card}>
          <span>Completed</span>
          <h2>{completedCount}</h2>
        </div>
      </div>

      {isManager && (
        <form onSubmit={assignTask} style={styles.form}>
          <h2>Assign New Task</h2>

          <label>Employee</label>
          <select
            required
            value={form.assigned_to}
            onChange={(e) =>
              setForm({ ...form, assigned_to: e.target.value })
            }
            style={styles.input}
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option
                key={employee.user_id || employee.id}
                value={employee.user_id || employee.id}
              >
                {employee.full_name || employee.username}
                {" (ID: "}
                {employee.user_id || employee.id}
                {")"}
              </option>
            ))}
          </select>

          <label>Task Title</label>
          <input
            required
            maxLength={200}
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            style={styles.input}
            placeholder="Enter task title"
          />

          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            style={styles.input}
            placeholder="Enter task description"
          />

          <label>Due Date</label>
          <input
            type="date"
            required
            value={form.due_date}
            onChange={(e) =>
              setForm({ ...form, due_date: e.target.value })
            }
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Assign Task
          </button>
        </form>
      )}

      <div style={styles.listHeader}>
        <h2>{isManager ? "All Assigned Tasks" : "My Tasks"}</h2>
        <button onClick={loadTasks} style={styles.refresh}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <div style={styles.taskList}>
          {tasks.map((task) => (
            <div key={task.id} style={styles.task}>
              <div style={styles.taskTop}>
                <h3>{task.title}</h3>
                <span
                  style={{
                    ...styles.status,
                    background:
                      task.status === "COMPLETED"
                        ? "#dcfce7"
                        : "#fef3c7",
                    color:
                      task.status === "COMPLETED"
                        ? "#166534"
                        : "#92400e",
                  }}
                >
                  {task.status}
                </span>
              </div>

              <p>{task.description || "No description provided."}</p>
              <p>
                <strong>Employee ID:</strong> {task.assigned_to}
              </p>
              <p>
                <strong>Due Date:</strong> {task.due_date}
              </p>

              {task.status === "PENDING" && (
                <button
                  onClick={() =>
                    updateStatus(task.id, "COMPLETED")
                  }
                  style={styles.button}
                >
                  Mark Completed
                </button>
              )}

              {task.status === "COMPLETED" && (
                <button
                  onClick={() =>
                    updateStatus(task.id, "PENDING")
                  }
                  style={styles.refresh}
                >
                  Reopen Task
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
    color: "#1f2937",
  },
  subtitle: { color: "#6b7280", marginBottom: "24px" },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    padding: "20px",
    background: "#f3f4f6",
    borderRadius: "10px",
  },
  form: {
    display: "grid",
    gap: "10px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    marginBottom: "28px",
  },
  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "8px",
  },
  button: {
    padding: "10px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  refresh: {
    padding: "9px 14px",
    background: "#e5e7eb",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  taskList: { display: "grid", gap: "16px" },
  task: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "18px",
  },
  taskTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  status: {
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  error: { color: "#b91c1c" },
  success: { color: "#15803d" },
};
