import { useEffect, useState } from "react";
import "./Profile.css";

const API_URL = "http://127.0.0.1:8000";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Please log in to view your profile.");
          return;
        }

        const response = await fetch(
          `${API_URL}/employees/me/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.detail || "Failed to load employee profile."
          );
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <p>Loading profile...</p>;

  if (error) {
    return <p className="profile-error">{error}</p>;
  }

  if (!profile) return <p>Employee profile not found.</p>;

  const details = [
    ["Employee ID", profile.id],
    ["Full Name", profile.full_name],
    ["Designation", profile.designation],
    ["Department", profile.department],
    ["Joining Date", profile.joining_date],
    ["Employment Status", profile.status],
  ];

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <p className="profile-subtitle">
        View your personal and employment details.
      </p>

      <div className="profile-card">
        {details.map(([label, value]) => (
          <div className="profile-row" key={label}>
            <span>{label}</span>
            <strong>{value ?? "Not available"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;
