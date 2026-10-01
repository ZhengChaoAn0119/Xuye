const works = [
  { id:'ember-city', title:'餘燼之城', author:'林渡', chapter:'第 128 章・無聲的港口', time:'12 分鐘前', genre:'末日科幻', status:'連載中', chapters:128, rating:'4.8', reads:'38.2 萬', saved:'12,840', cover:'#253862', art:'radial-gradient(circle at 72% 21%, #ffe8ae 0 5%, transparent 6%), linear-gradient(150deg, transparent 30%, #d86552)', desc:'當整座城市的燈火在同一晚熄滅，負責修復舊世界訊號的葉尋，在雜訊裡聽見了一個來自二十年前的求救。', state:'new', stateText:'有 3 章未讀' },
  { id:'north-window', title:'北窗記事', author:'沈硯', chapter:'第 47 章・雨停以前', time:'36 分鐘前', genre:'都市懸疑', status:'連載中', chapters:47, rating:'4.6', reads:'19.7 萬', saved:'8,291', cover:'#446b66', art:'linear-gradient(35deg, #192c31 0 32%, transparent 33%), radial-gradient(circle at 75% 20%, #d6d2a6, transparent 18%)', desc:'一間只在雨天營業的舊書店，一疊沒有寄件人的信，以及七個互不相識卻擁有同一段記憶的人。', state:'done', stateText:'已追到最新' },
  { id:'thirteen', title:'第十三月台', author:'迴聲', chapter:'第 82 章・末班車', time:'1 小時前', genre:'奇幻冒險', status:'連載中', chapters:82, rating:'4.9', reads:'51.4 萬', saved:'21,079', cover:'#62343f', art:'repeating-linear-gradient(90deg, transparent 0 12px, rgba(255,255,255,.08) 13px 14px), linear-gradient(25deg,#1c1720,#a45a68)', desc:'午夜十二點後，廢棄月台會停靠一班不存在於時刻表上的列車。每張車票，只能交換一個遺憾。', state:'new', stateText:'有 1 章未讀' },
  { id:'tea-house', title:'海岸線茶屋', author:'白川', chapter:'第 31 章・潮聲來信', time:'2 小時前', genre:'療癒日常', status:'連載中', chapters:31, rating:'4.7', reads:'11.8 萬', saved:'7,430', cover:'#b66f4d', art:'radial-gradient(ellipse at 70% 80%,#f5c283 0 12%,transparent 13%), linear-gradient(#7ec6c0 0 45%,#d99d69 46%)', desc:'離開城市後，她接手外婆留在海邊的茶屋，也接下替陌生人保管未寄出信件的工作。', state:'unread', stateText:'尚未閱讀' },
  { id:'paper-sun', title:'紙上太陽', author:'季遙', chapter:'第 64 章・白晝夢', time:'今天 08:20', genre:'青春成長', status:'連載中', chapters:64, rating:'4.5', reads:'16.9 萬', saved:'9,106', cover:'#d18b43', art:'radial-gradient(circle at 68% 26%,#ffeab0 0 13%,transparent 14%),linear-gradient(150deg,transparent,#69442c)', desc:'兩名高中生在一本交換日記裡，寫下彼此從未說出口的明天。', state:'done', stateText:'已追到最新' },
  { id:'silent-river', title:'靜河', author:'莫野', chapter:'第 19 章・渡口', time:'昨天', genre:'歷史小說', status:'連載中', chapters:19, rating:'4.8', reads:'8.2 萬', saved:'5,230', cover:'#263e48', art:'linear-gradient(165deg,transparent 45%,#7696a0 46% 55%,#18272e 56%)', desc:'烽火未至以前，河的兩岸只是兩座尋常村落。一名船夫卻提前知道了戰爭的日期。', state:'unread', stateText:'尚未閱讀' },
  { id:'red-room', title:'紅房間協定', author:'K.', chapter:'第 93 章・訪客權限', time:'昨天', genre:'科技驚悚', status:'連載中', chapters:93, rating:'4.4', reads:'29.5 萬', saved:'10,772', cover:'#7d2f31', art:'linear-gradient(90deg,transparent 45%,rgba(255,255,255,.25) 46% 48%,transparent 49%),linear-gradient(#361214,#a73f43)', desc:'一家科技公司邀請十二位陌生人測試新系統，唯一的規則是：不要打開紅色房間。', state:'new', stateText:'有 5 章未讀' },
  { id:'garden', title:'失物花園', author:'蘇禾', chapter:'完結篇・春日', time:'3 天前', genre:'溫柔奇幻', status:'已完結', chapters:56, rating:'4.9', reads:'42.1 萬', saved:'18,650', cover:'#657d58', art:'radial-gradient(circle at 23% 32%,#e4bdc5 0 4%,transparent 5%),radial-gradient(circle at 65% 62%,#f2dba6 0 5%,transparent 6%),linear-gradient(140deg,#31452e,#91a578)', desc:'只要在花園裡種下一件失物，就能在花開時見到它的主人。', state:'done', stateText:'已讀完' }
];

const chapterTitles = ['無聲的港口','燈塔以北','失真的頻率','灰色候鳥','黎明之前','逆風航線','編號 404','陌生人的火','地圖之外','漫長回音','沒有星星的夜晚','最後一封電報'];

function chapterTitle(w, n) {
  if (n === w.chapters) return w.chapter.split('・')[1] || chapterTitles[0];
  return chapterTitles[(w.chapters - n) % chapterTitles.length];
}

function chapterDate(w, n) {
  const i = w.chapters - n;
  return i < 1 ? w.time : i < 3 ? '昨天' : `${i+1} 天前`;
}

// Prototype persistence: per-browser localStorage stands in for account sync.
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(`xuye:${key}`); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(`xuye:${key}`, JSON.stringify(value)); } catch {} }
};

const HOUR = 3600e3;
const seedHistory = works.slice(0,6).map((w,i) => ({ id:w.id, n: w.id==='ember-city' ? 126 : Math.max(1,w.chapters-i*3), at: Date.now() - (i*7+1)*HOUR }));

const state = {
  scheme: localStorage.getItem('scheme') || 'a3',
  view: localStorage.getItem('view') || 'grid',
  library: 'all',
  latestFilter: 'all',
  searchStatus: 'all',
  searchGenre: '',
  chapterOrder: 'desc',
  chaptersExpanded: false,
  historyManage: false,
  profileTab: 'overview',
  openMenu: null,
  revealed: new Set(),
  readerChrome: true,
  readerTheme: store.get('readerTheme', 'sepia'),
  readerSize: store.get('readerSize', 19),
  search: '',
  saved: new Set(store.get('saved', works.map(w => w.id))),
  history: store.get('history', seedHistory),
  progress: store.get('progress', Object.fromEntries(seedHistory.map(h => [h.id, h.n]))),
  bookmarks: new Set(store.get('bookmarks', [])),
  votes: store.get('votes', {}),
  blocked: store.get('blocked', []),
  userReviews: store.get('userReviews', {}),
  prefs: store.get('prefs', { sexual:false, violence:true, badge:true, ageVerified:false }),
};

