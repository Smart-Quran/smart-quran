from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
import httpx

from services.quran_service import (
    get_surahs, get_surah, get_ayahs, get_ayah, search_quran,
    get_reciters, get_ayah_audio, get_surah_audio,
    get_tafseer_list, get_tafseer,
)
from middleware.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/quran", tags=["quran"])

CACHE_1H = {"Cache-Control": "public, max-age=3600"}
CACHE_5M = {"Cache-Control": "public, max-age=300"}


def _quran_error(e: httpx.HTTPStatusError):
    raise HTTPException(status_code=e.response.status_code, detail="Quran API error")


@router.get("/surahs")
async def surahs(_: User = Depends(get_current_user)):
    try:
        data = await get_surahs()
        return JSONResponse(content=data, headers=CACHE_1H)
    except httpx.HTTPStatusError as e:
        _quran_error(e)


@router.get("/surahs/{surah_id}")
async def surah(surah_id: int, _: User = Depends(get_current_user)):
    if not 1 <= surah_id <= 114:
        raise HTTPException(status_code=400, detail="Surah ID must be 1-114")
    try:
        data = await get_surah(surah_id)
        return JSONResponse(content=data, headers=CACHE_1H)
    except httpx.HTTPStatusError as e:
        _quran_error(e)


@router.get("/surahs/{surah_id}/ayahs")
async def ayahs(
    surah_id: int,
    page: int = Query(1, ge=1, le=20),
    translation_id: int = Query(131, ge=1),
    _: User = Depends(get_current_user),
):
    if not 1 <= surah_id <= 114:
        raise HTTPException(status_code=400, detail="Surah ID must be 1-114")
    try:
        data = await get_ayahs(surah_id, page, translation_id)
        return JSONResponse(content=data, headers=CACHE_5M)
    except httpx.HTTPStatusError as e:
        _quran_error(e)


@router.get("/ayahs/{verse_key}")
async def ayah(
    verse_key: str,
    translation_id: int = Query(131, ge=1),
    _: User = Depends(get_current_user),
):
    # Validate verse_key format: "1:1" to "114:286"
    parts = verse_key.split(":")
    if len(parts) != 2 or not all(p.isdigit() for p in parts):
        raise HTTPException(status_code=400, detail="Invalid verse key format (e.g. 2:255)")
    try:
        data = await get_ayah(verse_key, translation_id)
        return JSONResponse(content=data, headers=CACHE_5M)
    except httpx.HTTPStatusError as e:
        _quran_error(e)


@router.get("/search")
async def search(
    q: str = Query(..., min_length=2, max_length=100),
    page: int = Query(1, ge=1, le=50),
    translation_id: int = Query(131, ge=1),
    _: User = Depends(get_current_user),
):
    # Strip control characters and normalise whitespace
    q = " ".join(q.split()).strip()
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Query too short after sanitisation")
    try:
        data = await search_quran(q, page, translation_id)
        return JSONResponse(content=data, headers=CACHE_5M)
    except httpx.HTTPStatusError as e:
        _quran_error(e)


@router.get("/reciters")
async def reciters(_: User = Depends(get_current_user)):
    try:
        data = await get_reciters()
        return JSONResponse(content=data, headers=CACHE_1H)
    except httpx.HTTPStatusError as e:
        _quran_error(e)


@router.get("/audio/{recitation_id}/ayah/{verse_key}")
async def audio_ayah(
    recitation_id: int,
    verse_key: str,
    _: User = Depends(get_current_user),
):
    parts = verse_key.split(":")
    if len(parts) != 2 or not all(p.isdigit() for p in parts):
        raise HTTPException(status_code=400, detail="Invalid verse key")
    try:
        data = await get_ayah_audio(recitation_id, verse_key)
        return JSONResponse(content=data, headers=CACHE_1H)
    except httpx.HTTPStatusError as e:
        _quran_error(e)


@router.get("/audio/{recitation_id}/surah/{surah_id}")
async def audio_surah(
    recitation_id: int,
    surah_id: int,
    _: User = Depends(get_current_user),
):
    if not 1 <= surah_id <= 114:
        raise HTTPException(status_code=400, detail="Surah ID must be 1-114")
    try:
        data = await get_surah_audio(recitation_id, surah_id)
        return JSONResponse(content=data, headers=CACHE_1H)
    except httpx.HTTPStatusError as e:
        _quran_error(e)


@router.get("/tafseer")
async def tafseer_list(_: User = Depends(get_current_user)):
    try:
        data = await get_tafseer_list()
        return JSONResponse(content=data, headers=CACHE_1H)
    except httpx.HTTPStatusError as e:
        _quran_error(e)


@router.get("/tafseer/{tafseer_id}/{verse_key}")
async def tafseer(
    tafseer_id: int,
    verse_key: str,
    _: User = Depends(get_current_user),
):
    parts = verse_key.split(":")
    if len(parts) != 2 or not all(p.isdigit() for p in parts):
        raise HTTPException(status_code=400, detail="Invalid verse key")
    try:
        data = await get_tafseer(tafseer_id, verse_key)
        return JSONResponse(content=data, headers=CACHE_1H)
    except httpx.HTTPStatusError as e:
        _quran_error(e)
