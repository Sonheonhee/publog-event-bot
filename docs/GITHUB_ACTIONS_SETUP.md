
# GitHub Actions Setup Guide

이 가이드는 로컬 PC를 켜두지 않고도 **GitHub Actions**를 사용하여 매일 자동으로 주식 리포트를 받는 방법을 설명합니다.

## 1. 개요
- **목적**: 매일 오후 9시 (한국 시간)에 급등주 및 전략 분석 리포트를 Discord로 자동 발송
- **방식**: GitHub 서버에서 스크립트를 실행하여 KIS API 데이터 조회 및 분석 수행

## 2. GitHub Secrets 설정
보안을 위해 API 키와 같은 민감한 정보는 코드에 직접 작성하지 않고 GitHub Secrets에 저장해야 합니다.

1. GitHub 리포지토리로 이동합니다.
2. 상단 메뉴의 **Settings** (설정) 탭을 클릭합니다.
3. 왼쪽 사이드바에서 **Secrets and variables** -> **Actions**를 선택합니다.
4. **New repository secret** 버튼을 클릭하여 아래 값들을 각각 추가합니다.

| Name | Value (입력할 값) | 설명 |
|------|------------------|-----|
| `STOCK_DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | 디스코드 웹훅 URL |
| `KIS_APP_KEY` | (한국투자증권 APP Key) | 모의투자 또는 실전투자 앱 키 |
| `KIS_APP_SECRET` | (한국투자증권 APP Secret) | 모의투자 또는 실전투자 시크릿 키 |

> **주의**: `env.local` 파일에 있는 값들을 그대로 복사해서 넣으시면 됩니다.

## 3. 동작 확인
설정이 완료되면 다음 날 오후 9시부터 자동으로 알림이 옵니다.
즉시 테스트해보고 싶다면:

1. **Actions** 탭으로 이동합니다. (워크플로우 파일이 GitHub에 올라가야 보입니다. "New workflow" 버튼을 누르지 마세요!)
2. 왼쪽 목록에서 **Daily Stock Report** 워크플로우를 선택합니다.
3. **Run workflow** 버튼을 클릭합니다.
4. 잠시 후 초록색 체크 표시(✅)가 뜨고 디스코드 알림이 오는지 확인합니다.

## 4. 모니터링 종목 변경
`scripts/gh-monitor.ts` 파일을 열어 `TARGET_STOCKS` 리스트를 수정하면 원하는 종목을 추가하거나 뺄 수 있습니다.

```typescript
const CONFIG = {
    // ...
    TARGET_STOCKS: [
        { code: '005930', name: '삼성전자' },
        // ... 여기에 추가
    ]
};
```
