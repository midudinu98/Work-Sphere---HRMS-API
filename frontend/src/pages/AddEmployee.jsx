import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function AddEmployee() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    user_id: "",
    full_name: "",
    designation: "",
    department: "",
    joining_date: "",
    salary: "",
    status: "ACTIVE",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/employees/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          user_id: Number(form.user_id),
          salary: Number(form.salary),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || "Failed to add employee")
        );
      }

      alert("Employee added successfully!");
      navigate("/employees");
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Add Employee</h1>

      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>User ID</label>
        <input
          type="number"
          name="user_id"
          value={form.user_id}
          onChange={handleChange}
          min="1"
          required
        />

        <label>Full Name</label>
        <input
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          required
          minLength="2"
        />

        <label>Designation</label>
        <input
          name="designation"
          value={form.designation}
          onChange={handleChange}
          required
          minLength="2"
        />

        <label>Department</label>
        <input
          name="department"
          value={form.department}
          onChange={handleChange}
          required
          minLength="2"
        />

        <label>Joining Date</label>
        <input
          type="date"
          name="joining_date"
          value={form.joining_date}
          onChange={handleChange}
          required
        />

        <label>Salary</label>
        <input
          type="number"
          name="salary"
          value={form.salary}
          onChange={handleChange}
          min="0.01"
          step="0.01"
          required
        />

        <label>Status</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Employee"}
        </button>
      </form>
    </main>
  );
}

export default AddEmployee;
