#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Publog Event Monitoring Bot
모바일 이벤트 목록에서 신규 이벤트를 감지하여 Discord로 알림
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

# .env 파일 로드 (로컬 테스트용, GitHub Actions에서는 무시됨)
load_dotenv()


# Windows 콘솔 인코딩 문제 해결
def safe_print(text: str = "") -> None:
    """Windows 콘솔에서 안전하게 출력 (이모지 포함)"""
    try:
        print(text)
    except UnicodeEncodeError:
        # 이모지를 ASCII로 대체
        safe_text = text.encode('ascii', 'replace').decode('ascii')
        print(safe_text)


# 설정
TARGET_URL = "https://m.publog.co.kr/service_s7/event/list.s2.asp"
STATE_FILE = Path("data/events.json")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
MAX_NEW_EVENTS = 10
REQUEST_DELAY = 1.0  # 요청 간 대기 시간(초)


def get_korean_time() -> datetime:
    """
    정확한 한국 시간(KST) 반환
    서버가 어느 시간대에 있든 항상 한국 시간을 반환
    """
    kst = pytz.timezone('Asia/Seoul')
    return datetime.now(kst)


def is_korean_workday() -> bool:
    """
    한국 평일(공휴일 제외) 여부 확인 - 네이버 달력 기준
    1. 한국 시간대(KST) 명시적 사용
    2. 요일 체크 (월~금)
    3. 한국 공휴일 라이브러리 체크 (대체공휴일 자동 포함)
    
    참고: holidays 라이브러리는 대체공휴일을 자동으로 처리합니다.
    """
    # 한국 시간 가져오기 (KST)
    today = get_korean_time()
    year = today.year
    month = today.month
    day = today.day
    weekday = today.weekday()  # 0=월요일, 6=일요일
    
    safe_print(f"[INFO] ========== 한국 날짜 확인 ==========")
    safe_print(f"[INFO] 현재 한국 시간(KST): {today.strftime('%Y년 %m월 %d일 %H:%M:%S (%A)')}")
    safe_print(f"[INFO] 요일: {['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'][weekday]}")
    
    # 1단계: 주말 체크 (토요일=5, 일요일=6)
    if weekday >= 5:
        safe_print(f"[SKIP] ❌ 주말입니다 - {['토요일', '일요일'][weekday-5]}")
        safe_print(f"[INFO] ========================================")
        return False
    
    # 2단계: 한국 공휴일 라이브러리 체크 (대체공휴일 자동 포함)
    kr_holidays = holidays.KR(years=year)
    if today.date() in kr_holidays:
        holiday_name = kr_holidays.get(today.date())
        safe_print(f"[SKIP] ❌ 공휴일입니다: {holiday_name}")
        safe_print(f"[INFO] ========================================")
        return False
    
    # 3단계: 추가 임시공휴일 (정부 발표 시 여기에 추가)
    # 예: 2026년 임시공휴일이 발표되면 아래 형식으로 추가
    # manual_holidays = {
    #     (2026, 4, 10): "제22대 국회의원 선거일",  # 예시
    # }
    # if (year, month, day) in manual_holidays:
    #     holiday_name = manual_holidays[(year, month, day)]
    #     safe_print(f"[SKIP] ❌ 임시공휴일입니다: {holiday_name}")
    #     safe_print(f"[INFO] ========================================")
    #     return False
    
    # 최종 검증 - 모든 체크 통과
    safe_print(f"[PASS] ✅ 평일입니다 (근무일)")
    safe_print(f"[PASS] ✅ 요일: {weekday} (0=월, 1=화, 2=수, 3=목, 4=금)")
    safe_print(f"[PASS] ✅ 공휴일 아님")
    safe_print(f"[INFO] ========================================")
    return True


def load_state() -> Dict[str, str]:
    """이전 실행에서 저장된 이벤트 정보 로드 (URL: 제목)"""
    if not STATE_FILE.exists():
        safe_print(f"[INFO] State file not found: {STATE_FILE}")
        return {}
    
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            
            # 구버전 호환성 (URL 리스트만 있는 경우)
            if "event_urls" in data and isinstance(data["event_urls"], list):
                safe_print(f"[INFO] Converting old state format to new format")
                events = {url: "" for url in data["event_urls"]}
            else:
                events = data.get("events", {})
            
            safe_print(f"[INFO] Loaded {len(events)} existing events from state")
            return events
    except Exception as e:
        safe_print(f"[ERROR] Failed to load state: {e}")
        return {}


