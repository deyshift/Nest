import httpx
from typing import Any

STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_BASE = "https://www.strava.com/api/v3"


async def exchange_code(
    client_id: str, client_secret: str, code: str, redirect_uri: str | None = None
) -> dict[str, Any]:
    data: dict[str, str] = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
    }
    if redirect_uri:
        data["redirect_uri"] = redirect_uri
    async with httpx.AsyncClient() as client:
        resp = await client.post(STRAVA_TOKEN_URL, data=data)
        resp.raise_for_status()
        return resp.json()


async def refresh_token(client_id: str, client_secret: str, refresh_token: str) -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            STRAVA_TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        return resp.json()


async def get_athlete(access_token: str) -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{STRAVA_API_BASE}/athlete",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        return resp.json()


async def get_activities(
    access_token: str,
    after: int | None = None,
    before: int | None = None,
    page: int = 1,
    per_page: int = 100,
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"page": page, "per_page": per_page}
    if after:
        params["after"] = after
    if before:
        params["before"] = before

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{STRAVA_API_BASE}/athlete/activities",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
        )
        resp.raise_for_status()
        return resp.json()
