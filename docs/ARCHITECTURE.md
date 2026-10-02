# 正式版架構規劃

狀態：進行中，階段 0–4 已完成（階段 4 於 2026-10-02 完成）。已確定的技術決策以 `docs/DECISIONS.md` 的「Production build」為準；本文件說明怎麼實作。標示「預設」的項目尚可調整，改動時同步更新本文件。

## 1. 技術組成

| 層       | 選擇                                                                                             | 備註                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 框架     | Next.js 16（App Router）+ TypeScript（strict）                                                   | `output: "standalone"`；啟用 Cache Components（`use cache`、`cacheTag`）；`typedRoutes` |
| 資料庫   | PostgreSQL                                                                                       | 開發時用 Docker Compose 啟動                                                            |
| ORM      | Drizzle ORM + drizzle-kit                                                                        | 資料表定義在 `src/server/db/schema/`；migrations 提交在 `drizzle/`                      |
| 登入     | Auth.js + Drizzle Adapter                                                                        | Email 登入連結、Google（Apple 延後到上線後）；session 存在資料庫                        |
| 樣式     | CSS Modules + CSS 變數（預設）                                                                   | 變數取自 `prototype/styles.css` 的 A3 數值，放在 `src/styles/tokens.css`                |
| 驗證     | Zod                                                                                              | 所有 API 輸入、表單、環境變數都要驗證                                                   |
| 測試     | Vitest（單元測試）＋ Playwright（端對端測試）                                                    |                                                                                         |
| 套件管理 | pnpm（版本鎖定在 `package.json` 的 `packageManager`）                                            |                                                                                         |
| 寄信     | 開發用 Mailpit（docker compose）；正式環境的服務商待定                                           | 登入連結信件在 http://localhost:8025 查看                                               |
| CI       | GitHub Actions：`pnpm check`、e2e（PostgreSQL + Mailpit + standalone build）、Docker image build |                                                                                         |
| 部署     | Docker image；上線前再選 GCP、AWS 或自架                                                         | 開發期間避免使用特定平台的 API                                                          |

## 2. 資料夾結構

```
/
├─ prototype/              A3 原型（視覺參考，不再當作產品開發）
├─ docs/                   決策、架構、交接文件
├─ drizzle/                drizzle-kit 產生的 migrations（提交進 repo）
├─ scripts/                CLI：import-epubs、promote-admin、e2e-prepare、start-standalone
├─ src/
│  ├─ app/
│  │  ├─ (site)/           讀者端（有頁首）：/、/search、/works/[id]（之後加書架、紀錄、我的）
│  │  ├─ (reader)/         沉浸式閱讀器：/works/[id]/chapters/[position]
│  │  ├─ admin/            後台（限 admin 角色）
│  │  └─ api/              auth/（Auth.js）、admin/import、v1/（公開 API，之後給 App 共用）
│  ├─ server/
│  │  ├─ db/               client.ts（工廠）、index.ts（server-only）、schema/
│  │  ├─ content/          純邏輯：EPUB 解析、分類、匯入計畫、可見性、表單 schema
│  │  ├─ services/         商業邏輯（傳入 db）：catalog、content-import、admin-content、audit、health
│  │  ├─ catalog.ts        公開資料的快取層（use cache＋cacheTag）
│  │  ├─ authz.ts          requireAdmin / adminOrResponse
│  │  ├─ auth.ts           Auth.js 設定
│  │  └─ cache-tags.ts     快取標籤
│  ├─ components/          頁首、封面、作品列表、章節目錄、閱讀器控制
│  ├─ lib/                 格式化等共用工具
│  ├─ i18n/                messages/zh-Hant.ts + t()（預留 zh-Hans、en、ja，須符合同一型別）
│  └─ styles/              tokens.css（A3 設計變數）
├─ tests/e2e/              Playwright（獨立的 <db>_e2e 資料庫）
├─ Dockerfile              deps / migrator / builder / runner
├─ docker-compose.yml      db、mailpit、migrate、app
└─ .env.example            所有環境變數（不含真實值）
```

