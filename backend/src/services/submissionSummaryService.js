const getSummarizerBaseUrl = () =>
  (process.env.PDF_SUMMARIZER_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

const getRequestTimeoutMs = () => {
  const raw = Number(process.env.PDF_SUMMARIZER_TIMEOUT_MS || 180000);
  if (!Number.isFinite(raw) || raw <= 0) return 180000;
  return raw;
};

const parseErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    return payload?.detail || payload?.message || response.statusText;
  } catch {
    return response.statusText;
  }
};

export const summarizeSubmissionFileFromS3 = async ({ s3Key }) => {
  if (!s3Key || !String(s3Key).trim()) {
    const error = new Error("S3 file key is required for summary generation.");
    error.statusCode = 400;
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, getRequestTimeoutMs());

  try {
    const baseUrl = getSummarizerBaseUrl();
    const endpoint = `${baseUrl}/api/summarize?s3_key=${encodeURIComponent(String(s3Key).trim())}`;

    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      const error = new Error(`Summary service failed: ${message}`);
      error.statusCode = response.status === 404 ? 404 : 502;
      throw error;
    }

    const payload = await response.json();
    const firstResult = Array.isArray(payload) ? payload[0] : null;
    const summary = String(firstResult?.summary || "").trim();

    if (!summary) {
      const error = new Error("Summary service returned an empty summary.");
      error.statusCode = 502;
      throw error;
    }

    return summary;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Summary generation timed out.");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    if (error?.statusCode) {
      throw error;
    }

    const integrationError = new Error(
      `Failed to call summary service: ${error?.message || "Unknown error"}`,
    );
    integrationError.statusCode = 502;
    throw integrationError;
  } finally {
    clearTimeout(timeoutId);
  }
};

export default {
  summarizeSubmissionFileFromS3,
};
