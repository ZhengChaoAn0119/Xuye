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

const chapters = Array.from({length:12}, (_,i) => ({
  n: 128-i,
  title: ['無聲的港口','燈塔以北','失真的頻率','灰色候鳥','黎明之前','逆風航線','編號 404','陌生人的火','地圖之外','漫長回音','沒有星星的夜晚','最後一封電報'][i],
  date: i < 1 ? '今天' : i < 3 ? '昨天' : `${i+1} 天前`
}));

const state = {
  scheme: localStorage.getItem('scheme') || 'a3',
  view: localStorage.getItem('view') || 'grid',
  library: 'all',
  readerChrome: true,
  readerTheme: 'sepia',
  readerSize: 19,
  search: '',
};

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
    <strong>續頁・互動原型</strong><span>A3 為推薦方案，可切換比較三個分支</span>
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
      <div class="quota-mini" title="閱讀額度將於 16 小時 42 分後恢復"><span>37 / 100</span><span class="quota-track"><span></span></span></div>
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
      <div class="filter-row" style="margin:0;justify-content:flex-start"><button class="active">全部</button><button>連載中</button><button>已完結</button></div>
      <div class="segmented" aria-label="檢視模式"><button data-view="grid" class="${state.view==='grid'?'active':''}" title="作品卡片">${icons.grid}</button><button data-view="list" class="${state.view==='list'?'active':''}" title="欄位列表">${icons.list}</button></div>
    </div>
    <div id="works-view">${state.view==='grid'?cards():rows()}</div>
  </div></main>${footer()}`;
}

function searchPage() {
  const filtered = state.search ? works.filter(w => [w.title,w.author,w.genre,w.desc].join(' ').includes(state.search)) : works;
  return `${header()}<main id="main"><div class="page"><section class="search-stage"><p class="eyebrow">Find your next story</p><h1>想讀什麼故事？</h1><form class="giant-search" data-search-form><input name="q" autofocus placeholder="搜尋作品、作者、分類或標籤" value="${escapeHtml(state.search)}"><button class="btn primary">搜尋</button></form><div class="filter-row"><button class="active">全部</button><button>連載中</button><button>已完結</button><button>奇幻</button><button>懸疑</button><button>科幻</button><button>日常</button></div></section><div class="section-head"><h2>${state.search?`「${escapeHtml(state.search)}」的結果`:'全部作品'}</h2><span class="count">${filtered.length} 部作品</span></div>${cards(filtered)}</div></main>${footer()}`;
}

function libraryPage() {
  const filters = { all:'全部', unread:'尚未閱讀', new:'有新章', done:'已追到最新' };
  let list = works;
  if (state.library !== 'all') list = works.filter(w => w.state === state.library);
  return `${header('library')}<main id="main"><div class="page"><div class="page-head"><div><p class="eyebrow">Your library</p><h1>我的書架</h1><p class="subhead">收藏的故事與追更狀態會在所有裝置保持同步。</p></div><span class="count">8 部作品</span></div><div class="library-tabs">${Object.entries(filters).map(([k,v])=>`<button data-library="${k}" class="${state.library===k?'active':''}">${v}</button>`).join('')}</div>${rows(list,true)}</div></main>${footer()}`;
}

function historyPage() {
  return `${header('history')}<main id="main"><div class="page"><div class="page-head"><div><p class="eyebrow">Reading history</p><h1>閱讀紀錄</h1><p class="subhead">包含未加入書架的作品。跨裝置接續上一次停下的位置。</p></div><button class="btn ghost small" data-toast="已開啟紀錄管理">管理紀錄</button></div><div class="works-list">${works.slice(0,6).map((w,i)=>`<a class="work-row" href="#/reader/${w.id}/${Math.max(1,w.chapters-i*3)}"><span class="mini-cover" style="--cover:${w.cover}"></span><strong>${w.title}<br><span>讀至第 ${Math.max(1,w.chapters-i*3)} 章</span></strong><span class="hide-mobile">${i%2?'昨天':'今天'}</span><span class="hide-tablet">${w.genre}</span><span class="hide-tablet">${20+i*13}%</span><span>繼續閱讀 →</span></a>`).join('')}</div></div></main>${footer()}`;
}

function workPage(id) {
  const w = works.find(x=>x.id===id) || works[0];
  return `${header()}<main id="main"><div class="page"><section class="detail-hero"><div class="detail-cover">${cover(w)}</div><div class="detail-copy"><p class="eyebrow">${w.status}・${w.genre}</p><h1>${w.title}</h1><p class="author">${w.author} 著</p><div class="tags"><span>${w.genre}</span><span>群像</span><span>慢熱</span><span>劇情向</span></div><p class="synopsis">${w.desc}</p><div class="detail-actions"><a class="btn primary" href="#/reader/${w.id}/${w.id==='ember-city'?126:1}">繼續閱讀</a><button class="btn" data-toast="已加入書架">♡ 收藏作品</button><a class="btn ghost" href="#/discussion/${w.id}">查看評論</a></div></div></section>
    <section class="fact-grid"><div class="fact"><strong>${w.rating} / 5</strong><span>作品評分</span></div><div class="fact"><strong>${w.chapters} 章</strong><span>目前章數</span></div><div class="fact"><strong>${w.reads}</strong><span>累計閱讀</span></div><div class="fact"><strong>${w.saved}</strong><span>加入書架</span></div><div class="fact"><strong>${w.time}</strong><span>最近更新</span></div></section>
    <div class="content-columns"><section><div class="section-head" style="margin-top:0"><h2>章節目錄</h2><button class="btn small ghost" data-toast="已切換為由舊到新">⇅ 由新到舊</button></div><div class="chapter-list">${chapters.map(c=>`<a class="chapter" href="#/reader/${w.id}/${c.n}"><span>第 ${c.n} 章　${c.title}</span><small>${c.date}</small></a>`).join('')}</div></section><aside><div class="section-head" style="margin-top:0"><h2>讀者評論</h2><a href="#/discussion/${w.id}" class="count">查看全部</a></div>${reviewCards(3)}</aside></div>
  </div></main>${footer()}`;
}

function reviewCards(n=4) {
  const reviews = [
    ['夏日緩慢','第 124 章','伏筆在這章全部接起來了，但節奏還是很穩。喜歡作者沒有急著解釋所有事情。','128'],
    ['書頁之外','第 98 章','城市本身像另一個角色。場景不是背景，而是在一步步改變人物的選擇。','86'],
    ['折光','整體評論','文字很乾淨，讀到後面才發現最早幾章的細節都有意義。','54'],
    ['晚風信箱','第 127 章','已標註特定章節的評論；尚未讀到的讀者會看到劇透遮罩。','31']
  ];
  return reviews.slice(0,n).map((r,i)=>`<article class="review-card"><div class="review-user"><span class="avatar">${r[0][0]}</span><div><strong class="${i===0?'member-name':''}">${i===0?'<span class="medal">◆</span> ':''}${r[0]}</strong><small><span class="stars">★★★★★</span>・${r[1]}</small></div><button class="icon-btn" style="margin-left:auto;width:32px;height:32px;border:0" data-menu>${icons.more}</button></div><p>${r[2]}</p><button class="btn small ghost" data-toast="已標記為有幫助">♡ 有幫助 ${r[3]}</button><button class="btn small ghost" data-toast="已送出「沒有幫助」；數字不公開">沒有幫助</button></article>`).join('');
}

function discussionPage(id) {
  const w = works.find(x=>x.id===id)||works[0];
  return `${header()}<main id="main"><div class="page"><div class="page-head"><div><p class="eyebrow">Community reviews</p><h1>${w.title}・讀者評論</h1><p class="subhead">標註章節，讓其他讀者知道評論的討論範圍。超過閱讀進度的內容會自動遮蔽。</p></div><button class="btn primary" data-login>撰寫評論</button></div><div class="content-columns"><section>${reviewCards(4)}<article class="review-card"><div class="review-user"><span class="avatar">鹿</span><div><strong>林間鹿</strong><small><span class="stars">★★★★☆</span>・第 128 章</small></div></div><div style="padding:25px;background:var(--surface-2);border-radius:10px;text-align:center"><strong>此評論可能包含尚未讀到的劇情</strong><p style="margin:6px 0 0">你目前讀至第 126 章</p><button class="btn small" data-toast="已顯示劇透內容">仍要顯示</button></div></article></section><aside><div class="stat-panel"><p class="eyebrow">整體評分</p><span class="stat-number">${w.rating}</span><div class="stars" style="margin:6px 0 14px">★★★★★</div><p class="subhead" style="font-size:13px">共 2,461 位實際閱讀過本作品的讀者評分。</p></div></aside></div></div></main>${footer()}`;
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
  const n = Number(chapterNo)||1;
  return `<main id="main" class="reader-shell reader-${state.readerTheme}" style="--reader-size:${state.readerSize}px">${prototypeBar()}<div class="reader-top ${state.readerChrome?'':'hidden'}"><a class="icon-btn" href="#/work/${w.id}" aria-label="返回作品頁">${icons.back}</a><div class="book-title">${w.title}・第 ${n} 章</div><button class="icon-btn" data-toast="已加入書籤">${icons.bookmark}</button></div><div class="reader-tap-zone" data-reader-toggle aria-label="顯示或隱藏閱讀控制列"></div><article class="reader-article"><header><p class="chapter-meta">${w.title}・${w.author}</p><h1>第 ${n} 章　${n===128?'無聲的港口':'燈塔以北'}</h1><p class="chapter-meta">約 8 分鐘・本章 2,840 字</p></header><div class="reader-copy">${storyParagraphs.map(p=>`<p>${p}</p>`).join('')}</div><section class="reader-end"><p>第 ${n} 章・閱讀完畢</p><h2>${n>=w.chapters?'你已追到最新進度':'下一章・燈塔以北'}</h2><div class="reader-actions"><a class="btn" href="#/reader/${w.id}/${Math.max(1,n-1)}">← 上一章</a>${n>=w.chapters?`<a class="btn primary" href="#/work/${w.id}">返回作品頁</a>`:`<a class="btn primary" href="#/reader/${w.id}/${n+1}">進入下一章 →</a>`}</div></section></article><div class="reader-bottom ${state.readerChrome?'':'hidden'}"><button data-font="minus" title="縮小字級">A−</button><button data-reader-theme="sepia" title="米色">◐</button><button data-reader-theme="white" title="白色">○</button><button data-reader-theme="dark" title="深色">●</button><button data-font="plus" title="放大字級">A＋</button><button data-toast="已開啟章節目錄" title="目錄">${icons.menu}</button></div></main>`;
}

function profilePage() {
  return `${header()}<main id="main"><div class="page"><div class="page-head"><div><p class="eyebrow">Account & preferences</p><h1>我的</h1></div><a class="btn" href="#/plans">查看會員方案</a></div><div class="profile-layout"><aside class="profile-card"><span class="avatar">安</span><div><strong class="member-name"><span class="medal">◆</span> 安靜讀者</strong><small style="display:block;color:var(--muted);margin-top:5px">Free 免費會員</small></div><p class="subhead" style="font-size:12px;margin-top:12px">已同步 3 台裝置・同時使用 1 / 2</p><div class="profile-menu"><button class="active">帳號總覽</button><button>閱讀設定</button><button>內容偏好</button></div></aside><section><div class="quota-panel"><div class="quota-big"><div><p class="eyebrow">24 小時閱讀額度</p><strong>37 / 100</strong></div><span>16 小時 42 分後恢復</span></div><div class="quota-bar"><span></span></div><p class="subhead" style="font-size:12px">首次載入章節後開始計時；目前已載入的章節不會被中斷。</p></div><div class="settings-group"><div class="setting"><div><strong>性描繪內容</strong><small>已完成簡易年齡確認後可自行開啟</small></div><button class="toggle" aria-label="性描繪內容"></button></div><div class="setting"><div><strong>暴力與血腥內容</strong><small>在搜尋與作品列表中顯示相關內容</small></div><button class="toggle on" aria-label="暴力與血腥內容"></button></div><div class="setting"><div><strong>公開會員徽章</strong><small>在評論與個人頁展示付費身分</small></div><button class="toggle on" aria-label="公開會員徽章"></button></div></div><div class="settings-group"><div class="setting"><div><strong>跨裝置同步</strong><small>閱讀位置、書架與閱讀設定皆已同步</small></div><span class="pill">${icons.check} 已同步</span></div><div class="setting"><div><strong>登入方式</strong><small>Email・Google・Apple</small></div><button class="btn small" data-login>管理</button></div></div></section></div></div></main>${footer()}`;
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
    ['a2','A2・快速追更','參考 Komiic 的工具列、側邊功能軌與高密度作品格，讓讀者快速掃描更新與進入章節。'],
    ['a3','A3・現代書庫','清楚、快速、高資訊密度，兼顧卡片探索與欄位掃讀。']
  ];
  return `${prototypeBar()}<main id="main"><div class="page"><div class="compare-intro"><p class="eyebrow">Three directions, one product</p><h1>續頁・三個設計分支</h1><p class="subhead">A2 使用獨立的導覽、密度與作品資訊層級；A1 與 A3 則保留原本閱讀平台結構。</p></div><div class="concept-grid">${concepts.map(c=>`<article class="concept-card"><div class="concept-preview ${c[0]}">${c[0]==='a2'?`<div class="a2-fake-toolbar"><b>☰</b><strong>&lt;/&gt; 續頁</strong><i>37/100</i><span>搜　安</span></div><div class="a2-fake-body"><nav>⌂<br>♡<br>↺</nav><section><h4>最新更新　<span>新作上架</span></h4><div class="a2-fake-grid"><i></i><i></i><i></i><i></i><i></i><i></i></div></section></div>`:`<div class="fake-nav"><span>續頁</span><span>搜尋　我的</span></div><div class="fake-hero">故事，從下一頁開始。</div><div class="fake-cards"><span></span><span></span><span></span><span></span></div>`}</div><div class="concept-copy">${c[0]==='a2'?'<span class="recommended">KOMIIC 導覽模型</span>':c[0]==='a3'?'<span class="recommended">推薦方案</span>':''}<h2>${c[1]}</h2><p>${c[2]}</p><button class="btn ${c[0]==='a3'?'primary':''}" style="width:100%" data-enter-scheme="${c[0]}">使用此方案瀏覽</button></div></article>`).join('')}</div><section class="flow-map"><p class="eyebrow">Click map</p><h2>主要點擊流程</h2><div class="flow"><a href="#/latest">最新首頁</a><i>→</i><a href="#/work/ember-city">作品詳情／目錄</a><i>→</i><a href="#/reader/ember-city/126">閱讀章節</a><i>→</i><a href="#/reader/ember-city/127">下一章</a></div><div class="flow"><a href="#/search">單一搜尋框</a><i>→</i><a href="#/work/thirteen">搜尋結果作品</a><i>→</i><a href="#/discussion/thirteen">評分與評論</a></div><div class="flow"><a href="#/library">登入書架</a><i>→</i><a href="#/history">閱讀紀錄</a><i>→</i><a href="#/profile">額度／內容設定</a><i>→</i><a href="#/plans">會員方案</a></div></section></div></main>${footer()}`;
}

function loginModal() {
  return `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true" aria-label="登入"><div class="modal-head"><h2>登入續頁</h2><button class="modal-close" data-close-modal>×</button></div><div class="login-options"><button data-login-done>以 Google 繼續</button><button data-login-done>以 Apple 繼續</button></div><div class="divider">或使用 Email</div><div class="field"><label>Email</label><input type="email" placeholder="reader@example.com"></div><button class="btn primary" style="width:100%" data-login-done>寄送登入連結</button><p class="subhead" style="font-size:11px;margin-top:16px">登入後會保留目前頁面，並同步訪客期間的閱讀紀錄。</p></section></div>`;
}

