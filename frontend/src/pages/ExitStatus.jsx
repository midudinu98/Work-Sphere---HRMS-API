import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function ExitStatus() {
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResignations = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please log in first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/resignations/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load resignation status.");
        }

        setResignations(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load resignation status.");
      } finally {
        setLoading(false);
      }
    };

    fetchResignations();
  }, []);

  const statusStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return { color: "#15803d", background: "#dcfce7" };
      case "REJECTED":
        return { color: "#b91c1c", background: "#fee2e2" };
      default:
        return { color: "#92400e", background: "#fef3c7" };
    }
  };

  if (loading) {
    return <p style={styles.message}>Loading resignation status...</p>;
  }

  if (error) {
    return <p style={styles.error}>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h2>Resignation & Exit Status</h2>
      <p>Track your resignation requests and their current status.</p>

      {resignations.length === 0 ? (
        <p>No resignation requests found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>ID</th>
                <th style={styles.cell}>Reason</th>
                <th style={styles.cell}>Notice Period</th>
                <th style={styles.cell}>Submitted On</th>
                <th style={styles.cell}>Status</th>
              </tr>
            </thead>

            <tbody>
              {resignations.map((item) => (
                <tr key={item.id}>
                  <td style={styles.cell}>{item.id}</td>
                  <td style={styles.cell}>{item.reason}</td>
                  <td style={styles.cell}>{item.notice_period} days</td>
                  <td style={styles.cell}>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td style={styles.cell}>
                    <span
                      style={{
                        ...styles.badge,
                        ...statusStyle(item.status),
                      }}
                    >
                      {item.status}
                    </span>
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

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "30px auto",
    padding: "24px",
    background: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  cell: {
    border: "1px solid #ddd",
    padding: "12px",
    textAlign: "left",
  },
  badge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "5px",
    fontWeight: "bold",
  },
  message: {
    textAlign: "center",
    margin: "30px",
  },
  error: {
    color: "#b91c1c",
    textAlign: "center",
    margin: "30px",
  },
};