**API 分層原則**：商業邏輯只寫在 `src/server/services/`。頁面、Server Actions、`api/v1` 路由都只負責驗證輸入、檢查身分，再呼叫 service。這樣將來 App 打 `api/v1` 時，拿到的是同一套邏輯。

## 3. 資料模型（首版）

```
User            id, email, name, image, role(READER|ADMIN), tier(FREE…),
                birthDate?, ageVerifiedAt?, createdAt, suspendedAt?
Account / Session / VerificationToken   ← Auth.js 標準表
UserPreference  userId, readerFontSize, readerTheme, readerFont, lineHeight,
                pageWidth, showSexual, showViolence, showBadge

── 階段 1 已實作（src/server/db/schema/content.ts）──
authors         id, name(unique)                     無作者帳號，只用來顯示；書名／作者名有 trigram 索引
works           id(數字，用於網址), title, authorId?, synopsis, status(ongoing|completed),
                hasSexual, hasViolence, coverKey?(null＝自動產生文字封面), sourceKey(unique，匯入比對用)
tags, work_tags 分類標籤，多對多
chapters        id, workId, position(1 起算，等於公開章號), title(原樣保存), kind(chapter|note),
                status(draft|published|hidden), publishAt?, wordCount, contentHash
                unique(workId, position)；最新更新時間由查詢計算，不另存欄位
chapter_contents chapterId, body                     純文字、一行一段；查目錄時不用載入內文
audit_logs      actorId?, actorLabel, action, entityType, entityId, detail(jsonb)

── 階段 3、4 已實作 ──

BookshelfItem   userId, workId, createdAt            PK(userId, workId)
ReadingProgress userId, workId, currentChapterPosition, furthestChapterPosition,
                scrollProgress(0–10000), updatedAt,
                hiddenFromHistoryAt?                 進度與閱讀紀錄共用；移除紀錄不影響進度
Bookmark        userId, chapterId, createdAt

VisitorIdentity cookieId, ipHash, traitHash, firstSeenAt, lastSeenAt   IP／特徵只存 HMAC，不存原始資料
QuotaSetting    subject(VISITOR|FREE|…), chaptersPerWindow, windowHours  後台可調整章數
QuotaWindow     subjectKey, windowStart, windowEnd, used       視窗從第一次扣額度開始算 24 小時
QuotaCharge     id, windowId, chapterId, chargedAt   每次計費一筆；寬限期內重開同章不新增（見 4.3）
RateLimitWindow scope, key, windowStart, windowEnd, requests   PostgreSQL 短時請求計數
```

第二階段：Review、ReviewVote、Report、UserBlock、MembershipPlan、Subscription、Payment。首版資料表先保留 `tier` 欄位，可以不建這些表。

規模（2026-10-01 實際匯入）：29 部、5,460 章、約 1,484 萬字，PostgreSQL 處理這個量沒有壓力，全部匯入約 6 秒。搜尋使用 `pg_trgm` 對書名、作者做片段比對（內建全文搜尋不會斷中文詞）。

## 4. 主要流程

### 4.1 排程發布

章節對讀者可見的唯一條件：`status = published 且 publishAt <= now()`（`src/server/content/visibility.ts`，程式與 SQL 兩種寫法都有測試）。「排程」就是 published 加上未來的 publishAt，時間一到自然可見，**不需要排程程式（cron）**。首頁「最新更新」依各作品最新一章的可見時間排序。

快取：公開頁用 `use cache` + `cacheTag`（標籤定義在 `src/server/cache-tags.ts`）。後台存檔用 `updateTag`，匯入 API 用 `revalidateTag(tag, "max")`。CLI 匯入和排程到點都不會觸發失效，所以公開頁還要設短的 `cacheLife`（建議幾分鐘）。

### 4.2 公開與受保護內容

| 頁面                    | 渲染方式                     | 搜尋引擎收錄                              |
| ----------------------- | ---------------------------- | ----------------------------------------- |
| 最新更新（`/`）         | 每次請求產生，資料走快取     | 收錄                                      |
| 作品頁（`/works/{id}`） | App Shell＋按需快取          | 收錄；sitemap、canonical 等網域確定後補上 |
| 搜尋（`/search`）       | 請求時產生，結果依關鍵字快取 | `noindex`                                 |
| 章節閱讀頁              | 章節資訊快取；內文每次請求   | `noindex`；內文不進快取並逐次檢查額度     |

