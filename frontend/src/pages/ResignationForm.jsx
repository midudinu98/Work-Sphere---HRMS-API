import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function ResignationForm() {
  const [reason, setReason] = useState("");
  const [noticePeriod, setNoticePeriod] = useState(30);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please log in first.");
      return;
    }

    if (!reason.trim()) {
      setMessage("Please enter your resignation reason.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/resignations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reason.trim(),
          notice_period: Number(noticePeriod),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to submit resignation."
        );
      }

      setMessage(
        `Resignation submitted successfully. Status: ${data.status}`
      );
      setReason("");
      setNoticePeriod(30);
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Submit Resignation</h2>
      <p>Submit your resignation request for HR review.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label htmlFor="reason">Reason for Resignation</label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter your reason"
          rows={5}
          maxLength={2000}
          required
          style={styles.textarea}
        />

        <label htmlFor="noticePeriod">Notice Period (days)</label>
        <input
          id="noticePeriod"
          type="number"
          min="0"
          max="365"
          value={noticePeriod}
          onChange={(e) => setNoticePeriod(e.target.value)}
          required
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Submitting..." : "Submit Resignation"}
        </button>

        {message && <p role="status">{message}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "650px",
    margin: "30px auto",
    padding: "24px",
    background: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  textarea: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    resize: "vertical",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  button: {
    padding: "12px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
