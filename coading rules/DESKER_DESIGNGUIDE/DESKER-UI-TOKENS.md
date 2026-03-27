# DESKER UI 디자인 토큰 & 컴포넌트 가이드

> FURSYS GROUP · DESKER 브랜드 디자인 시스템 기반
> 출처: COLOR PDF, LOGO PDF (DESKER_DESIGNGUIDE 폴더)
> 다른 프로젝트에서 이 파일을 복사하여 바로 사용할 수 있습니다.

---

## 1. 브랜드 원칙

- 모노크로매틱 기반의 절제된 디자인
- 컬러 사용 비율: **Primary 80% / Secondary 15% / Attention 5%**
- 색상은 데이터·상태를 전달하는 수단으로만 사용, 장식 목적 금지

---

## 2. 색상 토큰

### 2.1 Grayscale (Primary)

```
#FFFFFF  --color-white      카드 배경, 입력 필드
#F5F5F5  --color-gray-50    페이지 배경, 테이블 짝수행
#EBEBEB  --color-gray-100   비활성 배경, muted 영역
#D9D9D9  --color-gray-200   기본 테두리
#C8C8C8  --color-gray-300   구분선
#B3B3B3  --color-gray-400   비활성 텍스트, 강한 테두리
#969696  --color-gray-500   placeholder
#787878  --color-gray-600   보조 아이콘
#515151  --color-gray-700   보조 텍스트, 차트 기본 막대
#3C3C3C  --color-gray-800   강조 텍스트
#282828  --color-gray-900   기본 텍스트, 기본 버튼 배경
```

### 2.2 Secondary (상태 표현 전용)

```
#336DFF  --color-blue       정보, 링크, 활성 상태
#FFDC1E  --color-yellow     경고, 하이라이트
#F72B35  --color-red        오류, 위험, 감소 지표
#00B441  --color-green      성공, 긍정, 증가 지표
```

### 2.3 Attention (즉각 주의 알림 전용)

```
#FF5948  --color-orange     리스크 경고, 주의 알림
```

---

## 3. CSS 변수 전체 (복사해서 사용)

```css
:root {
  /* Grayscale */
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

  /* Semantic */
  --color-bg-base:        var(--color-white);
  --color-bg-subtle:      var(--color-gray-50);
  --color-bg-muted:       var(--color-gray-100);
  --color-border:         var(--color-gray-200);
  --color-border-strong:  var(--color-gray-400);
  --color-text-primary:   var(--color-gray-900);
  --color-text-secondary: var(--color-gray-700);
  --color-text-disabled:  var(--color-gray-400);

  /* Secondary */
  --color-blue:           #336DFF;
  --color-yellow:         #FFDC1E;
  --color-red:            #F72B35;
  --color-green:          #00B441;

  /* Attention */
  --color-orange:         #FF5948;

  /* Spacing (4px base) */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;

  /* Typography */
  --font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-lg:   18px;
  --text-xl:   22px;
  --text-2xl:  28px;
}
```

---

## 4. 타이포그래피

폰트: `'Pretendard', 'Apple SD Gothic Neo', sans-serif`

| 토큰 | 크기 | 굵기 | 용도 |
|---|---|---|---|
| `--text-xs` | 11px | 400 | 레이블, 배지 |
| `--text-sm` | 13px | 400 | 보조 텍스트, 테이블 셀 |
| `--text-base` | 15px | 400 | 본문 기본 |
| `--text-base` | 15px | 600 | 섹션 소제목 |
| `--text-lg` | 18px | 600 | 카드 제목 |
| `--text-xl` | 22px | 700 | 페이지 제목 |
| `--text-2xl` | 28px | 700 | KPI 수치 |

---

## 5. 간격 시스템

4px 배수 체계. 8의 배수를 기본으로 사용하고, 세밀한 조정에만 4px 단위 사용.

```
4px   --space-1   아이콘-텍스트 간격
8px   --space-2   인라인 요소 간격
12px  --space-3   컴포넌트 내부 패딩 (소형)
16px  --space-4   카드 패딩, 섹션 내부
24px  --space-6   카드 간 간격
32px  --space-8   섹션 간 간격
48px  --space-12  페이지 상단 여백
```

---

## 6. 컴포넌트 색상 규칙

### 버튼

