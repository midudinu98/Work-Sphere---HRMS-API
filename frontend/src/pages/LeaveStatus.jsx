import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function LeaveStatus() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLeaves() {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in to view your leave history.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/leaves/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to load leave history."
          );
        }

        setLeaves(data);
      } catch (err) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaves();
  }, []);

  if (loading) {
    return <p>Loading leave history...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div className="leave-page">
      <h2>My Leave History</h2>
      <p>Check the status of your leave applications.</p>

      {leaves.length === 0 ? (
        <p>You have not applied for any leave yet.</p>
      ) : (
        <div className="leave-list">
          {leaves.map((leave) => (
            <article className="leave-card" key={leave.id}>
              <h3>{leave.leave_type} Leave</h3>

              <p>
                <strong>Start date:</strong> {leave.start_date}
              </p>

              <p>
                <strong>End date:</strong> {leave.end_date}
              </p>

              <p>
                <strong>Reason:</strong> {leave.reason}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span className={`status-${leave.status.toLowerCase()}`}>
                  {leave.status}
                </span>
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default LeaveStatus;
