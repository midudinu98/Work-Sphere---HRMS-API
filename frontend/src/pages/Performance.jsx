import { useEffect, useState } from "react";
import "./Performance.css";

const API_URL = "http://127.0.0.1:8000/performance/";

function Performance() {
  const [reviews, setReviews] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [reviewPeriod, setReviewPeriod] = useState("");
  const [rating, setRating] = useState("5");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const loadReviews = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Unable to load reviews (${response.status})`);
      }

      const data = await response.json();
      setReviews(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      loadReviews();
    } else {
      setMessage("Please log in to view performance reviews.");
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Please log in first.");
      return;
    }

    if (
      !employeeId ||
      !reviewPeriod.trim() ||
      !feedback.trim()
    ) {
      setMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employee_id: Number(employeeId),
          review_period: reviewPeriod.trim(),
          rating: Number(rating),
          feedback: feedback.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to submit performance review."
        );
      }

      setMessage("Performance review added successfully!");
      setEmployeeId("");
      setReviewPeriod("");
      setRating("5");
      setFeedback("");

      await loadReviews();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="performance-page">
      <div className="performance-header">
        <div>
          <h1>Performance Management</h1>
          <p>Track employee ratings, reviews, and feedback.</p>
        </div>
      </div>

      {message && (
        <div className="performance-message" role="status">
          {message}
        </div>
      )}

      <section className="performance-card">
        <h2>Add Performance Review</h2>

        <form onSubmit={handleSubmit}>
          <div className="performance-form-grid">
            <div className="performance-field">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                id="employeeId"
                type="number"
                min="1"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter employee ID"
                required
              />
            </div>

            <div className="performance-field">
              <label htmlFor="reviewPeriod">Review Period</label>
              <input
                id="reviewPeriod"
                type="text"
                value={reviewPeriod}
                onChange={(e) => setReviewPeriod(e.target.value)}
                placeholder="Example: Q3 2026"
                maxLength={50}
                required
              />
            </div>

            <div className="performance-field">
              <label htmlFor="rating">Performance Rating</label>
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                required
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very Good</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="1">1 - Unsatisfactory</option>
              </select>
            </div>

            <div className="performance-field">
              <label htmlFor="feedback">Feedback</label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter performance feedback"
                rows={4}
                required
              />
            </div>
          </div>

          <button
            className="performance-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </section>

      <section className="performance-card">
        <h2>Performance Review History</h2>

        <div className="performance-table-wrapper">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Review ID</th>
                <th>Employee ID</th>
                <th>Review Period</th>
                <th>Rating</th>
                <th>Feedback</th>
                <th>Created At</th>
              </tr>
            </thead>

            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.id}</td>
                  <td>{review.employee_id}</td>
                  <td>{review.review_period}</td>
                  <td>
                    <span className="performance-rating">
                      {review.rating}/5
                    </span>
                  </td>
                  <td>{review.feedback}</td>
                  <td>
                    {review.created_at
                      ? new Date(review.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}

              {reviews.length === 0 && (
                <tr>
                  <td colSpan="6" className="performance-empty">
                    No performance reviews found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="performance-refresh"
          onClick={loadReviews}
        >
          Refresh History
        </button>
      </section>
    </div>
  );
}

export default Performance;