function persist() {
  store.set('saved', [...state.saved]);
  store.set('history', state.history);
  store.set('progress', state.progress);
  store.set('bookmarks', [...state.bookmarks]);
  store.set('votes', state.votes);
  store.set('blocked', state.blocked);
  store.set('userReviews', state.userReviews);
  store.set('prefs', state.prefs);
  store.set('readerTheme', state.readerTheme);
  store.set('readerSize', state.readerSize);
}

function relativeTime(ts) {
  const h = Math.floor((Date.now() - ts) / HOUR);
  if (h < 1) return '剛剛';
  if (h < 24) return `${h} 小時前`;
  return h < 48 ? '昨天' : `${Math.floor(h/24)} 天前`;
}

const icons = {
  search:'⌕', grid:'▦', list:'☷', back:'←', menu:'☰', settings:'Aa', bookmark:'♡', more:'•••', star:'★', next:'→', check:'✓'
};

function setScheme(scheme) {
  state.scheme = scheme;
  localStorage.setItem('scheme', scheme);
  document.body.className = `scheme-${scheme}`;
  document.querySelectorAll('[data-scheme]').forEach(b => b.classList.toggle('active', b.dataset.scheme === scheme));
}

function route() { return location.hash.slice(1) || '/compare'; }
function go(path) { location.hash = path; }

function prototypeBar() {
  return `<div class="prototype-bar">
    <strong>續頁・互動原型</strong><span>A3 為主要方案；A1、A2 保留作比較參考</span>
    <div class="scheme-switch" aria-label="視覺方案">
      <button data-scheme="a1" class="${state.scheme==='a1'?'active':''}">A1 紙頁</button>
      <button data-scheme="a2" class="${state.scheme==='a2'?'active':''}">A2 追更</button>
      <button data-scheme="a3" class="${state.scheme==='a3'?'active':''}">A3 現代</button>
    </div>
  </div>`;
}

function header(active='') {
  if (state.scheme === 'a2') {
    const rail = [
      ['latest', '#/latest', '⌂', '最新'],
      ['library', '#/library', '♡', '書架'],
      ['history', '#/history', '↺', '紀錄'],
      ['', '#/plans', '◇', '方案'],
      ['', '#/compare', 'i', '比較']
    ];
    return `<header class="site-header a2-header">
      <div class="a2-toolbar">
        <button class="a2-menu" aria-label="開啟選單">☰</button>
        <a class="a2-brand" href="#/latest" aria-label="續頁首頁"><span>&lt;/&gt;</span>續頁</a>
        <a class="a2-support" href="#/plans">贊助</a>
        <a class="a2-quota" href="#/profile" title="16 小時 42 分後恢復"><strong>37 / 100</strong><small>閱讀額度</small></a>
        <a class="a2-search" href="#/search" aria-label="搜尋">搜</a>
        <a class="a2-account" href="#/profile"><span class="avatar">安</span><span>我的</span><b>⌄</b></a>
      </div>
      <nav class="a2-mobile-nav" aria-label="主要導覽">
        <a href="#/latest" class="${active==='latest'?'active':''}">最新</a>
        <a href="#/library" class="${active==='library'?'active':''}">書架</a>
        <a href="#/history" class="${active==='history'?'active':''}">紀錄</a>
      </nav>
    </header><aside class="a2-rail" aria-label="A2 功能導覽">${rail.map(([key,href,icon,label])=>`<a href="${href}" class="${active===key?'active':''}" title="${label}"><span>${icon}</span><small>${label}</small></a>`).join('')}</aside>`;
  }
  return `<header class="site-header">
    <div class="header-primary">
      <a class="brand" href="#/latest" aria-label="續頁首頁"><span class="brand-mark">續</span><span>續頁</span></a>
      <form class="header-search" data-search-form>
        <input name="q" aria-label="搜尋作品" placeholder="搜尋作品、作者或標籤" value="${escapeHtml(state.search)}" />
        <button class="search-submit" aria-label="搜尋">${icons.search}</button>
      </form>
      <a class="user-link" href="#/profile"><span class="avatar">安</span><span>我的</span></a>
    </div>
    <div class="header-secondary">
      <nav class="main-nav" aria-label="主要導覽">
        <a href="#/latest" class="${active==='latest'?'active':''}">最新</a>
        <a href="#/library" class="${active==='library'?'active':''}">書架</a>
        <a href="#/history" class="${active==='history'?'active':''}">紀錄</a>
      </nav>
      <a class="quota-mini" href="#/profile" title="閱讀額度將於 16 小時 42 分後恢復"><span>37 / 100</span><span class="quota-track"><span></span></span></a>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="footer-inner"><span>© 2026 續頁 Prototype・所有作品與人物皆為虛構</span><div class="footer-links"><a href="#/compare">方案比較</a><a href="#/plans">會員方案</a><a href="#/profile">內容設定</a></div></div></footer>`;
}

function cover(w, compact=false) {
  return `<div class="cover" style="--cover:${w.cover};--art:${w.art}"><div class="cover-copy"><strong>${w.title}</strong>${compact?'':`<small>${w.author}</small>`}</div></div>`;
}

function cards(items=works) {
  return `<div class="works-grid">${items.map(w=>`<a class="work-card" href="#/work/${w.id}">${cover(w)}<div class="card-meta"><h3>${w.title}</h3><div class="meta-line"><span>${w.genre}・${w.author}</span><span class="new">${w.time}</span></div><div class="meta-line" style="margin-top:6px"><span>${w.chapter}</span><span>★ ${w.rating}</span></div></div></a>`).join('')}</div>`;
}

function a2Cards(items=works) {
  return `<div class="a2-works-grid">${items.map((w,i)=>`<a class="a2-work-card" href="#/work/${w.id}">
    <div class="a2-cover-wrap">${cover(w,true)}<span class="a2-read-count">${w.reads}</span><span class="a2-save-count">♡ ${w.saved}</span></div>
    <h3>${w.title}</h3>
    <div class="a2-status"><b>${w.status.replace('中','')}</b><span>${w.chapters} 章</span></div>
    <div class="a2-update"><span>${w.chapter.replace('・',' ')}</span><time>${w.time}</time></div>
  </a>`).join('')}</div>`;
}

function rows(items=works, library=false) {
  return `<div class="works-list">${items.map(w=>`<a class="work-row" href="#/work/${w.id}"><span class="mini-cover" style="--cover:${w.cover}"></span><strong>${library?`<i class="state-dot ${w.state}"></i>`:''}${w.title}<br><span>${w.chapter}</span></strong><span class="hide-mobile">${library?w.stateText:w.genre}</span><span class="hide-tablet">${w.author}</span><span class="hide-tablet">★ ${w.rating}</span><span>${w.time}</span></a>`).join('')}</div>`;
}

function emptyState(title, body='', action='') {
  return `<div class="empty-state"><strong>${title}</strong>${body?`<p>${body}</p>`:''}${action}</div>`;
}

