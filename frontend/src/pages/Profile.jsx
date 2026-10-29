import { useEffect, useState } from "react";
import "./Profile.css";

const API_URL = "http://127.0.0.1:8000";

const defaultPreferences = {
  email_notifications: true,
  attendance_notifications: true,
  leave_notifications: true,
  payroll_notifications: true,
};

function Profile() {
  const [employee, setEmployee] = useState(null);
  const [account, setAccount] = useState(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [preferences, setPreferences] = useState(defaultPreferences);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("access_token");

  async function apiRequest(path, options = {}) {
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

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        if (!token) {
          throw new Error("Please log in to view your profile.");
        }

        const [accountData, employeeResult, preferenceData] =
          await Promise.all([
            apiRequest("/profile-settings/profile"),
            apiRequest("/employees/me/profile").catch(() => null),
            apiRequest("/profile-settings/notifications"),
          ]);

        if (cancelled) return;

        setAccount(accountData);
        setUsername(accountData.username || "");
        setEmail(accountData.email || "");
        setEmployee(employeeResult);
        setPreferences({
          ...defaultPreferences,
          ...preferenceData,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load profile settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function showMessage(text) {
    setError("");
    setMessage(text);
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSavingProfile(true);

    try {
      const updated = await apiRequest("/profile-settings/profile", {
        method: "PUT",
        body: JSON.stringify({ username, email }),
      });

      setAccount(updated);
      setUsername(updated.username);
      setEmail(updated.email);
      showMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must differ from the current password.");
      return;
    }

    setSavingPassword(true);

    try {
      const result = await apiRequest(
        "/profile-settings/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage(result.message || "Password changed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handlePreferencesSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSavingPreferences(true);

    try {
      const updated = await apiRequest(
        "/profile-settings/notifications",
        {
          method: "PUT",
          body: JSON.stringify(preferences),
        }
      );

      setPreferences({
        ...defaultPreferences,
        ...updated,
      });

      showMessage("Notification preferences saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPreferences(false);
    }
  }

  function updatePreference(field, checked) {
    setPreferences((previous) => ({
      ...previous,
      [field]: checked,
    }));
  }

  if (loading) {
    return <p className="profile-loading">Loading profile settings...</p>;
  }

  if (error && !account) {
    return <p className="profile-error">{error}</p>;
  }

  const employeeDetails = employee
    ? [
        ["Employee ID", employee.id],
        ["Full Name", employee.full_name],
        ["Designation", employee.designation],
        ["Department", employee.department],
        ["Joining Date", employee.joining_date],
        ["Employment Status", employee.status],
      ]
    : [];

  return (
    <div className="profile-container">
      <h2>Profile & Settings</h2>
      <p className="profile-subtitle">
        Manage your account, password, and notification preferences.
      </p>

      {error && <p className="profile-error">{error}</p>}
      {message && <p className="profile-success">{message}</p>}

      <section className="profile-section">
        <h3>Account Profile</h3>

        <form onSubmit={handleProfileSubmit}>
          <label htmlFor="profile-username">Username</label>
          <input
            id="profile-username"
            type="text"
            minLength={3}
            maxLength={50}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <div className="profile-card">
          <div className="profile-row">
            <span>Account Role</span>
            <strong>{account?.role || "Not available"}</strong>
          </div>
          <div className="profile-row">
            <span>Account Status</span>
            <strong>
              {account?.is_active ? "Active" : "Inactive"}
            </strong>
          </div>
        </div>
      </section>

      {employee && (
        <section className="profile-section">
          <h3>Employment Details</h3>
          <p className="profile-subtitle">
            These details are managed by HR or Admin.
          </p>

          <div className="profile-card">
            {employeeDetails.map(([label, value]) => (
              <div className="profile-row" key={label}>
                <span>{label}</span>
                <strong>{value ?? "Not available"}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="profile-section">
        <h3>Change Password</h3>

        <form onSubmit={handlePasswordSubmit}>
          <label htmlFor="current-password">Current Password</label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            maxLength={128}
            required
          />

          <label htmlFor="new-password">New Password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            required
          />

          <label htmlFor="confirm-password">Confirm New Password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            required
          />

          <button type="submit" disabled={savingPassword}>
            {savingPassword ? "Updating..." : "Change Password"}
          </button>
        </form>
      </section>

      <section className="profile-section">
        <h3>Notification Preferences</h3>
        <p className="profile-subtitle">
          Choose which types of notifications you prefer to receive.
        </p>

        <form onSubmit={handlePreferencesSubmit}>
          {[
            ["email_notifications", "Email notifications"],
            ["attendance_notifications", "Attendance notifications"],
            ["leave_notifications", "Leave notifications"],
            ["payroll_notifications", "Payroll notifications"],
          ].map(([field, label]) => (
            <label className="preference-row" key={field}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(preferences[field])}
                onChange={(event) =>
                  updatePreference(field, event.target.checked)
                }
              />
            </label>
          ))}

          <button type="submit" disabled={savingPreferences}>
            {savingPreferences ? "Saving..." : "Save Preferences"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Profile;
