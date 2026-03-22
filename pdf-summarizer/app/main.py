from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()

from app.routes.summarizeRoutes import router

app = FastAPI()
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        log_level="info"
    )