function filterButtons(attr, options, current) {
  return options.map(([value,label]) => `<button data-${attr}="${value}" class="${current===value?'active':''}" aria-pressed="${current===value}">${label}</button>`).join('');
}

const statusOptions = [['all','全部'],['連載中','連載中'],['已完結','已完結']];

function latestPageLegacy() {
  return `${header('latest')}<main id="main"><div class="page">
    <section class="hero">
      <a class="hero-main" href="#/work/ember-city"><div class="hero-content"><p class="eyebrow" style="color:#bfc9ff">今日焦點・12 分鐘前更新</p><h1>餘燼之城</h1><p>城市熄燈後，雜訊裡傳來一則二十年前的求救。第 128 章〈無聲的港口〉現已上架。</p><span class="btn primary">前往作品頁 ${icons.next}</span></div></a>
      <div class="hero-side"><div class="stat-panel"><span class="stat-number">8 部</span><span class="stat-label">今日更新作品</span></div><div class="update-note"><strong>依最新上架排列</strong><p style="margin:8px 0 0;color:var(--muted);font-size:13px;line-height:1.6">同一作品只出現一次，不使用演算法干預順序。</p></div></div>
    </section>
    <div class="section-head"><div><p class="eyebrow">Latest updates</p><h2>最新更新</h2></div><div class="segmented" aria-label="檢視模式"><button data-view="grid" class="${state.view==='grid'?'active':''}" title="作品卡片">${icons.grid}</button><button data-view="list" class="${state.view==='list'?'active':''}" title="欄位列表">${icons.list}</button></div></div>
    <div id="works-view">${state.view==='grid'?cards():rows()}</div>
  </div></main>${footer()}`;
}

// Refined home follows serial-fiction conventions: content first, compact and chronological.
function latestPage() {
  if (state.scheme === 'a2') {
    return `${header('latest')}<main id="main" class="a2-main"><div class="page a2-page">
      <div class="a2-page-tabs" role="tablist" aria-label="最新作品分類">
        <button class="active" role="tab" aria-selected="true">最新更新</button>
        <button role="tab">新作上架</button>
        <span>依時間排序・今日 8 部更新</span>
      </div>
      ${a2Cards()}
    </div></main>${footer()}`;
  }
  return `${header('latest')}<main id="main"><div class="page">
    <div class="page-head" style="margin-bottom:10px">
      <div><p class="eyebrow">Latest updates</p><h1>最新更新</h1><p class="subhead">依作品最近上架時間排列，同一作品只顯示一次。</p></div>
      <span class="count">2026 年 10 月 1 日・今日 8 部更新</span>
    </div>
    <div class="section-head" style="margin-top:18px">
      <div class="filter-row" style="margin:0;justify-content:flex-start">${filterButtons('latest-filter', statusOptions, state.latestFilter)}</div>
      <div class="segmented" aria-label="檢視模式"><button data-view="grid" class="${state.view==='grid'?'active':''}" title="作品卡片">${icons.grid}</button><button data-view="list" class="${state.view==='list'?'active':''}" title="欄位列表">${icons.list}</button></div>
    </div>
    <div id="works-view">${(() => {
      const list = state.latestFilter === 'all' ? works : works.filter(w => w.status === state.latestFilter);
      if (!list.length) return emptyState('目前沒有符合條件的作品');
      return state.view==='grid' ? cards(list) : rows(list);
    })()}</div>
  </div></main>${footer()}`;
}

const searchGenres = ['奇幻','懸疑','科幻','日常'];

function searchPage() {
  const filtered = works.filter(w =>
    (!state.search || [w.title,w.author,w.genre,w.desc].join(' ').includes(state.search)) &&
    (state.searchStatus === 'all' || w.status === state.searchStatus) &&
    (!state.searchGenre || w.genre.includes(state.searchGenre)));
  const genreButtons = searchGenres.map(g => `<button data-search-genre="${g}" class="${state.searchGenre===g?'active':''}" aria-pressed="${state.searchGenre===g}">${g}</button>`).join('');
  const heading = state.search ? `「${escapeHtml(state.search)}」的結果` : state.searchGenre ? `${state.searchGenre}作品` : '全部作品';
  const reset = `<button class="btn small" data-search-reset>清除搜尋與篩選</button>`;
  return `${header()}<main id="main"><div class="page"><section class="search-stage"><p class="eyebrow">Find your next story</p><h1>想讀什麼故事？</h1><form class="giant-search" data-search-form><input name="q" autofocus placeholder="搜尋作品、作者、分類或標籤" value="${escapeHtml(state.search)}"><button class="btn primary">搜尋</button></form><div class="filter-row">${filterButtons('search-status', statusOptions, state.searchStatus)}<span class="filter-sep" aria-hidden="true"></span>${genreButtons}</div></section><div class="section-head"><h2>${heading}</h2><span class="count">${filtered.length} 部作品</span></div>${filtered.length ? cards(filtered) : emptyState('找不到符合的作品', '試試其他關鍵字，或放寬篩選條件。', reset)}</div></main>${footer()}`;
}

function libraryPage() {
  const filters = { all:'全部', unread:'尚未閱讀', new:'有新章', done:'已追到最新' };
  const saved = works.filter(w => state.saved.has(w.id));
  const list = state.library === 'all' ? saved : saved.filter(w => w.state === state.library);
  const body = !saved.length
    ? emptyState('書架還是空的', '在作品頁按「收藏作品」，新章節上架時會出現在這裡。', '<a class="btn primary small" href="#/latest">瀏覽最新更新</a>')
    : list.length ? rows(list,true) : emptyState('這個分類目前沒有作品');
  return `${header('library')}<main id="main"><div class="page"><div class="page-head"><div><p class="eyebrow">Your library</p><h1>我的書架</h1><p class="subhead">收藏的故事與追更狀態會在所有裝置保持同步。</p></div><span class="count">${saved.length} 部作品</span></div><div class="library-tabs">${Object.entries(filters).map(([k,v])=>`<button data-library="${k}" class="${state.library===k?'active':''}">${v}</button>`).join('')}</div>${body}</div></main>${footer()}`;
}

function historyPage() {
  const entries = state.history.map(h => ({ ...h, w: works.find(x => x.id === h.id) })).filter(h => h.w);
  const actions = state.historyManage
    ? `<div class="head-actions">${entries.length?'<button class="btn ghost small" data-history-clear>清除全部</button>':''}<button class="btn primary small" data-history-manage>完成</button></div>`
    : entries.length ? `<button class="btn ghost small" data-history-manage>管理紀錄</button>` : '';
  const row = ({w,n,at}) => {
    const cells = `<span class="mini-cover" style="--cover:${w.cover}"></span><strong>${w.title}<br><span>讀至第 ${n} 章</span></strong><span class="hide-mobile">${relativeTime(at)}</span><span class="hide-tablet">${w.genre}</span><span class="hide-tablet">${Math.round(n/w.chapters*100)}%</span>`;
    return state.historyManage
      ? `<div class="work-row">${cells}<button class="btn small ghost" data-history-remove="${w.id}">移除</button></div>`
      : `<a class="work-row" href="#/reader/${w.id}/${n}">${cells}<span>繼續閱讀 →</span></a>`;
  };
  const body = entries.length ? `<div class="works-list">${entries.map(row).join('')}</div>` : emptyState('沒有閱讀紀錄', '開始閱讀任一章節後，進度會記錄在這裡。', '<a class="btn primary small" href="#/latest">瀏覽最新更新</a>');
  return `${header('history')}<main id="main"><div class="page"><div class="page-head"><div><p class="eyebrow">Reading history</p><h1>閱讀紀錄</h1><p class="subhead">包含未加入書架的作品。跨裝置接續上一次停下的位置。移除紀錄不會影響書架與閱讀進度。</p></div>${actions}</div>${body}</div></main>${footer()}`;
}

