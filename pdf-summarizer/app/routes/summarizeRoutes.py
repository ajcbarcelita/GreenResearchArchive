from fastapi import APIRouter, HTTPException
from app.services.s3_service import list_pdfs, download_pdf
from app.services.docling_service import pdf_to_markdown
from app.services.summarizer_service import summarize_chunks
from app.utils.chunker import chunk_markdown
import os

router = APIRouter()

def summarize_pdf_key(key: str):
    local_path = None
    try:
        local_path = download_pdf(key)
        markdown = pdf_to_markdown(local_path)
        chunks = chunk_markdown(markdown)
        title = os.path.basename(key).replace(".pdf", "")
        summary = summarize_chunks(chunks, doc_title=title)
        return {
            "file": key,
            "summary": summary,
            "chunk_count": len(chunks)
        }
    finally:
        if local_path and os.path.exists(local_path):
            os.unlink(local_path)

@router.post("/summarize")
async def summarize_pdfs(s3_prefix: str = "", s3_key: str = ""):
    if s3_key:
        pdf_keys = [s3_key]
    else:
        pdf_keys = list_pdfs(prefix=s3_prefix)

    if not pdf_keys:
        raise HTTPException(status_code=404, detail="No PDFs found in S3")

    results = []
    for key in pdf_keys:
        try:
            results.append(summarize_pdf_key(key))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed on {key}: {str(e)}")

    return results