def save_state(events: Dict[str, str]) -> None:
    """현재 이벤트 정보를 파일에 저장 (URL: 제목)"""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # 한국 시간으로 타임스탬프 저장
        kst_time = get_korean_time()
        data = {
            "events": events,
            "last_updated": kst_time.strftime("%Y-%m-%d %H:%M:%S KST"),
            "total_count": len(events)
        }
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        safe_print(f"[INFO] Saved {len(events)} events to state (KST: {kst_time.strftime('%Y-%m-%d %H:%M:%S')})")
    except Exception as e:
        safe_print(f"[ERROR] Failed to save state: {e}")


def fetch_event_list() -> List[str]:
    """이벤트 목록 페이지에서 이벤트 상세 URL 추출 (재시도 포함)"""
    safe_print(f"[INFO] Fetching event list from: {TARGET_URL}")
    
    max_retries = 3
    retry_delay = 5
    
    for attempt in range(1, max_retries + 1):
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            response = requests.get(TARGET_URL, headers=headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "lxml")
            
            # m_evt.asp 패턴의 URL 추출
            pattern = re.compile(r'/service_s7/event/[^"\']*m_evt\.asp[^"\']*')
            links = soup.find_all("a", href=pattern)
            
            event_urls = []
            for link in links:
                href = link.get("href", "")
                if href:
                    # 상대 경로를 절대 경로로 변환
                    if href.startswith("/"):
                        full_url = f"https://m.publog.co.kr{href}"
                    else:
                        full_url = href
                    event_urls.append(full_url)
            
            # 중복 제거
            event_urls = list(dict.fromkeys(event_urls))
            safe_print(f"[INFO] Found {len(event_urls)} event URLs")
            return event_urls
            
        except requests.exceptions.RequestException as e:
            safe_print(f"[ERROR] Attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                wait_time = retry_delay * attempt
                safe_print(f"[RETRY] Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                safe_print(f"[FAILED] Failed to fetch event list after {max_retries} attempts")
                # Discord 에러 알림 전송
                send_error_notification(
                    error_type="이벤트 목록 가져오기 실패",
                    error_message=f"{max_retries}회 재시도 후에도 퍼블로그 서버 접속 실패",
                    details=f"URL: {TARGET_URL}\n오류: {str(e)}"
                )
                return []
        except Exception as e:
            safe_print(f"[ERROR] Unexpected error: {e}")
            send_error_notification(
                error_type="예상치 못한 오류",
                error_message="이벤트 목록 가져오기 중 예상치 못한 오류 발생",
                details=str(e)
            )
            return []
    
    return []


def fetch_event_title(url: str) -> str:
    """이벤트 상세 페이지에서 제목 추출"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "lxml")
        
        # 우선순위: og:title → title 태그 → URL fallback
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"].strip()
        
        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            return title_tag.string.strip()
        
        # fallback: URL에서 추출
        return url.split("/")[-1]
        
    except Exception as e:
        safe_print(f"[WARNING] Failed to fetch title for {url}: {e}")
        return url


def send_discord_notification(events: List[Dict[str, str]], notification_type: str = "new") -> None:
    """
    Discord Webhook으로 이벤트 알림 전송 (재시도 포함)
    notification_type: "new" (신규) 또는 "modified" (변경)
    """
    if not DISCORD_WEBHOOK_URL:
        safe_print("[ERROR] DISCORD_WEBHOOK_URL environment variable not set")
        sys.exit(1)
    
    if not events:
        safe_print("[INFO] No events to send")
        return
    
    max_retries = 3
    retry_delay = 5  # 초
    failed_batches = []  # 실패한 배치 추적
    
    # 알림 타입별 설정
    if notification_type == "modified":
        title_emoji = "🔄"
        title_text = "퍼블로그 이벤트 변경 알림"
        description = f"총 {len(events)}개의 이벤트가 수정되었습니다."
        color = 0xFFA500  # Orange
        event_emoji = "🔄"
    elif notification_type == "none":
        title_emoji = "✅"
        title_text = "퍼블로그 이벤트 체크 완료"
        description = "새로운 이벤트가 없습니다."
        color = 0x57F287  # Green
        event_emoji = "✅"
    else:  # new
        title_emoji = "📢"
        title_text = "퍼블로그 신규 이벤트 알림"
        description = f"총 {len(events)}개의 신규 이벤트가 발견되었습니다."
        color = 0x5865F2  # Discord Blurple
        event_emoji = "🎉"
    
    # 10개 단위로 분할 전송
    for i in range(0, len(events), 10):
        batch = events[i:i+10]
        batch_num = i//10 + 1
        batch_success = False
        
        fields = []
        for idx, event in enumerate(batch, start=i+1):
            if notification_type == "modified" and "old_title" in event:
                # 변경된 이벤트: 이전/이후 제목 표시
                field_value = f"**이전:** {event['old_title']}\n**변경:** {event['title']}\n[이벤트 보기]({event['url']})"
            else:
                # 신규 이벤트: 제목만 표시
                field_value = f"[이벤트 보기]({event['url']})"
            
            fields.append({
                "name": f"{event_emoji} {idx}. {event['title']}",
                "value": field_value,
                "inline": False
            })
        
        # 한국 시간으로 타임스탬프 생성
        kst_time = get_korean_time()
        
        embed = {
            "title": f"{title_emoji} {title_text}",
            "description": description,
            "color": color,
            "fields": fields,
            "footer": {
                "text": f"Publog Event Bot • KST {kst_time.strftime('%Y-%m-%d %H:%M')}"
            },
            "timestamp": kst_time.isoformat()
        }
        
        payload = {"embeds": [embed]}
        
        # 재시도 로직
        for attempt in range(1, max_retries + 1):
            try:
                safe_print(f"  [Attempt {attempt}/{max_retries}] Sending batch {batch_num}...")
                response = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
                response.raise_for_status()
                safe_print(f"  [SUCCESS] Batch {batch_num} sent successfully")
                batch_success = True
                break  # 성공 시 재시도 루프 탈출
                
            except requests.exceptions.HTTPError as e:
                status_code = e.response.status_code if e.response else "Unknown"
                safe_print(f"  [ERROR] HTTP {status_code}: {e}")
                
                if attempt < max_retries:
                    wait_time = retry_delay * attempt  # 지수 백오프
                    safe_print(f"  [RETRY] Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    safe_print(f"  [FAILED] Batch {batch_num} failed after {max_retries} attempts")
                    failed_batches.append((batch_num, f"HTTP {status_code}"))
                    
            except requests.exceptions.Timeout:
                safe_print(f"  [ERROR] Request timeout")
                if attempt < max_retries:
                    wait_time = retry_delay * attempt
                    safe_print(f"  [RETRY] Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    safe_print(f"  [FAILED] Batch {batch_num} timed out after {max_retries} attempts")
                    failed_batches.append((batch_num, "Timeout"))
                    
            except Exception as e:
                safe_print(f"  [ERROR] Unexpected error: {e}")
                if attempt < max_retries:
                    wait_time = retry_delay * attempt
                    safe_print(f"  [RETRY] Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    safe_print(f"  [FAILED] Batch {batch_num} failed after {max_retries} attempts")
                    failed_batches.append((batch_num, str(e)))
    
    # 실패한 배치가 있으면 에러 알림 전송
    if failed_batches:
        failure_details = "\n".join([f"Batch {num}: {error}" for num, error in failed_batches])
        send_error_notification(
            error_type="Discord 알림 전송 실패",
            error_message=f"{len(failed_batches)}개 배치 전송 실패 (총 {len(events)}개 이벤트 중)",
            details=failure_details
        )
        return False  # 전송 실패
        
    return True  # 전송 성공


def send_error_notification(error_type: str, error_message: str, details: str = "") -> None:
    """실패 시 Discord로 에러 알림 전송"""
    if not DISCORD_WEBHOOK_URL:
        safe_print("[ERROR] Cannot send error notification - DISCORD_WEBHOOK_URL not set")
        sys.exit(1)
        return
    
    try:
        # 한국 시간으로 타임스탬프 생성
        kst_time = get_korean_time()
        
        embed = {
            "title": "⚠️ Publog Event Bot - 실행 실패 알림",
            "description": f"봇 실행 중 오류가 발생했습니다.",
            "color": 0xFF0000,  # Red
            "fields": [
                {
                    "name": "오류 유형",
                    "value": error_type,
                    "inline": False
                },
                {
                    "name": "오류 메시지",
                    "value": error_message,
                    "inline": False
                }
            ],
            "footer": {
                "text": f"Publog Event Bot Error Alert • KST {kst_time.strftime('%Y-%m-%d %H:%M')}"
            },
            "timestamp": kst_time.isoformat()
        }
        
        if details:
            embed["fields"].append({
                "name": "상세 정보",
                "value": details[:1000],  # Discord 필드 길이 제한
                "inline": False
            })
        
        payload = {"embeds": [embed]}
        response = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
        response.raise_for_status()
        safe_print("[INFO] Error notification sent to Discord")
        
    except Exception as e:
        safe_print(f"[ERROR] Failed to send error notification: {e}")


def main():
    """메인 실행 함수"""
    safe_print("=" * 60)
    safe_print("Publog Event Bot - Starting")
    safe_print("=" * 60)
    
    # 0. 한국 평일(공휴일 제외) 다중 검증
    safe_print("\n[STEP 0] Korean Workday Verification")
    safe_print("-" * 60)
    if not is_korean_workday():
        safe_print("-" * 60)
        safe_print("[RESULT] Execution skipped - Not a Korean workday")
        safe_print("=" * 60)
        safe_print("Publog Event Bot - Skipped")
        safe_print("=" * 60)
        return
    safe_print("-" * 60)
    safe_print("[RESULT] Workday verification passed - Proceeding")
    safe_print()
    
    # 1. 이전 상태 로드 (URL: 제목 딕셔너리)
    safe_print("[STEP 1] Loading previous state")
    previous_events = load_state()
    
    # 2. 현재 이벤트 목록 가져오기
    safe_print("\n[STEP 2] Fetching current event list")
    current_urls = fetch_event_list()
    
    if not current_urls:
        safe_print("[WARNING] No events found or failed to fetch")
        sys.exit(1)
    
    # 3. 신규 및 변경 이벤트 감지
    safe_print(f"\n[STEP 3] Detecting new and modified events")
    new_urls = [url for url in current_urls if url not in previous_events]
    existing_urls = [url for url in current_urls if url in previous_events]
    
    safe_print(f"[INFO] Found {len(new_urls)} new events")
    safe_print(f"[INFO] Found {len(existing_urls)} existing events to check")
    
    # 4. 신규 이벤트 상세 정보 수집
    new_events = []
    if new_urls:
        safe_print(f"\n[STEP 4] Collecting new event details (max {MAX_NEW_EVENTS})")
        for idx, url in enumerate(new_urls[:MAX_NEW_EVENTS], 1):
            safe_print(f"  [{idx}/{min(len(new_urls), MAX_NEW_EVENTS)}] Fetching: {url}")
            title = fetch_event_title(url)
            new_events.append({"title": title, "url": url, "type": "new"})
            time.sleep(REQUEST_DELAY)
    
    # 5. 기존 이벤트 변경 감지
    modified_events = []
    if existing_urls:
        safe_print(f"\n[STEP 5] Checking for modified events")
        for idx, url in enumerate(existing_urls, 1):
            old_title = previous_events.get(url, "")
            if not old_title:  # 구버전 호환성
                continue
            
            safe_print(f"  [{idx}/{len(existing_urls)}] Checking: {url}")
            current_title = fetch_event_title(url)
            
            if current_title != old_title:
                safe_print(f"  [MODIFIED] Title changed!")
                safe_print(f"    Old: {old_title}")
                safe_print(f"    New: {current_title}")
                modified_events.append({
                    "title": current_title,
                    "url": url,
                    "type": "modified",
                    "old_title": old_title
                })
            
            time.sleep(REQUEST_DELAY)
    
    # 6. 현재 상태 저장 (모든 이벤트의 최신 제목 저장)
    safe_print(f"\n[STEP 6] Collecting all current event titles")
    current_events = {}
    for url in current_urls:
        # 신규 이벤트
        for event in new_events:
            if event["url"] == url:
                current_events[url] = event["title"]
                break
        # 변경된 이벤트
        for event in modified_events:
            if event["url"] == url:
                current_events[url] = event["title"]
                break
        # 변경되지 않은 기존 이벤트
        if url not in current_events:
            if url in previous_events:
                current_events[url] = previous_events[url]
            else:
                # 제목을 모르는 경우 가져오기
                title = fetch_event_title(url)
                current_events[url] = title
                time.sleep(REQUEST_DELAY)
    
    # 7. Discord 알림 전송
    safe_print(f"\n[STEP 7] Sending Discord notifications")
    notification_success = True
    
    if new_events or modified_events:
        # 신규 이벤트 알림
        if new_events:
            safe_print(f"  Sending {len(new_events)} new event notifications")
            if not send_discord_notification(new_events, notification_type="new"):
                notification_success = False
        
        # 변경된 이벤트 알림
        if modified_events:
            safe_print(f"  Sending {len(modified_events)} modified event notifications")
            if not send_discord_notification(modified_events, notification_type="modified"):
                notification_success = False
    else:
        # 이벤트가 없어도 알림 전송
        safe_print(f"  No new or modified events detected - Sending status notification")
        if not send_discord_notification([{"title": f"총 {len(current_events)}개의 이벤트 모니터링 중", "url": TARGET_URL}], notification_type="none"):
            notification_success = False
    
    # 8. 상태 저장
    safe_print(f"\n[STEP 8] Saving state")
    save_state(current_events)
    
    safe_print("=" * 60)
    if notification_success:
        safe_print("Publog Event Bot - Completed Successfully")
    else:
        safe_print("Publog Event Bot - Completed with Errors (Notification Failed)")
    safe_print("=" * 60)
    
    if not notification_success:
        sys.exit(1)


if __name__ == "__main__":
    main()
