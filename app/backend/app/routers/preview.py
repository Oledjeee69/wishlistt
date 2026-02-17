# Backend: автозаполнение по URL — эндпоинт превью страницы
# Добавить в requirements.txt: httpx==0.27.0 beautifulsoup4==4.12.3

import json
import re
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, status
from bs4 import BeautifulSoup

router = APIRouter(prefix="/preview", tags=["preview"])

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


@router.get("")
def preview_url(url: str = Query(..., min_length=10)):
    """По ссылке возвращает title, image_url, price_cents (если удалось распознать)."""
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid URL")
    result = {"title": None, "image_url": None, "price_cents": None}
    try:
        with httpx.Client(follow_redirects=True, timeout=15.0, headers={"User-Agent": USER_AGENT}) as client:
            resp = client.get(url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

        # Open Graph
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"].strip()[:500]
        if not result["title"]:
            title_tag = soup.find("title")
            if title_tag and title_tag.string:
                result["title"] = title_tag.string.strip()[:500]

        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            img = og_image["content"].strip()
            if img.startswith("//"):
                img = "https:" + img
            result["image_url"] = img[:2000]

        # Цена: типичные селекторы и JSON-LD
        price_cents = _extract_price(soup, resp.text)
        if price_cents is not None:
            result["price_cents"] = price_cents

    except httpx.HTTPError:
        pass  # вернём пустой result — фронт покажет поля для ручного ввода
    except Exception:
        pass
    return result


def _extract_price(soup: BeautifulSoup, raw_html: str) -> Optional[int]:
    # JSON-LD Product
    for script in soup.find_all("script", type="application/ld+json"):
        if not script.string:
            continue
        try:
            data = json.loads(script.string)
            if isinstance(data, dict):
                data = [data]
            for item in data if isinstance(data, list) else [data]:
                offers = item.get("offers") or {}
                if isinstance(offers, list) and offers:
                    offers = offers[0]
                price = offers.get("price") if isinstance(offers, dict) else item.get("price")
                if price is not None:
                    p = float(price)
                    return int(round(p * 100))
        except Exception:
            continue

    # Мета-теги и data-атрибуты
    for meta in soup.find_all("meta", property=re.compile(r"product:price|price", re.I)):
        content = meta.get("content") or meta.get("value")
        if content:
            num = _parse_price_string(content)
            if num is not None:
                return num

    # Типичные классы/селекторы
    for sel in ["[itemprop=price]", ".price", "[data-price]", ".product-price", ".ProductPrice"]:
        el = soup.select_one(sel)
        if el:
            content = el.get("content") or el.get("data-price") or (el.get_text(strip=True) if el else None)
            if content:
                num = _parse_price_string(str(content))
                if num is not None:
                    return num

    # Поиск по тексту страницы: число и "руб" / "₽"
    match = re.search(r"(\d[\d\s]*[,.]?\d*)\s*(?:руб|₽|р\.)", raw_html, re.I)
    if match:
        num = _parse_price_string(match.group(1))
        if num is not None and 100 <= num <= 100_000_00:  # от 1 руб до 1М
            return num

    return None


def _parse_price_string(s: str) -> Optional[int]:
    if not s:
        return None
    s = re.sub(r"[\s\u00a0]", "", s)
    s = s.replace(",", ".")
    match = re.search(r"(\d+\.?\d*)", s)
    if not match:
        return None
    try:
        value = float(match.group(1))
        return int(round(value * 100))
    except (ValueError, TypeError):
        return None
