# 續頁

以線上連載小說為核心的繁體中文閱讀平台。

- 正式版（repo 根目錄）：Next.js 16 + TypeScript + PostgreSQL（Drizzle）+ Auth.js，以 Docker 開發。
- `prototype/`：A3「現代書庫」互動原型（純 HTML／CSS／JS），作為視覺參考。

## 正式版：本機開發

需要 Node.js 24、pnpm 10、Docker。

```bash
cp .env.example .env          # 再填入 AUTH_SECRET（可用 pnpm dlx auth secret 產生）
pnpm install
docker compose up -d db mailpit
pnpm db:migrate
pnpm dev                      # http://localhost:3000
```

- 登入信件（Email 登入連結）會被 Mailpit 攔下，在 http://localhost:8025 查看。
- 提交前執行 `pnpm check`；動到頁面或 API 時另外執行 `pnpm test:e2e`。
- 完整模擬正式環境：`docker compose up --build`。

其他指令與開發規範見 `AGENTS.md`。

## 原型

直接以瀏覽器開啟 `prototype/index.html`。可點擊的路由有 `#/latest`、`#/search`、`#/work/ember-city`、`#/reader/ember-city/126`、`#/library`、`#/history`、`#/discussion/ember-city`、`#/profile`。所有作品、作者、評論均為虛構。

## 專案文件

- `AGENTS.md`：人與 AI Agent 共用的工作規則與指令
- `docs/ARCHITECTURE.md`：正式版架構、資料模型、開發階段
- `docs/DECISIONS.md`：長期有效的決策
- `docs/PROJECT_CONTEXT.md`：產品背景
- `docs/handoffs/CURRENT.md`：目前進度與交接
