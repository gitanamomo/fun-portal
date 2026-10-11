// ============================================================
// FRESHJOY ENTERTAINMENT HUB - 清爽多主题与核心交互脚本
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // 支持的 5 套清爽主题
  const VALID_THEMES = ["mint", "sky", "peach", "matcha", "nord"];

  // 基础状态
  let currentCategory = "all";
  let currentNetwork = "all";
  let searchQuery = "";
  let currentTranslateLang = localStorage.getItem("fun_trans_lang") || "zh-CN";

  // 读取已保存的主题，默认采用清爽的「🌿 薄荷晴空 (mint)」
  let savedTheme = localStorage.getItem("fun_fresh_theme");
  if (!VALID_THEMES.includes(savedTheme)) {
    savedTheme = "mint";
  }
  let currentTheme = savedTheme;
  let isPlayingRadio = false;

  // DOM 元素
  const gridContainer = document.getElementById("cardsGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryTabs = document.querySelectorAll(".tab-btn");
  const networkBtns = document.querySelectorAll(".net-btn");
  const swatchBtns = document.querySelectorAll(".swatch-btn");
  const mascotAvatar = document.getElementById("mascotAvatar");
  const radioPlayBtn = document.getElementById("radioPlayBtn");
  const waveBars = document.getElementById("waveBars");
  const radioAudio = document.getElementById("radioAudio");
  const translateSelect = document.getElementById("translateSelect");
  const mascotBubbleText = document.getElementById("mascotBubbleText");
  const openToolBtn = document.getElementById("openToolBtn");
  const translateModal = document.getElementById("translateModal");
  const modalClose = document.getElementById("modalClose");
  const modalInputUrl = document.getElementById("modalInputUrl");
  const modalBtnZh = document.getElementById("modalBtnZh");
  const modalBtnEn = document.getElementById("modalBtnEn");

  // 初始化主题
  applyTheme(currentTheme);

  // 初始化翻译语言选择
  if (translateSelect) {
    translateSelect.value = currentTranslateLang;
  }

  // 动态问候语与吉祥物语录
  initGreeting();

  // 渲染所有卡片
  renderCards();

  // ----------------------------------------------------
  // 交互事件监听
  // ----------------------------------------------------

  // 🎨 5套清爽配色点击切换
  swatchBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTheme = btn.dataset.themeVal;
      applyTheme(targetTheme);
    });
  });

  // 点击矢量吉祥物头像也可以顺滑轮换主题色
  if (mascotAvatar) {
    mascotAvatar.addEventListener("click", () => {
      const nextIndex = (VALID_THEMES.indexOf(currentTheme) + 1) % VALID_THEMES.length;
      applyTheme(VALID_THEMES[nextIndex]);
    });
  }

  function applyTheme(themeName) {
    currentTheme = themeName;
    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem("fun_fresh_theme", themeName);
    swatchBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.themeVal === themeName);
    });
  }

  // 分类切换
  categoryTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      categoryTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      renderCards();
    });
  });

  // 网络模式切换 (全部 / 直连 / VPN)
  networkBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      networkBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentNetwork = btn.dataset.network;
      renderCards();
    });
  });

  // 实时搜索
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderCards();
  });

  // 快捷键支持 (Ctrl/Cmd + K 聚焦搜索)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // 俄站翻译偏好切换
  if (translateSelect) {
    translateSelect.addEventListener("change", (e) => {
      currentTranslateLang = e.target.value;
      localStorage.setItem("fun_trans_lang", currentTranslateLang);
      renderCards();
    });
  }

  // 内置 Lofi 音乐电台播放控制
  radioPlayBtn.addEventListener("click", () => {
    if (!isPlayingRadio) {
      radioAudio.play().then(() => {
        isPlayingRadio = true;
        radioPlayBtn.innerHTML = "⏸";
        waveBars.classList.add("playing");
      }).catch(err => {
        console.warn("音频自动播放被拦截:", err);
      });
    } else {
      radioAudio.pause();
      isPlayingRadio = false;
      radioPlayBtn.innerHTML = "▶";
      waveBars.classList.remove("playing");
    }
  });

  // 俄站翻译弹窗
  if (openToolBtn) {
    openToolBtn.addEventListener("click", () => {
      translateModal.classList.add("active");
    });
  }
  if (modalClose) {
    modalClose.addEventListener("click", () => {
      translateModal.classList.remove("active");
    });
  }
  if (translateModal) {
    translateModal.addEventListener("click", (e) => {
      if (e.target === translateModal) translateModal.classList.remove("active");
    });
  }
  if (modalBtnZh) {
    modalBtnZh.addEventListener("click", () => {
      openTranslatedUrl(modalInputUrl.value, "zh-CN");
    });
  }
  if (modalBtnEn) {
    modalBtnEn.addEventListener("click", () => {
      openTranslatedUrl(modalInputUrl.value, "en");
    });
  }

  // ----------------------------------------------------
  // 核心渲染与辅助函数
  // ----------------------------------------------------

  function renderCards() {
    gridContainer.innerHTML = "";

    // 读取本地用户自定义数据合并
    const customSites = JSON.parse(localStorage.getItem("fun_custom_sites") || "[]");
    const allData = [...(window.ENTERTAINMENT_DATA || []), ...customSites];

    const filtered = allData.filter(item => {
      // 分类筛选 (支持主分类、子分类、Gina自制专题以及 GitHub 开源专区筛选)
      if (currentCategory !== "all") {
        const matchPrimary = item.category === currentCategory;
        const matchSub = item.subCategories && item.subCategories.includes(currentCategory);
        const matchGithub = currentCategory === "github" && item.isGithub === true;
        const matchGina = currentCategory === "gina" && item.isGina === true;
        if (!matchPrimary && !matchSub && !matchGithub && !matchGina) {
          return false;
        }
      }
      // 网络筛选
      if (currentNetwork === "direct" && item.vpn === true) {
        return false;
      }
      if (currentNetwork === "vpn" && item.vpn === false) {
        return false;
      }
      // 搜索筛选
      if (searchQuery) {
        const titleMatch = item.title.toLowerCase().includes(searchQuery);
        const descMatch = item.desc.toLowerCase().includes(searchQuery);
        const tagMatch = item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery));
        if (!titleMatch && !descMatch && !tagMatch) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🌿🔍</div>
          <h3>没有找到匹配的娱乐站点</h3>
          <p>试试换个关键词，或者切回「全部宝藏」看看吧~</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = createCardElement(item);
      gridContainer.appendChild(card);
    });
  }

  function createCardElement(item) {
    const card = document.createElement("div");
    card.className = item.isGina ? "hub-card gina-card" : "hub-card";

    // 图标推断 (Emoji + 视觉识别)
    const iconMap = {
      gina: "👑",
      movie: "🎬",
      music: "🎧",
      book: "📖",
      game: "🎮",
      russia: "🇷🇺",
      github: "🐙"
    };
    const icon = iconMap[item.category] || "✨";

    // 翻译链接生成 (利用 Google Web Translate 服务)
    const encodedUrl = encodeURIComponent(item.url);
    const zhTranslateUrl = `https://translate.google.com/translate?sl=auto&tl=zh-CN&u=${encodedUrl}`;
    const enTranslateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodedUrl}`;

    // 决定主按钮点击时是直接打开还是自动翻译
    let mainLaunchUrl = item.url;
    let mainBtnText = item.isGina ? "立即畅玩 / 进入" : "立即打开";

    if (item.isRussian && currentTranslateLang !== "original") {
      mainLaunchUrl = currentTranslateLang === "zh-CN" ? zhTranslateUrl : enTranslateUrl;
      mainBtnText = currentTranslateLang === "zh-CN" ? "🇨🇳 中文打开" : "🇬🇧 英文打开";
    }

    // 子游戏/分入口胶囊生成 (例如 Woodland Arcade 的 4 款森林小游戏)
    let subLinksHtml = "";
    if (item.subLinks && item.subLinks.length > 0) {
      const pills = item.subLinks.map(sub =>
        `<a href="${sub.url}" target="_blank" rel="noopener noreferrer" class="sublink-pill">${escapeHtml(sub.label)}</a>`
      ).join("");
      subLinksHtml = `<div class="card-sublinks">${pills}</div>`;
    }

    // 标签生成
    const tagsHtml = (item.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join("");

    // VPN 状态徽章
    const vpnBadgeHtml = item.vpn
      ? `<span class="vpn-badge need-vpn" title="${item.vpnTip || '需VPN访问'}">🔵 需 VPN</span>`
      : `<span class="vpn-badge direct" title="${item.vpnTip || '国内可直连'}">🟢 直连秒开</span>`;

    // GitHub 星标评分徽章 或 Gina 原创金标
    let specialBadgeHtml = "";
    if (item.isGina) {
      specialBadgeHtml = `<span class="gina-origin-badge" title="Gina 自制原创项目">👑 Gina 原创</span>`;
    } else if (item.isGithub && item.githubStars) {
      specialBadgeHtml = `<span class="github-star-badge" title="GitHub 开源星标评分">⭐ ${escapeHtml(item.githubStars)}</span>`;
    }

    // 俄罗斯站点的多语言切换按钮
    let translateActionHtml = "";
    if (item.isRussian) {
      translateActionHtml = `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="translate-btn" title="查看俄罗斯原版网页">
          🇷🇺 原版
        </a>
        <a href="${zhTranslateUrl}" target="_blank" rel="noopener noreferrer" class="translate-btn" title="Google 翻译中文字幕/网页">
          译中
        </a>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="card-header">
          <div class="card-title-wrap">
            <div class="card-icon">${icon}</div>
            <div>
              <div class="card-title">${escapeHtml(item.title)}</div>
              <div class="card-quality">${escapeHtml(item.quality || "高清品质")}</div>
            </div>
          </div>
          <div class="card-badges-right">
            ${vpnBadgeHtml}
            ${specialBadgeHtml}
            ${item.badge ? `<span class="card-badge">${escapeHtml(item.badge)}</span>` : ""}
          </div>
        </div>
        <p class="card-desc">${escapeHtml(item.desc)}</p>
        ${subLinksHtml}
        <div class="card-tags">${tagsHtml}</div>
      </div>
      <div class="card-actions">
        <a href="${mainLaunchUrl}" target="_blank" rel="noopener noreferrer" class="launch-btn">
          <span>✨</span> ${mainBtnText}
        </a>
        ${translateActionHtml}
      </div>
    `;

    return card;
  }

  function initGreeting() {
    const hour = new Date().getHours();
    let greeting = "欢迎来到你的清爽娱乐小天地！";
    if (hour >= 5 && hour < 12) greeting = "早安！清爽的早晨，听首歌或看本好书开启美好一天吧 🌿";
    else if (hour >= 12 && hour < 18) greeting = "午后好时光！泡杯茶，挑一部超清电影或玩局小游戏放松下 🍵";
    else if (hour >= 18 && hour < 23) greeting = "晚上好！卸下一天的疲惫，尽情享受你的私人影音游戏时光 🎬";
    else greeting = "夜深啦，可以点击右侧切换「🌌 星夜极光」柔和护眼色哦 🌙";

    const allItems = window.ENTERTAINMENT_DATA || [];
    const ginaCount = allItems.filter(i => i.isGina).length;
    const githubCount = allItems.filter(i => i.isGithub).length;

    if (mascotBubbleText) {
      mascotBubbleText.innerHTML = `<strong>🌱 娱乐管家：</strong> ${greeting} 已收录 <strong>${allItems.length}</strong> 个宝藏站点（含 <strong>👑 ${ginaCount} 款 Gina 原创作品</strong> & <strong>${githubCount} 个 GitHub 开源神作</strong>）。`;
    }
  }

  function openTranslatedUrl(rawUrl, targetLang) {
    if (!rawUrl || !rawUrl.startsWith("http")) {
      alert("请输入合法的网址（以 http:// 或 https:// 开头）");
      return;
    }
    const target = `https://translate.google.com/translate?sl=auto&tl=${targetLang}&u=${encodeURIComponent(rawUrl)}`;
    window.open(target, "_blank");
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m];
    });
  }
});
