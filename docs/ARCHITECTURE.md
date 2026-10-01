# 正式版架構規劃

狀態：草案（2026-10-01）。已確定的技術決策以 `docs/DECISIONS.md` 的「Production build」為準；本文件說明怎麼實作。標示「預設」的項目尚可調整，改動時同步更新本文件。

## 1. 技術組成

| 層       | 選擇                                                                                             | 備註                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 框架     | Next.js 16（App Router）+ TypeScript（strict）                                                   | `output: "standalone"`；啟用 Cache Components（`use cache`、`cacheTag`）；`typedRoutes` |
| 資料庫   | PostgreSQL                                                                                       | 開發時用 Docker Compose 啟動                                                            |
| ORM      | Drizzle ORM + drizzle-kit                                                                        | 資料表定義在 `src/server/db/schema/`；migrations 提交在 `drizzle/`                      |
| 登入     | Auth.js + Drizzle Adapter                                                                        | Email 登入連結、Google、Apple；session 存在資料庫                                       |
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
├─ prototype/            A3 原型（視覺參考，不再當作產品開發）
├─ docs/                 決策、架構、交接文件
├─ drizzle/              drizzle-kit 產生的 migrations（提交進 repo）
├─ scripts/              seed（開發用虛構資料）等工具腳本
├─ src/
│  ├─ app/
│  │  ├─ (site)/         讀者端：最新、搜尋、作品、閱讀器、書架、紀錄、我的
│  │  ├─ admin/          後台（限 ADMIN 角色）
│  │  └─ api/v1/         公開 API（之後給 App 共用）
│  ├─ server/
│  │  ├─ db/             Drizzle client（index.ts）與資料表定義（schema/）
│  │  ├─ auth.ts         Auth.js 設定
│  │  └─ services/       商業邏輯：chapters、quota、library、works、import…
│  ├─ components/
│  ├─ i18n/              messages/zh-Hant.ts + t()（預留 zh-Hans、en、ja，須符合同一型別）
│  └─ styles/            tokens.css（A3 設計變數）
├─ tests/                e2e/
├─ Dockerfile
├─ docker-compose.yml    app + postgres
└─ .env.example          所有環境變數（不含真實值）
```

**API 分層原則**：商業邏輯只寫在 `src/server/services/`。頁面、Server Actions、`api/v1` 路由都只負責驗證輸入、檢查身分，再呼叫 service。這樣將來 App 打 `api/v1` 時，拿到的是同一套邏輯。

## 3. 資料模型（首版）

```
User            id, email, name, image, role(READER|ADMIN), tier(FREE…),
                birthDate?, ageVerifiedAt?, createdAt, suspendedAt?
Account / Session / VerificationToken   ← Auth.js 標準表
UserPreference  userId, readerFontSize, readerTheme, readerFont, lineHeight,
                pageWidth, showSexual, showViolence, showBadge

Author          id, slug, name                       （無作者帳號，僅顯示用）
Work            id, slug, title, authorId, synopsis, coverKey,
                status(ONGOING|COMPLETED), hasSexual, hasViolence,
                lastChapterAt, createdAt
Tag             id, slug, name, kind(GENRE|TAG)      Work ⇄ Tag 多對多
Chapter         id, workId, number, title, wordCount,
                status(DRAFT|SCHEDULED|PUBLISHED|HIDDEN), publishAt, publishedAt
                unique(workId, number)
ChapterContent  chapterId, body                      內文另外存一張表，查目錄時不用載入內文

BookshelfItem   userId, workId, createdAt            PK(userId, workId)
ReadingProgress userId, workId, chapterNumber, position, updatedAt,
                hiddenFromHistoryAt?                 進度與閱讀紀錄共用；移除紀錄不影響進度
Bookmark        userId, chapterId, createdAt

VisitorIdentity id, cookieId, ipHash, traitHash, firstSeenAt   只存雜湊值，不存原始資料
QuotaSetting    subject(VISITOR|FREE|…), chaptersPerWindow     後台可調整
QuotaWindow     subjectKey, windowStart, used        視窗從第一次扣額度開始算 24 小時
QuotaCharge     windowId, chapterId, chargedAt       unique(windowId, chapterId)：同一視窗內重讀同章不重複扣

