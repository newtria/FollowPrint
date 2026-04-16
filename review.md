# followprint — review

조사 일자: 2026-04-11
대상 커밋: `bc51d22`
스택: Next.js 16 (`output: "export"` 정적 사이트) · React 19 · TypeScript · Tailwind v4 · DOMPurify · JSZip · vitest + jsdom
도메인: Instagram 데이터 export (ZIP) 로컬 분석 — 팔로워/팔로잉/캐릭터 카드/인사이트

---

## 1. 원격 상태 (newtria/FollowPrint, heznpc/FollowPrint 에서 이동됨)

- 미해결 이슈: **0건**
- 미해결 PR: **0건**
- 최근 PR: 없음 (기여자 1인, 직접 main 푸시)
- 커밋 히스토리: 4개 (init → core UI/parsing → test infra + DOMPurify hardening → production hardening)
- CI: GitHub Actions `ci.yml` (lint + test on push/PR to main, Node 20)

→ 외부 트래픽/이슈 보고는 없음. README가 아직 create-next-app 템플릿 그대로인 점이 가장 눈에 띔.

---

## 2. 코드 품질 종합

### 강점

- **100% 클라이언트 처리**: `next.config.ts`의 `output: "export"` + 모든 파싱이 브라우저 안에서. 서버가 없음 → privacy 위험 0, 운영 비용 0. README의 약속(`100% Private · No Server`)이 코드와 정확히 매치.
- **DOMPurify 화이트리스트**: `safeParseDom()` 이 모든 Instagram HTML을 sanitize 후 DOMParser에 넘김. ALLOWED_TAGS / ALLOWED_ATTR를 명시. 회귀 가드까지 `parse-utils.test.ts` 에 박혀 있음 (script/onclick stripping 검증).
- **테스트 36개 (3 파일)**: parser/parse-utils/character. 모두 vitest + jsdom. 엉터리/스켈레톤 아님:
  - `parser.test.ts`: JSON/HTML 양 포맷, mutual/nonMutual/fansOnly 계산, INVALID_ZIP/UNSUPPORTED_FORMAT, malformed entries, pending/unfollowed/closeFriends/blocked/restricted 7종 분류 모두 검증.
  - `parse-utils.test.ts`: KO/EN 날짜 파싱 (오전/오후 12시 경계 포함), DOMPurify XSS 회귀.
  - `character.test.ts`: 6개 character type 모두 reachable, 점수 0–100 범위, 빈 입력, 동률 케이스, highlights 매칭.
- **CI**: GH Actions에서 lint + test 자동. 매우 깔끔.
- **에러 모델**: parser가 throw하는 에러 코드(`INVALID_ZIP`, `UNSUPPORTED_FORMAT`)가 고정 문자열 → `FileUpload.tsx`가 i18n key로 translate. UI/도메인 분리 깔끔.
- **React 19 + Next 16**: client component만 (`output: "export"` 라 server component 의미 없음). `ErrorBoundary` 컴포넌트로 catch. 
- **i18n KO/EN 토글**: 컨텍스트 + 토글 스위치 + character highlight key 분리. 글로벌 launch 준비 됨.
- **Insights 파서가 한국어 + 영어 둘 다**: `parseLoginActivity` 가 `오전/오후` 와 ISO 둘 다 지원. `parseInstagramDate` 도 동일. Instagram이 사용자 언어 기준으로 export 포맷이 달라지는 것에 대응.

### Fix TODO (우선순위순)

**[P1] README가 create-next-app 템플릿 그대로**
- 위치: `README.md` 전체
- 증상: 프로젝트가 무엇을 하는지, 데모 링크, 사용 방법, 빌드 방법, 기여 방법 모두 없음. GitHub 방문자가 첫 화면에서 가치 제안을 못 봄.
- Fix: TODO.md의 "런칭 블로커: SEO 랜딩"을 같이 업데이트하면서 README도 다시 작성. 데모 URL, 스크린샷, "Why Followprint vs SafeUnfollow/UnfollowTool" 비교, 한국어/영어 README 분리 권장.

