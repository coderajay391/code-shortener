/**
 * =================================================================
 * CODE SHORTENER - MAIN JAVASCRIPT
 * Beginner-friendly, offline code cleaner and whitespace remover
 * =================================================================
 */

// Wait for the DOM (Document Object Model) to fully load before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize application
  initApp();
});

/**
 * Global DOM Element References
 */
const elements = {
  // Textareas
  inputCode: document.getElementById("input-code"),
  outputCode: document.getElementById("output-code"),

  // Buttons
  btnShorten: document.getElementById("btn-shorten"),
  btnCopy: document.getElementById("btn-copy"),
  btnDownload: document.getElementById("btn-download"),
  btnClear: document.getElementById("btn-clear"),
  btnSample: document.getElementById("btn-sample"),
  btnThemeToggle: document.getElementById("btn-theme-toggle"),

  // Options Checkboxes
  optRemoveComments: document.getElementById("opt-remove-comments"),
  optSingleLine: document.getElementById("opt-single-line"),
  optAutoCopy: document.getElementById("opt-auto-copy"),

  // Statistics Display Elements
  statOrigChars: document.getElementById("stat-orig-chars"),
  statOrigLines: document.getElementById("stat-orig-lines"),
  statShortChars: document.getElementById("stat-short-chars"),
  statShortLines: document.getElementById("stat-short-lines"),
  statRemovedChars: document.getElementById("stat-removed-chars"),
  statSavedPercent: document.getElementById("stat-saved-percent"),

  // Live Counter Badges
  counterInput: document.getElementById("counter-input"),
  counterOutput: document.getElementById("counter-output"),

  // Theme Icons
  themeIconSun: document.getElementById("theme-icon-sun"),
  themeIconMoon: document.getElementById("theme-icon-moon"),

  // Toast Container
  toastContainer: document.getElementById("toast-container"),
};

/**
 * 1. Initialize Application
 * Sets up theme preferences, event listeners, and default stats.
 */
function initApp() {
  // Load saved theme preference from localStorage
  initTheme();

  // Attach event listeners to buttons
  elements.btnShorten.addEventListener("click", shortenCode);
  elements.btnCopy.addEventListener("click", copyCode);
  elements.btnDownload.addEventListener("click", downloadCode);
  elements.btnClear.addEventListener("click", clearFields);
  elements.btnSample.addEventListener("click", loadSampleSnippet);
  elements.btnThemeToggle.addEventListener("click", toggleDarkMode);

  // Attach live input counter event listener
  elements.inputCode.addEventListener("input", handleLiveCounter);

  // Attach keyboard shortcuts listener (Ctrl + Enter)
  document.addEventListener("keydown", initKeyboardShortcuts);

  // Initialize stats to 0
  updateStats("", "");
}

/**
 * 2. Shorten Code Logic
 * Removes unnecessary spaces, extra blank lines, tabs, and trims code.
 * Optionally removes comments or minifies into a single line based on user options.
 */