function chapterNumbers(w) {
  const all = Array.from({length:w.chapters}, (_,i) => w.chapters - i);
  return state.chapterOrder === 'asc' ? all.reverse() : all;
}

function chapterLinks(w, numbers, current=0, currentLabel='目前章節') {
  return numbers.map(n => `<a class="chapter ${n===current?'current':''}" href="#/reader/${w.id}/${n}"${n===current?' aria-current="true"':''}><span>第 ${n} 章　${chapterTitle(w,n)}</span><small>${n===current?currentLabel:chapterDate(w,n)}</small></a>`).join('');
}

function workPage(id) {
  const w = works.find(x=>x.id===id) || works[0];
  const progress = state.progress[w.id] || 0;
  const isSaved = state.saved.has(w.id);
  const numbers = chapterNumbers(w);
  const shown = state.chaptersExpanded ? numbers : numbers.slice(0,12);
  const more = numbers.length > shown.length ? `<button class="btn small ghost chapter-more" data-chapters-expand>顯示全部 ${w.chapters} 章</button>` : '';
  return `${header()}<main id="main"><div class="page"><section class="detail-hero"><div class="detail-cover">${cover(w)}</div><div class="detail-copy"><p class="eyebrow">${w.status}・${w.genre}</p><h1>${w.title}</h1><p class="author">${w.author} 著</p><div class="tags"><a href="#/search" data-tag-search="${w.genre}" title="搜尋「${w.genre}」作品">${w.genre}</a><span>群像</span><span>慢熱</span><span>劇情向</span></div><p class="synopsis">${w.desc}</p><div class="detail-actions"><a class="btn primary" href="#/reader/${w.id}/${progress||1}">${progress?`繼續閱讀・第 ${progress} 章`:'開始閱讀'}</a><button class="btn ${isSaved?'saved':''}" data-save-toggle="${w.id}" aria-pressed="${isSaved}">${isSaved?'♥ 已收藏':'♡ 收藏作品'}</button><a class="btn ghost" href="#/discussion/${w.id}">查看評論</a></div></div></section>
    <section class="fact-grid"><div class="fact"><strong>${w.rating} / 5</strong><span>作品評分</span></div><div class="fact"><strong>${w.chapters} 章</strong><span>目前章數</span></div><div class="fact"><strong>${w.reads}</strong><span>累計閱讀</span></div><div class="fact"><strong>${w.saved}</strong><span>加入書架</span></div><div class="fact"><strong>${w.time}</strong><span>最近更新</span></div></section>
    <div class="content-columns"><section><div class="section-head" style="margin-top:0"><h2>章節目錄</h2><button class="btn small ghost" data-chapter-order>⇅ ${state.chapterOrder==='desc'?'由新到舊':'由舊到新'}</button></div><div class="chapter-list">${chapterLinks(w, shown, progress, '上次讀到')}</div>${more}</section><aside><div class="section-head" style="margin-top:0"><h2>讀者評論</h2><a href="#/discussion/${w.id}" class="count">查看全部</a></div>${reviewCards(w,3)}</aside></div>
  </div></main>${footer()}`;
}

function reviewsFor(w) {
  const ch = n => Math.max(1, n);
  const seed = [
    { user:'夏日緩慢', ch:ch(w.chapters-4), stars:5, helpful:128, member:true, text:'伏筆在這章全部接起來了，但節奏還是很穩。喜歡作者沒有急著解釋所有事情。' },
    { user:'書頁之外', ch:ch(w.chapters-30), stars:5, helpful:86, text:'場景不是背景，而是在一步步改變人物的選擇。這一章之後整個故事的重心都移動了。' },
    { user:'折光', ch:null, stars:5, helpful:54, text:'文字很乾淨，讀到後面才發現最早幾章的細節都有意義。' },
    { user:'晚風信箱', ch:ch(w.chapters-1), stars:4, helpful:31, text:'原來那封信是寫給自己的。回頭重看前面幾章，每個線索都在。' },
    { user:'林間鹿', ch:w.chapters, stars:4, helpful:12, text:'最後那個轉折完全沒想到，但又覺得一切早就寫在那裡了。' },
  ].map((r,i) => ({ ...r, key:`${w.id}:${i}` }));
  return [...(state.userReviews[w.id] || []), ...seed];
}

function stars(n) { return '★'.repeat(n) + '☆'.repeat(5-n); }

function reviewCards(w, limit=Infinity) {
  const progress = state.progress[w.id] || 0;
  const all = reviewsFor(w);
  const visible = all.filter(r => !state.blocked.includes(r.user));
  const hiddenCount = all.length - visible.length;
  const cardsHtml = visible.slice(0, limit).map(r => {
    const vote = state.votes[r.key];
    const spoiler = r.ch && r.ch > progress && !r.own && !state.revealed.has(r.key);
    const badge = r.member || (r.own && state.prefs.badge);
    const menu = state.openMenu === r.key
      ? `<div class="review-menu" role="menu">${r.own ? `<button role="menuitem" data-review-delete="${r.key}">刪除我的評論</button>` : `<button role="menuitem" data-review-block="${escapeHtml(r.user)}">封鎖「${escapeHtml(r.user)}」</button><button role="menuitem" data-review-report="${r.key}">檢舉留言</button>`}</div>` : '';
    const body = spoiler
      ? `<div class="spoiler-mask"><strong>此評論可能包含尚未讀到的劇情</strong><p>${progress ? `你目前讀至第 ${progress} 章` : '你尚未開始閱讀本作品'}，評論標註為第 ${r.ch} 章</p><button class="btn small" data-reveal="${r.key}">仍要顯示</button></div>`
      : `<p>${escapeHtml(r.text)}</p>`;
    const votesHtml = r.own ? '' : `<button class="btn small ghost ${vote==='up'?'voted':''}" data-vote="${r.key}" data-dir="up" aria-pressed="${vote==='up'}">${vote==='up'?'♥':'♡'} 有幫助 ${r.helpful + (vote==='up'?1:0)}</button><button class="btn small ghost ${vote==='down'?'voted':''}" data-vote="${r.key}" data-dir="down" aria-pressed="${vote==='down'}">沒有幫助</button>`;
    return `<article class="review-card"><div class="review-user"><span class="avatar">${escapeHtml(r.user[0])}</span><div><strong class="${badge?'member-name':''}">${badge?'<span class="medal">◆</span> ':''}${escapeHtml(r.user)}${r.own?'<span class="pill own-pill">我的評論</span>':''}</strong><small><span class="stars">${stars(r.stars)}</span>・${r.ch?`第 ${r.ch} 章`:'整體評論'}</small></div><button class="icon-btn review-more" data-menu="${r.key}" aria-label="評論選單" aria-expanded="${state.openMenu===r.key}">${icons.more}</button>${menu}</div>${body}${spoiler?'':votesHtml}</article>`;
  }).join('');
  const hiddenNote = hiddenCount ? `<p class="blocked-note">已隱藏 ${hiddenCount} 則封鎖使用者的評論・<button class="link-btn" data-unblock-all>解除封鎖</button></p>` : '';
  return (cardsHtml || emptyState('目前沒有可顯示的評論')) + hiddenNote;
}

