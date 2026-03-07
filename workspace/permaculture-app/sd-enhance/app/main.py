"""
FastAPI sidecar for the Permaculture Sketch Enhancer.

Runs as an internal API — no frontend. The Node.js app on port 3002
calls this service during generation.

Endpoints
---------
POST /enhance     — accepts sketch image, returns enhanced PNG
GET  /progress    — returns current pipeline progress as JSON
GET  /health      — readiness probe
"""

import asyncio
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import yaml
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from .pipeline import EnhancePipeline

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
CONFIG_PATH = BASE_DIR / "config.yaml"

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Permaculture Sketch Enhancer — API")
pipeline: Optional[EnhancePipeline] = None


@app.on_event("startup")
async def startup():
    global pipeline

    UPLOAD_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)

    with open(CONFIG_PATH) as f:
        config = yaml.safe_load(f)

    pipeline = EnhancePipeline(config)

    # Load models in a background thread so uvicorn can start accepting
    # the /health endpoint while models download.
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, pipeline.load)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    ready = pipeline is not None and pipeline.ready
    status = "ready" if ready else "loading"
    return {"status": status, "progress": pipeline.progress if pipeline else {}}


# ---------------------------------------------------------------------------
# Progress (JSON, not SSE — easier for Node.js to poll)
# ---------------------------------------------------------------------------
@app.get("/progress")
async def progress():
    if not pipeline:
        return {"phase": "loading", "step": 0, "total": 0, "message": "Initializing..."}
    return pipeline.progress


# ---------------------------------------------------------------------------
# POST /enhance — main endpoint
# ---------------------------------------------------------------------------
@app.post("/enhance")
async def enhance(
    file: UploadFile = File(...),
    strength: Optional[float] = Form(None),
    steps: Optional[int] = Form(None),
    preprocessor: Optional[str] = Form(None),
):
    if not pipeline or not pipeline.ready:
        raise HTTPException(status_code=503, detail="Pipeline is still loading models. Try again shortly.")

    if preprocessor and preprocessor not in ("lineart", "scribble_hed"):
        raise HTTPException(status_code=422, detail="preprocessor must be 'lineart' or 'scribble_hed'")

    if strength is not None and not (0.0 <= strength <= 1.0):
        raise HTTPException(status_code=422, detail="strength must be between 0.0 and 1.0")

    if steps is not None and not (1 <= steps <= 100):
        raise HTTPException(status_code=422, detail="steps must be between 1 and 100")

    # Save upload
    ext = Path(file.filename).suffix if file.filename else ".png"
    upload_path = UPLOAD_DIR / f"{uuid.uuid4().hex}{ext}"
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    upload_path.write_bytes(content)

    # Signal that a job is starting (for progress pollers)
    pipeline._set_progress("pending", 0, 0, "Starting...")

    # Build overrides dict
    overrides: dict = {}
    if strength is not None:
        overrides["strength"] = strength
    if steps is not None:
        overrides["steps"] = steps
    if preprocessor is not None:
        overrides["preprocessor"] = preprocessor

    # Run pipeline in threadpool (CPU-bound)
    loop = asyncio.get_event_loop()
    output_path = await loop.run_in_executor(
        None, pipeline.enhance, str(upload_path), overrides
    )

    # Clean up upload
    upload_path.unlink(missing_ok=True)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    return FileResponse(
        output_path,
        media_type="image/png",
        filename=f"enhanced_{ts}.png",
    )
