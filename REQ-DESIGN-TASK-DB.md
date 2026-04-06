# DB 연동 후 진행 항목

> 이 문서는 DB 연동 완료 후에 진행할 요구사항/설계/태스크를 모아놓은 문서입니다.
> 현재 구현 범위에 포함되지 않습니다.

---

## REQ: 요구사항

### REQ-7: AI 분석 (기획 의도 vs 결과 및 Next Action)

담당자가 입력한 기획 의도가 실제로 구현되었는지 확인하고, 수치 변화가 큰 지표에 대한 자동 브리핑과 다음 행사 액션을 추천한다.

**Acceptance Criteria:**
1. 대시보드 최하단에 배치
2. Planning_Intent 텍스트를 섹션 상단에 표시
3. AI_Analyzer가 Planning_Intent + Performance_Result를 결합하여 기획 의도 평가 코멘트 생성
4. 목표 대비 변화폭이 가장 큰 지표를 자동 식별하여 브리핑 텍스트 생성
5. 다음 행사에서 유지/개선할 전략을 각각 1개 이상 포함하는 Next Action 제언 생성
6. 유입, 재고, 전환율 등 행사 데이터에 없는 외부 지표는 분석 제외
7. API 호출 실패 시 "AI 분석을 일시적으로 사용할 수 없습니다" 메시지 표시, 나머지 기능 정상 동작

### REQ-F1: 접근 암호 인증

- 사이트 접속 시 월별 암호를 입력해야 진입 가능한 인증 화면 제공
- 매월 1일 자정에 암호를 자동으로 새로 생성하여 갱신
- 갱신된 암호를 관리자 지정 이메일 주소로 자동 발송

### REQ-F2: 행사별 메모

- 각 행사 분석 레코드에 연결된 개인 메모 기능
- 행사 데이터가 DB에 저장된 이후 구현

### REQ-F3: AI 자동 분석

- 기획 의도 텍스트 + 수치 데이터를 결합하여 "의도가 실제로 구현됐는지" 평가
- Next Action 제언 생성
- ChatGPT 등 외부 AI API 연동 필요 (API 키 비용 발생)

### REQ-F4: Confluence 전송

- 분석 완료 후 대시보드에 "Confluence 전송" 버튼 표시
- 버튼 클릭 시 백엔드 서버(Node.js 프록시)를 통해 Confluence REST API 호출
- 지정된 Confluence 페이지(스페이스 키 + 부모 페이지 ID)에 행사별 섹션 누적 추가
- 전송 내용: 행사 컨텍스트 + KPI 수치 + 차트 이미지(html2canvas 캡처)
- 전송 완료 후 DB에 전송 여부 기록, 버튼 비활성화 (중복 전송 방지)
- Confluence 연결 정보(Atlassian URL, 스페이스 키, 부모 페이지 ID, API 토큰, 이메일)는 서버 환경변수로 사전 설정
- 전송 실패 시 오류 메시지 표시 + 버튼 재활성화

### REQ-F5: 행사명 DB 드롭다운

- DB에서 이전 행사 목록을 불러와 드롭다운으로 선택
- 새 행사 입력도 가능
- 배포2에서만 진행

---

## DESIGN: 설계 방향

### AI 분석 (REQ-7, REQ-F3)

- 외부 AI API (OpenAI GPT 등) 연동
- 백엔드 프록시 서버 필요 (API 키 노출 방지)
- 프롬프트: KPI 수치 + 기획 의도 텍스트를 입력으로 평가/브리핑/Next Action 생성

### 인증 (REQ-F1)

- DB에 월별 암호 저장
- 백엔드 API: 암호 검증, 자동 갱신 cron job
- 이메일 발송: nodemailer 또는 외부 메일 서비스

### Confluence 연동 (REQ-F4)

- Node.js 백엔드 프록시 서버
- Confluence REST API v2 사용
- html2canvas로 차트 캡처 → 이미지 첨부

### 데이터 영속성

- Repository 패턴 이미 구현됨 (IPromotionRepository, ICommentRepository)
- localStorage 구현체 → DB 구현체로 교체
- 후보: Vercel Postgres (Neon), Supabase 등

---

## TASK: 태스크 (DB 연동 후)

- [ ] DB 선정 및 스키마 설계
- [ ] Repository DB 구현체 작성 (localStorage → DB 교체)
- [ ] 백엔드 프록시 서버 구축 (Node.js)
- [ ] REQ-F1: 접근 암호 인증 구현
- [ ] REQ-F5: 행사명 DB 드롭다운 구현
- [ ] REQ-F2: 행사별 메모 기능 구현
- [ ] REQ-7/REQ-F3: AI 분석 API 연동
- [ ] REQ-F4: Confluence 전송 기능 구현
