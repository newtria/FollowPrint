# followprint

> Instagram 데이터 export ZIP 한 개를 끌어다 놓으면 팔로우 관계와 활동 패턴을
> 그 자리에서 분석한다. **모든 처리는 브라우저 안에서 끝난다 — 서버 없음, 업로드 없음, 로그인 없음.**

## 무엇을 보여주는가

| 영역 | 내용 |
| --- | --- |
| 관계 분석 | 맞팔(`mutual`) / 내가만 따르는(`nonMutual`) / 팬만(`fansOnly`) / 보류 / 최근 언팔 / 친한 친구 / 차단 / 제한 |
| 캐릭터 카드 | 6개 캐릭터 타입 (Influencer / Butterfly / Observer / Selective / Explorer / Minimalist) + 4개 점수 (Social / Loyalty / Curiosity / Selectivity) + 활동 시간대 + 월간 팔로우 속도 |
| 인사이트 | 좋아요 많이 누른 계정 Top 20, 저장 게시물 Top 20, 프로필 검색 / 단어 검색 기록, 24시간 로그인 분포, 채팅 상대 |

## 데이터를 어떻게 받는가

1. Instagram 앱 → **설정 → 내 정보 및 권한 → 정보 다운로드**
2. 형식: **JSON** (HTML도 호환)
3. 데이터 종류: 모두 또는 `followers_and_following + activity` 만
4. 받은 ZIP 파일을 followprint 페이지에 끌어다 놓는다

## 개인정보

- ZIP 안의 모든 파일은 **`JSZip` 으로 브라우저에서 직접 풀고 파싱한다**
- 네트워크 요청은 폰트와 정적 자산 외에 **0건**
- HTML 파싱 단계는 모두 `DOMPurify` 의 명시적 화이트리스트 (a, div, span, p, td, tr, table, ...) 를 통과한 뒤에만 DOMParser에 도달한다
- 새로고침하면 데이터는 메모리에서 사라진다

## 기술 스택

- **Next.js 16** (App Router, `output: "export"` — 정적 사이트)
- **React 19** + TypeScript strict
- **Tailwind v4**
- **JSZip** + **DOMPurify** + **vitest** + **jsdom**
- **i18n**: 한국어 / 영어 토글, Instagram export 의 KO/EN 날짜 포맷 모두 파싱

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 정적 사이트 빌드 (out/ 에 떨어짐)
npm test         # vitest run
npm run lint     # eslint
```

## 테스트

`src/lib/__tests__/` 안에 vitest 케이스가 있다:

- `parser.test.ts` — JSON / HTML 양 포맷 + mutual / nonMutual / fansOnly 계산 + INVALID_ZIP / UNSUPPORTED_FORMAT / malformed entries + 7종 분류 (pending / unfollowed / closeFriends / blocked / restricted)
- `parse-utils.test.ts` — KO / EN 날짜 (오전·오후·12시 경계) + DOMPurify XSS 회귀 (script / onclick stripping)
- `character.test.ts` — 6개 캐릭터 타입 분류 + 점수 0~100 범위 + highlight 매칭 + 빈 입력 / 동률 케이스
- `insights-parser.test.ts` — likedPosts / savedPosts / profileSearches / wordSearches / loginActivity / chatList 회귀 가드

CI (`.github/workflows/ci.yml`) 에서 push / PR 마다 자동 실행한다.

## 캐릭터 분류 기준

| 타입 | 조건 |
| --- | --- |
| **Influencer** | followers / following 비율 > 3 AND followers > 500 |
| **Selective** | following < 200 AND mutual / following > 0.6 |
| **Explorer** | pending / (pending + following) > 0.1 |
| **Butterfly** | following > 300 AND mutual / following > 0.5 (또는 default with mutualRate > 0.5) |
| **Observer** | following > 300 AND mutual / following < 0.3 (또는 default) |
| **Minimalist** | following < 100 AND followers < 100 |

`src/lib/character.ts` 에 정의되어 있다.

## Instagram 포맷 변경 대응

Instagram 은 가끔 export 디렉토리 구조와 HTML 클래스명을 바꾼다. 회귀가 발생하면
`src/lib/__tests__/parser.test.ts` 와 `insights-parser.test.ts` 가 먼저 깨지고,
`parser.ts` 의 `validateInstagramZip` 가 새로운 경로 패턴을 받아들이지 못하면
사용자에게 `INVALID_ZIP` 또는 `EMPTY_DATA` 가 노출된다. 두 함수 중 하나가
fail 하면 IG export 형식 변경을 의심해야 한다.

## License

MIT
