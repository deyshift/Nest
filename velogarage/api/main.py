import os
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import strava

load_dotenv()

CLIENT_ID = os.environ["STRAVA_CLIENT_ID"]
CLIENT_SECRET = os.environ["STRAVA_CLIENT_SECRET"]
# Public Railway URL — used to build the redirect_uri sent to Strava.
# e.g. https://velogarage-api.up.railway.app
API_PUBLIC_URL = os.environ["API_PUBLIC_URL"].rstrip("/")

app = FastAPI(title="VeloGarage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class RefreshRequest(BaseModel):
    refresh_token: str


@app.get("/api/auth/callback")
async def auth_callback(code: str = Query(...), error: str | None = Query(None)):
    """
    Strava redirects here after the user authorises the app.
    Set Authorization Callback Domain in strava.com/settings/api to the
    hostname of API_PUBLIC_URL (e.g. velogarage-api.up.railway.app).
    """
    if error:
        return RedirectResponse(f"velogarage://auth?error={error}")

    try:
        redirect_uri = f"{API_PUBLIC_URL}/api/auth/callback"
        tokens = await strava.exchange_code(CLIENT_ID, CLIENT_SECRET, code, redirect_uri)
    except Exception as e:
        return RedirectResponse(f"velogarage://auth?error=token_exchange_failed")

    athlete = tokens.get("athlete", {})
    params = (
        f"access_token={tokens['access_token']}"
        f"&refresh_token={tokens['refresh_token']}"
        f"&expires_at={tokens['expires_at']}"
        f"&athlete_id={athlete.get('id', '')}"
        f"&athlete_name={athlete.get('firstname', '')}"
        f"&athlete_photo={athlete.get('profile_medium', '')}"
    )
    # Deep-link back into the Expo app
    return RedirectResponse(f"velogarage://auth?{params}")


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
