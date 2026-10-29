import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function Feedback() {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("user_role");

  const isHRorAdmin = role === "HR" || role === "ADMIN";

  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchFeedback = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/feedback/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to load feedback."
        );
      }

      setFeedbackList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHRorAdmin && token) {
      fetchFeedback();
    }
  }, [token, isHRorAdmin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError("Please enter your feedback.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/feedback/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message.trim(),
          rating: Number(rating),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to submit feedback."
        );
      }

      setMessage("");
      setRating(5);
      setSuccess("Your feedback was submitted successfully.");
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Employee Feedback System</h1>
      <p style={styles.subtitle}>
        Share your feedback to help us improve WorkSphere.
      </p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {!isHRorAdmin && (
        <section style={styles.card}>
          <h2>Submit Feedback</h2>

          <form onSubmit={handleSubmit}>
            <label htmlFor="feedback-message" style={styles.label}>
              Your Feedback
            </label>

            <textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share your suggestions or experience..."
              minLength={3}
              maxLength={5000}
              rows={6}
              required
              style={styles.textarea}
            />

            <label htmlFor="feedback-rating" style={styles.label}>
              Rating
            </label>

            <select
              id="feedback-rating"
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              style={styles.input}
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Very Good</option>
              <option value={3}>3 - Good</option>
              <option value={2}>2 - Fair</option>
              <option value={1}>1 - Poor</option>
            </select>

            <button
              type="submit"
              disabled={submitting}
              style={styles.button}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </section>
      )}

      {isHRorAdmin && (
        <section style={styles.card}>
          <div style={styles.header}>
            <h2>Feedback Dashboard</h2>
            <button
              type="button"
              onClick={fetchFeedback}
              disabled={loading}
              style={styles.secondaryButton}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p>Loading feedback...</p>
          ) : feedbackList.length === 0 ? (
            <p>No feedback submissions found.</p>
          ) : (
            <>
              <p>
                Total submissions: <strong>{feedbackList.length}</strong>
              </p>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.cell}>ID</th>
                      <th style={styles.cell}>Employee ID</th>
                      <th style={styles.cell}>Feedback</th>
                      <th style={styles.cell}>Rating</th>
                      <th style={styles.cell}>Submitted At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {feedbackList.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.cell}>{item.id}</td>
                        <td style={styles.cell}>{item.employee_id}</td>
                        <td style={styles.cell}>{item.message}</td>
                        <td style={styles.cell}>
                          {"★".repeat(item.rating)}
                          {"☆".repeat(5 - item.rating)}
                          {" "}({item.rating}/5)
                        </td>
                        <td style={styles.cell}>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "30px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "24px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    margin: "16px 0 8px",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    resize: "vertical",
    fontSize: "15px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "15px",
  },
  button: {
    marginTop: "20px",
    padding: "12px 20px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "9px 14px",
    background: "#475569",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  cell: {
    borderBottom: "1px solid #e2e8f0",
    padding: "12px",
    verticalAlign: "top",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "16px",
  },
  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "16px",
  },
};

export default Feedback;
