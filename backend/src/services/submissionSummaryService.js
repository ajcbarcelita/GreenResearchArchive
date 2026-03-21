const getSummarizerBaseUrl = () => "http://localhost:8000"

const POLL_INTERVAL_MS = 15000   // check every 15 seconds
const POLL_TIMEOUT_MS  = 1800000 // give up after 30 minutes

export const summarizeSubmissionFileFromS3 = async ({ s3Key, submissionId }) => {
  if (!s3Key || !String(s3Key).trim()) {
    const error = new Error("S3 file key is required.")
    error.statusCode = 400
    throw error
  }

  const baseUrl = getSummarizerBaseUrl()

  // Step 1: Fire the job
  const triggerRes = await fetch(
    `${baseUrl}/api/summarize?s3_key=${encodeURIComponent(s3Key)}&submission_id=${encodeURIComponent(submissionId)}`,
    { method: "POST" }
  )
  // Returns immediately with 202 Accepted (not waiting for completion)

  if (!triggerRes.ok && triggerRes.status !== 202) {
    const text = await triggerRes.text()
    const error = new Error(`Summary service failed to start: ${text}`)
    error.statusCode = 502
    throw error
  }

  // Phase 2: Poll for results (check repeatedly)
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

    const statusRes = await fetch(
      `${baseUrl}/api/summarize/status/${encodeURIComponent(submissionId)}`
    )

    // Returns current job status: "processing", "done", or "failed"

    if (!statusRes.ok) continue

    const job = await statusRes.json()

    if (job.status === "done" && job.summary) {
      return job.summary
    }

    if (job.status === "failed") {
      const error = new Error(`Summary generation failed: ${job.error}`)
      error.statusCode = 502
      throw error
    }

    // still processing or queued — keep polling
  }

  const error = new Error("Summary generation timed out after 30 minutes.")
  error.statusCode = 504
  throw error
}

export default { summarizeSubmissionFileFromS3 }