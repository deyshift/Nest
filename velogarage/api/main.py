import os
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import strava

load_dotenv()

CLIENT_ID = os.environ["STRAVA_CLIENT_ID"]
CLIENT_SECRET = os.environ["STRAVA_CLIENT_SECRET"]

app = FastAPI(title="VeloGarage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class CodeExchangeRequest(BaseModel):
    code: str


class RefreshRequest(BaseModel):
    refresh_token: str


@app.post("/api/auth/strava")
async def auth_strava(body: CodeExchangeRequest):
    try:
        tokens = await strava.exchange_code(CLIENT_ID, CLIENT_SECRET, body.code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "expires_at": tokens["expires_at"],
        "athlete": tokens.get("athlete"),
    }


@app.post("/api/auth/refresh")
async def auth_refresh(body: RefreshRequest):
    try:
        tokens = await strava.refresh_token(CLIENT_ID, CLIENT_SECRET, body.refresh_token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "expires_at": tokens["expires_at"],
    }


@app.get("/api/strava/athlete")
async def get_athlete(authorization: str = Header(...)):
    access_token = authorization.removeprefix("Bearer ")
    try:
        return await strava.get_athlete(access_token)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/strava/activities")
async def get_activities(
    authorization: str = Header(...),
    after: int | None = Query(None),
    before: int | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=200),
):
    access_token = authorization.removeprefix("Bearer ")
    try:
        return await strava.get_activities(access_token, after, before, page, per_page)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
