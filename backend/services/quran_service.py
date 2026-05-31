import httpx
from config import get_settings

settings = get_settings()

BASE = settings.quran_api_base
HEADERS = {"Accept": "application/json"}
TIMEOUT = 10.0


async def get_tafseer_list() -> dict:
    """Returns all available tafseer resources."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(f"{BASE}/resources/tafsirs", headers=HEADERS)
        r.raise_for_status()
        return r.json()


async def get_tafseer(tafseer_id: int, verse_key: str) -> dict:
    """Returns tafseer text for a single ayah."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(
            f"{BASE}/tafsirs/{tafseer_id}/by_ayah/{verse_key}",
            headers=HEADERS,
        )
        r.raise_for_status()
        return r.json()


async def get_reciters() -> dict:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(f"{BASE}/resources/recitations", headers=HEADERS)
        r.raise_for_status()
        return r.json()


async def get_ayah_audio(recitation_id: int, verse_key: str) -> dict:
    """Returns the audio file URL for a single ayah from a given reciter."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(
            f"{BASE}/recitations/{recitation_id}/by_ayah/{verse_key}",
            headers=HEADERS,
        )
        r.raise_for_status()
        return r.json()


async def get_surah_audio(recitation_id: int, surah_id: int) -> dict:
    """Returns all ayah audio URLs for a full surah."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(
            f"{BASE}/recitations/{recitation_id}/by_chapter/{surah_id}",
            headers=HEADERS,
        )
        r.raise_for_status()
        return r.json()


async def get_surahs() -> dict:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(f"{BASE}/chapters", headers=HEADERS)
        r.raise_for_status()
        return r.json()


async def get_surah(surah_id: int) -> dict:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(f"{BASE}/chapters/{surah_id}", headers=HEADERS)
        r.raise_for_status()
        return r.json()


async def get_ayahs(surah_id: int, page: int = 1, translation_id: int = 131) -> dict:
    """
    translation_id 131 = Sahih International (English)
    """
    params = {
        "translations": translation_id,
        "page": page,
        "per_page": 50,
        "fields": "text_uthmani,verse_key,verse_number",
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(
            f"{BASE}/verses/by_chapter/{surah_id}",
            params=params,
            headers=HEADERS,
        )
        r.raise_for_status()
        return r.json()


async def search_quran(q: str, page: int = 1, translation_id: int = 131) -> dict:
    """Keyword search via quran.com /search endpoint."""
    params = {
        "q": q,
        "page": page,
        "size": 20,
        "translations": translation_id,
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(f"{BASE}/search", params=params, headers=HEADERS)
        r.raise_for_status()
        return r.json()


async def get_ayah(verse_key: str, translation_id: int = 131) -> dict:
    params = {
        "translations": translation_id,
        "fields": "text_uthmani,verse_key,verse_number",
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(
            f"{BASE}/verses/by_key/{verse_key}",
            params=params,
            headers=HEADERS,
        )
        r.raise_for_status()
        return r.json()
