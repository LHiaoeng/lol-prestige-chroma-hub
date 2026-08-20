#!/usr/bin/env python3
"""Fetch a public League of Legends China official news article by URL or docid."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen

API_URL = "https://apps.game.qq.com/cmc/zmMcnContentInfo"
DETAIL_URL = "https://lol.qq.com/news/detail.shtml?docid={docid}"


class ContentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.images: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "img":
            return
        src = dict(attrs).get("src")
        if src:
            self.images.append(src)

    def text(self) -> str:
        return "\n".join(
            line for line in (part.strip() for part in self.parts) if line
        )


def parse_docid(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme and parsed.netloc:
        docid = parse_qs(parsed.query).get("docid", [""])[0]
    else:
        docid = value
    if not re.fullmatch(r"\d+", docid):
        raise ValueError("请输入包含数字 docid 的 lol.qq.com 新闻链接，或直接提供 docid。")
    return docid


def fetch(docid: str, timeout: int) -> dict[str, object]:
    query = urlencode({"r0": "jsonp", "source": "web_pc", "type": "0", "docid": docid})
    request = Request(
        f"{API_URL}?{query}",
        headers={"User-Agent": "Mozilla/5.0 (compatible; Codex lol-qq-news skill)"},
    )
    with urlopen(request, timeout=timeout) as response:
        raw = response.read().decode("utf-8")

    match = re.fullmatch(r"\s*[^(]+\((.*)\);?\s*", raw, re.DOTALL)
    if not match:
        raise ValueError("内容接口未返回可解析的 JSONP 响应。")
    payload = json.loads(match.group(1))
    if payload.get("status") != 1 or not isinstance(payload.get("data", {}).get("result"), dict):
        raise ValueError(f"内容接口未成功返回文章：{payload.get('msg', '未知错误')}")

    article = payload["data"]["result"]
    content_html = html.unescape(str(article.get("sContent", "")))
    parser = ContentParser()
    parser.feed(content_html)
    parser.close()

    return {
        "source_url": DETAIL_URL.format(docid=docid),
        "docid": str(article.get("iDocID", docid)),
        "title": article.get("sTitle") or None,
        "published_at": article.get("sCreated") or None,
        "author": article.get("sAuthor") or None,
        "cover_image_url": article.get("sIMG") or None,
        "content_html": content_html,
        "content_text": parser.text(),
        "images": parser.images,
    }


def main() -> int:
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("url_or_docid", help="lol.qq.com 文章链接或数字 docid")
    cli.add_argument("--timeout", type=int, default=30, help="请求超时秒数（默认：30）")
    args = cli.parse_args()
    try:
        output = json.dumps(fetch(parse_docid(args.url_or_docid), args.timeout), ensure_ascii=False, indent=2)
        sys.stdout.buffer.write((output + "\n").encode("utf-8"))
    except (ValueError, HTTPError, URLError, TimeoutError) as exc:
        print(f"获取失败：{exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