function discussionPage(id) {
  const w = works.find(x=>x.id===id)||works[0];
  return `${header()}<main id="main"><div class="page"><div class="page-head"><div><p class="eyebrow">Community reviews</p><h1>${w.title}・讀者評論</h1><p class="subhead">標註章節，讓其他讀者知道評論的討論範圍。超過閱讀進度的內容會自動遮蔽。</p></div><button class="btn primary" data-write-review="${w.id}">撰寫評論</button></div><div class="content-columns"><section>${reviewCards(w)}</section><aside><div class="stat-panel"><p class="eyebrow">整體評分</p><span class="stat-number">${w.rating}</span><div class="stars" style="margin:6px 0 14px">★★★★★</div><p class="subhead" style="font-size:13px">共 2,461 位實際閱讀過本作品的讀者評分。</p></div></aside></div></div></main>${footer()}`;
}

const storyParagraphs = [
  '港口比記憶中安靜。葉尋沿著堤岸往北走，鞋底碾過細碎的玻璃，聲音被霧吸走，只剩下遠處一盞時明時滅的航標燈。',
  '他把接收器從背包裡拿出來。螢幕上沒有訊號，只有一道緩慢移動的白線，像有人在黑暗裡用指尖摸索出口。三分鐘後，耳機傳來第一次雜音。',
  '「如果有人聽見——」聲音很輕，尾端被浪聲切斷。「不要進城。」',
  '葉尋停下腳步。這段訊息他已經聽過四十七次，每次都停在同一個地方。但今天不一樣。雜訊過後，還有一個極短的呼吸，以及鐘聲。',
  '港口的鐘塔在二十年前就倒了。檔案裡寫得很清楚：停電當晚十一點四十分，塔身向西傾倒，鐘面碎在廣場中央。可是耳機裡的鐘一共敲了十二下。',
  '霧從水面漫上來，蓋住堤岸末端。葉尋看見那裡站著一個人，穿著早已停產的深藍色工作服，手裡提著一盞燈。',
  '他沒有靠近，只是抬起接收器。白線忽然劇烈跳動，螢幕中央浮出一行從未出現過的座標。那是舊城的中心，也是所有地圖刻意留白的位置。',
  '「你遲到了。」霧裡的人說。',
  '葉尋沒有問對方是誰。他終於明白，這二十年來重複播放的從來不是錄音，而是一場一直等待有人回應的通話。'
];

function readerPage(id, chapterNo) {
  const w = works.find(x=>x.id===id)||works[0];
  const n = Math.min(w.chapters, Math.max(1, Number(chapterNo)||1));
  const marked = state.bookmarks.has(`${w.id}/${n}`);
  const prev = n > 1 ? `<a class="btn" href="#/reader/${w.id}/${n-1}">← 上一章</a>` : `<span class="btn" aria-disabled="true">← 上一章</span>`;
  return `<main id="main" class="reader-shell reader-${state.readerTheme}" style="--reader-size:${state.readerSize}px">${prototypeBar()}<div class="reader-top ${state.readerChrome?'':'hidden'}"><a class="icon-btn" href="#/work/${w.id}" aria-label="返回作品頁">${icons.back}</a><div class="book-title">${w.title}・第 ${n} 章</div><button class="icon-btn ${marked?'marked':''}" data-bookmark="${w.id}/${n}" aria-pressed="${marked}" aria-label="${marked?'移除書籤':'加入書籤'}">${marked?'♥':icons.bookmark}</button></div><div class="reader-tap-zone" data-reader-toggle aria-label="顯示或隱藏閱讀控制列"></div><article class="reader-article"><header><p class="chapter-meta">${w.title}・${w.author}</p><h1>第 ${n} 章　${chapterTitle(w,n)}</h1><p class="chapter-meta">約 8 分鐘・本章 2,840 字</p></header><div class="reader-copy">${storyParagraphs.map(p=>`<p>${p}</p>`).join('')}</div><section class="reader-end"><p>第 ${n} 章・閱讀完畢</p><h2>${n>=w.chapters?'你已追到最新進度':`下一章・${chapterTitle(w,n+1)}`}</h2><div class="reader-actions">${prev}${n>=w.chapters?`<a class="btn primary" href="#/work/${w.id}">返回作品頁</a>`:`<a class="btn primary" href="#/reader/${w.id}/${n+1}">進入下一章 →</a>`}</div></section></article><div class="reader-bottom ${state.readerChrome?'':'hidden'}"><button data-font="minus" title="縮小字級">A−</button><button data-reader-theme="sepia" title="米色" aria-pressed="${state.readerTheme==='sepia'}">◐</button><button data-reader-theme="white" title="白色" aria-pressed="${state.readerTheme==='white'}">○</button><button data-reader-theme="dark" title="深色" aria-pressed="${state.readerTheme==='dark'}">●</button><button data-font="plus" title="放大字級">A＋</button><button data-toc="${w.id}/${n}" title="目錄">${icons.menu}</button></div></main>`;
}

function recordReading(id, n) {
  state.progress[id] = Math.max(state.progress[id] || 0, n);
  state.history = [{ id, n, at: Date.now() }, ...state.history.filter(h => h.id !== id)].slice(0, 30);
  persist();
}

const themeLabels = { sepia:'米色', white:'白色', dark:'深色' };

