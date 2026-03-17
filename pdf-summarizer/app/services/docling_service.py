from docling.document_converter import DocumentConverter

converter = DocumentConverter()

def pdf_to_markdown(local_pdf_path: str) -> str:
    result = converter.convert(local_pdf_path)
    return result.document.export_to_markdown()