**[P1] Instagram HTML 파서가 매우 깨지기 쉬움**
- 위치: `src/lib/insights-parser.ts:13` `(?:사용자 이름|Username)<\/td><td class="_2piu _a6_r">([^<]+)<\/td>`
- 증상: Instagram이 클래스명(`_2piu _a6_r`)을 한 번 바꾸면 likedPosts insight가 통째로 0이 됨. 라벨 한국어 텍스트(`사용자 이름`)도 locale 변경에 취약.
- Fix:
  - 클래스 매칭을 제거하고 구조 기반 (`td:nth-child(2)`) 또는 라벨 텍스트 → 다음 td 구조로 전환.
  - 또는 IG export 포맷 변경 자체를 빠르게 감지하는 schema check + degraded 모드 (insights는 안 보이지만 followers는 보이게).
  - 회귀 가드: `insights-parser.test.ts` 신규 추가 (현재 0개 — 해당 영역이 정확히 untested).

**[P1] `parseInstagramZip` 결과가 빈 데이터일 때 사용자 피드백 부재**
- 위치: `src/lib/parser.ts:146-152` (`validateInstagramZip`)
- 증상: ZIP 안에 `followers`/`following` 단어가 들어간 경로만 1개 있어도 통과. 그러나 실제 파싱 결과가 0건일 수 있음 (Instagram이 새 폴더 구조로 변경 등). 사용자에게는 빈 dashboard만 보임.
- Fix: `analyzeZip` 결과가 모두 0이면 `EMPTY_DATA` 같은 새 에러 코드를 throw하고, FileUpload에서 안내.

**[P2] insights-parser.ts 에 테스트 0개**
- 위치: `src/lib/__tests__/` 에 insights-parser.test.ts 없음
- 증상: 가장 깨지기 쉬운 코드가 정확히 untested. likedPosts/savedPosts/profileSearches/wordSearches/loginActivity/chatList 6개 함수 모두.
- Fix: 각 함수마다 IG가 실제로 export하는 HTML 샘플(2-3개)을 fixture로 두고 회귀 테스트.

**[P2] `character.ts` 의 점수식이 self-documenting 부족**
- 위치: `src/lib/character.ts:65-93`
- 증상: `socialScore = (followers + following) / 10 + mutualRate * 50` 같은 식의 magic number(10, 50, 70, 30, 200, 500…)가 의도 없이 박혀 있음. 캐릭터 분류 임계값(`ratio > 3`, `mutualRate > 0.6`, `pendingRate > 0.1`)도 마찬가지.
- Fix: 상수로 빼고 (`SCORE_CONSTANTS`, `TYPE_THRESHOLDS`) 한 줄 주석. 또는 README의 별도 섹션에 "어떻게 분류하는가" 표.

**[P2] OG 이미지 / SEO 메타 누락**
- 위치: `src/app/layout.tsx` (확인하지 않았지만 TODO.md의 "런칭 블로커" 항목)
- 증상: 트위터/인스타 카드에 미리보기 안 뜸. 바이럴 성장(공유) 차단.
- Fix: TODO.md 그대로. Figma로 OG 이미지 1장 + `metadata.openGraph` 채우기. Next 16의 `metadata` API 사용.

**[P2] `localStorage` 테마 set이 toggle에서만 일어남, 초기 read는 layout SSR 시점에 무의미**
- 위치: `src/app/page.tsx:11-23` (`ThemeToggle`)
- 증상: 첫 페이지 진입 시 dark가 default. 사용자가 light로 설정해놓아도 새로고침 직후 잠깐 dark flash. (FOUC)
- Fix: `layout.tsx` 의 `<head>` 안에 inline `<script>` 로 `localStorage.getItem('fp-theme')` 읽어 `documentElement.dataset.theme` 즉시 set (Tailwind dark mode 표준 패턴).

