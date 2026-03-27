# 엑셀/PDF 출력 가이드 및 원칙

바이브코딩 시 엑셀/PDF 다운로드 기능을 구현할 때 반드시 참조하는 가이드 문서입니다.
프로젝트에 종속되지 않는 범용 원칙이며, 참조 코드(`ReportService.ts`, `DownloadButtons.tsx`)와 함께 사용합니다.

---

## 1. 패키지 의존성

```json
{
  "xlsx": "^0.18.5",
  "jspdf": "^2.5.2",
  "html2canvas": "^1.4.1"
}
```

---

## 2. 엑셀 출력 원칙

### 2-1. 셀 서식
- 숫자(금액, 수량)는 **원시 number**로 저장. 절대 문자열로 변환하지 않음
- `XLSX` 셀 객체의 `z` 속성으로 표시 서식 지정
  - 금액/수량: `#,##0`
  - 비율: `0.0%` (값은 0~1 소수로 저장, 예: 20.1% → 0.201)
- `applyNumberFormat()` 헬퍼로 컬럼/행 범위에 일괄 적용
- **주의**: 서식을 문자열로 넣으면 엑셀에서 정렬/계산이 안 됨

### 2-2. 시트 구성
- 시트 이름: 31자 이내, 금지 문자(`\ / * ? [ ] :`) 제거 → `safeSheetName()` 헬퍼 사용
- 각 시트에 `!cols` (컬럼 너비) 반드시 설정 — 설정하지 않으면 모든 열이 기본 너비로 출력됨
- 데이터가 많으면 시트를 논리적으로 분리 (컨텍스트, KPI, 일별, 상품별 등)

### 2-3. 파일명
- 형식: `{제목}_{용도}_{YYYYMMDD}.xlsx`
- 한글 파일명 사용 가능 (XLSX.writeFile은 한글 지원)

### 2-4. 비교/복수 데이터
- 복수 데이터셋(비교 행사 등)은 같은 워크북에 시트 prefix로 구분
- 예: `이번행사_KPI`, `비교행사_KPI`

---

## 3. PDF 출력 원칙

### 3-1. 핵심 구조
- `html2canvas`로 DOM → Canvas 변환 → `jsPDF`로 PDF 생성
- 동적 import(`import('html2canvas')`)로 번들 크기 최적화
- PDF는 화면 캡처 방식이므로 **화면에 보이는 그대로가 PDF에 출력됨**

### 3-2. 섹션 분리 (`data-pdf-section`)
- 캡처 대상 컨테이너 내부에 `data-pdf-section` 속성으로 섹션 표시
- 섹션별로 개별 캡처 → 페이지 경계에서 텍스트/표가 잘리는 문제 방지
- 섹션이 없으면 전체를 하나로 캡처 (fallback)
- **`data-pdf-section`이 없는 요소는 PDF에서 자동 제외됨** — 이를 이용해 특정 영역을 PDF에서 빼기

### 3-3. 강제 페이지 넘김 (`data-pdf-newpage`)
- 특정 섹션을 항상 새 페이지에서 시작하려면 `data-pdf-newpage` 속성 추가
- 예: `<div data-pdf-section data-pdf-newpage>` → 무조건 새 페이지
- 큰 표나 독립적인 분석 영역에 사용

### 3-4. 페이지 경계 처리
- 섹션이 현재 페이지에 안 들어가면 자동으로 새 페이지
- 한 페이지보다 큰 섹션은 페이지 단위로 슬라이스하여 출력 (canvas를 잘라서 여러 페이지에 배치)
- 섹션 간 여백: 4mm

### 3-5. A4 설정
```ts
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2; // 190mm
```

### 3-6. html2canvas 옵션
```ts
{ scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff' }
```
- **`scale: 1.5` 권장** — 2로 하면 넓은 대시보드에서 canvas 메모리 초과로 다운로드 실패 가능
- `backgroundColor`를 명시하지 않으면 투명 배경으로 캡처되어 PDF에서 검게 나올 수 있음

