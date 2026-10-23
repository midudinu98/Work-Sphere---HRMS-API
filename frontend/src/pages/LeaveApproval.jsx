import { useCallback, useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function LeaveApproval() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchLeaves = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/leaves/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load leave requests.");
      }

      setLeaves(data);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  async function updateStatus(leaveId, status) {
    const token = localStorage.getItem("token");

    setError("");
    setMessage("");
    setProcessingId(leaveId);

    try {
      const response = await fetch(
        `${API_URL}/leaves/${leaveId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update leave status.");
      }

      setMessage(`Leave request ${leaveId} ${status.toLowerCase()}.`);
      await fetchLeaves();
    } catch (err) {
      setError(err.message || "Unable to update leave status.");
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return <p>Loading leave requests...</p>;
  }

  return (
    <div className="leave-page">
      <h2>Leave Approvals</h2>
      <p>Review employee leave applications.</p>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      {leaves.length === 0 ? (
        <p>No leave requests found.</p>
      ) : (
        <div className="leave-list">
          {leaves.map((leave) => (
            <article className="leave-card" key={leave.id}>
              <h3>Leave Request #{leave.id}</h3>

              <p>
                <strong>Employee ID:</strong> {leave.employee_id}
              </p>
              <p>
                <strong>Type:</strong> {leave.leave_type}
              </p>
              <p>
                <strong>From:</strong> {leave.start_date}
              </p>
              <p>
                <strong>To:</strong> {leave.end_date}
              </p>
              <p>
                <strong>Reason:</strong> {leave.reason}
              </p>
              <p>
                <strong>Status:</strong> {leave.status}
              </p>

              {leave.status === "PENDING" && (
                <div className="leave-actions">
                  <button
                    type="button"
                    disabled={processingId !== null}
                    onClick={() => updateStatus(leave.id, "APPROVED")}
                  >
                    {processingId === leave.id
                      ? "Processing..."
                      : "Approve"}
                  </button>

                  <button
                    type="button"
                    disabled={processingId !== null}
                    onClick={() => updateStatus(leave.id, "REJECTED")}
                  >
                    {processingId === leave.id
                      ? "Processing..."
                      : "Reject"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default LeaveApproval;
