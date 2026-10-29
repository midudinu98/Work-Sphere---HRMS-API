import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

export default function AnnouncementDetail() {
  const { id } = useParams();

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please log in to view this announcement.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/announcements/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load announcement.");
        }

        setAnnouncement(data);
      } catch (err) {
        setError(err.message || "Unable to load announcement.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  if (loading) {
    return <p style={styles.message}>Loading announcement...</p>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error}</p>
        <Link to="/announcements">Back to announcements</Link>
      </div>
    );
  }

  if (!announcement) {
    return <p style={styles.message}>Announcement not found.</p>;
  }

  return (
    <div style={styles.container}>
      <Link to="/announcements">← Back to announcements</Link>

      <h2 style={styles.title}>{announcement.title}</h2>

      <p style={styles.meta}>
        Published:{" "}
        {announcement.created_at
          ? new Date(announcement.created_at).toLocaleString()
          : "—"}
      </p>

      <div style={styles.messageContent}>{announcement.message}</div>

      <p style={styles.meta}>
        Announcement ID: {announcement.id}
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "850px",
    margin: "30px auto",
    padding: "28px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  title: {
    marginTop: "24px",
    overflowWrap: "anywhere",
  },
  meta: {
    color: "#666",
    fontSize: "14px",
    marginBottom: "20px",
  },
  messageContent: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    lineHeight: 1.7,
    margin: "24px 0",
  },
  error: {
    color: "#b91c1c",
  },
};
