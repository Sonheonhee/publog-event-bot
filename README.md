# 🚀 Premium Quant Dashboard

AI 기반 자가 진화형 퀀트 분석 엔진과 프리미엄 대시보드

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)

## ✨ 주요 기능

### 📊 실시간 특징주 분석
- 한국투자증권 API를 통한 실시간 주가 데이터
- RSI, MACD, Bollinger Bands 등 기술적 지표 자동 계산
- AI 기반 종합 점수 시스템 (0-100점)
- 5초마다 자동 갱신

### 🎯 AI 예측 시스템
- Google Gemini AI를 활용한 종목 분석
- 매수/매도/보유 추천 및 신뢰도 점수
- 목표가 및 예상 수익률 제시
- 분석 근거 및 주요 요인 상세 설명

### 📈 감시 종목 DB
- 관심 종목 추가/삭제 관리
- 알림 가격 설정
- 메모 기능

### 🔔 Discord 알림 (자동화)
- **백그라운드 모니터링**: 브라우저 없이도 자동 실행
- **고점수 종목 발견 시 자동 알림** (점수 80 이상)
- **거래정지 종목 경고**
- **AI 예측 결과** (고신뢰도 예측만)
- **중복 방지**: 동일 종목 5분 쿨다운
- **API 최적화**: 1분 간격 체크 (92% 할당량 절감)
- **시스템 상태 알림**: 시작/중지/오류

### 🎨 프리미엄 UI/UX
- Dark Navy/Indigo 테마
- Glassmorphism 디자인
- 부드러운 애니메이션
- 반응형 디자인 (모바일/태블릿/데스크톱)

## 🛠️ 기술 스택

### Frontend
- **Next.js 15** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **SWR** - 실시간 데이터 동기화
- **Framer Motion** - 애니메이션

### Backend & Services
- **한국투자증권 KIS API** - 실시간 주가 데이터
- **Google Gemini AI** - AI 분석 엔진
- **Discord Webhook** - 알림 시스템

### Data Analysis
- **Custom Indicators Library** - RSI, MACD, Bollinger Bands
- **Stock Scoring Algorithm** - 기술적 분석 + AI 분석 + 모멘텀

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
cd "c:/Users/abyz/OneDrive/바탕 화면/프로젝트/2026년/1.STOCK BOT"
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일에 다음 정보를 입력하세요:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Discord Webhook
DISCORD_WEBHOOK_URL=your_discord_webhook_url

# Korean Investment Securities API
KIS_APP_KEY=your_kis_app_key
KIS_APP_SECRET=your_kis_app_secret
KIS_ACCOUNT_NUMBER=your_account_number
KIS_USE_MOCK=true  # 모의투자: true, 실전투자: false

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 5. Discord 백그라운드 모니터링 (선택사항)
자동 Discord 알림을 받으려면:

```bash
# Discord 웹훅 테스트
npm run test:discord

# 백그라운드 모니터링 시작
npm run monitor
```

또는 `scripts\start-monitor.bat`를 더블클릭하여 실행하세요.

**자동 시작 설정**: `scripts\setup-autostart.md` 가이드를 참고하여 Windows 부팅 시 자동 실행 설정

### 6. 프로덕션 빌드
```bash
npm run build
npm start
```

## 🔑 API 키 발급 방법

### 한국투자증권 KIS Developers
1. [KIS Developers](https://apiportal.koreainvestment.com) 접속
2. 회원가입 및 로그인
3. 앱 등록하여 `APP_KEY`와 `APP_SECRET` 발급
4. 모의투자 또는 실전투자 선택

### Google Gemini API
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 생성
3. `.env.local`에 추가

### Discord Webhook
1. Discord 서버 설정 > 연동 > 웹후크
2. 웹후크 생성 및 URL 복사
3. `.env.local`에 추가

## 📁 프로젝트 구조

```
1.STOCK BOT/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   └── stocks/
│   │       ├── realtime/     # 실시간 종목 데이터
│   │       └── predictions/  # AI 예측 데이터
│   ├── globals.css           # 글로벌 스타일
│   ├── layout.tsx            # 루트 레이아웃
│   └── page.tsx              # 메인 페이지
├── components/               # React 컴포넌트
│   ├── tabs/                 # 탭 컴포넌트
│   │   ├── RealTimeStocks.tsx
│   │   ├── TomorrowPicks.tsx
│   │   └── WatchlistDB.tsx
│   └── ui/                   # UI 컴포넌트
│       ├── GlassCard.tsx
│       ├── VerificationBadge.tsx
│       └── SkeletonLoader.tsx
├── services/                 # 외부 서비스
│   ├── kisClient.ts          # 한국투자증권 API
│   ├── geminiAI.ts           # Google Gemini AI
│   ├── discord.ts            # Discord 알림
│   ├── krxMonitor.ts         # KRX 거래정지 모니터
│   └── dataVerification.ts   # 데이터 검증
├── lib/                      # 유틸리티 & 라이브러리
│   ├── indicators.ts         # 기술적 지표 계산
│   ├── stockScoring.ts       # 종목 점수 시스템
│   └── utils.ts              # 공통 유틸리티
├── types/                    # TypeScript 타입
│   └── stock.ts
├── .env.local                # 환경 변수
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## 🎯 사용 방법

### 1. 실시간 특징주 탭
- 자동으로 5초마다 갱신
- 고점수 종목 우선 표시
- 기술적 지표 및 AI 분석 확인

### 2. 내일 필승 종목 탭
- AI가 분석한 매수 추천 종목
- 신뢰도, 목표가, 예상 수익률 확인
- 분석 근거 및 주요 요인 검토

### 3. 감시 종목 DB 탭
- 관심 종목 추가
- 알림 가격 설정
- 메모 작성

## ⚠️ 주의사항

### 데이터 지연
- 실시간 주가 데이터는 15-20분 지연될 수 있습니다
- 실제 거래용이 아닌 분석/학습 목적으로 사용하세요

### API 사용량 (최적화됨)
- 한국투자증권 API: **1분 간격** (시간당 60회, 기존 대비 92% 절감)
- Google Gemini API: **고점수 종목만** (점수 80 이상, 비용 최소화)
- Discord Webhook: **5분 쿨다운** (중복 알림 방지)

### 투자 책임
- 본 시스템은 투자 참고용이며, 투자 결정은 본인의 책임입니다
- AI 예측이 항상 정확하지 않을 수 있습니다
- 충분한 검토 후 투자하세요

## 🔧 개발 정보

### 스크립트
```bash
npm run dev           # 개발 서버 실행
npm run build         # 프로덕션 빌드
npm run start         # 프로덕션 서버 실행
npm run lint          # ESLint 검사
npm run monitor       # 백그라운드 모니터링 시작
npm run monitor:dev   # 디버그 모드로 모니터링
npm run test:discord  # Discord 웹훅 테스트
```

### 환경
- Node.js 18.x 이상
- npm 9.x 이상
- Windows/macOS/Linux

## 📝 라이선스

이 프로젝트는 개인 학습 및 연구 목적으로 제작되었습니다.

## 🤝 기여

버그 리포트 및 기능 제안은 환영합니다!

## 📧 문의

문제가 발생하면 Discord로 알림을 확인하거나 로그를 검토하세요.

---

**Made with ❤️ by Premium Quant Team**
