import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

export default function AnnouncementBoard() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role")?.toUpperCase();
  const canPost = role === "HR" || role === "ADMIN";

  const fetchAnnouncements = async () => {
    setError("");

    try {
      const response = await fetch(`${API_URL}/announcements/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load announcements.");
      }

      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!title.trim() || !message.trim()) {
      setError("Please enter both a title and a message.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/announcements/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to post announcement.");
      }

      setTitle("");
      setMessage("");
      setNotice("Announcement published successfully.");
      await fetchAnnouncements();
    } catch (err) {
      setError(err.message || "Unable to publish announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return <p style={styles.error}>Please log in to view announcements.</p>;
  }

  return (
    <div style={styles.container}>
      <h2>Internal Announcements</h2>
      <p>Stay informed about important organizational updates.</p>

      {canPost && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>Publish Announcement</h3>

          <label htmlFor="announcementTitle">Title</label>
          <input
            id="announcementTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Enter announcement title"
            required
            style={styles.input}
          />

          <label htmlFor="announcementMessage">Message</label>
          <textarea
            id="announcementMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Write your announcement"
            required
            style={styles.textarea}
          />

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? "Publishing..." : "Publish Announcement"}
          </button>
        </form>
      )}

      {notice && <p style={styles.success}>{notice}</p>}
      {error && <p style={styles.error}>{error}</p>}

      <h3>Latest Announcements</h3>

      {loading ? (
        <p>Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p>No announcements have been published yet.</p>
      ) : (
        <div style={styles.list}>
          {announcements.map((item) => (
            <article key={item.id} style={styles.card}>
              <h3>{item.title}</h3>

              <p style={styles.preview}>
                {item.message.length > 180
                  ? `${item.message.slice(0, 180)}...`
                  : item.message}
              </p>

              <small>
                Published:{" "}
                {item.created_at
                  ? new Date(item.created_at).toLocaleString()
                  : "—"}
              </small>

              <div>
                <Link to={`/announcements/${item.id}`}>
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "30px auto",
    padding: "24px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "20px",
    margin: "20px 0",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  textarea: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    resize: "vertical",
  },
  button: {
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  list: {
    display: "grid",
    gap: "16px",
  },
  card: {
    padding: "18px",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  preview: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
  success: {
    color: "#15803d",
  },
  error: {
    color: "#b91c1c",
  },
};