### 3-7. 파일 저장
- `pdf.save()` 대신 **blob URL + `<a>` 클릭 방식** 사용 (브라우저 호환성 및 안정성)
```ts
const blob = pdf.output('blob');
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = filename;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
```

---

## 4. PDF 캡처 전 UI 정리 (중요)

PDF는 화면 캡처 방식이므로, 캡처 시점의 화면 상태가 결과물에 직접 영향을 미칩니다.

### 4-1. pdfCaptureMode 플래그
- 상태관리 store(zustand 등)에 `pdfCaptureMode: boolean` 플래그 추가
- PDF 버튼 클릭 시 `true` → 캡처 완료/실패 시 `false`로 복원
- 컴포넌트에서 이 플래그를 구독하여 PDF용 렌더링을 조건 분기

### 4-2. 자동 접기/숨기기 대상
| 대상 | 처리 방식 |
|------|-----------|
| 입력 패널/사이드바 | store의 toggle 함수로 접기 → 캡처 후 복원 |
| 테이블 아코디언/드릴다운 | `pdfCaptureMode`이면 접힌 상태로 렌더링 |
| 업로드 안내/빈 placeholder | `pdfCaptureMode`이면 숨김 처리 |
| PDF에 불필요한 섹션 | `data-pdf-section` 속성 자체를 부여하지 않음 |

### 4-3. 타이밍
```
PDF 버튼 클릭
  → pdfCaptureMode ON + 패널 접기
  → 토스트 표시
  → setTimeout(500ms)
  → scrollIntoView (버튼 영역으로 이동)
  → setTimeout(1500ms)
  → 이중 requestAnimationFrame (레이아웃 완전 안정화)
  → html2canvas 캡처 시작
  → 캡처 완료
  → finally: pdfCaptureMode OFF + 패널 복원
```

### 4-4. 복원은 반드시 `finally`에서
- 캡처 실패해도 UI가 원래 상태로 돌아와야 함
- `panelWasOpen` 등 복원에 필요한 변수는 try 밖에서 선언

---

## 5. PDF 전용 콘텐츠

### 5-1. PDF 전용 안내 문구
- `pdfCaptureMode`일 때만 렌더링되는 안내 문구를 섹션 하단에 추가
- 일반 화면에서는 보이지 않고 PDF 출력물에만 포함
- 예: "* PDF에서는 상품 성과가 구분 단위로 표시됩니다. 상세 내역은 엑셀 다운로드를 이용해주세요."
```tsx
const PdfCaptureNotice: React.FC = () => {
  const pdfCaptureMode = useStore((s) => s.pdfCaptureMode);
  if (!pdfCaptureMode) return null;
  return (
    <p className="text-sm text-gray-400 text-left mt-1 pb-4">
      * 안내 문구
    </p>
  );
};
```

### 5-2. PDF에서 제외할 영역
- `data-pdf-section` 미부여: 해당 영역이 캡처 대상에서 완전 제외
- `pdfCaptureMode` 조건부 숨김: 섹션 자체는 캡처되지만 내부 특정 요소만 숨김

---

## 6. CSS/레이아웃 주의사항 (PDF 품질)

### 6-1. 텍스트 잘림 방지
- **`truncate` 클래스 주의** — 화면에서는 말줄임이 자연스럽지만 PDF에서는 잘린 채 출력됨
- PDF에 포함되는 제목/라벨에는 `truncate` 사용 금지, 줄바꿈 허용
- 긴 텍스트는 `break-keep` 또는 자연 줄바꿈으로 처리

### 6-2. 스크롤 영역
- `overflow-y: auto`나 `max-height`가 있는 영역은 html2canvas가 **보이는 부분만** 캡처
- PDF에 전체 내용을 포함하려면 `pdfCaptureMode`일 때 스크롤 제한 해제 고려

### 6-3. 하단 여백
- 섹션 마지막 요소가 PDF 페이지 하단에서 잘릴 수 있음
- 마지막 요소에 `pb-4` 이상의 하단 패딩 추가

