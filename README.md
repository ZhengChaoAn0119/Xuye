# 續頁

以線上連載小說為核心的繁體中文閱讀平台。

- `prototype/`：互動原型（純 HTML／CSS／JS），A3「現代書庫」為主要方案。
- 正式版：Next.js + TypeScript，規劃中，將放在 repo 根目錄。

## 原型啟動

直接以瀏覽器開啟 `prototype/index.html`，或在 `prototype/` 資料夾啟動任一靜態檔案伺服器。

## 原型可點擊路由

- `#/compare`：三個方案及點擊流程圖
- `#/latest`：最新更新；卡片／欄位檢視切換
- `#/search`：單一搜尋框及篩選入口
- `#/work/ember-city`：作品資訊、章節與評論
- `#/reader/ember-city/126`：沉浸閱讀器
- `#/library`：三種書架閱讀狀態
- `#/history`：跨裝置閱讀紀錄
- `#/discussion/ember-city`：五星評價、防劇透與互動
- `#/profile`：24 小時額度與內容偏好
- `#/plans`：四級會員方案

所有名稱、作品、作者、封面與評論均為虛構示意。

## 專案文件

- `AGENTS.md`：人與 AI Agent 共用的工作規則
- `docs/PROJECT_CONTEXT.md`：產品、架構與驗證方式
- `docs/DECISIONS.md`：長期有效的決策
- `docs/handoffs/CURRENT.md`：目前進度與交接