```
기본 버튼:  배경 #282828 / 텍스트 #FFFFFF / hover: #3C3C3C
보조 버튼:  배경 #FFFFFF / 텍스트 #282828 / 테두리 #B3B3B3 / hover: 배경 #F5F5F5
위험 버튼:  배경 #F72B35 / 텍스트 #FFFFFF
비활성:     배경 #EBEBEB / 텍스트 #B3B3B3 / cursor: not-allowed
```

### 테이블

```
헤더:       배경 #F5F5F5 / 텍스트 #515151 / 테두리 하단 #D9D9D9
홀수 행:    배경 #FFFFFF
짝수 행:    배경 #F5F5F5
hover 행:   배경 #EBEBEB
선택 행:    배경 #EEF3FF / 좌측 테두리 2px #336DFF
```

### 상태 배지

```
성공:   배경 rgba(0,180,65,0.10)   / 텍스트 #00B441
경고:   배경 rgba(255,220,30,0.15) / 텍스트 #282828 / 테두리 #FFDC1E
오류:   배경 rgba(247,43,53,0.10)  / 텍스트 #F72B35
리스크: 배경 rgba(255,89,72,0.08)  / 텍스트 #FF5948 / 테두리 #FF5948
```

### 입력 필드

```
기본:   테두리 #D9D9D9 / 배경 #FFFFFF / 텍스트 #282828
포커스: 테두리 #336DFF (2px)
오류:   테두리 #F72B35
비활성: 배경 #F5F5F5 / 텍스트 #B3B3B3
```

### 카드

```
배경: #FFFFFF
테두리: 1px solid #D9D9D9
border-radius: 8px
shadow: 0 1px 3px rgba(40,40,40,0.08)
패딩: 16px (--space-4)
```

---

## 7. 로고 사용 규칙

| 배경 | 로고 색상 |
|---|---|
| 밝은 배경 (#FFFFFF ~ #969696) | `#000000` |
| 어두운 배경 (#787878 ~ #282828) | `#FFFFFF` |

- 최소 사이즈: 웹 **20px**, 인쇄 **3mm**
- Clearspace: 로고 'D' 글자 높이만큼 사방 여백 확보
- 색상 변형 금지 (흑/백 2가지만 허용)
- 배경색 변경, 회전, 왜곡 금지

---

## 8. 반응형 브레이크포인트

| 이름 | 범위 | 레이아웃 |
|---|---|---|
| `xs` | ~ 479px | 단일 열 |
| `sm` | 480px ~ 767px | 단일 열 (여백 확장) |
| `md` | 768px ~ 1023px | 2열 또는 상하 배치 |
| `lg` | 1024px ~ 1439px | 기본 다열 레이아웃 |
| `xl` | 1440px ~ | 최대 너비 고정, 중앙 정렬 |

```js
// Tailwind CSS tailwind.config.ts
theme: {
  screens: {
    'xs':  '480px',
    'sm':  '640px',
    'md':  '768px',
    'lg':  '1024px',
    'xl':  '1440px',
  }
}
```

---

## 9. 데이터 시각화 색상 가이드

### 차트 기본 팔레트 (순서대로 사용)

```
1순위: #282828  (Primary Dark)
2순위: #515151  (Primary Mid)
3순위: #336DFF  (Blue)
4순위: #B3B3B3  (Light Gray)
5순위: #00B441  (Green)
6순위: #F72B35  (Red)
```

### 이중축 차트

```
주 데이터 (막대):  #515151 / hover: #282828
보조 데이터 (선):  #F72B35
보조 축 레이블:    #F72B35
그리드 라인:       #D9D9D9 (수평선만)
툴팁 배경:         #282828 / 텍스트: #FFFFFF
```

### 히트맵 (6단계 블루 스케일)

```
0%      #F5F5F5   (없음)
1~20%   #D9E8FF   (낮음)
21~40%  #93B8FF   (보통)
41~60%  #336DFF   (높음)
61~80%  #1A4FCC   (매우 높음)
81~100% #0A2E80   (최고)
```

### 증감 표시

```
증가 (▲): #00B441  (매출, 수량 등 높을수록 좋은 지표)
감소 (▼): #F72B35
환불율 증가 (▲): #F72B35  (높을수록 나쁜 지표는 반전)
환불율 감소 (▼): #00B441
```
