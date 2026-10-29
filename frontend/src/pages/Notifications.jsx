import { useCallback, useEffect, useState } from "react";
import "./Notifications.css";

const API_URL = "http://127.0.0.1:8000";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setError("Please log in to view notifications.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const [listResponse, countResponse] = await Promise.all([
        fetch(`${API_URL}/notifications/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/notifications/unread-count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!listResponse.ok || !countResponse.ok) {
        throw new Error("Unable to load notifications.");
      }

      const listData = await listResponse.json();
      const countData = await countResponse.json();

      setNotifications(listData);
      setUnreadCount(countData.unread_count);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to mark notification as read.");
      }

      await fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with your WorkSphere activities.</p>
        </div>

        <div className="unread-badge">
          {unreadCount} unread
        </div>
      </div>

      {error && <p className="notification-error">{error}</p>}

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="notifications-empty">
          <h3>You're all caught up!</h3>
          <p>Your notifications will appear here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-card ${
                notification.is_read ? "read" : "unread"
              }`}
            >
              <div className="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <small>
                  {new Date(notification.created_at).toLocaleString()}
                </small>
              </div>

              {!notification.is_read && (
                <button
                  className="mark-read-button"
                  onClick={() => markAsRead(notification.id)}
                >
                  Mark as read
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <button
        className="refresh-notifications"
        onClick={fetchNotifications}
      >
        Refresh notifications
      </button>
    </div>
  );
}

export default Notifications;
