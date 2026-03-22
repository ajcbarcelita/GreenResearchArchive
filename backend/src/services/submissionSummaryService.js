const getSummarizerBaseUrl = () =>
  (process.env.PDF_SUMMARIZER_BASE_URL || "http://localhost:8000").replace(/\/+$/, "")

const POLL_INTERVAL_MS = 15000
const POLL_TIMEOUT_MS = 1800000

export const summarizeSubmissionFileFromS3 = async ({ s3Key, submissionId }) => {
  if (!s3Key || !String(s3Key).trim()) {
    const error = new Error("No capstone paper file found for this submission.")
    error.statusCode = 400
    error.code = "NO_FILE"
    throw error
  }

  const baseUrl = getSummarizerBaseUrl()

  const triggerRes = await fetch(
    `${baseUrl}/api/summarize?s3_key=${encodeURIComponent(s3Key)}&submission_id=${encodeURIComponent(submissionId)}`,
    { method: "POST" }
  )

  if (!triggerRes.ok && triggerRes.status !== 202) {
    const text = await triggerRes.text()
    const error = new Error(`Summary service failed to start: ${text}`)
    error.statusCode = 502
    throw error
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

    const statusRes = await fetch(
      `${baseUrl}/api/summarize/status/${encodeURIComponent(submissionId)}`
    )

    if (!statusRes.ok) continue

    const job = await statusRes.json()

    if (job.status === "done" && job.summary) {
      return job.summary
    }

    if (job.status === "no_file") {
      const error = new Error("No capstone paper file found for this submission.")
      error.statusCode = 404
      error.code = "NO_FILE"
      throw error
    }

    if (job.status === "failed") {
      const error = new Error(`Summary generation failed: ${job.error}`)
      error.statusCode = 502
      throw error
    }
  }

  const error = new Error("Summary generation timed out after 30 minutes.")
  error.statusCode = 504
  throw error
}

export default { summarizeSubmissionFileFromS3 }