function escapeHtml(s='') { return s.replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function toast(message) { const root=document.querySelector('#toast-root'); root.innerHTML=`<div class="toast">${message}</div>`; setTimeout(()=>root.innerHTML='',2200); }

function render() {
  setScheme(state.scheme);
  const path = route();
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
  else if (path.startsWith('/reader/')) { const [, , id, n] = path.split('/'); html = readerPage(id,n); }
  else html = latestPage();
  document.querySelector('#app').innerHTML = html;
  bind();
  window.scrollTo(0,0);
}

function bind() {
  document.querySelectorAll('[data-scheme]').forEach(b=>b.onclick=()=>setScheme(b.dataset.scheme));
  document.querySelectorAll('[data-enter-scheme]').forEach(b=>b.onclick=()=>{ setScheme(b.dataset.enterScheme); go('/latest'); });
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{ state.view=b.dataset.view; localStorage.setItem('view',state.view); render(); });
  document.querySelectorAll('[data-library]').forEach(b=>b.onclick=()=>{ state.library=b.dataset.library; render(); });
  document.querySelectorAll('[data-search-form]').forEach(f=>f.onsubmit=e=>{ e.preventDefault(); state.search=new FormData(f).get('q').trim(); go('/search'); if(route()==='/search') render(); });
  document.querySelectorAll('[data-toast]').forEach(b=>b.onclick=e=>{ if(b.tagName==='BUTTON') e.preventDefault(); toast(b.dataset.toast); });
  document.querySelectorAll('.toggle').forEach(b=>b.onclick=()=>b.classList.toggle('on'));
  document.querySelectorAll('[data-login]').forEach(b=>b.onclick=()=>document.querySelector('#modal-root').innerHTML=loginModal());
  const tap = document.querySelector('[data-reader-toggle]');
  if(tap) tap.onclick=()=>{ state.readerChrome=!state.readerChrome; document.querySelector('.reader-top').classList.toggle('hidden',!state.readerChrome); document.querySelector('.reader-bottom').classList.toggle('hidden',!state.readerChrome); };
  document.querySelectorAll('[data-reader-theme]').forEach(b=>b.onclick=()=>{ state.readerTheme=b.dataset.readerTheme; render(); });
  document.querySelectorAll('[data-font]').forEach(b=>b.onclick=()=>{ state.readerSize=Math.max(15,Math.min(26,state.readerSize+(b.dataset.font==='plus'?1:-1))); document.querySelector('.reader-shell').style.setProperty('--reader-size',`${state.readerSize}px`); toast(`字級 ${state.readerSize}px`); });
}

document.addEventListener('click', e=>{
  if(e.target.matches('[data-close-modal]')) document.querySelector('#modal-root').innerHTML='';
  if(e.target.matches('[data-login-done]')) { document.querySelector('#modal-root').innerHTML=''; toast('登入流程示意完成'); }
  if(e.target.matches('[data-menu]')) toast('選單：封鎖使用者・檢舉留言');
});
window.addEventListener('hashchange', render);
render();