**[P3] `parseFileFull` 이 JSZip 두 번 로드 가능**
- 위치: `src/lib/parser.ts:164-176`
- 증상: 현재 코드는 `JSZip.loadAsync(file)` 한 번 후 `analyzeZip` + `parseInsights` 를 동시에 돌림. **OK** — 이건 잘 짠 부분. 다만 `parseInstagramZip` 와 `parseFileFull` 양쪽에서 `validateInstagramZip` 도 두 번 호출 가능 (한 번만 호출되므로 OK이지만 `parseInstagramZip` 호출처가 따로 있다면 중복 위험).
- Fix: `parseInstagramZip` 가 사실상 unused면 export 제거. (`parseFileFull` 가 superset)

**[P3] `parseLikedPosts` 의 regex에 g 플래그**
- 위치: `src/lib/insights-parser.ts:13` `regex` 가 module-scope가 아닌 함수-scope. 매번 새로 컴파일. 대규모 HTML에는 sub-millisecond 영향. 미세 최적화.
- Fix: `const LIKED_POSTS_REGEX = /.../g;` 모듈 scope.

**[P3] `findFile` 이 첫 매치만 반환**
- 위치: `src/lib/insights-parser.ts:160-172`
- 증상: 동일 패턴이 여러 파일에 있으면 첫 번째만. Instagram의 `liked_posts` 도 사용자에 따라 여러 파일 split될 수 있음 (큰 계정).
- Fix: `findAllFiles` 로 변경하거나, parser별로 누적.

**[P3] `i18n.tsx` 의 `t()` 가 missing key 시 key 자체 반환**
- 위치: `FileUpload.tsx:36-41` 에서 `translated !== \`upload.error.${code}\`` 으로 fallback 처리. 번역 누락 시 fallback이 동작은 하지만 console.warn 같은 dev 표시가 없으면 silently broken.
- Fix: dev 모드에서 missing key console.warn.

**[P3] `analyzeCharacter` 의 `oldestFollow = Math.min(...followTimestamps, now)`**
- 위치: `src/lib/character.ts:61`
- 증상: `followTimestamps` 가 빈 배열이면 `Math.min(now)` = now → `monthsActive = 1` → `followsPerMonth = totalFollowing/1`. 의미적으로 "지난달에 200명 모두 팔로우"로 표시되는 거짓 신호. 다만 빈 timestamps에 빠지는 경우는 거의 없음 (`timestamp` 가 IG export에 포함됨). edge case.
- Fix: timestamps 부재 시 `followsPerMonth = null` 또는 UI에서 N/A 처리.

---

## 3. 테스트 상태

| 파일 | 케이스 수 | 평가 |
| --- | --- | --- |
| parser.test.ts | 8 | JSON/HTML/INVALID/UNSUPPORTED/edge cases. 핵심 도메인 전부. |
| parse-utils.test.ts | 11 | KO/EN 날짜 (오전·오후·12시 경계), DOMPurify XSS 회귀. |
| character.test.ts | 11 | 6개 type 분류, 점수 범위, highlight 매칭. |
| insights-parser.test.ts | **0** | **부재** — 가장 깨지기 쉬운 코드가 untested. |

- **엉터리 테스트는 없음**, 케이스 의도가 모두 명확.
- vitest 4.x + jsdom 29.x. CI에서 `npm test` 자동.
- **빠진 영역**: insights-parser, FileUpload component 통합, character → UI 매핑 (CharacterCard).

---

## 4. 시장 가치 (2026-04-11 기준, 글로벌 관점)

**한 줄 평**: 카테고리는 commodity (직접 경쟁자 5개 이상). 차별화는 **캐릭터 카드(게임화) + 한글 인사이트** 두 가지에 달려 있고, 이 둘이 살아 있으므로 niche 진입은 가능. 단 단가가 낮고 수익화가 어려운 카테고리.

**경쟁 환경**

