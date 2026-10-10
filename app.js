// ============================================================
// CYBER KAWAII ENTERTAINMENT HUB - 核心交互脚本
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // 基础状态
  let currentCategory = "all";
  let currentNetwork = "all";
  let searchQuery = "";
  let currentTranslateLang = localStorage.getItem("fun_trans_lang") || "zh-CN"; // 'zh-CN' 或 'en'
  let currentTheme = localStorage.getItem("fun_theme") || "dark";
  let isPlayingRadio = false;

  // DOM 元素
  const gridContainer = document.getElementById("cardsGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryTabs = document.querySelectorAll(".tab-btn");
  const networkBtns = document.querySelectorAll(".net-btn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
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
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon();

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

  // 主题切换
  themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("fun_theme", currentTheme);
    updateThemeIcon();
  });

  function updateThemeIcon() {
    themeToggleBtn.innerHTML = currentTheme === "dark" ? "🌙 暗黑赛博" : "☀️ 萌粉甜心";
  }

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
      // 分类筛选
      if (currentCategory !== "all" && item.category !== currentCategory) {
        return false;
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
          <div class="empty-state-icon">🐱💫</div>
          <h3>未找到匹配的宝藏网站</h3>
          <p>试试换个搜索词，或者重置分类筛选吧~</p>
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
    card.className = "hub-card";

    // 图标推断
    const iconMap = {
      movie: "🎬",
      music: "🎵",
      book: "📚",
      game: "🎮",
      russia: "🇷🇺"
    };
    const icon = iconMap[item.category] || "✨";

    // 翻译链接生成 (利用 Google Web Translate 服务)
    const encodedUrl = encodeURIComponent(item.url);
    const zhTranslateUrl = `https://translate.google.com/translate?sl=auto&tl=zh-CN&u=${encodedUrl}`;
    const enTranslateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodedUrl}`;

    // 决定主按钮点击时是直接打开还是自动翻译
    let mainLaunchUrl = item.url;
    let mainBtnText = "立即前往";

    if (item.isRussian && currentTranslateLang !== "original") {
      mainLaunchUrl = currentTranslateLang === "zh-CN" ? zhTranslateUrl : enTranslateUrl;
      mainBtnText = currentTranslateLang === "zh-CN" ? "🇨🇳 中文打开" : "🇬🇧 英文打开";
    }

    // 标签生成
    const tagsHtml = (item.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join("");

    // VPN 状态徽章
    const vpnBadgeHtml = item.vpn
      ? `<span class="vpn-badge need-vpn" title="${item.vpnTip || '需VPN访问'}">🟣 需 VPN</span>`
      : `<span class="vpn-badge direct" title="${item.vpnTip || '国内可直连'}">🟢 直连秒开</span>`;

    // 俄罗斯站点的多语言切换按钮
    let translateActionHtml = "";
    if (item.isRussian) {
      translateActionHtml = `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="translate-btn" title="查看俄罗斯原版网页">
          🇷🇺 原版
        </a>
        <a href="${zhTranslateUrl}" target="_blank" rel="noopener noreferrer" class="translate-btn" title="Google 翻译中文字幕/网页">
          中
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
            ${item.badge ? `<span class="card-badge">${escapeHtml(item.badge)}</span>` : ""}
          </div>
        </div>
        <p class="card-desc">${escapeHtml(item.desc)}</p>
        <div class="card-tags">${tagsHtml}</div>
      </div>
      <div class="card-actions">
        <a href="${mainLaunchUrl}" target="_blank" rel="noopener noreferrer" class="launch-btn">
          <span>🚀</span> ${mainBtnText}
        </a>
        ${translateActionHtml}
      </div>
    `;

    return card;
  }

  function initGreeting() {
    const hour = new Date().getHours();
    let greeting = "欢迎来到你的私人娱乐次元！";
    if (hour >= 5 && hour < 12) greeting = "早安！新的一天从美妙的音乐和阅读开始吧 ☕";
    else if (hour >= 12 && hour < 18) greeting = "午后时光，喝杯下午茶，来部高清电影或玩局游戏放松下~ 🍰";
    else if (hour >= 18 && hour < 23) greeting = "晚上好！今天辛苦啦，尽情享受属于你的私密娱乐之夜 🎬";
    else greeting = "夜猫子守护者在此！已为你点亮夜光，记得早点休息哦 🌙";

    if (mascotBubbleText) {
      mascotBubbleText.innerHTML = `<strong>✨ 娱乐管家：</strong> ${greeting} 当前共收录 <strong>${(window.ENTERTAINMENT_DATA || []).length}</strong> 个免注册神站。`;
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
