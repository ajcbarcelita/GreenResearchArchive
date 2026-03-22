from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from pypdf import PdfWriter, PdfReader
import tempfile
import os
import logging

logger = logging.getLogger("uvicorn.error")

PAGE_BATCH_SIZE = 20

def get_pdf_page_count(path: str) -> int:
    reader = PdfReader(path)
    return len(reader.pages)

def split_pdf_batch(input_path: str, start: int, end: int) -> str:
    reader = PdfReader(input_path)
    writer = PdfWriter()
    for i in range(start, min(end, len(reader.pages))):
        writer.add_page(reader.pages[i])
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    with open(tmp.name, "wb") as f:
        writer.write(f)
    return tmp.name

def make_converter():
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = False
    pipeline_options.do_table_structure = False
    pipeline_options.generate_page_images = False
    pipeline_options.generate_picture_images = False

    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
                backend=PyPdfiumDocumentBackend
            )
        }
    )

def pdf_to_markdown(local_pdf_path: str) -> str:
    total_pages = get_pdf_page_count(local_pdf_path)
    logger.info(f"PDF has {total_pages} pages, batching in groups of {PAGE_BATCH_SIZE}")

    all_markdown = []
    start = 0

    while start < total_pages:
        end = min(start + PAGE_BATCH_SIZE, total_pages)
        chunk_path = None
        try:
            logger.info(f"Converting pages {start+1}–{end}...")
            chunk_path = split_pdf_batch(local_pdf_path, start, end)
            converter = make_converter()  # fresh converter per batch to avoid memory buildup
            result = converter.convert(chunk_path)
            md = result.document.export_to_markdown()
            if md.strip():
                all_markdown.append(md)
        except Exception as e:
            logger.error(f"Failed on pages {start+1}–{end}: {e}")
        finally:
            if chunk_path and os.path.exists(chunk_path):
                os.unlink(chunk_path)

        start = end

    if not all_markdown:
        raise Exception("Could not convert any pages from the PDF")

    return "\n\n".join(all_markdown)