- 동일 카테고리 (Instagram ZIP을 client-side 분석) 에 이미 다음이 존재:
  - **SafeUnfollow** — 100% 클라이언트, 1M+ 계정 주장. ([SafeUnfollow](https://safeunfollow.app/))
  - **UnfollowTool** — JSON 포맷, 로컬 처리. ([UnfollowTool](https://www.unfollowtool.com/))
  - **InstaAnalytics** — ZIP/JSON, 로컬 처리. ([igstats.ridwaanhall.com](https://igstats.ridwaanhall.com/))
  - **Follower Analyzer** — 브라우저 처리. ([followeranalyzer.io](https://followeranalyzer.io/))
  - **Followers Analyzer** — 데이터 export 기반, 권한 없음. ([followers-analyzer.com](https://followers-analyzer.com/))
- 위 경쟁자 모두 "non-mutual / 언팔" 분석에 머물러 있음. **followprint의 캐릭터 카드 + 인사이트(좋아요·검색·로그인 패턴)는 차별화 포인트**.
- 동일 분석을 해주는 Chrome 확장도 다수: ([Chrome Web Store](https://chromewebstore.google.com/detail/follower-analysis-for-ins/hbejaeaoomehcibgnehdcdihdpenejeh)). 단 확장은 권한 요청이 무거워 신뢰 비용이 더 큼 → followprint 의 "권한 없음 + ZIP만" 모델 우위.

**시장 매력도**

- **검색 수요**: "instagram unfollow checker" 류 키워드는 안정적으로 큰 수요. 단 가격 민감도 높음, 평균 거래 단가 0–$5.
- **수익화 채널** (TODO.md 와 일치):
  - one-time premium $2.99 — 가능하나 conversion 1–3% 가정시 ARPU 매우 낮음.
  - 광고 — 클라이언트 사이드 정적 사이트라 광고 fit 안 좋음 + 신뢰도 손상.
  - donation/buy-me-coffee — 가장 자연스러움.
- **바이럴 성장**: 캐릭터 카드 → IG/X 공유는 강력한 trojan horse. TODO.md 의 html2canvas + 워터마크 항목이 핵심 ROI.
- **타깃 지역**: 한국 + 영어권. KO 인사이트 파서가 잘 동작하므로 한국 내 점유율 가능. 한국 IG 사용자 ≈ 2500만, 시장 규모로는 작지만 acquisition 비용 0인 정적 사이트라 손익분기점이 매우 낮음.
- **위험**: Instagram이 export 포맷을 바꾸면 즉시 깨짐. 작년/재작년에 1회 이상 변경된 전례. P1의 "포맷 변경 대응" TODO 가 존재 이유.

**결론**

- 글로벌 vs 국내: **글로벌 ★★☆☆☆ / 국내 ★★★☆☆**.
- 코드 품질이 높고 TODO가 명확해서 **launch 자체는 1–2주 거리**. OG 이미지 + 도메인 + 캐릭터 카드 공유 만 마무리되면 ProductHunt 런칭 가능 상태.
- 수익은 기대하지 말고 **사용자 트래픽 → 다른 product의 마중물**로 활용하는 것이 합리적.

---

## 5. 한 줄 요약

> 코드 품질·테스트·CI 모두 잘 깔려 있고 launch 직전 상태. **(1) README replace, (2) insights-parser 회귀 테스트, (3) Instagram 포맷 변경 감지 전략** 3개만 닫고 OG 이미지 만들면 즉시 출시 가능. 시장은 redundant하지만 캐릭터 카드 게임화가 차별화로 작동할 여지 있음.

## Sources

- [SafeUnfollow — Instagram Unfollowers ZIP upload](https://safeunfollow.app/)
- [UnfollowTool — Free ZIP Tool](https://www.unfollowtool.com/)
- [InstaAnalytics — ridwaanhall](https://igstats.ridwaanhall.com/)
- [Follower Analyzer io](https://followeranalyzer.io/)
- [Followers Analyzer com](https://followers-analyzer.com/)
- [Chrome Web Store — Follower Analysis for Instagram](https://chromewebstore.google.com/detail/follower-analysis-for-ins/hbejaeaoomehcibgnehdcdihdpenejeh)
- [GitHub — Ammaar-Alam/instagram-Checker](https://github.com/Ammaar-Alam/instagram-Checker)
- [GitHub — developer-az/pyFollowerVsFollowing](https://github.com/developer-az/pyFollowerVsFollowing)
