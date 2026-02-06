#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Publog Event Monitoring Bot - Fixed Version
- GitHub Secrets 매핑 최적화
- 환경 변수 로드 로직 강화
"""

import os
import json
import re
import time
import sys
from pathlib import Path
from typing import List, Dict, Set
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import holidays
import pytz
from dotenv import load_dotenv

# .env 파일 로드 (로컬 테스트용)
load_dotenv()

# Windows 콘솔 인코딩 문제 해결
def safe_print(text: str = "") -> None:
    try:
        print(text)
    except UnicodeEncodeError:
        safe_text = text.encode('ascii', 'replace').decode('ascii')
        print(safe_text)

# [수정] 설정: 환경 변수 이름을 GitHub Secret과 100% 일치시킴
TARGET_URL = "https://m.publog.co.kr/service_s7/event/list.s2.asp"
STATE_FILE = Path("data/events.json")

# GitHub Actions 환경 변수 우선 로드, 없으면 .env 로드
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL") or os.getenv("DISCORD_WEBHOOK_URL")

MAX_NEW_EVENTS = 10
REQUEST_DELAY = 1.0

def get_korean_time() -> datetime:
    kst = pytz.timezone('Asia/Seoul')
    return datetime.now(kst)

def is_korean_workday() -> bool:
    """한국 평일 여부 확인 (테스트 시 이 함수를 건너뛰려면 main을 수정하세요)"""
    today = get_korean_time()
    year, weekday = today.year, today.weekday()
    
    safe_print(f"[INFO] 현재 한국 시간(KST): {today.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 주말 체크
    if weekday >= 5:
        safe_print(f"[SKIP] ❌ 주말입니다.")
        return False
    
    # 공휴일 체크
    kr_holidays = holidays.KR(years=year)
    if today.date() in kr_holidays:
        safe_print(f"[SKIP] ❌ 공휴일({kr_holidays.get(today.date())})입니다.")
        return False
        
    return True

def load_state() -> Dict[str, str]:
    if not STATE_FILE.exists(): return {}
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("events", {})
    except: return {}

def save_state(events: Dict[str, str]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    kst_time = get_korean_time()
    data = {
        "events": events,
        "last_updated": kst_time.strftime("%Y-%m-%d %H:%M:%S KST"),
        "total_count": len(events)
    }
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def fetch_event_list() -> List[str]:
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = requests.get(TARGET_URL, headers=headers, timeout=30)
        soup = BeautifulSoup(response.text, "lxml")
        pattern = re.compile(r'/service_s7/event/[^"\']*m_evt\.asp[^"\']*')
        links = soup.find_all("a", href=pattern)
        urls = [f"https://m.publog.co.kr{l.get('href')}" if l.get('href').startswith("/") else l.get('href') for l in links]
        return list(dict.fromkeys(urls))
    except Exception as e:
        safe_print(f"[ERROR] Fetch failed: {e}")
        return []

def fetch_event_title(url: str) -> str:
    try:
        response = requests.get(url, timeout=20)
        soup = BeautifulSoup(response.text, "lxml")
        og_title = soup.find("meta", property="og:title")
        return og_title["content"].strip() if og_title else url.split("/")[-1]
    except: return url

def send_discord_notification(events: List[Dict[str, str]], notification_type: str = "new") -> bool:
    # [검증] 웹훅 URL이 비어있는지 마지막으로 체크
    if not DISCORD_WEBHOOK_URL:
        safe_print("[CRITICAL] DISCORD_WEBHOOK_URL이 설정되지 않았습니다. GitHub Secrets를 확인하세요.")
        return False
    
    # 알림 색상 및 아이콘 설정
    config = {
        "new": (0x5865F2, "🎉", "신규 이벤트"),
        "modified": (0xFFA500, "🔄", "이벤트 변경"),
        "none": (0x57F287, "✅", "상태 체크 완료")
    }
    color, emoji, title_text = config.get(notification_type, config["new"])
    
    fields = [{"name": f"{emoji} {idx}. {e['title']}", "value": f"[링크 바로가기]({e['url']})", "inline": False} for idx, e in enumerate(events, 1)]
    
    payload = {
        "embeds": [{
            "title": f"{emoji} {title_text}",
            "color": color,
            "fields": fields[:10], # 디스코드 제한
            "footer": {"text": f"KST {get_korean_time().strftime('%Y-%m-%d %H:%M')}"}
        }]
    }
    
    try:
        res = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
        res.raise_for_status()
        return True
    except Exception as e:
        safe_print(f"[ERROR] Discord 전송 실패: {e}")
        return False

def main():
    safe_print("=" * 40)
    safe_print("🚀 Publog Bot 실행 시작")
    
    # [핵심 수정] 환경 변수 값 존재 여부 즉시 확인
    if not DISCORD_WEBHOOK_URL:
        safe_print("❌ 에러: DISCORD_WEBHOOK_URL을 찾을 수 없습니다.")
        sys.exit(1)

    # 평일 검증 로직 (필요 시 주석 처리하여 강제 실행 가능)
    if not is_korean_workday():
        safe_print("😴 오늘은 쉬는 날입니다. 실행을 종료합니다.")
        # return  # 주말에도 테스트하려면 이 줄을 주석 처리하세요.

    # 실행 로직
    prev_events = load_state()
    current_urls = fetch_event_list()
    
    if not current_urls:
        safe_print("📭 진행 중인 이벤트를 찾지 못했습니다.")
        return

    new_urls = [url for url in current_urls if url not in prev_events]
    new_event_details = []
    
    for url in new_urls[:MAX_NEW_EVENTS]:
        title = fetch_event_title(url)
        new_event_details.append({"title": title, "url": url})
        time.sleep(REQUEST_DELAY)

    # 알림 전송
    if new_event_details:
        send_discord_notification(new_event_details, "new")
    else:
        safe_print("✨ 새로운 이벤트가 없습니다.")
        # 정기 체크 알림 (선택 사항)
        # send_discord_notification([{"title": "감시 중", "url": TARGET_URL}], "none")

    # 상태 업데이트 및 저장
    updated_state = {url: fetch_event_title(url) if url in new_urls else prev_events.get(url) for url in current_urls}
    save_state(updated_state)
    safe_print("✅ 작업 완료")

if __name__ == "__main__":
    main()
