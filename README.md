# Tahoe OS Desktop Environment

A lightweight, flat-design macOS Tahoe (v26) inspired desktop environment UI — built with **zero frameworks**, **zero gradients**, and **zero blurs**. Optimized for low-end hardware and old processors.

## Features

### Desktop Shell
- **Menu Bar** — Apple menu, active app name, menus (File/Edit/View/Window/Help), clock with live time, Wi-Fi/battery/Control Center status icons, Spotlight shortcut
- **Dock** — App launcher with hover scale effect, tooltip labels, active & running state indicators, separator, Trash
- **Desktop Icons** — Double-click to open (Macintosh HD, Applications, Documents, Downloads, Trash)

### Window Management
- Drag by title bar
- Resize from bottom-right corner handle
- Close (red), Minimize (yellow), Maximize (green) traffic light buttons
- Auto-focus on click, z-index stacking
- Minimized windows persist in the dock
- Maximize toggles full-screen mode

### Built-in Apps
1. **Finder** — Sidebar (Favorites, iCloud) + file grid with icons and names
2. **Safari** — Navigation bar with back/forward buttons and URL bar
3. **Terminal** — Dark background, green prompt, blinking cursor, session info
4. **Settings** — Sidebar categories (General, Display, Sound, Privacy, Network, Energy) with working Dark Mode toggle
5. **Calendar** — Live month grid with today highlighted, weekday headers, upcoming section
6. **Notes** — Sidebar list of notes with search, editable title and body
7. **Music** — Library/Playlists sidebar, song list, player bar with play button and progress
8. **Photos** — Grid gallery with nature emoji photos
9. **Messages** — Conversation list, chat bubbles (sent/received), working message input
10. **Calculator** — Fully functional calculator (add, subtract, multiply, divide, percent, negate, decimal, chain calculations)

### System Features
- **Launchpad** — Full-screen app grid with search (trigger from dock or Spotlight icon)
- **Notification Center** — Right-slide panel with notification history and Clear button
- **Apple Menu** — About dialog, System Settings shortcut, Lock/Logout/Restart/Shutdown notifications

## Design System

- **Color Palette:** Deep Tahoe blue desktop (#1B2838), dark slate bars (#1C1C1E), clean white windows, Tahoe Blue accent (#3A86FF)
- **Typography:** System font stack (`-apple-system, SF Pro Text, Helvetica Neue`)
- **Style:** Fully flat — no CSS gradients, no `backdrop-filter` blur, no `box-shadow`
- **Icons:** Pure CSS/SVG/emoji — zero external assets

## Tech Stack

- Vanilla HTML5
- Vanilla CSS3 (Flexbox, Grid, no preprocessors)
- Vanilla JavaScript (ES5/ES6, no frameworks, no dependencies)

## Getting Started

Since this is a fully static site, you can serve it with any HTTP server:

```bash
# Using npx serve (recommended for preview)
npx serve . -l 5000 --no-clipboard --no-compression

# Or using Python
python3 -m http.server 5000

# Or using Node.js
npx http-server . -p 5000
```

Then open `http://localhost:5000` in your browser.

## Project Structure

```
├── index.html      # Main HTML entry point
├── css/
│   └── style.css   # All styles (flat design system)
├── js/
│   └── app.js      # All JavaScript (window mgmt, apps, interactions)
└── README.md
```
