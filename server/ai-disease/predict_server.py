"""
Local plant-disease image classifier (no per-request API).
Uses the same MobileNet weights previously called via Hugging Face Inference:
  linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification

Downloads the model once into the Hugging Face cache, then runs fully offline.
"""
from __future__ import annotations

import io
import os
from contextlib import asynccontextmanager
from typing import Any

import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
# Older preprocessor_config uses MobileNetV2FeatureExtractor; newer transformers
# need the explicit MobileNetV2ImageProcessor class (AutoImageProcessor fails).
from transformers import MobileNetV2ForImageClassification, MobileNetV2ImageProcessor

MODEL_ID = os.environ.get(
    "LOCAL_DISEASE_MODEL_ID",
    "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
)
HOST = os.environ.get("LOCAL_DISEASE_HOST", "127.0.0.1")
PORT = int(os.environ.get("LOCAL_DISEASE_PORT", "8765"))

_processor = None
_model = None
_device = "cpu"


def load_model() -> None:
    global _processor, _model, _device
    if _model is not None:
        return
    print(f"[LocalDisease] Loading {MODEL_ID} (first run downloads weights)…", flush=True)
    _device = "cuda" if torch.cuda.is_available() else "cpu"
    # Prefer HF_API_TOKEN / HF_TOKEN if set (download rate limits only; inference stays local)
    token = os.environ.get("HF_TOKEN") or os.environ.get("HF_API_TOKEN") or None
    _processor = MobileNetV2ImageProcessor.from_pretrained(MODEL_ID, token=token)
    _model = MobileNetV2ForImageClassification.from_pretrained(MODEL_ID, token=token)
    _model.to(_device)
    _model.eval()
    print(f"[LocalDisease] Ready on {_device}", flush=True)


def predict_image_bytes(data: bytes) -> dict[str, Any]:
    load_model()
    assert _processor is not None and _model is not None

    try:
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as exc:
        raise ValueError(f"Invalid image: {exc}") from exc

    inputs = _processor(images=image, return_tensors="pt")
    inputs = {k: v.to(_device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
        score, idx = torch.max(probs, dim=0)
        label_id = int(idx.item())
        label = _model.config.id2label.get(label_id, str(label_id))

    return {
        "label": str(label).strip(),
        "score": float(score.item()),
        "model": MODEL_ID,
        "device": _device,
    }


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        load_model()
    except Exception as exc:
        print(f"[LocalDisease] Warmup failed (will retry on first request): {exc}", flush=True)
    yield


app = FastAPI(title="Mashtal Local Plant Disease Detector", lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "ok": True,
        "ready": _model is not None,
        "model": MODEL_ID,
        "device": _device,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    try:
        result = predict_image_bytes(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
    return JSONResponse(result)


if __name__ == "__main__":
    import uvicorn

    # Bind first; lifespan loads weights so /health is reachable during download
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