AuditLog        actorId, action, entity, entityId, diff(json), createdAt
```

第二階段：Review、ReviewVote、Report、UserBlock、MembershipPlan、Subscription、Payment。首版資料表先保留 `tier` 欄位，可以不建這些表。

規模：1,000+ 章 × 3,000–5,000 字，內文總量約 15 MB，PostgreSQL 處理這個量沒有壓力。搜尋使用 `pg_trgm` 對書名、作者、標籤做片段比對（內建全文搜尋不會斷中文詞）。

## 4. 主要流程

### 4.1 排程發布

章節對讀者是否可見，判斷條件是 `status = PUBLISHED`，或 `status = SCHEDULED 且 publishAt <= now()`。查詢時直接判斷，**不需要排程程式（cron）**。首頁「最新更新」依各作品最新一章的可見時間排序。公開頁面採定時重新產生（ISR），快取時間要短，或在發布時主動更新快取。

### 4.2 公開與受保護內容

| 頁面                         | 渲染方式                     | 搜尋引擎收錄                              |
| ---------------------------- | ---------------------------- | ----------------------------------------- |
| 最新更新、搜尋、作品頁、目錄 | 伺服器端產生，可快取         | 收錄；加上 sitemap、metadata、Open Graph  |
| 章節閱讀頁                   | 每次請求動態產生，先檢查額度 | 頁面加 `noindex`；內文不寫進可快取的 HTML |

### 4.3 閱讀與額度

1. 讀者進入章節時，伺服器先辨識身分：
   - 已登入：以帳號為單位。
   - 訪客：簽章 Cookie + IP 雜湊 + 瀏覽器特徵雜湊。
2. 找出或建立這個身分的 `QuotaWindow`。視窗已滿 24 小時就開新視窗。
3. 這一章在本視窗內已扣過額度，就直接顯示；額度還有剩，就新增一筆 `QuotaCharge` 再顯示。
4. 額度用完：訪客與已登入使用者都只顯示額度恢復時間。**不設登入牆，也不提示註冊。** 已經載入的章節不會被中斷。
5. 預先載入下一章：只允許「目前章節的下一章」，一次一章，載入時不扣額度；讀者真的進入時才扣。這條規則防止有人用預載功能繞過額度。

### 4.4 防爬蟲

- 依 IP 和帳號做請求頻率限制。首版用 PostgreSQL 計數；之後流量變大再改用 Redis。
- 前面加 Cloudflare（或其他 WAF）擋機器人。
- 偵測到異常讀取速度時，暫時要求額外驗證。
- 目標是讓**大量自動抓取**變困難；真人手動複製在技術上無法完全阻止。

### 4.5 內容分級

- 作品標記 `hasSexual`、`hasViolence`，預設依使用者偏好隱藏。
- 開啟性描繪內容前，必須填生日並確認年滿 18 歲；確認時間記在 `ageVerifiedAt`。

## 5. 後台（首版）

- 作品：新增、編輯、封面上傳、分類標籤、連載狀態、內容分級。
- 章節：編輯器、草稿、排程、發布、下架、排序。
- 批次匯入：
  - 方式一：上傳資料夾或 zip，每章一個 `.txt` 或 `.md` 檔。
  - 方式二：上傳整份文字檔，依「第 N 章」的標題自動切章。
  - 正式寫入前要先預覽，確認章號和標題正確。
- 使用者：查詢、停權。
- 額度設定：調整訪客和 Free 會員的額度數字。
- 數據：每日閱讀章數、熱門作品、新註冊人數。
- 操作紀錄：所有後台寫入動作都記錄在 AuditLog。

## 6. 多語系

- 介面文字一律用 `t("key")` 從 `src/i18n/messages/zh-Hant.ts` 讀取，元件裡不直接寫中文字串。
- 新增語系時，在 `src/i18n/messages/` 加上 `zh-Hans.ts`、`en.ts`、`ja.ts`，型別必須符合 `Messages`（少翻任何一個 key，typecheck 就會失敗），再加進 `locales`。網址先不加語系前綴，`<html lang="zh-Hant">`。
- 作品內容本身只有繁中，資料表不需要語系欄位。

## 7. 開發階段

| 階段          | 內容                                                                                | 完成條件                                                             |
| ------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 0 基礎建設 ✅ | Next.js 專案、Docker Compose、Drizzle、Auth.js 骨架、lint、測試、CI、`.env.example` | `pnpm check` 全部通過；`docker compose up` 能啟動（2026-10-01 完成） |
| 1 內容與後台  | 資料表、後台作品與章節管理、批次匯入、排程                                          | 能匯入一部虛構作品並排程發布                                         |
| 2 讀者公開頁  | 最新、搜尋、作品頁、目錄、閱讀器（先不檢查額度）                                    | 對照 A3 原型，桌面與手機版面一致                                     |
| 3 帳號與同步  | 三種登入、偏好設定、書架、閱讀進度、閱讀紀錄                                        | 兩台裝置之間能同步                                                   |
| 4 額度與防爬  | 訪客辨識（Cookie＋IP＋瀏覽器特徵）、額度視窗、頻率限制、後台額度設定                | 額度邏輯有單元測試覆蓋各種邊界情況                                   |
| 5 上線準備    | 法務頁面、SEO、錯誤監控、備份、選定主機並部署                                       | 上線檢查清單全部完成                                                 |

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

- Email 寄信服務（用來寄登入連結）：Resend、Amazon SES、SendGrid 等。
- 需要申請 Apple Developer 帳號（Apple 登入用）。
- 封面圖片的儲存位置（S3 相容的物件儲存）：等主機決定後再選。
- 錯誤監控與流量分析工具：要符合「不追蹤」原則。
