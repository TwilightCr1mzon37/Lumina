/* ==========================================================================
   Lumina · Theme switch
   --------------------------------------------------------------------------
   Toggles between the light and dark theme and remembers the choice.

   How it works
   - The theme is the data-theme attribute on <html>. Light is the default
     and has no attribute; dark sets data-theme="dark".
   - variables.css redefines the colour tokens for the dark value, so no
     other stylesheet needs to know about themes.
   - A tiny inline script in index.html applies the saved theme before the
     first paint. This file handles the toggle button after that.
   ========================================================================== */

(() => {
  "use strict";

  const STORAGE_KEY = "lumina-theme";
  const THEME_COLORS = { light: "#f5f7fa", dark: "#0f141b" };

  const root = document.documentElement;

  const readSavedTheme = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null; // storage blocked (private mode, file restrictions)
    }
  };

  const saveTheme = (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* the choice still applies for this visit */
    }
  };

  const isDark = () => root.dataset.theme === "dark";

  /** Applies a theme to the page and keeps the button and browser chrome in sync. */
  const applyTheme = (theme, toggleButton) => {
    if (theme === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;

    toggleButton?.setAttribute("aria-pressed", String(theme === "dark"));
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  };

  const init = () => {
    const toggleButton = document.getElementById("theme-toggle");
    if (!toggleButton) return;

    // Sync the button with whatever the inline script already applied
    applyTheme(readSavedTheme() === "dark" ? "dark" : "light", toggleButton);

    toggleButton.addEventListener("click", () => {
      const nextTheme = isDark() ? "light" : "dark";
      applyTheme(nextTheme, toggleButton);
      saveTheme(nextTheme);
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