### 6-4. Tailwind 커스텀 테마 주의
- 커스텀 테마에서 색상을 덮어씌우면 기본 색상 스케일(`red-600` 등)이 사라질 수 있음
- 예: `red`를 커스텀 색상으로 정의하면 `bg-red`은 되지만 `bg-red-600`은 안 됨
- 버튼 색상은 프로젝트의 tailwind config를 확인 후 적용

---

## 7. 버튼 UI 규칙

### 7-1. 색상
- 엑셀 버튼: 초록 계열 (`bg-emerald-600` 또는 커스텀 초록)
- PDF 버튼: 빨강 계열 (`bg-red-600` 또는 커스텀 빨강)
- 두 버튼 모두 `font-medium shadow-sm`으로 시인성 확보

### 7-2. 상태별 처리
| 상태 | 처리 |
|------|------|
| 비활성 (데이터 없음) | 동일 색상 + `opacity-40 cursor-not-allowed` |
| 로딩 중 | 스피너 아이콘 (`animate-spin`) + disabled |
| 오류 발생 | 버튼 옆에 빨간 텍스트로 에러 메시지 표시 |

### 7-3. 토스트 메시지
- PDF 다운로드 시 토스트로 상태 안내 (예: "PDF 생성: 입력 패널을 접고, 상품은 구분 단위로 표시됩니다")
- 표시 시간: 6초
- 버튼 영역으로 `scrollIntoView({ behavior: 'smooth', block: 'center' })` 자동 스크롤
- 위치: 버튼 컨테이너 위 (`absolute -top-10 right-0`)

---

## 8. 에러 처리 원칙

### 8-1. 엑셀
- `XLSX.writeFile` 실패 시 catch에서 사용자 친화적 메시지 표시
- 원본 에러는 로깅만 하고 유저에게는 "파일 생성에 실패했습니다. 다시 시도해주세요." 표시

### 8-2. PDF
- html2canvas 또는 jsPDF 실패 시 동일하게 사용자 친화적 메시지
- **캡처 실패해도 UI 복원이 최우선** — finally 블록에서 반드시 처리
- 이미 "파일 생성에 실패" 메시지를 포함한 에러는 그대로 전달, 아닌 경우 래핑

### 8-3. 다운로드 실패 대응
- `pdf.save()` 방식은 한글 파일명이나 대용량에서 실패 가능 → blob URL 방식 필수
- canvas 메모리 초과: `scale` 값을 낮추거나 섹션 분리로 개별 캡처 크기 줄이기
- 패널/사이드바가 열린 채 캡처하면 DOM이 너무 넓어 실패 가능 → 자동 접기 필수

---

## 9. 체크리스트 (구현 시 확인)

### 엑셀
- [ ] 숫자가 number 타입으로 저장되는가 (문자열 아닌지)
- [ ] 비율이 0~1 소수 + `0.0%` 서식으로 되어있는가
- [ ] 시트 이름 31자 제한 및 금지 문자 처리
- [ ] 컬럼 너비(`!cols`) 설정 완료

### PDF
- [ ] `data-pdf-section`으로 섹션 분리 완료
- [ ] PDF에 불필요한 영역은 `data-pdf-section` 미부여
- [ ] `pdfCaptureMode` 플래그 구현 및 store에 추가
- [ ] 패널/아코디언 자동 접기 + finally 복원
- [ ] `truncate` 클래스가 PDF 대상 텍스트에 없는지 확인
- [ ] 토스트 메시지 + scrollIntoView 구현
- [ ] PDF 전용 안내 문구 필요 시 추가
- [ ] blob URL 방식 파일 저장
- [ ] html2canvas scale 1.5 설정

---

## 참조 코드

- `ReportService.ts` — 엑셀/PDF 생성 로직 (참고용, 프로젝트에 맞게 수정)
- `DownloadButtons.tsx` — 다운로드 버튼 UI + pdfCaptureMode + 토스트 + 자동 접기 (참고용)
