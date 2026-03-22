from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.s3_service import download_pdf
from app.services.docling_service import pdf_to_markdown
from app.services.summarizer_service import summarize_chunks
from app.utils.chunker import chunk_markdown
import os
import logging

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

jobs = {}

def run_summary_job(key: str, submission_id: str):
    jobs[submission_id] = {"status": "processing", "summary": None, "error": None}
    local_path = None
    try:
        logger.info(f"[JOB START] submission_id={submission_id} s3_key={key}")

        local_path = download_pdf(key)
        logger.info(f"[DOWNLOAD OK] submission_id={submission_id} local_path={local_path}")

        markdown = pdf_to_markdown(local_path)
        logger.info(f"[DOCLING OK] submission_id={submission_id} markdown_length={len(markdown)}")

        chunks = chunk_markdown(markdown)
        logger.info(f"[CHUNKED] submission_id={submission_id} chunk_count={len(chunks)}")

        title = os.path.basename(key).replace(".pdf", "")
        logger.info(f"[SUMMARIZING] submission_id={submission_id} title={title} chunks={len(chunks)}")

        summary = summarize_chunks(chunks, doc_title=title)
        logger.info(f"[SUMMARY OK] submission_id={submission_id} summary_length={len(summary)}")

        jobs[submission_id] = {"status": "done", "summary": summary, "error": None}
        logger.info(f"[JOB DONE] submission_id={submission_id}")

    except Exception as e:
        jobs[submission_id] = {"status": "failed", "summary": None, "error": str(e)}
        logger.error(f"[JOB FAILED] submission_id={submission_id} error={str(e)}", exc_info=True)
    finally:
        if local_path and os.path.exists(local_path):
            os.unlink(local_path)
            logger.info(f"[CLEANUP] temp file deleted for submission_id={submission_id}")

@router.post("/summarize", status_code=202)
async def summarize_pdfs(
    background_tasks: BackgroundTasks,
    s3_key: str = "",
    submission_id: str = "",
    s3_prefix: str = ""
):
    logger.info(f"[REQUEST RECEIVED] POST /summarize submission_id={submission_id!r} s3_key={s3_key!r}")

    if not s3_key or not s3_key.strip():
        logger.warning(f"[REJECTED] No s3_key provided for submission_id={submission_id!r}")
        if submission_id:
            jobs[submission_id] = {"status": "no_file", "summary": None, "error": "No S3 key provided"}
        raise HTTPException(status_code=400, detail="s3_key is required")

    if not submission_id:
        logger.warning("[REJECTED] No submission_id provided")
        raise HTTPException(status_code=400, detail="submission_id is required")

    if submission_id in jobs and jobs[submission_id]["status"] == "processing":
        logger.info(f"[DUPLICATE] Job already processing for submission_id={submission_id}")
        return {"status": "processing", "message": "Already in progress"}

    logger.info(f"[JOB QUEUED] submission_id={submission_id} s3_key={s3_key}")
    background_tasks.add_task(run_summary_job, s3_key, submission_id)
    jobs[submission_id] = {"status": "queued", "summary": None, "error": None}

    return {"status": "queued", "submission_id": submission_id}

@router.get("/summarize/status/{submission_id}")
async def get_summary_status(submission_id: str):
    logger.info(f"[STATUS POLL] submission_id={submission_id}")
    job = jobs.get(submission_id)
    if not job:
        logger.warning(f"[STATUS NOT FOUND] submission_id={submission_id}")
        raise HTTPException(status_code=404, detail="No job found for this submission")
    logger.info(f"[STATUS RESPONSE] submission_id={submission_id} status={job['status']}")
    return {"submission_id": submission_id, **job}