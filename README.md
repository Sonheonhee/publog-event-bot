# 퍼블로그 이벤트 알림 봇 🎉

퍼블로그 모바일 이벤트 목록 페이지를 모니터링하여 신규 이벤트를 자동으로 감지하고 Discord로 알림을 보내는 봇입니다.

## 📌 프로젝트 소개

- **대상 사이트**: [퍼블로그 모바일 이벤트 목록](https://m.publog.co.kr/service_s7/event/list.s2.asp)
- **알림 방식**: Discord Webhook (Embed 형식)
- **실행 환경**: GitHub Actions (서버 비용 없음)
- **실행 주기**: 매일 오전 10시 (KST) - 한국 공휴일 자동 제외

## 🔧 동작 방식

1. **URL 기반 차이 감지**: 이벤트 목록에서 상세 URL(`m_evt.asp` 패턴)을 추출
2. **상태 관리**: `data/events.json` 파일에 이벤트 URL과 제목을 저장
3. **신규 이벤트 감지**: 이전에 없던 URL이 발견되면 신규로 판단
4. **변경 이벤트 감지**: 기존 URL의 제목이 변경되면 수정으로 판단
5. **Discord 알림**: 
   - 신규 이벤트: 파란색 Embed로 전송
   - 변경 이벤트: 주황색 Embed로 전송 (이전/변경 제목 표시)
6. **자동 커밋**: GitHub Actions가 상태 파일을 자동으로 커밋하여 다음 실행에 활용

## 🛠️ 준비물

- **Discord Webhook URL**: 알림을 받을 Discord 채널의 Webhook URL
- **GitHub 레포지토리**: 이 프로젝트를 업로드할 GitHub 레포

---

## 📝 Discord Webhook 생성 방법

### 1단계: Discord 서버 설정 열기
1. Discord 앱에서 알림을 받을 서버 선택
2. 채널 옆의 **⚙️ 설정** 아이콘 클릭

### 2단계: Webhook 생성
1. 왼쪽 메뉴에서 **연동** (Integrations) 선택
2. **웹후크** (Webhooks) 클릭
3. **새 웹후크** (New Webhook) 버튼 클릭

### 3단계: Webhook 설정
1. 웹후크 이름 설정 (예: `Publog Event Bot`)
2. 알림을 받을 채널 선택
3. **웹후크 URL 복사** 버튼 클릭하여 URL 복사

> ⚠️ **중요**: Webhook URL은 절대 공개하지 마세요! 이 URL을 아는 사람은 누구나 해당 채널에 메시지를 보낼 수 있습니다.

---

## 🔐 GitHub Secrets 등록 방법

### 1단계: GitHub 레포지토리 설정 열기
1. GitHub에서 이 프로젝트 레포지토리로 이동
2. 상단 메뉴에서 **Settings** 클릭

### 2단계: Secrets 추가
1. 왼쪽 메뉴에서 **Secrets and variables** → **Actions** 선택
2. **New repository secret** 버튼 클릭

### 3단계: Secret 입력
- **Name**: `DISCORD_WEBHOOK_URL`
- **Secret**: 앞서 복사한 Discord Webhook URL 붙여넣기
- **Add secret** 버튼 클릭

---

## 💻 로컬 실행 방법

### 설치

```bash
# 의존성 설치
pip install -r requirements.txt
```

### 환경변수 설정

**Windows PowerShell:**
```powershell
$env:DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"
```

**Mac / Linux:**
```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"
```

### 실행

```bash
python publog_event_bot.py
```

### 실행 결과 예시

```
============================================================
Publog Event Bot - Starting
============================================================
[INFO] State file not found: data\events.json
[INFO] Fetching event list from: https://m.publog.co.kr/service_s7/event/list.s2.asp
[INFO] Found 15 event URLs
[INFO] Detected 15 new events
[INFO] Sent Discord notification (batch 1)
[INFO] Sent Discord notification (batch 2)
[INFO] Saved 15 event URLs to state
============================================================
Publog Event Bot - Completed
============================================================
```

---

## 🤖 GitHub Actions 실행 방법

### 수동 실행 (workflow_dispatch)

1. GitHub 레포지토리에서 **Actions** 탭 클릭
2. 왼쪽에서 **Publog Event Notifier** 워크플로 선택
3. **Run workflow** 버튼 클릭
4. **Run workflow** 확인 버튼 클릭
5. 실행 로그에서 결과 확인

### 자동 스케줄 실행

- **실행 시간**: 매일 오전 10시 (KST)
- **cron 설정**: `0 1 * * *` (UTC 01:00 = KST 10:00)
- **한국 공휴일 체크**: 스크립트가 자동으로 주말 및 공휴일 확인
  - 주말(토/일) 및 한국 공휴일에는 자동으로 실행 건너뜀
  - 설날, 추석, 광복절 등 한국 법정 공휴일 모두 포함
- **확인 방법**: Actions 탭에서 평일 10시 이후 실행 로그 확인

> 💡 **참고**: 첫 실행 시에는 모든 이벤트가 "신규"로 감지됩니다. 두 번째 실행부터 정상적으로 차이를 감지합니다.

---

## 🔄 이벤트 변경 감지

### 신규 vs 변경 이벤트

봇은 **신규 이벤트**와 **변경된 이벤트**를 구분하여 알림을 보냅니다:

**신규 이벤트 (파란색 📢)**
- 이전에 없던 URL이 발견된 경우
- Discord Embed: 파란색 (Blurple)
- 알림 제목: "📢 퍼블로그 신규 이벤트 알림"

**변경 이벤트 (주황색 🔄)**
- 기존 URL의 제목이 변경된 경우
- Discord Embed: 주황색 (Orange)
- 알림 제목: "🔄 퍼블로그 이벤트 변경 알림"
- 이전 제목과 변경된 제목을 함께 표시

**변경 감지 예시:**
```
🔄 1. 새로운 이벤트 제목
이전: 기존 이벤트 제목
변경: 새로운 이벤트 제목
[이벤트 보기](URL)
```

> 💡 **참고**: 제목이 조금이라도 변경되면 감지됩니다 (띄어쓰기, 특수문자 포함).

---

## 🔍 트러블슈팅

### 신규 이벤트가 없으면 알림이 오지 않습니다
- **정상 동작입니다**: 신규 이벤트가 없으면 Discord 알림을 보내지 않습니다.
- **확인 방법**: Actions 로그에서 `[INFO] No new events detected` 메시지 확인

### 403 / 429 에러 발생 시
- **원인**: 과도한 요청으로 인한 차단
- **대응**: 
  - 1일 1회 실행을 권장합니다 (현재 설정 유지)
  - 재시도는 다음 스케줄 실행에 맡깁니다
  - 필요 시 `REQUEST_DELAY` 값을 늘려보세요 (현재 1초)

### 사이트 구조 변경으로 이벤트를 못 찾을 때
- **수정 위치**: `publog_event_bot.py` 파일의 `fetch_event_list()` 함수
- **수정 내용**: 정규식 패턴 변경
  ```python
  # 현재 패턴
  pattern = re.compile(r'/service_s7/event/[^"\']*m_evt\.asp[^"\']*')
  
  # 새 패턴으로 변경 (예시)
  pattern = re.compile(r'새로운_패턴')
  ```

### data/events.json이 커밋되지 않을 때
- **원인**: `.gitignore`에 `data/` 또는 `*.json`이 포함되어 있을 수 있음
- **해결**: `.gitignore`에서 해당 항목 제거 또는 예외 추가
  ```gitignore
  # .gitignore
  !data/events.json
  ```

---

## 🔄 실패 시 재시도 메커니즘

### 자동 재시도 프로세스

봇은 일시적인 네트워크 오류나 서버 문제에 대비하여 **자동 재시도** 기능을 제공합니다:

**재시도 설정:**
- **최대 재시도 횟수**: 3회
- **재시도 간격**: 지수 백오프 (5초, 10초, 15초)
- **적용 대상**:
  - 이벤트 목록 페이지 요청
  - Discord Webhook 알림 전송

**동작 방식:**
1. **1차 시도 실패** → 5초 대기 후 재시도
2. **2차 시도 실패** → 10초 대기 후 재시도
3. **3차 시도 실패** → 로그에 실패 기록, 다음 실행 대기

**실패 시나리오:**
- **일시적 네트워크 오류**: 자동 재시도로 대부분 해결
- **서버 점검/다운**: 3회 재시도 후 실패, 다음 실행(익일 10시)에 재시도
- **Discord Webhook 오류**: 재시도 후에도 실패 시 Actions 로그 확인 필요

**로그 예시:**
```
[Attempt 1/3] Sending batch 1...
[ERROR] Request timeout
[RETRY] Waiting 5s before retry...
[Attempt 2/3] Sending batch 1...
[SUCCESS] Batch 1 sent successfully
```

**에러 알림 (Discord):**
- 3회 재시도 후에도 실패 시 **Discord로 에러 알림 자동 전송**
- 알림 내용:
  - ⚠️ 오류 유형 (이벤트 목록 가져오기 실패 / Discord 알림 전송 실패)
  - 오류 메시지
  - 상세 정보 (URL, 에러 내용 등)
- 빨간색 Embed로 일반 알림과 구분

**에러 알림 예시:**
```
⚠️ Publog Event Bot - 실행 실패 알림
봇 실행 중 오류가 발생했습니다.

오류 유형: 이벤트 목록 가져오기 실패
오류 메시지: 3회 재시도 후에도 퍼블로그 서버 접속 실패
상세 정보: URL: https://m.publog.co.kr/...
```

> 💡 **참고**: 실패한 알림은 다음 실행 시 신규 이벤트가 있으면 함께 전송됩니다.

---

## ⚠️ 운영 주의사항

### 과도한 요청 금지
- **권장 실행 빈도**: 1일 1회 (현재 설정)
- **이유**: 퍼블로그 서버에 부담을 주지 않기 위함
- **주의**: cron 설정을 너무 자주 실행하도록 변경하지 마세요

### 사이트 구조 변경 가능성
- 퍼블로그 사이트 구조가 변경되면 봇이 작동하지 않을 수 있습니다
- 정기적으로 Actions 로그를 확인하여 정상 작동 여부를 점검하세요

### 개인정보 보호
- Discord Webhook URL은 절대 공개 레포지토리에 직접 작성하지 마세요
- 반드시 GitHub Secrets를 사용하세요

---

## 📂 프로젝트 구조

```
.
├─ publog_event_bot.py          # 메인 봇 스크립트
├─ requirements.txt              # Python 의존성
├─ README.md                     # 이 문서
├─ data/
│  └─ events.json               # 상태 저장 파일 (자동 생성)
└─ .github/
   └─ workflows/
      └─ publog_event_bot.yml  # GitHub Actions 워크플로
```

---

## ✅ 사용자 체크리스트

프로젝트를 처음 설정할 때 아래 항목을 순서대로 완료하세요:

- [ ] **Discord Webhook 만들기**
  - Discord 서버에서 Webhook 생성
  - Webhook URL 복사

- [ ] **GitHub Secrets 등록**
  - GitHub 레포 Settings → Secrets and variables → Actions
  - `DISCORD_WEBHOOK_URL` Secret 추가

- [ ] **Actions 수동 실행**
  - Actions → Publog Event Notifier → Run workflow
  - 실행 로그에서 정상 작동 확인
  - Discord 채널에 알림 도착 확인

- [ ] **data/events.json 커밋 확인**
  - 레포지토리에 `data/events.json` 파일이 생성되었는지 확인
  - 파일 내용에 이벤트 URL 목록이 있는지 확인

- [ ] **다음날 자동 실행 확인**
  - 다음날 10:00(KST) 이후 Actions 로그 확인
  - 스케줄 실행이 정상적으로 작동하는지 확인

---

## 📄 라이선스

이 프로젝트는 개인 용도로 자유롭게 사용 가능합니다.

---

## 🙋‍♂️ 문의

문제가 발생하거나 개선 사항이 있으면 GitHub Issues를 통해 제보해주세요.

**Happy Event Hunting! 🎉**
