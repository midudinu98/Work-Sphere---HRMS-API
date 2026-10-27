import { useEffect, useState } from "react";
import {uploadDocument,getDocuments,downloadDocument} from "../services/documentService";

export default function Documents() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDocuments() {
    setLoading(true);
    setError("");

    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Please select a document.");
      return;
    }

    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Only PDF, PNG, JPG and JPEG files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must not exceed 5 MB.");
      return;
    }

    setUploading(true);

    try {
      await uploadDocument(file);
      setFile(null);
      event.target.reset();
      setMessage("Document uploaded successfully.");
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(document) {
    setError("");

    try {
      await downloadDocument(document.id, document.file_name);
    } catch (err) {
      setError(err.message || "Document download failed.");
    }
  }

  return (
    <div style={styles.container}>
      <h1>Document Management</h1>
      <p style={styles.subtitle}>
        Upload, view and download your employee documents.
      </p>

      <section style={styles.card}>
        <h2>Upload Document</h2>

        <form onSubmit={handleUpload}>
          <label htmlFor="documentFile">Select document</label>

          <input
            id="documentFile"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(event) => setFile(event.target.files[0] || null)}
            style={styles.fileInput}
          />

          <p style={styles.hint}>
            Allowed formats: PDF, PNG, JPG, JPEG. Maximum size: 5 MB.
          </p>

          <button type="submit" disabled={uploading} style={styles.button}>
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </section>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      <section style={styles.card}>
        <h2>My Documents</h2>

        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>ID</th>
                  <th style={styles.cell}>File Name</th>
                  <th style={styles.cell}>Uploaded At</th>
                  <th style={styles.cell}>Action</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td style={styles.cell}>{document.id}</td>
                    <td style={styles.cell}>{document.file_name}</td>
                    <td style={styles.cell}>
                      {document.uploaded_at
                        ? new Date(document.uploaded_at).toLocaleString()
                        : "—"}
                    </td>
                    <td style={styles.cell}>
                      <button
                        type="button"
                        onClick={() => handleDownload(document)}
                        style={styles.downloadButton}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
    color: "#1f2937",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "24px",
  },
  card: {
    background: "#ffffff",
    padding: "24px",
    marginBottom: "24px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  fileInput: {
    display: "block",
    marginTop: "12px",
    marginBottom: "8px",
    maxWidth: "100%",
  },
  hint: {
    color: "#6b7280",
    fontSize: "13px",
  },
  button: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "12px",
  },
  downloadButton: {
    background: "#059669",
    color: "#ffffff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  success: {
    color: "#047857",
    background: "#ecfdf5",
    padding: "12px",
    borderRadius: "6px",
  },
  error: {
    color: "#b91c1c",
    background: "#fef2f2",
    padding: "12px",
    borderRadius: "6px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  cell: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
};