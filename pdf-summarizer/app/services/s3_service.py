import boto3
import tempfile
import os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

BUCKET = os.getenv("S3_BUCKET_NAME")

def list_pdfs(prefix: str = "") -> list[str]:
    paginator = s3.get_paginator("list_objects_v2")
    keys = []
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            if obj["Key"].endswith(".pdf"):
                keys.append(obj["Key"])
    return keys

def download_pdf(s3_key: str) -> str:
    suffix = os.path.basename(s3_key)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{suffix}")
    s3.download_fileobj(BUCKET, s3_key, tmp)
    tmp.close()
    return tmp.name