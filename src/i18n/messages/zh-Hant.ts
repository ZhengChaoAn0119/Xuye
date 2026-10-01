// Source of truth for UI copy. Other locales must provide the same keys (see ../index.ts).
const zhHant = {
  site: {
    name: "續頁",
    tagline: "連載小說，從下一頁開始。",
    description: "續頁：繁體中文連載小說閱讀平台。",
  },
  a11y: {
    skipToContent: "跳到主要內容",
  },
  nav: {
    latest: "最新",
    library: "書架",
    history: "紀錄",
    account: "我的",
    search: "搜尋作品、作者或標籤",
  },
  home: {
    buildingTitle: "正式版建置中",
    buildingBody: "閱讀功能將依開發階段陸續上線。",
  },
} as const;

export default zhHant;
