from google import genai
import os
import time
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemma-3-27b-it"

CHUNK_PROMPT = """You are a precise document analyst. Summarize the following section concisely, preserving key facts, figures, and conclusions:

{chunk}

Summary:"""

FINAL_PROMPT = """You have been given summaries of consecutive sections from a document titled "{title}".
Synthesize these into a single coherent summary covering the main topics, key findings, and conclusions.

Section summaries:
{summaries}

Final Summary:"""

def call_gemini_with_retry(prompt: str, retries: int = 5) -> str:
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt
            )
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                wait = 60 * (attempt + 1)  # 60s, 120s, 180s...
                print(f"  Rate limited. Waiting {wait}s before retry {attempt+1}/{retries}...")
                time.sleep(wait)
            else:
                raise
    raise Exception("Gemini API failed after max retries")

def summarize_chunks(chunks: list[str], doc_title: str = "Document") -> str:
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        print(f"  Summarizing chunk {i+1}/{len(chunks)}...")
        summary = call_gemini_with_retry(CHUNK_PROMPT.format(chunk=chunk))
        chunk_summaries.append(summary)
        time.sleep(4)  # ~15 RPM = 1 request per 4s

    combined = "\n\n---\n\n".join(
        f"Section {i+1}:\n{s}" for i, s in enumerate(chunk_summaries)
    )
    final = call_gemini_with_retry(
        FINAL_PROMPT.format(title=doc_title, summaries=combined)
    )
    return final.text