function profilePanel() {
  const p = state.prefs;
  const toggle = (key, label) => `<button class="toggle ${p[key]?'on':''}" data-pref="${key}" role="switch" aria-checked="${p[key]}" aria-label="${label}"></button>`;
  if (state.profileTab === 'reading') return `<div class="settings-group"><div class="setting"><div><strong>預設字級</strong><small>套用於所有作品的閱讀頁</small></div><div class="stepper"><button class="btn small" data-pref-size="-1" aria-label="縮小字級">A−</button><span>${state.readerSize}px</span><button class="btn small" data-pref-size="1" aria-label="放大字級">A＋</button></div></div><div class="setting"><div><strong>閱讀背景</strong><small>目前：${themeLabels[state.readerTheme]}</small></div><div class="segmented">${Object.entries(themeLabels).map(([k,v])=>`<button data-pref-theme="${k}" class="${state.readerTheme===k?'active':''}">${v}</button>`).join('')}</div></div></div><div class="reading-preview reader-shell reader-${state.readerTheme}" style="--reader-size:${state.readerSize}px"><div class="reader-copy"><p>${storyParagraphs[0]}</p></div></div>`;
  if (state.profileTab === 'content') return `<div class="settings-group"><div class="setting"><div><strong>性描繪內容</strong><small>${p.ageVerified?'已完成年齡確認':'開啟前需完成簡易年齡確認（18 歲以上）'}</small></div>${toggle('sexual','性描繪內容')}</div><div class="setting"><div><strong>暴力與血腥內容</strong><small>在搜尋與作品列表中顯示相關內容</small></div>${toggle('violence','暴力與血腥內容')}</div></div><div class="settings-group"><div class="setting"><div><strong>公開會員徽章</strong><small>在評論與個人頁展示付費身分</small></div>${toggle('badge','公開會員徽章')}</div></div>`;
  return `<div class="quota-panel"><div class="quota-big"><div><p class="eyebrow">24 小時閱讀額度</p><strong>37 / 100</strong></div><span>16 小時 42 分後恢復</span></div><div class="quota-bar"><span></span></div><p class="subhead" style="font-size:12px">首次載入章節後開始計時；目前已載入的章節不會被中斷。</p></div><div class="settings-group"><div class="setting"><div><strong>跨裝置同步</strong><small>閱讀位置、書架與閱讀設定皆已同步</small></div><span class="pill">${icons.check} 已同步</span></div><div class="setting"><div><strong>登入方式</strong><small>Email・Google・Apple</small></div><button class="btn small" data-login>管理</button></div></div>`;
}

function profilePage() {
  const tabs = { overview:'帳號總覽', reading:'閱讀設定', content:'內容偏好' };
  return `${header()}<main id="main"><div class="page"><div class="page-head"><div><p class="eyebrow">Account & preferences</p><h1>我的</h1></div><a class="btn" href="#/plans">查看會員方案</a></div><div class="profile-layout"><aside class="profile-card"><span class="avatar">安</span><div><strong class="member-name">${state.prefs.badge?'<span class="medal">◆</span> ':''}安靜讀者</strong><small style="display:block;color:var(--muted);margin-top:5px">Free 免費會員</small></div><p class="subhead" style="font-size:12px;margin-top:12px">已同步 3 台裝置・同時使用 1 / 2</p><div class="profile-menu" role="tablist">${Object.entries(tabs).map(([k,v])=>`<button role="tab" data-profile-tab="${k}" class="${state.profileTab===k?'active':''}" aria-selected="${state.profileTab===k}">${v}</button>`).join('')}</div></aside><section>${profilePanel()}</section></div></div></main>${footer()}`;
}

function plansPage() {
  const plans = [
    ['Free','NT$0','100 章／24 小時',['含非追蹤式廣告','跨裝置同步','書架、紀錄與評論','基本頭像與名稱']],
    ['Light 輕讀','NT$59','200 章／24 小時',['無廣告閱讀','自訂頭像','自訂名稱顏色','Light 會員徽章']],
    ['Standard 暢讀','NT$129','500 章／24 小時',['無廣告閱讀','完整外觀權益','Standard 會員徽章','適合大部分重度讀者']],
    ['Patron 贊助','NT$299','1,000 章／24 小時',['無廣告閱讀','全部外觀權益','Patron 贊助徽章','支持平台長期營運']]
  ];
  return `${header()}<main id="main"><div class="page"><div class="compare-intro"><p class="eyebrow">Membership</p><h1>選擇適合你的閱讀量</h1><p class="subhead">所有付費方案皆以月計費。額度用於維持服務品質；當前章節永遠不會被中斷。</p></div><div class="plans">${plans.map((p,i)=>`<article class="plan ${i===2?'featured':''}">${i===2?'<span class="label">最多人選擇</span>':''}<p class="eyebrow">${p[0]}</p><div class="price">${p[1]} <small>/ 月</small></div><strong>${p[2]}</strong><ul>${p[3].map(x=>`<li>${x}</li>`).join('')}</ul><button class="btn ${i===2?'primary':''}" style="width:100%" data-toast="此為原型，尚未啟用付款">${i===0?'目前方案':'選擇方案'}</button></article>`).join('')}</div><p class="subhead" style="font-size:12px;margin:30px auto;text-align:center">示意價格與額度可由後台調整；取消後仍可使用至當期結束。</p></div></main>${footer()}`;
}

function comparePage() {
  const concepts = [
    ['a1','A1・紙頁書房','暖白、低彩度與紙本排版，適合重視文學感與長時間閱讀的讀者。'],
    ['a2','A2・快速追更','參考 Komiic 的工具列、側邊功能軌與高密度作品格。已評估：導覽結構不採用，配色保留為 A3 備選色系。'],
    ['a3','A3・現代書庫','清楚、快速、高資訊密度，兼顧卡片探索與欄位掃讀。']
  ];
  return `${prototypeBar()}<main id="main"><div class="page"><div class="compare-intro"><p class="eyebrow">Three directions, one product</p><h1>續頁・三個設計分支</h1><p class="subhead">A2 使用獨立的導覽、密度與作品資訊層級；A1 與 A3 則保留原本閱讀平台結構。</p></div><div class="concept-grid">${concepts.map(c=>`<article class="concept-card"><div class="concept-preview ${c[0]}">${c[0]==='a2'?`<div class="a2-fake-toolbar"><b>☰</b><strong>&lt;/&gt; 續頁</strong><i>37/100</i><span>搜　安</span></div><div class="a2-fake-body"><nav>⌂<br>♡<br>↺</nav><section><h4>最新更新　<span>新作上架</span></h4><div class="a2-fake-grid"><i></i><i></i><i></i><i></i><i></i><i></i></div></section></div>`:`<div class="fake-nav"><span>續頁</span><span>搜尋　我的</span></div><div class="fake-hero">故事，從下一頁開始。</div><div class="fake-cards"><span></span><span></span><span></span><span></span></div>`}</div><div class="concept-copy">${c[0]==='a2'?'<span class="recommended muted">僅保留配色參考</span>':c[0]==='a3'?'<span class="recommended">主要方案</span>':''}<h2>${c[1]}</h2><p>${c[2]}</p><button class="btn ${c[0]==='a3'?'primary':''}" style="width:100%" data-enter-scheme="${c[0]}">使用此方案瀏覽</button></div></article>`).join('')}</div><section class="flow-map"><p class="eyebrow">Click map</p><h2>主要點擊流程</h2><div class="flow"><a href="#/latest">最新首頁</a><i>→</i><a href="#/work/ember-city">作品詳情／目錄</a><i>→</i><a href="#/reader/ember-city/126">閱讀章節</a><i>→</i><a href="#/reader/ember-city/127">下一章</a></div><div class="flow"><a href="#/search">單一搜尋框</a><i>→</i><a href="#/work/thirteen">搜尋結果作品</a><i>→</i><a href="#/discussion/thirteen">評分與評論</a></div><div class="flow"><a href="#/library">登入書架</a><i>→</i><a href="#/history">閱讀紀錄</a><i>→</i><a href="#/profile">額度／內容設定</a><i>→</i><a href="#/plans">會員方案</a></div></section></div></main>${footer()}`;
}

