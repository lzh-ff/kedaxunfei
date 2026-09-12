"""Independent learning service; not required by the public GitHub Pages demo.

Run from the repository root: python -m uvicorn server.app:app --host 127.0.0.1 --port 8000
No external model is configured in this delivery. Scoring is the real pinned
DeepTutor 1.6.7 function. Storage remains client-local in the published demo.
"""
from fastapi import FastAPI
from pydantic import BaseModel, Field, StrictBool, ConfigDict
from server.vendor.deeptutor_mastery import compute_mastery

app = FastAPI(title="职教自适应学习助手 · 学习服务", version="2.0.0")

class MasteryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    correctness: list[StrictBool] = Field(default_factory=list, max_length=300)

@app.get("/api/health")
def health():
    return {"status": "ok", "algorithm": "DeepTutor 1.6.7 compute_mastery", "model_connected": False}

@app.post("/api/mastery/evaluate")
def evaluate(body: MasteryRequest):
    return {"mastery": compute_mastery(body.correctness), "evidence_count": len(body.correctness), "algorithm": "recency_weighted_accuracy"}