### 4.3 閱讀與額度

1. 讀者進入章節時，伺服器先辨識身分：
   - 已登入：以帳號為單位。
   - 訪客：簽章 Cookie + IP 雜湊 + 瀏覽器特徵雜湊。
2. 找出或建立這個身分的 `QuotaWindow`。視窗已滿 24 小時就開新視窗。
3. 每次向伺服器請求章節內文都計入額度（額度限制的是每日瀏覽量，讀過不等於取得重讀權）。只有在同一章上次計費後的寬限期內（`quota_settings.reread_grace_minutes`，預設 10 分鐘，後台可調）重新開啟才不重複扣，涵蓋重新整理、連點、返回等誤觸；寬限期從計費當下起算，不因重讀延長。額度還有剩就新增一筆 `QuotaCharge` 再顯示（2026-10-02 起同一章可有多筆）。
4. 額度用完：訪客與已登入使用者都只顯示額度恢復時間。**不設登入牆，也不提示註冊。** 已經載入的章節不會被中斷。
5. 首版停用所有章節連結的框架預取，讀者真的進入時才扣額度。未來若啟用預載，只能載入目前章節的下一章，且進入前不得扣額度。
6. 閱讀方式分兩種，讀者第一次進閱讀器時選擇（`user_preferences.reading_mode`，未選為 null；之後可在工具列 ⇣ 或「設定 › 閱讀」更改）：
   - **翻頁**：章末有上一章／下一章，換頁才請求下一章。
   - **連續**：讀者自己操作（滾輪、觸控、按鍵、指標）捲到頁面最底時，才向 `GET /api/v1/works/[id]/chapters/[position]` 要下一章；這支 API 與開啟章節頁走同一套額度與頻率檢查。開頁、恢復閱讀位置等程式捲動都不會觸發，一次只接一章，額度用完就在串流尾端顯示恢復時間。
7. 連續閱讀的記憶體：離視野超過 2 個畫面高的章節換成等高佔位框（DOM 釋放、文字留在本頁），捲回時從本頁記憶體重新顯示、不請求伺服器、不扣額度。本頁最多保留 30 章文字；被釋放的章節只在讀者按「重新載入」時才請求，並依第 3 點計費。

### 4.4 防爬蟲

- 依 IP 和帳號做請求頻率限制。首版用 PostgreSQL 計數；之後流量變大再改用 Redis。
- 前面加 Cloudflare（或其他 WAF）擋機器人。
- 應用層偵測到異常讀取速度時先暫停請求；正式部署接上 WAF 後可改為額外驗證挑戰。
- 目標是讓**大量自動抓取**變困難；真人手動複製在技術上無法完全阻止。

目前應用層以 5 分鐘固定視窗限制帳號／訪客 80 次、IP 400 次章節請求；較寬鬆的 IP 門檻用來容納共用網路。正式部署時再於前端加 Cloudflare／WAF。

### 4.5 內容分級

- 作品標記 `hasSexual`、`hasViolence`，預設依使用者偏好隱藏。
- 開啟性描繪內容前，必須填生日並確認年滿 18 歲；確認時間記在 `ageVerifiedAt`。

## 5. 後台

已完成（階段 1，`/admin`，限 admin 角色；每個頁面、Action、API 都各自呼叫 `requireAdmin()`／`adminOrResponse()`）：

- 總覽：作品數、章數、字數、公告、排程、草稿、隱藏，以及即將發布的章節清單。
- 作品：列表（依最新發布排序）；編輯書名、作者、簡介、連載狀態、分類標籤、內容分級。
- 章節：新增（接在最後一章之後）、編輯標題／類型／內文；發布方式有立即發布、排程（台北時間）、草稿、隱藏。
- EPUB 匯入：後台上傳後先預覽（新增、更新、未變更的章數，判定為公告和隱藏的章節），確認後才寫入；也可用 `pnpm content:import` 大量匯入（預設只預覽，加 `--apply` 才寫入）。
- 操作紀錄：所有寫入都記錄在 `audit_logs`。
- 閱讀額度：`/admin/quota` 調整訪客與 Free 會員每個 24 小時視窗的章數，並顯示已辨識訪客與有效視窗數。

