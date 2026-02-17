# Backend: автозаполнение по URL — эндпоинт превью страницы
# Добавить в requirements.txt: httpx==0.27.0 beautifulsoup4==4.12.3

import json
import re
from typing import Optional
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException, Query, status
from bs4 import BeautifulSoup

router = APIRouter(prefix="/preview", tags=["preview"])

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg")
IMAGE_CONTENT_TYPES = ("image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/svg+xml")


def _is_direct_image_url(url: str) -> bool:
    """Проверяет, похожа ли ссылка на прямой URL картинки."""
    lower = url.lower().split("?")[0]
    return lower.endswith(IMAGE_EXTENSIONS)


@router.get("")
def preview_url(url: str = Query(..., min_length=10)):
    """По ссылке возвращает title, image_url, price_cents. Поддерживает:
    - Ссылку на страницу товара (извлекает og:image, title, цену)
    - Прямую ссылку на картинку (jpg, png и т.д.) — использует как image_url
    """
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid URL")
    result = {"title": None, "image_url": None, "price_cents": None}

    # Если это прямая ссылка на картинку — сразу возвращаем её как image_url
    if _is_direct_image_url(url):
        result["image_url"] = url[:2000]
        return result

    # Проверка по Content-Type (HEAD-запрос) — некоторые CDN не имеют расширения в URL
    try:
        with httpx.Client(follow_redirects=True, timeout=10.0, headers={"User-Agent": USER_AGENT}) as client:
            head = client.head(url)
            ct = head.headers.get("content-type", "").lower().split(";")[0].strip()
            if any(t in ct for t in IMAGE_CONTENT_TYPES):
                result["image_url"] = url[:2000]
                return result
    except Exception:
        pass

    # Иначе считаем, что это страница товара — парсим HTML
    try:
        with httpx.Client(follow_redirects=True, timeout=15.0, headers={"User-Agent": USER_AGENT}) as client:
            resp = client.get(url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

        # Open Graph — заголовок
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"].strip()[:500]
        if not result["title"]:
            title_tag = soup.find("title")
            if title_tag and title_tag.string:
                result["title"] = title_tag.string.strip()[:500]

        # Картинка: og:image, twitter:image, JSON-LD, link rel
        result["image_url"] = _extract_image(soup, url)

        # Цена
        price_cents = _extract_price(soup, resp.text)
        if price_cents is not None:
            result["price_cents"] = price_cents

    except httpx.HTTPError:
        pass
    except Exception:
        pass
    return result


def _extract_image(soup: BeautifulSoup, base_url: str) -> Optional[str]:
    """Извлекает URL картинки из страницы товара."""
    # Open Graph
    for prop in ("og:image", "og:image:url", "twitter:image"):
        meta = soup.find("meta", attrs={"property": prop}) or soup.find("meta", attrs={"name": prop})
        if meta and meta.get("content"):
            img = meta["content"].strip()
            if img.startswith("//"):
                img = "https:" + img
            elif img.startswith("/"):
                parsed = urlparse(base_url)
                img = f"{parsed.scheme}://{parsed.netloc}{img}"
            return img[:2000] if img.startswith("http") else None

    # JSON-LD Product image
    for script in soup.find_all("script", type="application/ld+json"):
        if not script.string:
            continue
        try:
            data = json.loads(script.string)
            items = [data] if isinstance(data, dict) else (data if isinstance(data, list) else [])
            for item in items:
                img = item.get("image")
                if img:
                    url_str = img if isinstance(img, str) else (img.get("url") if isinstance(img, dict) else (img[0] if isinstance(img, list) else None))
                    if url_str and url_str.startswith("http"):
                        return url_str[:2000]
        except Exception:
            continue

    # link rel="image_src"
    link = soup.find("link", rel="image_src")
    if link and link.get("href"):
        href = link["href"].strip()
        if href.startswith("//"):
            href = "https:" + href
        if href.startswith("http"):
            return href[:2000]

    return None


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
