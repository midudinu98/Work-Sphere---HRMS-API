import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function EditEmployee() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    designation: "",
    department: "",
    joining_date: "",
    salary: "",
    status: "ACTIVE",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmployee() {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${API_URL}/employees/${employeeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load employee.");
        }

        setForm({
          full_name: data.full_name,
          designation: data.designation,
          department: data.department,
          joining_date: data.joining_date,
          salary: data.salary,
          status: data.status,
        });
      } catch (err) {
        setError(err.message || "Unable to load employee.");
      } finally {
        setLoading(false);
      }
    }

    loadEmployee();
  }, [employeeId]);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/employees/${employeeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            salary: Number(form.salary),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || "Failed to update employee.")
        );
      }

      alert("Employee updated successfully!");
      navigate("/employees");
    } catch (err) {
      setError(err.message || "Unable to update employee.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading employee...</p>;

  return (
    <main>
      <h1>Edit Employee</h1>

      {error && <p role="alert">{error}</p>}

      {!error && (
        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
            minLength={2}
          />

          <label>Designation</label>
          <input
            name="designation"
            value={form.designation}
            onChange={handleChange}
            required
            minLength={2}
          />

          <label>Department</label>
          <input
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            minLength={2}
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

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/employees")}
          >
            Cancel
          </button>
        </form>
      )}
    </main>
  );
}

export default EditEmployee;
