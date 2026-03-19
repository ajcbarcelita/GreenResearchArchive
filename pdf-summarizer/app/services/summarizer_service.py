from openai import OpenAI
import os
import re
import time
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

SECONDS_BETWEEN_REQUESTS = 2

def rate_limited_generate(prompt: str, max_tokens: int = 500) -> str:
    time.sleep(SECONDS_BETWEEN_REQUESTS)
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a strict document summarizer that only restates what is explicitly written in the provided text."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=max_tokens,
        stream=False
    )
    return response.choices[0].message.content

def clean_text(text: str) -> str:
    text = re.sub(r'\*\*?(.*?)\*\*?', r'\1', text)
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = text.replace('\\n', ' ').strip()
    return text

CHUNK_PROMPT = """You are an academic research analyst. Extract only what is explicitly stated in the section below. Focus on capturing: research objectives, methodology, data, findings, tools used, and conclusions if present.

Rules:
- Only restate what is directly written, nothing more
- Do not infer, assume, or add external knowledge
- Plain prose only, no bullet points, markdown, or headers
- Skip anything not clearly explained in the text
- 3-4 sentences maximum

Document section:
{chunk}

Academic summary:"""

FINAL_PROMPT = """You are an academic research analyst. Using only the section summaries below from a research document titled "{title}", write a structured academic summary.

The summary must cover these elements if present in the summaries:
1. Research objective or problem being addressed
2. Methodology or approach used
3. Key findings, results, or outputs
4. Tools, frameworks, or technologies involved
5. Conclusions or recommendations

Rules:
- Only include what is explicitly present in the summaries below
- Do not add any external knowledge or interpretation
- Plain prose only, no bullet points, markdown, or headers
- Write as 2-3 cohesive paragraphs
- Do not introduce the summary or explain what you are doing

Section summaries:
{summaries}

Academic summary:"""

def summarize_chunks(chunks: list[str], doc_title: str = "Document") -> str:
    # Step 1: summarize each chunk
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        print(f"  Summarizing chunk {i+1}/{len(chunks)}...")
        chunk_summaries.append(clean_text(rate_limited_generate(
            CHUNK_PROMPT.format(chunk=chunk),
            max_tokens=250
        )))

    # Step 2: batch 50 at a time
    SUMMARY_BATCH_SIZE = 50
    batched_summaries = []
    for i in range(0, len(chunk_summaries), SUMMARY_BATCH_SIZE):
        batch = chunk_summaries[i:i + SUMMARY_BATCH_SIZE]
        combined = "\n\n".join(
            f"Section {i+j+1}: {s}" for j, s in enumerate(batch)
        )
        print(f"  Batching summaries {i+1}–{min(i+SUMMARY_BATCH_SIZE, len(chunk_summaries))}...")
        batched_summaries.append(clean_text(rate_limited_generate(
            FINAL_PROMPT.format(title=doc_title, summaries=combined),
            max_tokens=600
        )))

    if len(batched_summaries) == 1:
        return batched_summaries[0]

    # Step 3: final synthesis
    print(f"  Final synthesis across {len(batched_summaries)} batches...")
    combined_final = "\n\n".join(
        f"Part {i+1}: {s}" for i, s in enumerate(batched_summaries)
    )
    return clean_text(rate_limited_generate(
    FINAL_PROMPT.format(title=doc_title, summaries=combined_final),
    max_tokens=1200
    ))

## 250 - chunk summaries / 600 - batch summaries / 1200 - final synthesis