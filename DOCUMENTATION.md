# Code Shortener — Technical Documentation

> **Version:** 1.0.0  
> **License:** Apache 2.0  
> **Architecture:** Single-Page Application (SPA) with Vanilla JS + Minimal React Shell

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [File Structure & Responsibilities](#2-file-structure--responsibilities)
3. [Core Logic Deep Dive](#3-core-logic-deep-dive)
   - [3.1 Application Initialization](#31-application-initialization)
   - [3.2 Code Shortening Algorithm](#32-code-shortening-algorithm)
   - [3.3 Comment Removal](#33-comment-removal)
   - [3.4 Single Line Minification](#34-single-line-minification)
   - [3.5 Statistics Calculation](#35-statistics-calculation)
4. [Theme System](#4-theme-system)
5. [Toast Notification System](#5-toast-notification-system)
6. [Keyboard Shortcuts](#6-keyboard-shortcuts)
7. [Clipboard Operations](#7-clipboard-operations)
8. [Responsive Design Strategy](#8-responsive-design-strategy)
9. [Build & Deployment](#9-build--deployment)
10. [Extending the Tool](#10-extending-the-tool)

---

## 1. Architecture Overview

Code Shortener follows a **modular vanilla JavaScript architecture** with a lightweight React shell for extensibility.

```
┌─────────────────────────────────────────────┐
│                index.html                    │
│  (Semantic HTML structure, SEO meta tags)    │
├─────────────────────────────────────────────┤
│                   style.css                  │
│  (CSS custom properties, themes, responsive) │
├─────────────────────────────────────────────┤
│                   script.js                  │
│  (All application logic, event handling,     │
│   DOM manipulation, clipboard, download)     │
├─────────────────────────────────────────────┤
│                  vite.config.ts              │
│  (Build configuration, plugins, HMR)         │
├─────────────────────────────────────────────┤
│  src/                                        │
│  ├── App.tsx    (React shell component)      │
│  ├── main.tsx   (React entry point)          │
│  └── index.css  (Tailwind base)             │
└─────────────────────────────────────────────┘
```

**Key Design Decisions:**

| Decision                             | Rationale                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **Vanilla JS for core logic**        | Zero framework overhead; faster load time; easier for beginners to understand                      |
| **React shell**                      | Provides an upgrade path if more complex state management or component composition is needed later |
| **CSS custom properties**            | Enables seamless light/dark theme switching without redundant CSS                                  |
| **No external runtime dependencies** | The tool works entirely offline; no CDN links or external requests                                 |

---

## 2. File Structure & Responsibilities

### `index.html`

- **Semantic HTML5** structure (`<header>`, `<main>`, `<section>`, `<footer>`)
- SEO-optimized meta tags (description, viewport)
- Inline SVG icons for buttons and logo
- All UI elements referenced via `id` attributes for JS hooks
- Accessible labels (`aria-label`, `aria-live="polite"` for toast)

### `style.css`

- **Section 1:** CSS reset (`box-sizing`, margin/padding reset)
- **Section 2:** CSS custom properties for light and dark themes (over 35 variables)
- **Section 3:** Typography (`h1`, `code`, `kbd` styling)
- **Section 4:** Layout (`.app-container` max-width grid)
- **Section 5:** Components (header, stats cards, textareas, buttons, checkboxes)
- **Section 6:** Toast animations (`@keyframes toastIn`, `toastOut`)
- **Section 7:** Footer and shortcut tips
- **Section 8:** Responsive breakpoints (900px, 600px)

### `script.js`

Organized into **11 clearly named functions** (see Section 3 for details).

### `vite.config.ts`

- React plugin for JSX/TSX support
- Tailwind CSS v4 Vite plugin
- Path alias (`@` → project root)
- Configurable HMR (disabled in AI Studio via `DISABLE_HMR` env var)

---

## 3. Core Logic Deep Dive

### 3.1 Application Initialization

```javascript
function initApp() {
  initTheme(); // Load saved theme from localStorage
  // Attach all event listeners
  elements.btnShorten.addEventListener("click", shortenCode);
  elements.btnCopy.addEventListener("click", copyCode);
  elements.btnDownload.addEventListener("click", downloadCode);
  elements.btnClear.addEventListener("click", clearFields);
  elements.btnSample.addEventListener("click", loadSampleSnippet);
  elements.btnThemeToggle.addEventListener("click", toggleDarkMode);
  elements.inputCode.addEventListener("input", handleLiveCounter);
  document.addEventListener("keydown", initKeyboardShortcuts);
  updateStats("", ""); // Initialize stats to zero
}
```

**Event Binding Table:**

| Element             | Event     | Handler                 | Trigger                    |
| ------------------- | --------- | ----------------------- | -------------------------- |
| `#btn-shorten`      | `click`   | `shortenCode`           | User clicks "Shorten Code" |
| `#btn-copy`         | `click`   | `copyCode`              | User clicks "Copy Output"  |
| `#btn-download`     | `click`   | `downloadCode`          | User clicks "Download"     |
| `#btn-clear`        | `click`   | `clearFields`           | User clicks "Clear"        |
| `#btn-sample`       | `click`   | `loadSampleSnippet`     | User clicks "Load Sample"  |
| `#btn-theme-toggle` | `click`   | `toggleDarkMode`        | Theme toggle button        |
| `#input-code`       | `input`   | `handleLiveCounter`     | User types in input        |
| `document`          | `keydown` | `initKeyboardShortcuts` | Keyboard shortcut          |

### 3.2 Code Shortening Algorithm

The `shortenCode()` function processes input through a **4-stage pipeline**:

```
Input Text
    │
    ▼
┌─────────────────────┐
│  Stage 1:           │
│  Optional Comment   │
│  Removal            │  ← Only if "Remove Comments" is checked
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Stage 2:           │
│  Normalize Line     │
│  Breaks             │  │ \r\n → \n, \r → \n
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Stage 3:           │
│  Line-by-line       │
│  Cleaning           │  │ Remove tabs, collapse spaces, trim each line
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Stage 4:           │
│  Optional           │
│  Single-Line Join   │  │ If checked: join with spaces
│  OR Standard Join   │  │ If unchecked: join with \n
└─────────┬───────────┘
          │
          ▼
    Output Text
```

**Code Snippet (Core Cleaning):**

```javascript
// Convert all line breaks to Unix format
let lines = processedText
  .replace(/\r\n/g, "\n")
  .replace(/\r/g, "\n")
  .split("\n");

// Process each line
let cleanedLines = lines
  .map((line) => {
    let cleaned = line.replace(/\t/g, " "); // Replace tabs with space
    cleaned = cleaned.replace(/[ ]+/g, " "); // Collapse multiple spaces
    return cleaned.trim(); // Trim leading/trailing spaces
  })
  .filter((line) => line.length > 0); // Remove empty lines
```

### 3.3 Comment Removal

When the **"Remove Comments"** checkbox is checked, three types of comments are stripped:

| Comment Type               | Regex Pattern        | Example                  |
| -------------------------- | -------------------- | ------------------------ | -------------------- |
| HTML comments              | `/<!--[\s\S]*?-->/g` | `<!-- card styles -->`   |
| Multi-line CSS/JS comments | `\/\*[\s\S]*?\*\/`   | `/* Card Styles */`      |
| Single-line JS comments    | `(^                  | [^\:\"])(\/\/[^\n\r]\*)` | `// Sample Function` |

**Important:** The single-line comment regex uses a negative lookbehind pattern `(^|[^\:\"])` to avoid stripping URLs like `https://example.com`.

### 3.4 Single Line Minification

When enabled, cleaned lines are joined with a single space:

```javascript
if (elements.optSingleLine.checked) {
  processedText = cleanedLines.join(" ");
} else {
  processedText = cleanedLines.join("\n");
}
```

This produces compact, single-line output ideal for HTML email templates or inline styles.

### 3.5 Statistics Calculation

The `updateStats(origText, shortText)` function computes:

```javascript
const origChars = origText.length;
const shortChars = shortText.length;
const origLines = origText ? origText.split("\n").length : 0;
const shortLines = shortText ? shortText.split("\n").length : 0;
const removedChars = Math.max(0, origChars - shortChars);
const savedPercent =
  origChars > 0 ? Math.round((removedChars / origChars) * 100) : 0;
```

**Display Mapping:**

| DOM Element           | Statistic                 |
| --------------------- | ------------------------- |
| `#stat-orig-chars`    | Original character count  |
| `#stat-orig-lines`    | Original line count       |
| `#stat-short-chars`   | Shortened character count |
| `#stat-short-lines`   | Shortened line count      |
| `#stat-removed-chars` | Characters removed        |
| `#stat-saved-percent` | Percentage saved          |
| `#counter-input`      | Live input counter badge  |
| `#counter-output`     | Output counter badge      |

---

## 4. Theme System

The theme system uses **CSS custom properties** scoped to `:root` (light) and `[data-theme="dark"]` (dark).

### JavaScript Theme Management

```javascript
const savedTheme = localStorage.getItem("code_shortener_theme") || "light";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Toggle sun/moon icons
  elements.themeIconSun.classList.toggle("hidden", theme !== "dark");
  elements.themeIconMoon.classList.toggle("hidden", theme !== "light");
}
```

### Theme Variables Comparison

| CSS Variable     | Light Value           | Dark Value            |
| ---------------- | --------------------- | --------------------- |
| `--bg-main`      | `#f8fafc` (slate-50)  | `#0f172a` (slate-900) |
| `--bg-card`      | `#ffffff`             | `#1e293b` (slate-800) |
| `--text-main`    | `#0f172a` (slate-900) | `#f8fafc` (slate-50)  |
| `--primary`      | `#2563eb` (blue-600)  | `#3b82f6` (blue-500)  |
| `--border-color` | `#e2e8f0` (slate-200) | `#334155` (slate-700) |

---

## 5. Toast Notification System

Toasts are dynamically created DOM elements with **3 types**:

| Type      | Icon                 | Border Color          | Use Case                     |
| --------- | -------------------- | --------------------- | ---------------------------- |
| `success` | Checkmark (green)    | `--accent` (#10b981)  | Code shortened, copied       |
| `warning` | Alert circle (red)   | `--danger` (#ef4444)  | Empty input, nothing to copy |
| `info`    | Info circle (indigo) | `--primary` (#2563eb) | Theme toggle, sample loaded  |

**Animation:**

```css
@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
}
```

Duration: 3 seconds visible, 250ms exit animation.

---

## 6. Keyboard Shortcuts

| Key Combination     | Action       | Implementation            |
| ------------------- | ------------ | ------------------------- |
| `Ctrl + Enter`      | Shorten code | `initKeyboardShortcuts()` |
| `Cmd + Enter` (Mac) | Shorten code | `event.metaKey` check     |

```javascript
function initKeyboardShortcuts(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    shortenCode();
  }
}
```

---

## 7. Clipboard Operations

Two methods are used for clipboard access:

1. **Primary:** `navigator.clipboard.writeText()` (requires HTTPS or localhost)
2. **Fallback:** `document.execCommand("copy")` via textarea `.select()`

```javascript
if (navigator.clipboard && window.isSecureContext) {
  navigator.clipboard.writeText(outputText).then(() => handleCopySuccess());
} else {
  fallbackCopyText(outputText);
}
```

The **Auto-Copy** feature (`copyCodeSilently()`) uses the same clipboard API without visual feedback on the copy button.

---

## 8. Responsive Design Strategy

| Breakpoint | Layout Changes                                                |
| ---------- | ------------------------------------------------------------- |
| > 900px    | Two-column editor grid, 3-column stats grid                   |
| 601–900px  | Single-column editor, 2-column stats grid                     |
| ≤ 600px    | Single column everything, stacked toolbar, full-width buttons |

**Mobile-First Considerations:**

- Touch-friendly button sizes (minimum 44px tap target)
- Toast container repositioned from bottom-right to full-width bottom
- Font sizes remain readable (no scaling below 14px)
- Textareas maintain minimum height of 220px on smaller screens

---

## 9. Build & Deployment

### Development

```bash
npm run dev
# Starts Vite dev server on port 3000 with HMR
```

### Production Build

```bash
npm run build
# Output to dist/ directory
# Includes:
#   - Bundled JS (tree-shaken)
#   - Minified CSS
#   - Optimized assets
```

### Preview Build

```bash
npm run preview
# Serves the production build locally
```

### Clean

```bash
npm run clean
# Removes dist/ directory and server.js
```

---

## 10. Extending the Tool

### Adding a New Option

1. **HTML:** Add a new checkbox inside `.options-group` in `index.html`:

   ```html
   <label class="checkbox-container">
     <input type="checkbox" id="opt-new-feature" />
     <span class="checkmark"></span>
     <span class="label-text">New Feature</span>
   </label>
   ```

2. **JS:** Add element reference in the `elements` object:

   ```javascript
   optNewFeature: document.getElementById("opt-new-feature"),
   ```

3. **JS:** Add the transformation logic inside `shortenCode()`:
   ```javascript
   if (elements.optNewFeature.checked) {
     processedText = processedText.replace(/pattern/g, "replacement");
   }
   ```

### Adding a New Button

1. **HTML:** Add button inside `.toolbar-actions`:

   ```html
   <button id="btn-format" class="btn btn-secondary">
     <svg>...</svg>
     <span>Format</span>
   </button>
   ```

2. **JS:** Bind event listener in `initApp()`:

   ```javascript
   elements.btnFormat.addEventListener("click", formatCode);
   ```

3. **JS:** Implement handler function.

### Adding a New Statistic

1. **HTML:** Add a new `.stat-card` inside `.stats-grid`.
2. **JS:** Add DOM references and update logic in `updateStats()`.

---

## Appendix: Browser Support

| Browser                     | Support          |
| --------------------------- | ---------------- |
| Chrome (latest 2 versions)  | ✅ Full          |
| Firefox (latest 2 versions) | ✅ Full          |
| Safari (latest 2 versions)  | ✅ Full          |
| Edge (latest 2 versions)    | ✅ Full          |
| Internet Explorer           | ❌ Not supported |

**Requirements:**

- ES6+ JavaScript support
- CSS Custom Properties (`var()`)
- Clipboard API (HTTPS/localhost)
- `localStorage` for theme persistence

---

## Appendix: Performance

| Metric                    | Value   |
| ------------------------- | ------- |
| Total JS size (minified)  | ~6 KB   |
| Total CSS size (minified) | ~8 KB   |
| HTML size                 | ~5 KB   |
| DOM Content Loaded        | < 100ms |
| Time to Interactive       | < 200ms |

All processing is synchronous and O(n) relative to input length. For typical code snippets (< 50,000 characters), shortening completes in under 10ms.

---

_Documentation generated for Code Shortener v1.0.0_
