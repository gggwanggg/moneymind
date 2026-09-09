# MoneyMind

월급 기반 자산 포트폴리오와 소비 패턴을 관리하는 React 애플리케이션입니다.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Run the app: `npm run dev`
## 월급 예산 대시보드

API 시작 화면에서 데모 키를 입력하고 연동하면 포트폴리오 화면을 볼 수 있습니다.
월급과 주거비·식비·기타 생활비·저축·투자·기타 예산을 금액으로 입력하면
Chart.js 파이 차트와 월급 대비 비율이 즉시 갱신됩니다.

- 미배정 금액은 회색 차트 조각으로 표시합니다. 초과 상태에서는 파이의 면적은 총 예산 기준이며, 범례와 툴팁 비율은 월급 기준입니다.
- 개별 항목이 월급의 40%를 **초과**하면 빨간색으로 강조합니다.
- 추천 템플릿은 저축/고정비/생활비 순서로 50/30/20, 30/40/30, 20/40/40입니다. 적용하면 기존 입력 금액을 대체합니다.
- 월급이 0이거나 예산이 월급을 초과하면 저장할 수 없습니다. 미배정 잔액이 있는 예산은 저장할 수 있습니다.
- `예산 데이터 JSON 보기`에서 현재 계산 결과를 확인하고 다운로드할 수 있습니다.

`src/utils/budgetPortfolio.ts`의 `calculateBudget(salary, items)`는 JSON으로 직렬화할 수 있는
`BudgetResult`를 반환합니다. 금액은 원 단위 정수이며 비율의 분모는 월급입니다.
비율은 계산 시 반올림하지 않고 화면에서 소수점 둘째 자리까지 표시합니다.

```json
{
  "salary": 3000000,
  "totalBudget": 1500000,
  "remainingAmount": 1500000,
  "totalPercent": 50,
  "unallocatedPercent": 50,
  "exceededPercent": 0,
  "isOverBudget": false,
  "warnings": [],
  "items": [
    {
      "id": "saving",
      "name": "저축",
      "group": "saving",
      "amount": 1500000,
      "color": "#10B981",
      "percent": 50,
      "exceedsFortyPercent": true
    }
  ]
}
```

월급이 0이면 비율 필드는 `null`이며 입력 안내가 `warnings`에 담깁니다.
예산 초과 시 `remainingAmount`는 음수이고 `warnings`에 초과 금액 안내가 담깁니다.

저장 시 기존 `moneymind_portfolio_v1`에 세부 항목 `budgetItems`를 추가하고,
홈에서 사용하는 기존 배분 항목도 함께 갱신합니다. 주거비는 기존 생활비 집계에 포함합니다.
기존 데이터의 생활비는 금액 변경 없이 `기타 생활비`로 가져오며 주거비·식비는 0원에서 시작합니다.
저장된 세부 식비 예산은 소비 분석의 식비 예산으로 사용합니다.

검증 명령: `npm test`, `npm run lint`, `npm run build`.
