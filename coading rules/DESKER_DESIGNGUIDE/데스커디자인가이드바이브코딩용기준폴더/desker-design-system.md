---
inclusion: manual
---

# DESKER 디자인 시스템 가이드

FURSYS GROUP의 DESKER 브랜드 디자인 시스템입니다.
UI/UX 설계 시 이 파일을 참조하여 브랜드 일관성을 유지하세요.

출처: `DESKER_DESIGNGUIDE/` 폴더 내 COLOR, LOGO PDF

---

## 브랜드 철학

- 모노크로매틱 기반의 절제된 디자인
- 색상은 데이터/상태를 강조하는 수단으로만 사용
- 정보 밀도를 높이되 시각적 노이즈 최소화
- 컬러 사용 비율: **Primary 80% / Secondary 15% / Attention 5%**

---

## 색상 팔레트

### Primary (Grayscale 11단계)

| 토큰 | HEX | 용도 |
|---|---|---|
| `--color-white` | `#FFFFFF` | 카드 배경, 입력 필드 |
| `--color-gray-50` | `#F5F5F5` | 페이지 배경, 테이블 홀수행 |
| `--color-gray-100` | `#EBEBEB` | 비활성 배경, muted 영역 |
| `--color-gray-200` | `#D9D9D9` | 기본 테두리 |
| `--color-gray-300` | `#C8C8C8` | 구분선 |
| `--color-gray-400` | `#B3B3B3` | 비활성 텍스트, 강한 테두리 |
| `--color-gray-500` | `#969696` | placeholder |
| `--color-gray-600` | `#787878` | 보조 아이콘 |
| `--color-gray-700` | `#515151` | 보조 텍스트, 차트 기본 막대 |
| `--color-gray-800` | `#3C3C3C` | 강조 텍스트 |
| `--color-gray-900` | `#282828` | 기본 텍스트, 기본 버튼 배경 |

### Secondary (의미 있는 상태 표현에만 사용)

| 토큰 | HEX | 용도 |
|---|---|---|
| `--color-blue` | `#336DFF` | 정보, 링크, 활성 상태, 강조 |
| `--color-yellow` | `#FFDC1E` | 경고, 하이라이트 |
| `--color-red` | `#F72B35` | 오류, 위험, 환불/감소 지표 |
| `--color-green` | `#00B441` | 성공, 긍정, 증가 지표 |

### Attention (즉각적 주의 알림에만 사용)

| 토큰 | HEX | 용도 |
|---|---|---|
| `--color-orange` | `#FF5948` | 리스크 경고, 주의 알림 |

---

## 로고 사용 규칙

- 밝은 배경 → 로고 색상 `#000000`
- 어두운 배경 → 로고 색상 `#FFFFFF`
- 최소 사이즈: 웹 **20px**
- Clearspace: 'D' 글자 높이만큼 최소 여백 확보
- 색상 변형 금지 (흑/백 2가지만 허용)

---

## CSS 변수 전체 정의

```css
:root {
  /* ── Grayscale ── */
  --color-white:          #FFFFFF;
  --color-gray-50:        #F5F5F5;
  --color-gray-100:       #EBEBEB;
  --color-gray-200:       #D9D9D9;
  --color-gray-300:       #C8C8C8;
  --color-gray-400:       #B3B3B3;
  --color-gray-500:       #969696;
  --color-gray-600:       #787878;
  --color-gray-700:       #515151;
  --color-gray-800:       #3C3C3C;
  --color-gray-900:       #282828;

  /* ── Semantic ── */
  --color-bg-base:        var(--color-white);
  --color-bg-subtle:      var(--color-gray-50);
  --color-bg-muted:       var(--color-gray-100);
  --color-border:         var(--color-gray-200);
  --color-border-strong:  var(--color-gray-400);
  --color-text-primary:   var(--color-gray-900);
  --color-text-secondary: var(--color-gray-700);
  --color-text-disabled:  var(--color-gray-400);

  /* ── Secondary ── */
  --color-blue:           #336DFF;
  --color-yellow:         #FFDC1E;
  --color-red:            #F72B35;
  --color-green:          #00B441;

  /* ── Attention ── */
  --color-orange:         #FF5948;
}
```

---

## 타이포그래피

폰트 패밀리: `'Pretendard', 'Apple SD Gothic Neo', sans-serif`

| 토큰 | 크기 | 굵기 | 용도 |
|---|---|---|---|
| `--text-xs` | 11px | 400 | 레이블, 배지 |
| `--text-sm` | 13px | 400 | 보조 텍스트, 테이블 셀 |
| `--text-base` | 15px | 400 | 본문 기본 |
| `--text-md` | 15px | 600 | 섹션 소제목 |
| `--text-lg` | 18px | 600 | 카드 제목 |
| `--text-xl` | 22px | 700 | 페이지 제목 |
| `--text-2xl` | 28px | 700 | KPI 수치 |

---

## 간격 시스템 (4px 기반)

| 토큰 | 값 | 주요 용도 |
|---|---|---|
| `--space-1` | 4px | 아이콘-텍스트 간격 |
| `--space-2` | 8px | 인라인 요소 간격 |
| `--space-3` | 12px | 컴포넌트 내부 패딩 |
| `--space-4` | 16px | 카드 패딩, 섹션 내부 |
| `--space-6` | 24px | 카드 간 간격 |
| `--space-8` | 32px | 섹션 간 간격 |
| `--space-12` | 48px | 페이지 상단 여백 |

---

## 컴포넌트 색상 적용 규칙

| 컴포넌트 | 배경 | 텍스트 | 테두리 |
|---|---|---|---|
| 페이지 배경 | `--color-bg-base` | — | — |
| 카드 | `--color-white` | `--color-text-primary` | `--color-border` |
| 테이블 헤더 | `--color-bg-subtle` | `--color-text-secondary` | `--color-border` |
| 테이블 행 (홀수) | `--color-white` | `--color-text-primary` | — |
| 테이블 행 (짝수) | `--color-bg-subtle` | `--color-text-primary` | — |
| 기본 버튼 | `--color-gray-900` | `--color-white` | — |
| 보조 버튼 | `--color-white` | `--color-gray-900` | `--color-border-strong` |
| 링크/강조 | — | `--color-blue` | — |
| 경고 배너 | `--color-yellow` (15% 투명도) | `--color-gray-900` | `--color-yellow` |
| 오류 배너 | `--color-red` (10% 투명도) | `--color-red` | — |
| 성공 상태 | `--color-green` (10% 투명도) | `--color-green` | — |
| 리스크 배지 | `--color-orange` (8% 투명도) | `--color-orange` | `--color-orange` |

---

## 반응형 브레이크포인트

| 이름 | 범위 | 설명 |
|---|---|---|
| `xs` | ~ 479px | 모바일 최소 |
| `sm` | 480px ~ 767px | 모바일 |
| `md` | 768px ~ 1023px | 태블릿 |
| `lg` | 1024px ~ 1439px | 데스크탑 |
| `xl` | 1440px ~ | 와이드 (최대 너비 고정) |

```css
/* Tailwind CSS 설정 예시 */
screens: {
  'xs':  '480px',
  'sm':  '640px',
  'md':  '768px',
  'lg':  '1024px',
  'xl':  '1440px',
}
```
