from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.s3_service import download_pdf
from app.services.docling_service import pdf_to_markdown
from app.services.summarizer_service import summarize_chunks
from app.utils.chunker import chunk_markdown
import os
import time
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory job store { submission_id: { status, summary, error } }
jobs = {}

def run_summary_job(key: str, submission_id: str):
    jobs[submission_id] = {"status": "processing", "summary": None, "error": None}
    local_path = None
    try:
        local_path = download_pdf(key)
        markdown = pdf_to_markdown(local_path)
        chunks = chunk_markdown(markdown)
        title = os.path.basename(key).replace(".pdf", "")
        summary = summarize_chunks(chunks, doc_title=title)
        jobs[submission_id] = {"status": "done", "summary": summary, "error": None}
        logger.info(f"Job done for submission {submission_id}")
    except Exception as e:
        jobs[submission_id] = {"status": "failed", "summary": None, "error": str(e)}
        logger.error(f"Job failed for submission {submission_id}: {e}")
    finally:
        if local_path and os.path.exists(local_path):
            os.unlink(local_path)

# Return 202 to accept so that Node does not timeout
@router.post("/summarize", status_code=202)
async def summarize_pdfs(
    background_tasks: BackgroundTasks,
    s3_key: str = "",
    submission_id: str = "",
    s3_prefix: str = ""
):
    if not s3_key:
        raise HTTPException(status_code=400, detail="s3_key is required")

    if submission_id in jobs and jobs[submission_id]["status"] == "processing":
        return {"status": "processing", "message": "Already in progress"}

    background_tasks.add_task(run_summary_job, s3_key, submission_id)
    jobs[submission_id] = {"status": "queued", "summary": None, "error": None}

    return {"status": "queued", "submission_id": submission_id}

@router.get("/summarize/status/{submission_id}")
async def get_summary_status(submission_id: str):
    job = jobs.get(submission_id)
    if not job:
        raise HTTPException(status_code=404, detail="No job found for this submission")
    return {"submission_id": submission_id, **job}