import { useEffect, useState } from "react";
import "./UserManagement.css";

const API_URL = "http://127.0.0.1:8000";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });

  const token = localStorage.getItem("access_token");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/admin/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in again."
            : response.status === 403
            ? "Admin access is required."
            : "Unable to load users."
        );
      }

      setUsers(await response.json());
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleFormChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function createUser(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/admin/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to create user. Check the entered details."
        );
      }

      setMessage("User created successfully.");
      setForm({
        username: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
      });
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    }
  }

  async function updateUser(userId, changes) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changes),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to update user."
        );
      }

      setMessage("User updated successfully.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    }
  }

  async function deleteUser(user) {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${user.username}?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to delete user."
        );
      }

      setMessage("User deleted successfully.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    }
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div>
          <h1>User Management</h1>
          <p>Manage users, roles and account status.</p>
        </div>

        <button
          className="add-user-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {message && <div className="um-success">{message}</div>}
      {error && <div className="um-error">{error}</div>}

      {showForm && (
        <form className="user-form" onSubmit={createUser}>
          <h2>Create User</h2>

          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            value={form.username}
            onChange={handleFormChange}
            minLength={3}
            maxLength={50}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleFormChange}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleFormChange}
            minLength={8}
            maxLength={128}
            required
          />

          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleFormChange}
          >
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="HR">HR</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <button type="submit" className="add-user-btn">
            Create User
          </button>
        </form>
      )}

      <div className="user-table-card">
        <h2>Registered Users</h2>

        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>

                    <td>
                      <select
                        aria-label={`Role for ${user.username}`}
                        value={user.role}
                        onChange={(event) =>
                          updateUser(user.id, {
                            role: event.target.value,
                          })
                        }
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="HR">HR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td>
                      <span
                        className={
                          user.is_active ? "um-active" : "um-inactive"
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="um-actions">
                        <button
                          className="um-status-btn"
                          onClick={() =>
                            updateUser(user.id, {
                              is_active: !user.is_active,
                            })
                          }
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          className="um-delete-btn"
                          onClick={() => deleteUser(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
