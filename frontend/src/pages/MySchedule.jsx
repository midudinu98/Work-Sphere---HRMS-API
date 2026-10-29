import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function MySchedule() {
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${API_URL}/shifts/my-schedule`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to retrieve your shift schedule."
          );
        }

        setSchedule(data);
      } catch (err) {
        setError(err.message || "Unable to load your schedule.");
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, []);

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading your schedule...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <h1>My Shift Schedule</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div style={{ padding: "24px" }}>
        <h1>My Shift Schedule</h1>
        <p>No shift schedule has been assigned to you yet.</p>
      </div>
    );
  }

  const shift = schedule.shift || schedule;

  return (
    <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>My Shift Schedule</h1>
      <p>View your assigned working hours.</p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2>{shift.name || "Assigned Shift"}</h2>

        <p>
          <strong>Shift ID:</strong> {schedule.shift_id ?? shift.id ?? "N/A"}
        </p>

        <p>
          <strong>Start Time:</strong>{" "}
          {shift.start_time
            ? String(shift.start_time).slice(0, 5)
            : "N/A"}
        </p>

        <p>
          <strong>End Time:</strong>{" "}
          {shift.end_time
            ? String(shift.end_time).slice(0, 5)
            : "N/A"}
        </p>
      </div>
    </div>
  );
}

export default MySchedule;