之後再做：封面上傳、使用者查詢與停權、閱讀數據、章節排序調整、TXT 匯入。

## 6. 多語系

- 介面文字一律用 `t("key")` 從 `src/i18n/messages/zh-Hant.ts` 讀取，元件裡不直接寫中文字串。
- 新增語系時，在 `src/i18n/messages/` 加上 `zh-Hans.ts`、`en.ts`、`ja.ts`，型別必須符合 `Messages`（少翻任何一個 key，typecheck 就會失敗），再加進 `locales`。網址先不加語系前綴，`<html lang="zh-Hant">`。
- 作品內容本身只有繁中，資料表不需要語系欄位。

## 7. 開發階段

| 階段            | 內容                                                                                | 完成條件                                                               |
| --------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 0 基礎建設 ✅   | Next.js 專案、Docker Compose、Drizzle、Auth.js 骨架、lint、測試、CI、`.env.example` | `pnpm check` 全部通過；`docker compose up` 能啟動（2026-10-01 完成）   |
| 1 內容與後台 ✅ | 資料表、後台作品與章節管理、EPUB 匯入、排程                                         | 全部 29 部真實書籍匯入；e2e 涵蓋匯入、編輯、排程（2026-10-01 完成）    |
| 2 讀者公開頁 ✅ | 最新、搜尋、作品頁、目錄、閱讀器（先不檢查額度）、自動產生文字封面                  | 對照 A3 原型、桌面與手機一致；以真實 29 部書驗證（2026-10-01 完成）    |
| 3 帳號與同步 ✅ | Email 與 Google 登入（Apple 延後到上線後）、偏好設定、書架、閱讀進度、閱讀紀錄      | 桌面與手機 e2e 驗證兩個瀏覽器情境可同步（2026-10-02 完成）             |
| 4 額度與防爬 ✅ | 訪客辨識（Cookie＋IP＋瀏覽器特徵）、額度視窗、頻率限制、後台額度設定                | 桌面與手機 e2e 驗證 10／50 額度、重讀與公告不扣額度（2026-10-02 完成） |
| 5 上線準備      | 法務頁面、SEO、錯誤監控、備份、選定主機並部署                                       | 上線檢查清單全部完成                                                   |

第二階段（看流量再決定）：評論與檢舉審核、會員與金流、廣告、App。

## 8. 給 AI Agent 與協作者的規範（已寫入 AGENTS.md）

- 每個任務對應一個分支，任務完成時更新 `docs/handoffs/CURRENT.md`。
- `pnpm check` 依序跑 lint、format:check、typecheck、test，提交前必須通過。動到頁面或 API 時另跑 `pnpm test:e2e`。
- 寫 Next.js 程式前先讀 `node_modules/next/dist/docs/` 的對應文件（這版 API 與一般認知不同，例如 `proxy.ts` 取代 middleware、request API 一律 async、沒有 `next lint`）。
- services 必須有單元測試；額度、權限、發布可見性屬於高風險邏輯，邊界情況都要測到。
- 資料表變更一律先改 `src/server/db/schema/`，再用 `pnpm db:generate` 產生 migration，不直接改資料庫。
- 新增任何套件前，先在 `docs/DECISIONS.md` 記錄理由。
- 密鑰只放在 `.env`（不提交）；`.env.example` 要隨時與程式一致。

## 9. 待確認事項

- 正式環境的寄信服務：建議 Resend（起步）或 Amazon SES（若主機選 AWS），使用專屬子網域並設定 SPF／DKIM／DMARC，等使用者確認。
- 封面上傳（之後）：S3 相容物件儲存（GCS／S3／R2，開發用 MinIO），等主機決定後再選。目前一律使用自動產生的文字封面。
- Apple 登入與 App：延後到正式版上線後（已決定）。
- 錯誤監控與流量分析工具：要符合「不追蹤」原則。
