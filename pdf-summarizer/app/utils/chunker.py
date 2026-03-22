from langchain_text_splitters import MarkdownTextSplitter

CHUNK_SIZE = 7000
CHUNK_OVERLAP = 300

def chunk_markdown(markdown: str) -> list[str]:
    splitter = MarkdownTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP
    )
    return splitter.split_text(markdown)