function loginModal() {
  return `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true" aria-label="登入"><div class="modal-head"><h2>登入續頁</h2><button class="modal-close" data-close-modal>×</button></div><div class="login-options"><button data-login-done>以 Google 繼續</button><button data-login-done>以 Apple 繼續</button></div><div class="divider">或使用 Email</div><div class="field"><label>Email</label><input type="email" placeholder="reader@example.com"></div><button class="btn primary" style="width:100%" data-login-done>寄送登入連結</button><p class="subhead" style="font-size:11px;margin-top:16px">登入後會保留目前頁面，並同步訪客期間的閱讀紀錄。</p></section></div>`;
}

function modalShell(title, body) {
  return `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><div class="modal-head"><h2>${title}</h2><button class="modal-close" data-close-modal aria-label="關閉">×</button></div>${body}</section></div>`;
}

function reviewModal(w) {
  const progress = state.progress[w.id] || 0;
  if (!progress) return modalShell('撰寫評論', `<p class="subhead">評分前需至少閱讀一章，確保評論來自實際讀者。</p><a class="btn primary" style="width:100%" href="#/reader/${w.id}/1">開始閱讀第 1 章</a>`);
  const scopes = Array.from({length:Math.min(progress, 30)}, (_,i) => progress - i);
  return modalShell('撰寫評論', `<form data-review-form="${w.id}"><div class="field"><label>評分</label><div class="star-picker" role="radiogroup" aria-label="評分">${[1,2,3,4,5].map(s=>`<button type="button" role="radio" data-star="${s}" aria-checked="${s===5}" aria-label="${s} 星" class="${s<=5?'on':''}">★</button>`).join('')}</div><input type="hidden" name="stars" value="5"></div><div class="field"><label for="review-scope">討論範圍</label><select id="review-scope" name="ch"><option value="">整體評論（不含特定章節劇情）</option>${scopes.map(n=>`<option value="${n}">第 ${n} 章　${chapterTitle(w,n)}</option>`).join('')}</select><small class="field-note">只能標註你已讀過的章節（目前讀至第 ${progress} 章）。未讀到的讀者會看到劇透遮罩。</small></div><div class="field"><label for="review-text">評論內容</label><textarea id="review-text" name="text" rows="5" maxlength="1000" required placeholder="分享你的閱讀感受"></textarea></div><button class="btn primary" style="width:100%">送出評論</button></form>`);
}

function reportModal(key) {
  const reasons = ['未標註的劇透','騷擾或人身攻擊','廣告或垃圾訊息','其他'];
  return modalShell('檢舉留言', `<form data-report-form="${key}"><div class="radio-list">${reasons.map((r,i)=>`<label><input type="radio" name="reason" value="${r}" ${i===0?'checked':''}> ${r}</label>`).join('')}</div><p class="subhead" style="font-size:12px">檢舉將由營運團隊人工審核，對方不會知道檢舉人身分。</p><button class="btn primary" style="width:100%">送出檢舉</button></form>`);
}

function ageModal() {
  return modalShell('年齡確認', `<form data-age-form><div class="field"><label for="birthday">出生日期</label><input id="birthday" type="date" name="birthday" required max="${new Date().toISOString().slice(0,10)}"></div><label class="check-line"><input type="checkbox" name="adult" required> 我確認已年滿 18 歲，並自願開啟性描繪內容</label><button class="btn primary" style="width:100%;margin-top:16px">確認並開啟</button></form>`);
}

function tocModal(w, current) {
  return modalShell(`${w.title}・目錄`, `<div class="chapter-list toc-list">${chapterLinks(w, Array.from({length:w.chapters}, (_,i) => w.chapters - i), current)}</div>`);
}

function openModal(html) {
  document.querySelector('#modal-root').innerHTML = html;
  bindModal();
  const root = document.querySelector('#modal-root');
  const current = root.querySelector('.chapter.current');
  if (current) { current.scrollIntoView({ block:'center' }); current.focus(); return; }
  const focusable = root.querySelector('.modal form input:not([type=hidden]), .modal form textarea') || root.querySelector('.modal-close');
  if (focusable) focusable.focus();
}
function closeModal() { document.querySelector('#modal-root').innerHTML = ''; }

function ageFrom(dateString) {
  const b = new Date(dateString), t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age;
}

function bindModal() {
  const root = document.querySelector('#modal-root');
  root.querySelectorAll('[data-star]').forEach(b => b.onclick = () => {
    const s = Number(b.dataset.star);
    root.querySelector('input[name=stars]').value = s;
    root.querySelectorAll('[data-star]').forEach(x => { const on = Number(x.dataset.star) <= s; x.classList.toggle('on', on); x.setAttribute('aria-checked', Number(x.dataset.star) === s); });
  });
  const reviewForm = root.querySelector('[data-review-form]');
  if (reviewForm) reviewForm.onsubmit = e => {
    e.preventDefault();
    const id = reviewForm.dataset.reviewForm, f = new FormData(reviewForm), text = String(f.get('text')).trim();
    if (!text) return;
    const review = { key:`${id}:u${Date.now()}`, user:'安靜讀者', own:true, stars:Number(f.get('stars')), ch: f.get('ch') ? Number(f.get('ch')) : null, helpful:0, text };
    state.userReviews[id] = [review, ...(state.userReviews[id] || [])];
    persist(); closeModal(); render(true); toast('評論已發布');
  };
  const reportForm = root.querySelector('[data-report-form]');
  if (reportForm) reportForm.onsubmit = e => { e.preventDefault(); closeModal(); toast('已送出檢舉，將由人工審核'); };
  const ageForm = root.querySelector('[data-age-form]');
  if (ageForm) ageForm.onsubmit = e => {
    e.preventDefault();
    const f = new FormData(ageForm);
    if (ageFrom(f.get('birthday')) < 18) { toast('未滿 18 歲無法開啟此內容'); return; }
    state.prefs.ageVerified = true; state.prefs.sexual = true;
    persist(); closeModal(); render(true); toast('已完成年齡確認並開啟');
  };
}

