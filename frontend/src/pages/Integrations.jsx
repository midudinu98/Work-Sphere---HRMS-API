import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const reports = [
  { label: "Employee Report", value: "employees" },
  { label: "Attendance Report", value: "attendance" },
  { label: "Leave Report", value: "leaves" },
  { label: "Payroll Report", value: "payroll" },
];

const initialEvent = {
  summary: "",
  description: "",
  start_time: "",
  end_time: "",
  timezone: "Asia/Kolkata",
};

export default function Integrations() {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [eventData, setEventData] = useState(initialEvent);

  const token = localStorage.getItem("access_token");

  async function apiRequest(path, options = {}) {
    if (!token) {
      throw new Error("Please log in before using integrations.");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.detail || "Request failed.");
    }

    return data;
  }

  async function checkCalendarStatus() {
    setCalendarLoading(true);
    setError("");

    try {
      const data = await apiRequest("/calendar/google/status");
      setCalendarConnected(data.connected);
    } catch (err) {
      setError(err.message);
    } finally {
      setCalendarLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("google_calendar") === "connected") {
      setMessage("Google Calendar connected successfully.");
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    checkCalendarStatus();
    // Initial status check when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function downloadReport(reportType, format) {
    setLoading(`${reportType}-${format}`);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/exports/${reportType}/${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Report export failed.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${reportType}_report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage(
        `${reportType} ${format.toUpperCase()} downloaded successfully.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  }

  async function connectCalendar() {
    setLoading("calendar-connect");
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/calendar/google/connect");

      if (!data.authorization_url) {
        throw new Error("Google authorization URL was not returned.");
      }

      window.location.assign(data.authorization_url);
    } catch (err) {
      setError(err.message);
      setLoading("");
    }
  }

  async function disconnectCalendar() {
    setLoading("calendar-disconnect");
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/calendar/google/disconnect", {
        method: "DELETE",
      });

      setCalendarConnected(false);
      setMessage(data.message || "Google Calendar disconnected.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  }

  function updateEvent(field, value) {
    setEventData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function createCalendarEvent(event) {
    event.preventDefault();
    setLoading("calendar-event");
    setMessage("");
    setError("");

    try {
      if (
        !eventData.start_time ||
        !eventData.end_time ||
        !eventData.summary.trim()
      ) {
        throw new Error("Enter an event title, start time, and end time.");
      }

      const start = new Date(eventData.start_time);
      const end = new Date(eventData.end_time);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        throw new Error("The event end time must be after its start time.");
      }

      const payload = {
        summary: eventData.summary.trim(),
        description: eventData.description,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        timezone: eventData.timezone,
      };

      const data = await apiRequest("/calendar/google/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage(data.message || "Calendar event created successfully.");
      setEventData(initialEvent);

      if (data.event_link) {
        window.open(data.event_link, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  }

  return (
    <div style={styles.page}>
      <h1>Reports & Integrations</h1>
      <p style={styles.subtitle}>
        Export HR reports and manage external integrations.
      </p>

      {message && <p role="status" style={styles.success}>{message}</p>}
      {error && <p role="alert" style={styles.error}>{error}</p>}

      <section style={styles.section}>
        <h2>Export Reports</h2>
        <p>Choose a report format to download your HR data.</p>

        <div style={styles.grid}>
          {reports.map((report) => (
            <div key={report.value} style={styles.card}>
              <h3>{report.label}</h3>

              <div style={styles.actions}>
                <button
                  disabled={Boolean(loading)}
                  onClick={() => downloadReport(report.value, "csv")}
                  style={styles.csvButton}
                >
                  {loading === `${report.value}-csv`
                    ? "Exporting..."
                    : "Export CSV"}
                </button>

                <button
                  disabled={Boolean(loading)}
                  onClick={() => downloadReport(report.value, "pdf")}
                  style={styles.pdfButton}
                >
                  {loading === `${report.value}-pdf`
                    ? "Exporting..."
                    : "Export PDF"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <h2>Google Calendar Integration</h2>
        <p>
          Connect your Google account to create events in your primary
          Google Calendar.
        </p>

        <p>
          Connection status:{" "}
          <strong>
            {calendarLoading
              ? "Checking..."
              : calendarConnected
                ? "Connected"
                : "Not connected"}
          </strong>
        </p>

        <div style={styles.actions}>
          <button
            disabled={Boolean(loading) || calendarLoading}
            onClick={connectCalendar}
            style={styles.primaryButton}
          >
            {loading === "calendar-connect"
              ? "Connecting..."
              : calendarConnected
                ? "Reconnect Google Calendar"
                : "Connect Google Calendar"}
          </button>

          <button
            disabled={
              Boolean(loading) || calendarLoading || !calendarConnected
            }
            onClick={disconnectCalendar}
            style={styles.secondaryButton}
          >
            {loading === "calendar-disconnect"
              ? "Disconnecting..."
              : "Disconnect"}
          </button>

          <button
            disabled={Boolean(loading) || calendarLoading}
            onClick={checkCalendarStatus}
            style={styles.secondaryButton}
          >
            Refresh Status
          </button>
        </div>

        {calendarConnected && (
          <form onSubmit={createCalendarEvent} style={styles.form}>
            <h3>Create Calendar Event</h3>

            <label style={styles.label} htmlFor="event-summary">
              Event title
            </label>
            <input
              id="event-summary"
              style={styles.input}
              value={eventData.summary}
              onChange={(e) => updateEvent("summary", e.target.value)}
              maxLength={200}
              required
            />

            <label style={styles.label} htmlFor="event-description">
              Description
            </label>
            <textarea
              id="event-description"
              style={styles.input}
              value={eventData.description}
              onChange={(e) => updateEvent("description", e.target.value)}
              maxLength={2000}
              rows={3}
            />

            <label style={styles.label} htmlFor="event-start">
              Start date and time
            </label>
            <input
              id="event-start"
              type="datetime-local"
              style={styles.input}
              value={eventData.start_time}
              onChange={(e) => updateEvent("start_time", e.target.value)}
              required
            />

            <label style={styles.label} htmlFor="event-end">
              End date and time
            </label>
            <input
              id="event-end"
              type="datetime-local"
              style={styles.input}
              value={eventData.end_time}
              onChange={(e) => updateEvent("end_time", e.target.value)}
              required
            />

            <label style={styles.label} htmlFor="event-timezone">
              Time zone
            </label>
            <select
              id="event-timezone"
              style={styles.input}
              value={eventData.timezone}
              onChange={(e) => updateEvent("timezone", e.target.value)}
            >
              <option value="Asia/Kolkata">India Standard Time</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="Europe/London">London</option>
            </select>

            <button
              type="submit"
              disabled={Boolean(loading)}
              style={styles.primaryButton}
            >
              {loading === "calendar-event"
                ? "Creating Event..."
                : "Create Google Calendar Event"}
            </button>
          </form>
        )}
      </section>

      <section style={styles.section}>
        <h2>Email Notifications</h2>
        <p>
          SMTP email notifications are configured in the backend and
          are available for supported WorkSphere workflows.
        </p>
        <span style={styles.badge}>Backend email integration</span>
      </section>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
    color: "#1f2937",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "28px",
  },
  section: {
    marginBottom: "32px",
    padding: "22px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "20px",
  },
  card: {
    padding: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "600px",
    marginTop: "24px",
  },
  label: {
    fontWeight: 600,
    marginTop: "8px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    font: "inherit",
  },
  csvButton: {
    padding: "10px 12px",
    background: "#15803d",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  pdfButton: {
    padding: "10px 12px",
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  primaryButton: {
    padding: "10px 14px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    background: "#e5e7eb",
    color: "#1f2937",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    background: "#dbeafe",
    borderRadius: "6px",
    color: "#1d4ed8",
  },
  success: { color: "#15803d" },
  error: { color: "#b91c1c" },
};
