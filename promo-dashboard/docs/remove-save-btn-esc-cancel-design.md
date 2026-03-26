# 저장 버튼 제거 + ESC 분석 중단 - 설계

## 1. 저장 버튼 제거
- `PromotionContextForm.tsx`에서 submit 버튼 제거
- `handleSubmit`, `saved` state 등 관련 코드 정리
- `saveAndGet` ref 메서드는 유지 (분석 시 자동 저장에 사용)

## 2. ESC 분석 중단
- `App.tsx`에 AbortController 도입
- 분석 시작 시 AbortController 생성, ESC 키 이벤트에서 abort() 호출
- `promotionStore.analyze()`에 AbortSignal 전달
- 파싱 단계에서 signal.aborted 체크하여 중단
- 중단 시 isAnalyzing = false로 복원, 에러 메시지 없음

## 3. ESC 안내 UI
- `FileUploadPanel.tsx`에서 isAnalyzing 상태일 때 "ESC를 눌러 분석을 중단할 수 있습니다" 텍스트 표시

## 변경 파일
- `src/components/PromotionContextForm.tsx` — 저장 버튼 제거
- `src/App.tsx` — AbortController + ESC 키 리스너
- `src/stores/promotionStore.ts` — analyze에 signal 파라미터 추가
- `src/components/FileUploadPanel.tsx` — ESC 안내 문구 추가