function escapeHtml(s='') { return String(s).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
let toastTimer;
function toast(message) { const root=document.querySelector('#toast-root'); root.innerHTML=`<div class="toast">${message}</div>`; clearTimeout(toastTimer); toastTimer=setTimeout(()=>root.innerHTML='',2200); }

let lastPath = null;
function render(keepScroll=false) {
  setScheme(state.scheme);
  const path = route();
  if (path !== lastPath) { state.openMenu = null; state.historyManage = false; state.chaptersExpanded = false; closeModal(); lastPath = path; }
  const scrollY = window.scrollY;
  let html;
  if (path === '/compare') html = comparePage();
  else if (path === '/latest') html = latestPage();
  else if (path === '/search') html = searchPage();
  else if (path === '/library') html = libraryPage();
  else if (path === '/history') html = historyPage();
  else if (path === '/profile') html = profilePage();
  else if (path === '/plans') html = plansPage();
  else if (path.startsWith('/work/')) html = workPage(path.split('/')[2]);
  else if (path.startsWith('/discussion/')) html = discussionPage(path.split('/')[2]);
  else if (path.startsWith('/reader/')) {
    const [, , id, n] = path.split('/');
    const w = works.find(x=>x.id===id) || works[0];
    recordReading(w.id, Math.min(w.chapters, Math.max(1, Number(n)||1)));
    html = readerPage(id,n);
  }
  else html = latestPage();
  document.querySelector('#app').innerHTML = html;
  bind();
  window.scrollTo(0, keepScroll ? scrollY : 0);
}

const rerender = () => render(true);
const on = (selector, handler) => document.querySelectorAll(selector).forEach(el => el.onclick = e => handler(el, e));
const clampSize = n => Math.max(15, Math.min(26, n));

function bind() {
  on('[data-scheme]', b => setScheme(b.dataset.scheme));
  on('[data-enter-scheme]', b => { setScheme(b.dataset.enterScheme); go('/latest'); });
  on('[data-view]', b => { state.view=b.dataset.view; localStorage.setItem('view',state.view); rerender(); });
  on('[data-library]', b => { state.library=b.dataset.library; rerender(); });
  on('[data-latest-filter]', b => { state.latestFilter=b.dataset.latestFilter; rerender(); });
  on('[data-search-status]', b => { state.searchStatus=b.dataset.searchStatus; rerender(); });
  on('[data-search-genre]', b => { state.searchGenre = state.searchGenre===b.dataset.searchGenre ? '' : b.dataset.searchGenre; rerender(); });
  on('[data-search-reset]', () => { state.search=''; state.searchStatus='all'; state.searchGenre=''; rerender(); });
  on('[data-tag-search]', (a, e) => { e.preventDefault(); state.search=a.dataset.tagSearch; state.searchStatus='all'; state.searchGenre=''; go('/search'); });
  document.querySelectorAll('[data-search-form]').forEach(f=>f.onsubmit=e=>{ e.preventDefault(); state.search=String(new FormData(f).get('q')).trim(); if(route()==='/search') rerender(); else go('/search'); });
  on('[data-toast]', (b, e) => { if(b.tagName==='BUTTON') e.preventDefault(); toast(b.dataset.toast); });
  on('[data-login]', () => openModal(loginModal()));

  // Work page
  on('[data-save-toggle]', b => { const id=b.dataset.saveToggle; const had=state.saved.has(id); had?state.saved.delete(id):state.saved.add(id); persist(); rerender(); toast(had?'已從書架移除':'已加入書架'); });
  on('[data-chapter-order]', () => { state.chapterOrder = state.chapterOrder==='desc'?'asc':'desc'; rerender(); });
  on('[data-chapters-expand]', () => { state.chaptersExpanded=true; rerender(); });

  // Reviews
  on('[data-menu]', b => { state.openMenu = state.openMenu===b.dataset.menu ? null : b.dataset.menu; rerender(); });
  on('[data-vote]', b => { const k=b.dataset.vote, d=b.dataset.dir; if(state.votes[k]===d) delete state.votes[k]; else state.votes[k]=d; persist(); rerender(); if(state.votes[k]==='down') toast('已送出「沒有幫助」；數字不公開'); });
  on('[data-reveal]', b => { state.revealed.add(b.dataset.reveal); rerender(); });
  on('[data-review-block]', b => { state.blocked=[...new Set([...state.blocked, b.dataset.reviewBlock])]; state.openMenu=null; persist(); rerender(); toast(`已封鎖「${b.dataset.reviewBlock}」，其評論將不再顯示`); });
  on('[data-review-report]', b => { state.openMenu=null; rerender(); openModal(reportModal(b.dataset.reviewReport)); });
  on('[data-review-delete]', b => { const [id]=b.dataset.reviewDelete.split(':'); state.userReviews[id]=(state.userReviews[id]||[]).filter(r=>r.key!==b.dataset.reviewDelete); state.openMenu=null; persist(); rerender(); toast('已刪除評論'); });
  on('[data-unblock-all]', () => { state.blocked=[]; persist(); rerender(); toast('已解除所有封鎖'); });
  on('[data-write-review]', b => openModal(reviewModal(works.find(w=>w.id===b.dataset.writeReview))));

  // History
  on('[data-history-manage]', () => { state.historyManage=!state.historyManage; rerender(); });
  on('[data-history-remove]', b => { state.history=state.history.filter(h=>h.id!==b.dataset.historyRemove); persist(); rerender(); });
  on('[data-history-clear]', () => { state.history=[]; persist(); rerender(); toast('已清除閱讀紀錄'); });

  // Profile
  on('[data-profile-tab]', b => { state.profileTab=b.dataset.profileTab; rerender(); });
  on('[data-pref]', b => {
    const key=b.dataset.pref;
    if (key==='sexual' && !state.prefs.sexual && !state.prefs.ageVerified) { openModal(ageModal()); return; }
    state.prefs[key]=!state.prefs[key]; persist(); rerender();
  });
  on('[data-pref-size]', b => { state.readerSize=clampSize(state.readerSize+Number(b.dataset.prefSize)); persist(); rerender(); });
  on('[data-pref-theme]', b => { state.readerTheme=b.dataset.prefTheme; persist(); rerender(); });

  // Reader
  const tap = document.querySelector('[data-reader-toggle]');
  if(tap) tap.onclick=()=>{ state.readerChrome=!state.readerChrome; document.querySelector('.reader-top').classList.toggle('hidden',!state.readerChrome); document.querySelector('.reader-bottom').classList.toggle('hidden',!state.readerChrome); };
  on('[data-reader-theme]', b => { state.readerTheme=b.dataset.readerTheme; persist(); rerender(); });
  on('[data-font]', b => { state.readerSize=clampSize(state.readerSize+(b.dataset.font==='plus'?1:-1)); persist(); document.querySelector('.reader-shell').style.setProperty('--reader-size',`${state.readerSize}px`); toast(`字級 ${state.readerSize}px`); });
  on('[data-bookmark]', b => { const k=b.dataset.bookmark, had=state.bookmarks.has(k); had?state.bookmarks.delete(k):state.bookmarks.add(k); persist(); rerender(); toast(had?'已移除書籤':'已加入書籤'); });
  on('[data-toc]', b => { const [id,n]=b.dataset.toc.split('/'); openModal(tocModal(works.find(w=>w.id===id), Number(n))); });
}

document.addEventListener('click', e=>{
  if(e.target.matches('[data-close-modal]')) closeModal();
  if(e.target.closest('#modal-root a[href^="#/"]')) setTimeout(closeModal); // after the link navigates
  if(e.target.matches('[data-login-done]')) { closeModal(); toast('登入流程示意完成'); }
  if(state.openMenu && !e.target.closest('.review-menu, [data-menu]')) { state.openMenu=null; rerender(); }
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && document.querySelector('#modal-root').innerHTML) closeModal();
});
window.addEventListener('hashchange', () => render());
render();
