/* ============================================
   Tahoe OS — Desktop Environment JavaScript
   Flat, lightweight, low-overhead system UI.
   ============================================ */

(function () {
  "use strict";

  // ---------- State ----------
  let windowZIndex = 100;
  let activeWindowId = null;
  let windowCounter = 0;
  const windows = {}; // id -> element
  const appState = {
    calcDisplay: "0",
    calcCurrent: null,
    calcOp: null,
    calcReset: false,
    musicPlaying: false,
    currentNoteId: 0,
  };

  // ---------- App Definitions ----------
  const APP_DEFS = {
    finder:  { name: "Finder",  icon: "finder-icon",  defaultWidth: 600,  defaultHeight: 400 },
    safari:  { name: "Safari",  icon: "safari-icon",  defaultWidth: 700,  defaultHeight: 450 },
    terminal:{ name: "Terminal",icon: "terminal-icon",defaultWidth: 550,  defaultHeight: 380 },
    settings:{ name: "Settings",icon: "settings-icon",defaultWidth: 560,  defaultHeight: 420 },
    calendar:{ name: "Calendar",icon: "calendar-icon",defaultWidth: 340,  defaultHeight: 360 },
    notes:   { name: "Notes",   icon: "notes-icon",   defaultWidth: 500,  defaultHeight: 400 },
    music:   { name: "Music",   icon: "music-icon",   defaultWidth: 520,  defaultHeight: 420 },
    photos:  { name: "Photos",  icon: "photos-icon",  defaultWidth: 480,  defaultHeight: 400 },
    messages:{ name: "Messages",icon: "messages-icon",defaultWidth: 560,  defaultHeight: 420 },
    calculator:{name: "Calculator",icon: "calculator-icon",defaultWidth: 260, defaultHeight: 340 },
  };

  const LAUNCHPAD_APPS = [
    { id: "finder",      name: "Finder",      color: "#3A86FF", emoji: "☺" },
    { id: "safari",      name: "Safari",      color: "#3B82F6", emoji: "🧭" },
    { id: "terminal",    name: "Terminal",    color: "#1E1E1E", emoji: ">_" },
    { id: "settings",    name: "Settings",    color: "#6B7280", emoji: "⚙" },
    { id: "calendar",    name: "Calendar",    color: "#E5E5E7", emoji: "📅" },
    { id: "notes",       name: "Notes",       color: "#FCD34D", emoji: "📝" },
    { id: "music",       name: "Music",       color: "#FF6B6B", emoji: "♪" },
    { id: "photos",      name: "Photos",      color: "#F472B6", emoji: "🏞" },
    { id: "messages",    name: "Messages",    color: "#34C759", emoji: "💬" },
    { id: "calculator",  name: "Calculator",  color: "#2C2C2E", emoji: "#" },
  ];

  // ---------- DOM refs ----------
  const desktop = document.getElementById("desktop");
  const loginScreen = document.getElementById("loginScreen");
  const loginPassword = document.getElementById("loginPassword");
  const loginHint = document.getElementById("loginHint");
  const loginStatus = document.getElementById("loginStatus");
  const loginClock = document.getElementById("loginClock");
  const desktopArea = document.getElementById("desktopArea");
  const windowsContainer = document.getElementById("windowsContainer");
  const dockItems = document.getElementById("dockItems");
  const launchpad = document.getElementById("launchpad");
  const launchpadGrid = document.getElementById("launchpadGrid");
  const appleMenu = document.getElementById("appleMenu");
  const appleMenuDropdown = document.getElementById("appleMenuDropdown");
  const clockDisplay = document.getElementById("clockDisplay");
  const aboutDialog = document.getElementById("aboutDialog");
  const notificationCenter = document.getElementById("notificationCenter");
  const notificationsContent = document.querySelector(".nc-content");
  const menubarAppName = document.getElementById("activeAppName");

  // ---------- Login / Lock Screen ----------
  function updateLoginClock() {
    var now = new Date();
    var h = now.getHours();
    var m = String(now.getMinutes()).padStart(2, "0");
    var ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    loginClock.textContent = h + ":" + m + " " + ampm;
  }
  updateLoginClock();

  function unlockScreen() {
    loginScreen.classList.add("hidden");
    loginScreen.classList.remove("locked");
    loginStatus.textContent = "";
    loginPassword.value = "";
  }

  function lockScreen() {
    loginScreen.classList.remove("hidden");
    loginScreen.classList.add("locked");
    loginHint.textContent = "Click to unlock";
    setTimeout(function () { loginPassword.focus(); }, 100);
  }

  // Focus password on login screen click
  loginScreen.addEventListener("click", function () {
    loginPassword.focus();
    loginHint.textContent = "Enter your password";
  });

  // Unlock on Enter
  loginPassword.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      unlockScreen();
      // Ensure desktop is fully visible
      if (Object.keys(windows).length === 0) {
        openApp("finder");
      }
    }
  });

  // Click avatar to focus password
  document.getElementById("loginAvatar").addEventListener("click", function () {
    loginPassword.focus();
  });

  // Lock screen via keyboard shortcut (Ctrl+Cmd+Q style from macOS)
  document.addEventListener("keydown", function (e) {
    // Escape from desktop locks the screen
    if (e.key === "Escape" && !loginScreen.classList.contains("locked") && !launchpad.classList.contains("open")) {
      // Only if no dialog is open
      var anyDialog = document.querySelector(".dialog-overlay:not(.hidden)");
      if (!anyDialog) {
        lockScreen();
      }
    }
  });

  // ---------- Utility ----------
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // ---------- Clock ----------
  function updateClock() {
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = days[now.getDay()];
    const month = months[now.getMonth()];
    const date = now.getDate();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    clockDisplay.textContent = `${day} ${month} ${date}  ${h}:${m} ${ampm}`;
  }

  updateClock();
  setInterval(updateClock, 10000);

  // ---------- Apple Menu ----------
  appleMenu.addEventListener("click", function (e) {
    e.stopPropagation();
    appleMenuDropdown.classList.toggle("open");
  });

  appleMenuDropdown.addEventListener("click", function (e) {
    const item = e.target.closest(".menu-list-item");
    if (!item) return;
    const action = item.dataset.action;
    appleMenuDropdown.classList.remove("open");
    if (action === "about") {
      aboutDialog.classList.remove("hidden");
    } else if (action === "lock" || action === "logout") {
      if (action === "lock") {
        lockScreen();
      } else {
        // Log out - close all windows then lock
        for (var wid in windows) { closeWindow(wid); }
        lockScreen();
      }
    } else if (action === "restart") {
      showNotification("System", "Restarting Tahoe OS…");
    } else if (action === "shutdown") {
      showNotification("System", "Shutting down Tahoe OS…");
    } else if (action === "system") {
      openApp("settings");
    }
  });

  document.addEventListener("click", function () {
    appleMenuDropdown.classList.remove("open");
  });

  // About dialog
  document.getElementById("closeAbout").addEventListener("click", function () {
    aboutDialog.classList.add("hidden");
  });

  // ---------- Notifications ----------
  function showNotification(title, message) {
    notificationCenter.classList.add("open");
    const ncContent = notificationsContent;
    // Remove empty state
    const empty = ncContent.querySelector(".nc-empty");
    if (empty) empty.remove();
    const notif = document.createElement("div");
    notif.style.cssText = "background:#fff;border:1px solid #D1D1D6;border-radius:8px;padding:10px 12px;margin-bottom:8px;";
    notif.innerHTML = `<div style="font-size:12px;font-weight:600;margin-bottom:2px;">${title}</div>
                       <div style="font-size:11px;color:#8E8E93;">${message}</div>`;
    ncContent.appendChild(notif);
  }

  document.getElementById("clearNotifications").addEventListener("click", function () {
    notificationsContent.innerHTML = '<div class="nc-empty">No new notifications</div>';
  });

  // ---------- Launchpad ----------
  function renderLaunchpad() {
    launchpadGrid.innerHTML = "";
    LAUNCHPAD_APPS.forEach(function (app) {
      const el = document.createElement("div");
      el.className = "launchpad-app";
      el.dataset.app = app.id;
      el.innerHTML = `<div class="launchpad-app-icon" style="background:${app.color};">
                        <span style="font-size:24px;color:${app.color === "#E5E5E7" || app.color === "#FCD34D" ? "#1C1C1E" : "#fff"};">${app.emoji}</span>
                      </div>
                      <div class="launchpad-app-name">${app.name}</div>`;
      el.addEventListener("click", function () {
        openApp(app.id);
        launchpad.classList.remove("open");
      });
      launchpadGrid.appendChild(el);
    });
  }
  renderLaunchpad();

  // Toggle launchpad via dock
  function toggleLaunchpad() {
    launchpad.classList.toggle("open");
    if (launchpad.classList.contains("open")) {
      const search = launchpad.querySelector(".launchpad-search");
      if (search) { search.value = ""; search.focus(); }
    } else {
      notificationCenter.classList.remove("open");
    }
  }

  // Close launchpad on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      launchpad.classList.remove("open");
    }
  });

  // ---------- App Content Builders ----------
  const APP_CONTENT = {
    finder: function () {
      const div = document.createElement("div");
      div.style.cssText = "display:flex;height:100%;";
      div.innerHTML = `
        <div class="finder-sidebar">
          <div class="finder-sidebar-section">Favorites</div>
          <div class="finder-sidebar-item active">🏠  Recents</div>
          <div class="finder-sidebar-item">👤  AirDrop</div>
          <div class="finder-sidebar-item">📁  Applications</div>
          <div class="finder-sidebar-item">🖥  Desktop</div>
          <div class="finder-sidebar-item">📄  Documents</div>
          <div class="finder-sidebar-item">⬇  Downloads</div>
          <div class="finder-sidebar-section">iCloud</div>
          <div class="finder-sidebar-item">☁️  iCloud Drive</div>
          <div class="finder-sidebar-item">👨  Shared</div>
        </div>
        <div class="finder-content">
          <div class="finder-file"><div class="finder-file-icon" style="background:#7C3AED;">📄</div><div class="finder-file-name">Project_Plan.pdf</div></div>
          <div class="finder-file"><div class="finder-file-icon" style="background:#059669;">📊</div><div class="finder-file-name">Q3_Report.xlsx</div></div>
          <div class="finder-file"><div class="finder-file-icon" style="background:#3A86FF;">📁</div><div class="finder-file-name">Design_Assets</div></div>
          <div class="finder-file"><div class="finder-file-icon" style="background:#DC2626;">▶️</div><div class="finder-file-name">Demo_Video.mov</div></div>
          <div class="finder-file"><div class="finder-file-icon" style="background:#F59E0B;">📝</div><div class="finder-file-name">Notes.txt</div></div>
          <div class="finder-file"><div class="finder-file-icon" style="background:#6366F1;">🖼</div><div class="finder-file-name">Screenshot.png</div></div>
        </div>`;
      return div;
    },

    safari: function () {
      const div = document.createElement("div");
      div.style.cssText = "display:flex;flex-direction:column;height:100%;";
      div.innerHTML = `
        <div class="safari-toolbar">
          <button class="safari-nav-btn" disabled>&#8592;</button>
          <button class="safari-nav-btn" disabled>&#8594;</button>
          <input class="safari-url-bar" type="text" value="tahoe.os/start" readonly />
        </div>
        <div class="safari-content">
          <h2>Tahoe</h2>
          <p>Welcome to the Tahoe web experience.</p>
          <p style="font-size:11px;color:#C7C7CC;">Your lightweight, blazing-fast browser.</p>
        </div>`;
      return div;
    },

    terminal: function () {
      const div = document.createElement("div");
      div.className = "terminal-content";
      div.innerHTML = `
        <div class="terminal-line"><span class="terminal-output">Last login: ${new Date().toLocaleString()}</span></div>
        <div class="terminal-line"><span class="terminal-output">Tahoe OS v26.0 Beta 1 (x64)</span></div>
        <div class="terminal-line" style="margin-bottom:6px;"><span class="terminal-output">Welcome to Tahoe.</span></div>
        <div class="terminal-line terminal-cursor-line">
          <span class="terminal-prompt">tahoe:~ user$ </span>
          <span class="terminal-cursor"></span>
        </div>`;
      return div;
    },

    settings: function () {
      const div = document.createElement("div");
      div.style.cssText = "display:flex;height:100%;";
      div.innerHTML = `
        <div class="settings-sidebar">
          <div class="settings-item active">👤  General</div>
          <div class="settings-item">🖥  Display</div>
          <div class="settings-item">🔊  Sound</div>
          <div class="settings-item">🔒  Privacy</div>
          <div class="settings-item">🌐  Network</div>
          <div class="settings-item">🔋  Energy</div>
        </div>
        <div class="settings-content">
          <h3>General</h3>
          <div class="settings-row"><span>Appearance</span><span style="color:#8E8E93;">Auto</span></div>
          <div class="settings-row"><span>Accent Color</span><span style="color:#3A86FF;">Tahoe Blue</span></div>
          <div class="settings-row"><span>Sidebar Icon Size</span><span style="color:#8E8E93;">Medium</span></div>
          <div class="settings-row">
            <span>Dark Mode</span>
            <button class="settings-toggle" data-toggle="darkmode"></button>
          </div>
          <div class="settings-row">
            <span>Reduce Motion</span>
            <button class="settings-toggle on" data-toggle="reducemotion"></button>
          </div>
        </div>`;
      return div;
    },

    calendar: function () {
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const firstDay = new Date(y, m, 1).getDay();
      const today = now.getDate();
      const months = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];

      let daysHtml = "";
      for (let i = 0; i < firstDay; i++) {
        daysHtml += `<div class="calendar-day other-month"></div>`;
      }
      for (let d = 1; d <= daysInMonth; d++) {
        daysHtml += `<div class="calendar-day ${d === today ? 'today' : ''}">${d}</div>`;
      }

      const div = document.createElement("div");
      div.style.cssText = "display:flex;flex-direction:column;height:100%;";
      div.innerHTML = `
        <div class="calendar-header">
          <button class="calendar-nav-btn">&#8592;</button>
          <h3>${months[m]} ${y}</h3>
          <button class="calendar-nav-btn">&#8594;</button>
        </div>
        <div class="calendar-weekdays">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div class="calendar-days">${daysHtml}</div>
        <div style="padding:12px 16px;border-top:1px solid #D1D1D6;font-size:12px;">
          <div style="font-weight:600;margin-bottom:4px;">Upcoming</div>
          <div style="color:#8E8E93;">No events today</div>
        </div>`;
      return div;
    },

    notes: function () {
      const notes = [
        { title: "Welcome to Notes", body: "This is your first note. You can write anything here.\n\nTahoe Notes sync across all your devices." },
        { title: "Shopping List", body: "• Apples\n• Bananas\n• Bread\n• Milk\n• Eggs" },
        { title: "Project Ideas", body: "1. Build a lightweight OS UI\n2. Create a flat design system\n3. Optimize for old hardware" },
      ];
      let listHtml = "";
      notes.forEach(function (n, i) {
        listHtml += `<div class="notes-item ${i === 0 ? 'active' : ''}" data-note="${i}">
                       <div class="notes-item-title">${n.title}</div>
                       <div class="notes-item-preview">${n.body.substring(0, 40)}...</div>
                     </div>`;
      });
      const div = document.createElement("div");
      div.style.cssText = "display:flex;height:100%;";
      div.dataset.currentNote = "0";
      div.innerHTML = `
        <div class="notes-sidebar">
          <div class="notes-search"><input type="text" placeholder="Search notes..." /></div>
          <div class="notes-list">${listHtml}</div>
        </div>
        <div class="notes-editor">
          <input type="text" value="${notes[0].title}" id="notesTitle" />
          <textarea id="notesBody">${notes[0].body}</textarea>
        </div>`;
      // Wire up note switching
      setTimeout(function () {
        $$(".notes-item", div).forEach(function (item) {
          item.addEventListener("click", function () {
            $$(".notes-item", div).forEach(function (n) { n.classList.remove("active"); });
            item.classList.add("active");
            const idx = parseInt(item.dataset.note);
            const note = notes[idx];
            const titleInput = div.querySelector("#notesTitle");
            const bodyInput = div.querySelector("#notesBody");
            if (titleInput && bodyInput) {
              titleInput.value = note.title;
              bodyInput.value = note.body;
            }
          });
        });
      }, 0);
      return div;
    },

    music: function () {
      const songs = [
        { title: "Midnight Drive", artist: "Tahoe Waves", dur: "3:45" },
        { title: "Lake Effect", artist: "Sierra Sound", dur: "4:12" },
        { title: "Pine Grove", artist: "Forest Echo", dur: "2:58" },
        { title: "Summit View", artist: "Alpine", dur: "5:01" },
        { title: "Crystal Clear", artist: "Tahoe Waves", dur: "3:33" },
        { title: "Trailhead", artist: "Mountain Path", dur: "4:27" },
        { title: "Evening Glow", artist: "Sierra Sound", dur: "3:19" },
      ];
      let songsHtml = "";
      songs.forEach(function (s, i) {
        songsHtml += `<div class="music-song">
                       <span class="music-song-number">${i + 1}</span>
                       <span class="music-song-title">${s.title}</span>
                       <span class="music-song-artist">${s.artist}</span>
                       <span class="music-song-duration">${s.dur}</span>
                     </div>`;
      });
      const div = document.createElement("div");
      div.style.cssText = "display:flex;flex-direction:column;height:100%;";
      div.innerHTML = `
        <div style="display:flex;flex:1;overflow:hidden;">
          <div class="music-sidebar">
            <div class="music-sidebar-item active">🎵  Library</div>
            <div class="music-sidebar-item">▶  Playlists</div>
            <div class="music-sidebar-item">❤  Favorites</div>
            <div class="music-sidebar-item">🔄  Recent</div>
          </div>
          <div class="music-content">
            <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Library</div>
            ${songsHtml}
          </div>
        </div>
        <div class="music-player-bar">
          <div class="music-player-controls">
            <button class="music-player-btn">⏮</button>
            <button class="music-player-btn" id="musicPlayBtn">▶</button>
            <button class="music-player-btn">⏭</button>
          </div>
          <div class="music-current-info">Midnight Drive — Tahoe Waves</div>
          <div class="music-progress"><div class="music-progress-fill"></div></div>
        </div>`;
      return div;
    },

    photos: function () {
      const photos = ["🏔", "🌲", "🏞", "🌅", "🌊", "⛰", "🌿", "🌸", "🌺", "🍂", "❄", "🌙",
                      "☀️", "🌈", "⭐️", "🔥", "💧", "🪨", "🌻", "🌴", "🍁", "🌵", "🐚", "🦅"];
      const div = document.createElement("div");
      div.style.cssText = "display:flex;flex-direction:column;height:100%;";
      div.innerHTML = `<div class="photos-grid">${photos.map(function (p) {
        return `<div class="photos-item">${p}</div>`;
      }).join("")}</div>`;
      return div;
    },

    messages: function () {
      const convos = [
        { name: "Alex Chen", initials: "AC", color: "#3A86FF", preview: "Hey, the design looks great!", time: "2m ago" },
        { name: "Sarah Park", initials: "SP", color: "#34C759", preview: "Can you review the PR?", time: "15m ago" },
        { name: "Tahoe Team", initials: "TT", color: "#FF6B6B", preview: "Meeting at 3pm tomorrow", time: "1h ago" },
        { name: "Mom", initials: "M", color: "#F472B6", preview: "Don't forget dinner Saturday!", time: "3h ago" },
        { name: "Mike R.", initials: "MR", color: "#F59E0B", preview: "Sent you the files", time: "Yesterday" },
      ];
      const chats = {
        "0": [{ from: "them", text: "Hey, the design looks great!" },
              { from: "me", text: "Thanks! I've been working on the flat UI system." },
              { from: "them", text: "The Tahoe palette is really clean. Love the blues." },
              { from: "me", text: "Right? No gradients, no blurs — pure solid color efficiency." }],
        "1": [{ from: "them", text: "Can you review the PR?" },
              { from: "me", text: "Sure, sending feedback now." }],
        "2": [{ from: "them", text: "Meeting at 3pm tomorrow" },
              { from: "them", text: "Bring your wireframes!" }],
      };

      const div = document.createElement("div");
      div.style.cssText = "display:flex;height:100%;";
      div.innerHTML = `
        <div class="messages-list">
          ${convos.map(function (c, i) {
            return `<div class="msg-conversation ${i === 0 ? 'active' : ''}" data-convo="${i}">
                      <div class="msg-avatar" style="background:${c.color};">${c.initials}</div>
                      <div class="msg-info">
                        <div class="msg-name">${c.name}</div>
                        <div class="msg-preview">${c.preview}</div>
                      </div>
                      <div class="msg-time">${c.time}</div>
                    </div>`;
          }).join("")}
        </div>
        <div class="messages-chat">
          <div class="messages-header">Alex Chen</div>
          <div class="messages-body" id="msgBody">
            ${(chats["0"] || []).map(function (msg) {
              return `<div class="msg-bubble ${msg.from === 'me' ? 'sent' : 'received'}">${msg.text}</div>`;
            }).join("")}
          </div>
          <div class="messages-input">
            <input type="text" placeholder="Message..." id="msgInput" />
          </div>
        </div>`;

      setTimeout(function () {
        const input = div.querySelector("#msgInput");
        if (input) {
          input.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && input.value.trim()) {
              const body = div.querySelector("#msgBody");
              const bubble = document.createElement("div");
              bubble.className = "msg-bubble sent";
              bubble.textContent = input.value.trim();
              body.appendChild(bubble);
              body.scrollTop = body.scrollHeight;
              input.value = "";
            }
          });
        }
        $$(".msg-conversation", div).forEach(function (item) {
          item.addEventListener("click", function () {
            $$(".msg-conversation", div).forEach(function (n) { n.classList.remove("active"); });
            item.classList.add("active");
            // Update header
            const header = div.querySelector(".messages-header");
            const name = item.querySelector(".msg-name");
            if (header && name) header.textContent = name.textContent;
            const idx = item.dataset.convo;
            const body = div.querySelector("#msgBody");
            if (body && chats[idx]) {
              body.innerHTML = chats[idx].map(function (msg) {
                return `<div class="msg-bubble ${msg.from === 'me' ? 'sent' : 'received'}">${msg.text}</div>`;
              }).join("");
            } else if (body) {
              body.innerHTML = "";
            }
          });
        });
      }, 0);
      return div;
    },

    calculator: function () {
      const div = document.createElement("div");
      div.style.cssText = "display:flex;flex-direction:column;height:100%;";
      div.innerHTML = `
        <div class="calc-display" id="calcDisplay">0</div>
        <div class="calc-buttons">
          <button class="calc-btn function" data-action="clear">C</button>
          <button class="calc-btn function" data-action="negate">±</button>
          <button class="calc-btn function" data-action="percent">%</button>
          <button class="calc-btn operator" data-action="divide">÷</button>
          <button class="calc-btn" data-action="7">7</button>
          <button class="calc-btn" data-action="8">8</button>
          <button class="calc-btn" data-action="9">9</button>
          <button class="calc-btn operator" data-action="multiply">×</button>
          <button class="calc-btn" data-action="4">4</button>
          <button class="calc-btn" data-action="5">5</button>
          <button class="calc-btn" data-action="6">6</button>
          <button class="calc-btn operator" data-action="subtract">−</button>
          <button class="calc-btn" data-action="1">1</button>
          <button class="calc-btn" data-action="2">2</button>
          <button class="calc-btn" data-action="3">3</button>
          <button class="calc-btn operator" data-action="add">+</button>
          <button class="calc-btn zero" data-action="0">0</button>
          <button class="calc-btn" data-action="decimal">.</button>
          <button class="calc-btn equals" data-action="equals">=</button>
        </div>`;
      // Wire up calculator
      setTimeout(function () {
        const display = div.querySelector("#calcDisplay");
        let state = { display: "0", current: null, op: null, reset: false };
        $$(".calc-btn", div).forEach(function (btn) {
          btn.addEventListener("click", function () {
            const action = btn.dataset.action;
            if (!display) return;

            if (action === "clear") {
              state.display = "0";
              state.current = null;
              state.op = null;
              state.reset = false;
            } else if (action === "negate") {
              var val = parseFloat(state.display);
              if (isNaN(val) || !isFinite(val)) { state.display = "0"; } else { state.display = String(-val); }
            } else if (action === "percent") {
              state.display = String(parseFloat(state.display) / 100);
            } else if (action === "equals") {
              if (state.op && state.current !== null) {
                const a = parseFloat(state.current);
                const b = parseFloat(state.display);
                let result = 0;
                switch (state.op) {
                  case "add": result = a + b; break;
                  case "subtract": result = a - b; break;
                  case "multiply": result = a * b; break;
                  case "divide": result = b !== 0 ? a / b : "Error"; break;
                }
                state.display = String(result);
                state.op = null;
                state.current = null;
                state.reset = true;
              }
            } else if (["add", "subtract", "multiply", "divide"].includes(action)) {
              if (state.op && !state.reset) {
                // chain calculation
                const a = parseFloat(state.current);
                const b = parseFloat(state.display);
                let result = 0;
                switch (state.op) {
                  case "add": result = a + b; break;
                  case "subtract": result = a - b; break;
                  case "multiply": result = a * b; break;
                  case "divide": result = b !== 0 ? a / b : "Error"; break;
                }
                state.current = String(result);
                state.display = String(result);
              } else {
                state.current = state.display;
              }
              state.op = action;
              state.reset = true;
            } else if (action === "decimal") {
              if (state.reset) { state.display = "0."; state.reset = false; return; }
              if (!state.display.includes(".")) state.display += ".";
            } else {
              // Number
              if (state.reset || state.display === "0") {
                state.display = action;
                state.reset = false;
              } else {
                state.display += action;
              }
            }
            display.textContent = state.display.length > 14 ? parseFloat(state.display).toExponential(4) : state.display;
          });
        });
      }, 0);
      return div;
    },
  };

  // ---------- Window Management ----------
  function openApp(appId) {
    const def = APP_DEFS[appId];
    if (!def) return;

    // Check if window already exists, focus it
    for (const id in windows) {
      const win = windows[id];
      if (win.dataset.app === appId && !win.dataset.minimized) {
        focusWindow(id);
        return id;
      }
    }

    // Check if minimized
    for (const id in windows) {
      const win = windows[id];
      if (win.dataset.app === appId && win.dataset.minimized) {
        win.dataset.minimized = "";
        win.style.display = "";
        focusWindow(id);
        return id;
      }
    }

    // Create new window
    const id = "win-" + (++windowCounter);
    const win = document.createElement("div");
    win.className = "window active";
    win.dataset.app = appId;
    win.id = id;
    win.style.width = def.defaultWidth + "px";
    win.style.height = def.defaultHeight + "px";
    win.style.top = (60 + (windowCounter % 6) * 30) + "px";
    win.style.left = (60 + (windowCounter % 6) * 30) + "px";

    // Title bar
    const titlebar = document.createElement("div");
    titlebar.className = "window-titlebar";
    titlebar.innerHTML = `<div class="window-traffic-lights">
                           <button class="traffic-light close" data-action="close" title="Close"></button>
                           <button class="traffic-light minimize" data-action="minimize" title="Minimize"></button>
                           <button class="traffic-light maximize" data-action="maximize" title="Maximize"></button>
                         </div>
                         <div class="window-title">${def.name}</div>`;

    // Content
    const content = document.createElement("div");
    content.className = "window-content";

    const builder = APP_CONTENT[appId];
    if (builder) {
      content.appendChild(builder());
    } else {
      content.innerHTML = `<div style="padding:20px;color:#8E8E93;">${def.name} application</div>`;
    }

    // Resize handle
    const handle = document.createElement("div");
    handle.className = "window-resize-handle";

    win.appendChild(titlebar);
    win.appendChild(content);
    win.appendChild(handle);
    windowsContainer.appendChild(win);

    windows[id] = win;
    focusWindow(id);

    // Mark dock item as running
    const dockItem = document.querySelector(`.dock-item[data-app="${appId}"]`);
    if (dockItem) dockItem.classList.add("running");

    // Wire up window controls
    setupWindowEvents(id, win, titlebar, handle);

    return id;
  }

  function focusWindow(id) {
    const win = windows[id];
    if (!win) return;
    windowZIndex++;
    win.style.zIndex = windowZIndex;
    win.classList.add("active");
    if (activeWindowId && windows[activeWindowId] && activeWindowId !== id) {
      windows[activeWindowId].classList.remove("active");
    }
    activeWindowId = id;

    // Update app name in menu bar
    const appId = win.dataset.app;
    const def = APP_DEFS[appId];
    if (def) {
      menubarAppName.textContent = def.name;
    }

    // Update dock active state
    $$(".dock-item").forEach(function (item) {
      item.classList.remove("active");
    });
    const dockItem = document.querySelector(`.dock-item[data-app="${appId}"]`);
    if (dockItem) dockItem.classList.add("active");
  }

  function closeWindow(id) {
    const win = windows[id];
    if (!win) return;
    const appId = win.dataset.app;
    win.remove();
    delete windows[id];

    // If no windows left, set active to null and app name to Finder
    const remaining = Object.keys(windows);
    if (remaining.length === 0) {
      activeWindowId = null;
      menubarAppName.textContent = "Finder";
      $$(".dock-item").forEach(function (item) {
        item.classList.remove("active", "running");
      });
      // Finder stays active by default
      const finderDock = document.querySelector('.dock-item[data-app="finder"]');
      if (finderDock) finderDock.classList.add("active");
    } else {
      // Focus the topmost window
      let topId = null;
      let topZ = -1;
      for (const wid in windows) {
        const w = windows[wid];
        if (!w.dataset.minimized && parseInt(w.style.zIndex) > topZ) {
          topZ = parseInt(w.style.zIndex);
          topId = wid;
        }
      }
      if (topId) focusWindow(topId);
    }

    // Check if any windows of this app remain
    const anyLeft = Object.values(windows).some(function (w) { return w.dataset.app === appId; });
    if (!anyLeft) {
      const dockItem = document.querySelector(`.dock-item[data-app="${appId}"]`);
      if (dockItem) dockItem.classList.remove("running");
    }
  }

  function setupWindowEvents(id, win, titlebar, handle) {
    let isDragging = false, isResizing = false;
    let startX, startY, startLeft, startTop, startW, startH;

    // Bring to front on click
    win.addEventListener("mousedown", function (e) {
      if (!win.classList.contains("active")) {
        focusWindow(id);
      }
    });

    // Traffic lights
    titlebar.addEventListener("click", function (e) {
      const btn = e.target.closest(".traffic-light");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "close") {
        closeWindow(id);              } else if (action === "minimize") {
        win.dataset.minimized = "true";
        win.style.display = "none";
        // Focus next window
        const remaining = Object.keys(windows).filter(function (wid) {
          return windows[wid] && !windows[wid].dataset.minimized;
        });
        if (remaining.length > 0) {
          focusWindow(remaining[remaining.length - 1]);
        } else {
          // All windows minimized — reset active state
          activeWindowId = null;
          menubarAppName.textContent = "Finder";
          $$(".dock-item").forEach(function (item) { item.classList.remove("active"); });
          var finderDock = document.querySelector('.dock-item[data-app="finder"]');
          if (finderDock) finderDock.classList.add("active");
        }
      } else if (action === "maximize") {
        win.classList.toggle("maximized");
      }
    });

    // Drag
    titlebar.addEventListener("mousedown", function (e) {
      if (e.target.closest(".traffic-light")) return;
      if (win.classList.contains("maximized")) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = win.offsetLeft;
      startTop = win.offsetTop;
    });

    document.addEventListener("mousemove", function (e) {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        win.style.left = (startLeft + dx) + "px";
        win.style.top = (startTop + dy) + "px";
      }
      if (isResizing) {
        const dw = e.clientX - startX;
        const dh = e.clientY - startY;
        win.style.width = Math.max(300, startW + dw) + "px";
        win.style.height = Math.max(200, startH + dh) + "px";
      }
    });

    document.addEventListener("mouseup", function () {
      isDragging = false;
      isResizing = false;
    });

    // Resize
    handle.addEventListener("mousedown", function (e) {
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = win.offsetWidth;
      startH = win.offsetHeight;
    });
  }

  // ---------- Dock ----------
  dockItems.addEventListener("click", function (e) {
    const item = e.target.closest(".dock-item");
    if (!item) return;
    const appId = item.dataset.app;
    if (appId === "launchpad") {
      toggleLaunchpad();
    } else if (appId === "trash") {
      openApp("finder"); // Trash opens Finder's Trash view
      showNotification("Trash", "Trash is empty.");
    } else {
      openApp(appId);
    }
  });

  // ---------- Desktop Icons ----------
  $$(".desktop-icon").forEach(function (icon) {
    icon.addEventListener("dblclick", function () {
      const app = icon.dataset.app;
      const APP_MAP = {
        finder: "finder", applications: "finder", documents: "finder",
        downloads: "finder", trash: "finder"
      };
      openApp(APP_MAP[app] || "finder");
    });
  });

  // ---------- Spotlight ----------
  document.getElementById("spotlightIcon").addEventListener("click", function () {
    if (launchpad.classList.contains("open")) {
      launchpad.classList.remove("open");
    } else {
      toggleLaunchpad();
    }
  });

  // ---------- Notification Center Toggle (clock click) ----------
  clockDisplay.addEventListener("click", function () {
    notificationCenter.classList.toggle("open");
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest("#notificationCenter") && !e.target.closest(".menubar-time")) {
      notificationCenter.classList.remove("open");
    }
  });

  // ---------- Settings Toggles ----------
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest(".settings-toggle[data-toggle]");
    if (!toggle) return;
    toggle.classList.toggle("on");
    var action = toggle.dataset.toggle;
    if (action === "darkmode") {
      document.body.style.background = toggle.classList.contains("on") ? "#000" : "";
      document.getElementById("desktop").style.background = toggle.classList.contains("on") ? "#0a0a0c" : "";
    }
    showNotification("Settings", (toggle.classList.contains("on") ? "Enabled" : "Disabled") + " " + (action === "darkmode" ? "Dark Mode" : "Reduce Motion"));
  });

  // ---------- Menu Bar Menu Items ----------
  $$(".menu-item").forEach(function (item) {
    item.addEventListener("click", function () {
      const menu = item.dataset.menu;
      showNotification("Menu", `${menu.charAt(0).toUpperCase() + menu.slice(1)} menu selected`);
    });
  });

  // ---------- Desktop starts locked ----------
  // Desktop is hidden behind login screen.
  // Finder opens on unlock via loginPassword keydown handler.
  // Focus the password field immediately so the user can type.
  setTimeout(function () { loginPassword.focus(); }, 300);

})();
