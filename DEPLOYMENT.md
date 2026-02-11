# Google Cloud Run 배포 가이드

이 문서는 Stock Bot Premium 애플리케이션을 Google Cloud Run에 배포하는 방법을 안내합니다.

## 사전 준비

### 1. Google Cloud 계정 및 프로젝트 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 결제 계정 연결 (필수)

### 2. 필요한 API 활성화

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. gcloud CLI 설치 및 인증

1. [gcloud CLI 설치](https://cloud.google.com/sdk/docs/install)
2. 인증 및 프로젝트 설정:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region asia-northeast3
```

## 환경 변수 준비

배포 전에 다음 환경 변수들을 준비해주세요:

- `DISCORD_WEBHOOK_URL`: Discord 웹훅 URL
- `KIS_APP_KEY`: 한국투자증권 API 키
- `KIS_APP_SECRET`: 한국투자증권 API 시크릿
- `GEMINI_API_KEY`: Google Gemini API 키

## 배포 방법

### 방법 1: 수동 배포 (권장 - 처음 배포 시)

#### 1단계: Docker 이미지 빌드 및 푸시

```bash
# 프로젝트 루트 디렉토리에서 실행
cd "c:\Users\abyz\OneDrive\바탕 화면\프로젝트\2026년\1.STOCK BOT"

# Docker 이미지 빌드
docker build -t gcr.io/YOUR_PROJECT_ID/stock-bot-premium:latest .

# Container Registry에 푸시
docker push gcr.io/YOUR_PROJECT_ID/stock-bot-premium:latest
```

#### 2단계: Cloud Run에 배포

```bash
gcloud run deploy stock-bot-premium \
  --image gcr.io/YOUR_PROJECT_ID/stock-bot-premium:latest \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_APP_URL=https://YOUR_SERVICE_URL" \
  --set-secrets "DISCORD_WEBHOOK_URL=discord-webhook:latest,KIS_APP_KEY=kis-app-key:latest,KIS_APP_SECRET=kis-app-secret:latest,GEMINI_API_KEY=gemini-api-key:latest"
```

**중요**: `--set-secrets` 사용 전에 Secret Manager에 시크릿을 먼저 생성해야 합니다.

#### 3단계: Secret Manager에 환경 변수 저장

```bash
# Discord 웹훅 URL
echo -n "YOUR_DISCORD_WEBHOOK_URL" | gcloud secrets create discord-webhook --data-file=-

# KIS API 키
echo -n "YOUR_KIS_APP_KEY" | gcloud secrets create kis-app-key --data-file=-

# KIS API 시크릿
echo -n "YOUR_KIS_APP_SECRET" | gcloud secrets create kis-app-secret --data-file=-

# Gemini API 키
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Cloud Run 서비스에 시크릿 접근 권한 부여
gcloud secrets add-iam-policy-binding discord-webhook \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding kis-app-key \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding kis-app-secret \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**프로젝트 번호 확인**:
```bash
gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)"
```

### 방법 2: Cloud Build 자동 배포

GitHub 저장소와 연동하여 자동 배포를 설정할 수 있습니다.

#### 1단계: Cloud Build 트리거 생성

1. [Cloud Build 콘솔](https://console.cloud.google.com/cloud-build/triggers)로 이동
2. "트리거 만들기" 클릭
3. 저장소 연결 (GitHub)
4. 빌드 구성: `cloudbuild.yaml` 선택
5. 트리거 생성

#### 2단계: 환경 변수 설정

Cloud Build에서도 Secret Manager를 사용하여 환경 변수를 관리합니다.

## 배포 후 확인

### 1. 서비스 URL 확인

```bash
gcloud run services describe stock-bot-premium --region asia-northeast3 --format="value(status.url)"
```

### 2. 로그 확인

```bash
# 실시간 로그 스트리밍
gcloud run services logs tail stock-bot-premium --region asia-northeast3

# 최근 50개 로그 확인
gcloud run services logs read stock-bot-premium --region asia-northeast3 --limit=50
```

### 3. 웹 UI 접속

브라우저에서 서비스 URL로 접속하여 대시보드가 정상적으로 표시되는지 확인합니다.

### 4. Discord 알림 확인

- Discord 채널에서 "모니터링 시작" 메시지 확인
- 5-10분 후 고점수 주식 알림이 오는지 확인

## 업데이트 및 재배포

코드를 수정한 후 재배포:

```bash
# 이미지 다시 빌드
docker build -t gcr.io/YOUR_PROJECT_ID/stock-bot-premium:latest .

# 푸시
docker push gcr.io/YOUR_PROJECT_ID/stock-bot-premium:latest

# 재배포 (Cloud Run이 자동으로 새 이미지를 감지하고 배포)
gcloud run deploy stock-bot-premium \
  --image gcr.io/YOUR_PROJECT_ID/stock-bot-premium:latest \
  --region asia-northeast3
```

## 비용 최적화

### 1. 최소 인스턴스 조정

24시간 실행이 필요하지 않다면 최소 인스턴스를 0으로 설정:

```bash
gcloud run services update stock-bot-premium \
  --region asia-northeast3 \
  --min-instances 0
```

**주의**: 최소 인스턴스를 0으로 설정하면 모니터링 스크립트가 중단될 수 있습니다.

### 2. 리소스 조정

트래픽이 적다면 메모리와 CPU를 줄일 수 있습니다:

```bash
gcloud run services update stock-bot-premium \
  --region asia-northeast3 \
  --memory 512Mi \
  --cpu 0.5
```

### 3. 예상 비용

- **최소 인스턴스 1개 유지 (24시간 실행)**:
  - 월 약 $10-20 (리전 및 리소스에 따라 변동)
  
- **최소 인스턴스 0개 (요청 시에만 실행)**:
  - 월 약 $1-5 (트래픽에 따라 변동)
  - 단, 모니터링 기능이 제한됨

## 문제 해결

### 배포 실패 시

```bash
# 빌드 로그 확인
gcloud builds list --limit=5

# 특정 빌드 로그 상세 확인
gcloud builds log BUILD_ID
```

### 서비스 실행 오류 시

```bash
# 서비스 상태 확인
gcloud run services describe stock-bot-premium --region asia-northeast3

# 로그 확인
gcloud run services logs read stock-bot-premium --region asia-northeast3 --limit=100
```

### 환경 변수 확인

```bash
gcloud run services describe stock-bot-premium \
  --region asia-northeast3 \
  --format="value(spec.template.spec.containers[0].env)"
```

## 로컬 테스트

배포 전에 로컬에서 Docker 이미지를 테스트할 수 있습니다:

```bash
# 이미지 빌드
docker build -t stock-bot-test .

# 환경 변수와 함께 실행
docker run -p 3000:3000 \
  -e DISCORD_WEBHOOK_URL="your-webhook-url" \
  -e KIS_APP_KEY="your-key" \
  -e KIS_APP_SECRET="your-secret" \
  -e GEMINI_API_KEY="your-gemini-key" \
  stock-bot-test

# 브라우저에서 http://localhost:3000 접속
```

## 추가 리소스

- [Cloud Run 문서](https://cloud.google.com/run/docs)
- [Secret Manager 문서](https://cloud.google.com/secret-manager/docs)
- [Cloud Build 문서](https://cloud.google.com/build/docs)
- [가격 계산기](https://cloud.google.com/products/calculator)
