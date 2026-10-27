const API_URL = "http://127.0.0.1:8000/documents";

function getAuthHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  if (!token) {
    throw new Error("Please log in first.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.detail || `Request failed (${response.status})`
    );
  }

  return response;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  await handleResponse(response);
  return response.json();
}

export async function getDocuments() {
  const response = await fetch(`${API_URL}/`, {
    headers: getAuthHeaders(),
  });

  await handleResponse(response);
  return response.json();
}

export async function downloadDocument(documentId, fileName) {
  const response = await fetch(
    `${API_URL}/${documentId}/download`,
    {
      headers: getAuthHeaders(),
    }
  );

  await handleResponse(response);

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}