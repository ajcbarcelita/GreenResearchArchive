import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")

CHUNK_PROMPT = """You are a precise document analyst. Summarize the following section concisely, preserving key facts, figures, and conclusions:

{chunk}

Summary:"""

FINAL_PROMPT = """You have been given summaries of consecutive sections from a document titled "{title}".
Synthesize these into a single coherent summary covering the main topics, key findings, and conclusions.

Section summaries:
{summaries}

Final Summary:"""

def summarize_chunks(chunks: list[str], doc_title: str = "Document") -> str:
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        print(f"  Summarizing chunk {i+1}/{len(chunks)}...")
        response = model.generate_content(CHUNK_PROMPT.format(chunk=chunk))
        chunk_summaries.append(response.text)

    combined = "\n\n---\n\n".join(
        f"Section {i+1}:\n{s}" for i, s in enumerate(chunk_summaries)
    )
    final = model.generate_content(
        FINAL_PROMPT.format(title=doc_title, summaries=combined)
    )
    return final.text