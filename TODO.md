# FollowPrint 상용화 TODO

> 2026-04-03 기준 | 완성도 ~83%

## 런칭 블로커

- [ ] 프로덕션 배포 (Vercel/Cloudflare Pages + 커스텀 도메인)
- [ ] OG 이미지 에셋 생성 (캐릭터 카드가 미리보기로 표시)
- [ ] SEO 랜딩 페이지
- [ ] Instagram 데이터 포맷 변경 대응 (JSON + HTML 호환성)

## 바이럴 성장

- [ ] 캐릭터 카드 → Instagram Story/X 공유 (html2canvas + 워터마크)
- [ ] 친구 비교 기능 (두 ZIP 비교)
- [ ] 시간 경과 분석 (여러 시점 ZIP → 추세 그래프)

## 수익화

- [ ] 프리미엄 분석 (one-time $2.99) — 상세 인사이트, DM 분석
- [ ] Lemon Squeezy 연동 (라이선스 키 → 로컬 검증, 서버 최소화)

## 마케팅

- [ ] Product Hunt 런칭
- [ ] X/Instagram 티저 (샘플 캐릭터 카드)

## 제작 병목 주의

- **OG 이미지**: 디자인 도구(Figma/Canva)로 제작. AI 코딩 도구로 이미지 생성 X
- **배포 설정**: Vercel은 설정 파일 몇 줄로 끝남. 이건 빠르게 처리 가능
- **html2canvas 공유**: 브라우저별 렌더링 차이 디버깅이 길어질 수 있음. 타겟 브라우저 한정해서 진행
