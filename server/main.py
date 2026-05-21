"""
Samatva AI – FastAPI Backend
Replaces the previous Express.js server with identical REST API surface.
"""

import os
import time
from contextlib import asynccontextmanager
from typing import Optional

import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
import google.generativeai as genai

from database import get_connection, init_db

# ---------------------------------------------------------------------------
# Config / env
# ---------------------------------------------------------------------------
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

API_KEY    = os.getenv("VITE_GEMINI_API_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "samatva_ultra_secret_2026")
JWT_ALGO   = "HS256"
JWT_EXP_H  = 24          # token lifetime in hours
PORT       = int(os.getenv("PORT", 5000))

if not API_KEY:
    raise RuntimeError("FATAL: VITE_GEMINI_API_KEY is not set in .env")

genai.configure(api_key=API_KEY)

# ---------------------------------------------------------------------------
# DB connection (shared, thread-safe via WAL mode)
# ---------------------------------------------------------------------------
db = get_connection()

# ---------------------------------------------------------------------------
# Password hashing helpers  (direct bcrypt – replaces passlib which is
# incompatible with bcrypt>=4.1 on Python 3.13)
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

# ---------------------------------------------------------------------------
# In-memory audit cache  {cache_key -> result_dict}
# ---------------------------------------------------------------------------
audit_cache: dict[str, dict] = {}
CACHE_MAX = 1000

# ---------------------------------------------------------------------------
# Rate limiter (slowapi)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)

# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db(db)
    print(f"Samatva FastAPI backend running on http://localhost:{PORT}")
    yield
    db.close()

app = FastAPI(
    title="Samatva AI Backend",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Custom exception handler — return {"error": "..."} for frontend compat
# ---------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc):
    return JSONResponse(
        status_code=422,
        content={"error": "Invalid request data. Please check your input."},
    )

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------
def create_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = int(time.time()) + JWT_EXP_H * 3600
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")


def get_current_user(request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return decode_token(auth.split(" ", 1)[1])

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class RegisterBody(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = ""

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class AuditBody(BaseModel):
    attribute: str
    outcome: str
    score: float
    lowGroup: str
    lowRate: float
    highGroup: str
    highRate: float
    userId: Optional[int] = None

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "Samatva AI Backend Running", "version": "2.0.0", "framework": "FastAPI"}


# --- Health Check ---

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0", "timestamp": int(time.time())}


# --- Auth ---

@app.post("/api/auth/register")
@limiter.limit("10/15minutes")
async def register(request: Request, body: RegisterBody):
    hashed = hash_password(body.password)
    try:
        cur = db.execute(
            "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
            (body.email, hashed, body.name or ""),
        )
        db.commit()
        uid = cur.lastrowid
        token = create_token({"id": uid, "email": body.email})
        return {"token": token, "user": {"id": uid, "email": body.email, "name": body.name}}
    except Exception:
        raise HTTPException(status_code=400, detail="Email already exists or invalid data")


@app.post("/api/auth/login")
@limiter.limit("10/15minutes")
async def login(request: Request, body: LoginBody):
    row = db.execute("SELECT * FROM users WHERE email = ?", (body.email,)).fetchone()
    if not row or not verify_password(body.password, row["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"id": row["id"], "email": row["email"]})
    return {"token": token, "user": {"id": row["id"], "email": row["email"], "name": row["name"]}}


# --- Verify Token ---

@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    row = db.execute("SELECT id, email, name, created_at FROM users WHERE id = ?", (current_user["id"],)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": dict(row)}


# --- Audit ---

MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest"]


@app.post("/api/audit")
@limiter.limit("100/15minutes")
async def run_audit(request: Request, body: AuditBody):
    cache_key = f"{body.attribute}_{body.outcome}_{body.score}_{body.lowGroup}_{body.lowRate}_{body.highGroup}_{body.highRate}"

    # Cache hit
    if cache_key in audit_cache:
        print("[Backend] Audit Cache hit!")
        cached = audit_cache[cache_key]
        if body.userId:
            db.execute(
                "INSERT INTO audits (user_id, attribute, outcome, score, analysis, report, model_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (body.userId, body.attribute, body.outcome, body.score, cached["analysis"], cached["report"], cached["model"]),
            )
            db.commit()
        return cached

    result = None
    last_error = None

    for model_name in MODELS_TO_TRY:
        try:
            print(f"[Backend] Attempting model: {model_name}")
            model = genai.GenerativeModel(model_name)

            ethicist_prompt = (
                f'You are an expert AI Ethicist and Compliance Officer. '
                f'Audit context: Attribute="{body.attribute}", Outcome="{body.outcome}". '
                f'Results: Score={body.score}, LowGroup="{body.lowGroup}" ({body.lowRate}%), '
                f'HighGroup="{body.highGroup}" ({body.highRate}%). '
                f'Provide a concise, professional 2-3 sentence ethical analysis. No formatting.'
            )
            analysis_text = model.generate_content(ethicist_prompt).text

            report_prompt = (
                f'Generate a detailed AI Compliance Report for an audit of "{body.outcome}" based on "{body.attribute}". '
                f'Results: Fairness Score {body.score}, LowGroup={body.lowGroup} ({body.lowRate}%). '
                f'Sections: EXECUTIVE SUMMARY, REGULATORY ALIGNMENT (EU AI Act, US EEOC, India AI Act), RECOMMENDED MITIGATIONS. '
                f'No markdown headers, use ALL CAPS for section titles.'
            )
            report_text = model.generate_content(report_prompt).text

            result = {"analysis": analysis_text, "report": report_text, "model": model_name}

            # Update cache
            audit_cache[cache_key] = result
            if len(audit_cache) > CACHE_MAX:
                oldest = next(iter(audit_cache))
                del audit_cache[oldest]

            # Persist to DB
            if body.userId:
                db.execute(
                    "INSERT INTO audits (user_id, attribute, outcome, score, analysis, report, model_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (body.userId, body.attribute, body.outcome, body.score, analysis_text, report_text, model_name),
                )
                db.commit()

            print(f"[Backend] Success - model={model_name}, user={body.userId or 'Guest'}")
            break

        except Exception as e:
            print(f"[Backend] Model {model_name} failed: {e}")
            last_error = e

    if result:
        return result

    err_msg = str(last_error) if last_error else "All models failed"
    raise HTTPException(status_code=500, detail=err_msg)


# --- Audit History ---

@app.get("/api/audits/{user_id}")
def get_audits(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: Cannot access other user's audits")
    rows = db.execute(
        "SELECT * FROM audits WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    return [dict(r) for r in rows]


@app.delete("/api/audits/{audit_id}")
def delete_audit(audit_id: int, current_user: dict = Depends(get_current_user)):
    row = db.execute("SELECT * FROM audits WHERE id = ?", (audit_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Audit not found")
    if row["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.execute("DELETE FROM audits WHERE id = ?", (audit_id,))
    db.commit()
    return {"message": "Audit deleted successfully"}


# ---------------------------------------------------------------------------
# Entry-point  (python main.py)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
