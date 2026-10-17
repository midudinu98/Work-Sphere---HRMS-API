import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function LeaveApplication() {
  const [form, setForm] = useState({
    leave_type: "CASUAL",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (form.end_date < form.start_date) {
      setError("End date cannot be before start date.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in before applying for leave.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/leaves/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to submit leave request.");
      }

      setMessage(
        `Leave request submitted successfully. Status: ${data.status}`
      );

      setForm({
        leave_type: "CASUAL",
        start_date: "",
        end_date: "",
        reason: "",
      });
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="leave-page">
      <h2>Apply for Leave</h2>
      <p>Complete the form to submit your leave request.</p>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="leave_type">Leave Type</label>
        <select
          id="leave_type"
          name="leave_type"
          value={form.leave_type}
          onChange={handleChange}
          required
        >
          <option value="SICK">Sick Leave</option>
          <option value="CASUAL">Casual Leave</option>
          <option value="PAID">Paid Leave</option>
        </select>

        <label htmlFor="start_date">Start Date</label>
        <input
          id="start_date"
          type="date"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
          required
        />

        <label htmlFor="end_date">End Date</label>
        <input
          id="end_date"
          type="date"
          name="end_date"
          value={form.end_date}
          min={form.start_date || undefined}
          onChange={handleChange}
          required
        />

        <label htmlFor="reason">Reason</label>
        <textarea
          id="reason"
          name="reason"
          value={form.reason}
          onChange={handleChange}
          minLength={3}
          maxLength={500}
          placeholder="Enter your reason for leave"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Leave Request"}
        </button>
      </form>
    </div>
  );
}

export default LeaveApplication;