function shortenCode() {
  const originalText = elements.inputCode.value;

  // Validation: Check if input textarea is empty or contains only whitespace
  if (!originalText || originalText.trim() === "") {
    showToast("Please paste or type some code first!", "warning");
    elements.inputCode.focus();
    return;
  }

  let processedText = originalText;

  // Option 1: Remove Comments (if checkbox is checked)
  if (elements.optRemoveComments.checked) {
    // Remove HTML comments <!-- ... -->
    processedText = processedText.replace(/<!--[\s\S]*?-->/g, "");
    // Remove multi-line CSS/JS comments /* ... */
    processedText = processedText.replace(/\/\*[\s\S]*?\*\//g, "");
    // Remove single-line JS comments // ... (taking care not to strip URLs like http://)
    processedText = processedText.replace(/(^|[^\:\"])(\/\/[^\n\r]*)/g, "$1");
  }

  // Core Shortening Logic:
  // 1. Convert all Windows (\r\n) or Mac (\r) line breaks to standard Unix (\n)
  let lines = processedText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // 2. Process line by line: remove tabs, trim leading & trailing spaces on each line
  let cleanedLines = lines
    .map((line) => {
      // Replace tabs (\t) with single spaces
      let cleaned = line.replace(/\t/g, " ");
      // Collapse multiple spaces into a single space
      cleaned = cleaned.replace(/[ ]+/g, " ");
      // Trim spaces from start and end of line
      return cleaned.trim();
    })
    // 3. Filter out empty lines (remove blank lines)
    .filter((line) => line.length > 0);

  // Option 2: Single Line Minify (if checkbox is checked)
  if (elements.optSingleLine.checked) {
    processedText = cleanedLines.join(" ");
  } else {
    // Standard Shorten: Join cleaned lines back together (keeps code readable)
    processedText = cleanedLines.join("\n");
  }

  // Trim whitespace from beginning and end of final output
  processedText = processedText.trim();

  // Display shortened code in the output textarea
  elements.outputCode.value = processedText;

  // Update statistics dashboard
  updateStats(originalText, processedText);

  // Show success toast notification
  showToast("Code shortened successfully!", "success");

  // Option 3: Auto-copy to clipboard if option is enabled
  if (elements.optAutoCopy.checked) {
    copyCodeSilently();
  }
}

/**
 * 3. Copy Code to Clipboard
 * Copies the shortened output text to clipboard and notifies user.
 */
function copyCode() {
  const outputText = elements.outputCode.value;

  // Check if output field has content
  if (!outputText || outputText.trim() === "") {
    showToast("Nothing to copy! Shorten some code first.", "warning");
    return;
  }

  // Use the modern Navigator Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(outputText)
      .then(() => {
        handleCopySuccess();
      })
      .catch(() => {
        fallbackCopyText(outputText);
      });
  } else {
    // Fallback for non-HTTPS or older browsers
    fallbackCopyText(outputText);
  }
}

/**
 * Copy Code Silently (for Auto-Copy option)
 */
function copyCodeSilently() {
  const outputText = elements.outputCode.value;
  if (!outputText) return;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(outputText).then(() => {
      showToast("Shortened code auto-copied to clipboard!", "info");
    });
  }
}

/**
 * Helper function for handling successful copy feedback
 */
function handleCopySuccess() {
  showToast("Shortened code copied to clipboard!", "success");

  // Temporarily update copy button text for quick visual feedback
  const btnSpan = elements.btnCopy.querySelector("span");
  const originalText = btnSpan.textContent;

  btnSpan.textContent = "Copied!";
  elements.btnCopy.classList.add("btn-primary");
  elements.btnCopy.classList.remove("btn-secondary");

  setTimeout(() => {
    btnSpan.textContent = originalText;
    elements.btnCopy.classList.remove("btn-primary");
    elements.btnCopy.classList.add("btn-secondary");
  }, 2000);
}

/**
 * Fallback copy method for compatibility
 */
function fallbackCopyText(text) {
  elements.outputCode.select();
  try {
    document.execCommand("copy");
    handleCopySuccess();
  } catch (err) {
    showToast("Unable to copy code. Please copy manually.", "warning");
  }
}

/**
 * 4. Download Shortened Code
 * Downloads the shortened code as a plain text file (.txt).
 */
function downloadCode() {
  const outputText = elements.outputCode.value;

  if (!outputText || outputText.trim() === "") {
    showToast("No shortened code available to download!", "warning");
    return;
  }

  // Create a Blob with the output text
  const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger browser download
  const a = document.createElement("a");
  a.href = url;
  a.download = "shortened-code.txt";
  document.body.appendChild(a);
  a.click();

  // Cleanup temporary URL and DOM element
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Code downloaded as shortened-code.txt!", "success");
}

/**
 * 5. Clear Fields
 * Resets textareas, options, and statistics.
 */
function clearFields() {
  // Clear textarea values
  elements.inputCode.value = "";
  elements.outputCode.value = "";

  // Reset statistics and live counters
  updateStats("", "");

  // Focus back to input textarea
  elements.inputCode.focus();

  showToast("Fields and statistics cleared.", "info");
}

/**
 * 6. Update Statistics
 * Calculates and updates character count, line count, and percentage reduction.
 */
function updateStats(origText, shortText) {
  const origChars = origText.length;
  const shortChars = shortText.length;

  // Calculate lines count (empty string = 0 lines)
  const origLines = origText ? origText.split("\n").length : 0;
  const shortLines = shortText ? shortText.split("\n").length : 0;

  // Calculate characters removed
  const removedChars = Math.max(0, origChars - shortChars);

  // Calculate percentage saved
  let savedPercent = 0;
  if (origChars > 0) {
    savedPercent = Math.round((removedChars / origChars) * 100);
  }

  // Update DOM text contents
  elements.statOrigChars.textContent = origChars.toLocaleString();
  elements.statOrigLines.textContent = `${origLines} line${origLines === 1 ? "" : "s"}`;

  elements.statShortChars.textContent = shortChars.toLocaleString();
  elements.statShortLines.textContent = `${shortLines} line${shortLines === 1 ? "" : "s"}`;

  elements.statRemovedChars.textContent = removedChars.toLocaleString();
  elements.statSavedPercent.textContent = `${savedPercent}% saved`;

  // Update live badges
  elements.counterInput.textContent = `${origChars.toLocaleString()} chars | ${origLines} lines`;
  elements.counterOutput.textContent = `${shortChars.toLocaleString()} chars | ${shortLines} lines`;
}

/**
 * 7. Live Character Counter Listener
 * Updates counter badges dynamically as the user types in input.
 */
function handleLiveCounter() {
  const inputText = elements.inputCode.value;
  const outputText = elements.outputCode.value;

  const origChars = inputText.length;
  const origLines = inputText ? inputText.split("\n").length : 0;

  elements.counterInput.textContent = `${origChars.toLocaleString()} chars | ${origLines} lines`;
  elements.statOrigChars.textContent = origChars.toLocaleString();
  elements.statOrigLines.textContent = `${origLines} line${origLines === 1 ? "" : "s"}`;
}

/**
 * 8. Dark Mode Toggle
 * Switches between Light and Dark themes and persists preference in localStorage.
 */
function initTheme() {
  const savedTheme = localStorage.getItem("code_shortener_theme") || "light";
  applyTheme(savedTheme);
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  applyTheme(newTheme);
  localStorage.setItem("code_shortener_theme", newTheme);

  showToast(`Switched to ${newTheme === "dark" ? "Dark" : "Light"} Mode`, "info");
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    elements.themeIconSun.classList.remove("hidden");
    elements.themeIconMoon.classList.add("hidden");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    elements.themeIconSun.classList.add("hidden");
    elements.themeIconMoon.classList.remove("hidden");
  }
}

/**
 * 9. Toast Notification Handler
 * Creates and displays floating toast popups with smooth animation.
 */
function showToast(message, type = "info") {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Choose icon based on toast type
  let iconSVG = "";
  if (type === "success") {
    iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === "warning") {
    iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else {
    iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `${iconSVG}<span>${message}</span>`;

  // Append to container
  elements.toastContainer.appendChild(toast);

  // Auto remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add("toast-out");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }, 3000);
}

/**
 * 10. Sample Code Snippet Loader
 * Loads a sample code snippet into the input box for quick testing.
 */
function loadSampleSnippet() {
  const sampleCode = `<!-- Sample Unoptimized HTML & CSS Snippet -->
<div class="user-card">
    
    <h2 class="title">
        Hello World
    </h2>
    
    <p class="description">
        This is an unoptimized snippet with extra spaces, tabs, and line breaks.
    </p>

</div>

<style>
    /* Card Styles */
    .user-card {
        padding:    20px;
        margin:   10px auto;
        
        background-color:   #ffffff;
        border-radius:   8px;
    }

    /* Heading */
    .title {
        font-size:   24px;
        color:   #333333;
    }
</style>

<script>
    // Sample Function
    function greetUser( name ) {
        
        if ( !name ) {
            return "Hello Guest!";
        }
        
        return "Welcome, " + name + "!";
        
    }
</script>`;

  elements.inputCode.value = sampleCode;
  handleLiveCounter();
  shortenCode();
  showToast("Sample snippet loaded and shortened!", "info");
}

/**
 * 11. Keyboard Shortcuts Handler
 * Handles Ctrl + Enter (or Cmd + Enter on Mac) to shorten code.
 */
function initKeyboardShortcuts(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    shortenCode();
  }
}
