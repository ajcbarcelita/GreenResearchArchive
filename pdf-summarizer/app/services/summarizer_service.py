from google import genai
import os
import re
import time
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Rate limiter
SECONDS_PER_REQUEST = 7
_last_request_time = 0.0

def rate_limited_generate(prompt: str) -> str:
    global _last_request_time
    elapsed = time.time() - _last_request_time
    wait = SECONDS_PER_REQUEST - elapsed
    if wait > 0:
        print(f"  Rate limit: waiting {wait:.1f}s...")
        time.sleep(wait)
    response = client.models.generate_content(
        model="gemma-3-27b-it",
        contents=prompt
    )
    _last_request_time = time.time()
    return response.text

def clean_text(text: str) -> str:
    text = re.sub(r'\*\*?(.*?)\*\*?', r'\1', text)
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = text.replace('\\n', ' ').strip()
    return text

CHUNK_PROMPT = """You are a strict document summarizer. Your only job is to extract and restate what is explicitly written in the document section below.

Rules you must follow without exception:
- Only include information that is directly stated in the text
- Do not infer, assume, or add any external knowledge
- Do not use bullet points, markdown, asterisks, or headers
- Write in plain, flowing prose only
- If a topic is mentioned but not explained in the text, skip it entirely
- Keep it concise

Document section:
{chunk}

Plain text summary of only what is stated above:"""

FINAL_PROMPT = """You are a strict document summarizer. Below are summaries of sections from a document titled "{title}".

Rules you must follow without exception:
- Only include information present in the section summaries below
- Do not add any knowledge, context, or interpretation not found in the summaries
- Do not use bullet points, markdown, asterisks, or headers
- Write in plain, flowing prose as a single cohesive paragraph or two
- Do not introduce the document or explain what you are doing, just write the summary
- If something is unclear or missing from the summaries, skip it

Section summaries:
{summaries}

Plain text final summary:"""

def summarize_chunks(chunks: list[str], doc_title: str = "Document") -> str:
    # Step 1: summarize each chunk
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        print(f"  Summarizing chunk {i+1}/{len(chunks)}...")
        chunk_summaries.append(clean_text(rate_limited_generate(
            CHUNK_PROMPT.format(chunk=chunk)
        )))

    # Cool down before moving to next step
    print("  Step 1 complete. Cooling down 60s before batching...")
    time.sleep(60)

    # Step 2: batch the chunk summaries (50 at a time) into mid-level summaries
    SUMMARY_BATCH_SIZE = 50
    batched_summaries = []
    for i in range(0, len(chunk_summaries), SUMMARY_BATCH_SIZE):
        batch = chunk_summaries[i:i + SUMMARY_BATCH_SIZE]
        combined = "\n\n".join(
            f"Section {i+j+1}: {s}" for j, s in enumerate(batch)
        )
        print(f"  Batching summaries {i+1}–{min(i+SUMMARY_BATCH_SIZE, len(chunk_summaries))}...")
        batched_summaries.append(clean_text(rate_limited_generate(
            FINAL_PROMPT.format(title=doc_title, summaries=combined)
        )))
        time.sleep(60)

    # Cool down before final synthesis
    print("  Step 2 complete. Cooling down 60s before final synthesis...")
    time.sleep(60)

    # Step 3: if only one batch, we're done
    if len(batched_summaries) == 1:
        return batched_summaries[0]

    # Step 4: final synthesis across batched summaries
    print(f"  Final synthesis across {len(batched_summaries)} batches...")
    combined_final = "\n\n".join(
        f"Part {i+1}: {s}" for i, s in enumerate(batched_summaries)
    )
    return clean_text(rate_limited_generate(
        FINAL_PROMPT.format(title=doc_title, summaries=combined_final)
    ))