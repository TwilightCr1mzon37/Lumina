/* ==========================================================================
   Lumina · App core
   --------------------------------------------------------------------------
   Creates the one global the app uses, `Lumina`, and gives every feature
   file the same small toolkit. This file must load first (see index.html).

   How features plug in
     Lumina.register("tax", () => { ...wire up the tax form... });
   Every registered function runs once, after the page has loaded, in the
   order the scripts were included. A feature that throws is reported in the
   console and never stops the others from starting.

   The toolkit
     Lumina.format    number and peso formatting, HTML escaping
     Lumina.validate  one reusable number validator for every form
     Lumina.dom       short query helpers
     Lumina.ui        field errors, result panels, feedback messages, icons
   ========================================================================== */

(() => {
  "use strict";

  /* ---------- Formatting ---------- */

  const pesoFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Formatters are created once per precision and reused
  const numberFormatters = new Map();

  /** 1234.5 -> "₱1,234.50" */
  const formatPeso = (amount) => pesoFormatter.format(amount);

  /** 1234.56789 -> "1,234.56789". Trailing zeros are dropped. */
  const formatNumber = (value, maximumFractionDigits = 6) => {
    if (!numberFormatters.has(maximumFractionDigits)) {
      numberFormatters.set(
        maximumFractionDigits,
        new Intl.NumberFormat("en-PH", { maximumFractionDigits })
      );
    }
    return numberFormatters.get(maximumFractionDigits).format(value);
  };

  const htmlEscapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };

  /** Makes user-typed text safe to place inside an HTML template string. */
  const escapeHTML = (text) => String(text).replace(/[&<>"']/g, (character) => htmlEscapes[character]);

  /* ---------- Validation ---------- */

  /**
   * Checks one typed value against simple rules.
   * Returns { value } when it is valid, or { error } with a message to show.
   *
   *   validateNumber("42", { label: "Days worked", min: 0 })  ->  { value: 42 }
   *   validateNumber("", { label: "Days worked" })            ->  { error: "Enter days worked." }
   */
  const validateNumber = (raw, { label = "Value", min = -Infinity, max = Infinity, integer = false } = {}) => {
    const text = String(raw ?? "").trim();

    if (text === "") return { error: `Enter ${label.toLowerCase()}.` };

    const value = Number(text);
    if (!Number.isFinite(value)) return { error: `${label} must be a number.` };
    if (integer && !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
    if (value < min) return { error: `${label} must be ${formatNumber(min)} or more.` };
    if (value > max) return { error: `${label} must be ${formatNumber(max)} or less.` };

    return { value };
  };

  /* ---------- DOM helpers ---------- */

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  /* ---------- UI helpers ---------- */

  /** Restarts a CSS animation, so a repeated result still draws the eye. */
  const replayAnimation = (element, className = "anim-reveal") => {
    element.classList.remove(className);
    void element.offsetWidth; // forces a reflow so the class can be added again
    element.classList.add(className);
  };

  /** Shows an error under a form control and marks it invalid for assistive tech. */
  const setFieldError = (input, message) => {
    const field = input.closest(".field");
    const errorElement = $(".field__error", field);
    field.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    if (errorElement) errorElement.textContent = message;
  };

  const clearFieldError = (input) => {
    const field = input.closest(".field");
    if (!field) return;
    const errorElement = $(".field__error", field);
    field.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    if (errorElement) errorElement.textContent = "";
  };

  /** Fills a .result panel with a headline value and an optional detail line. */
  const showResult = (panel, { value, detail = "" }) => {
    $(".result__value", panel).textContent = value;
    const detailElement = $(".result__detail", panel);
    if (detailElement) detailElement.textContent = detail;
    panel.classList.remove("is-empty");
    replayAnimation(panel);
  };

  /** Shows a form-level message. type is "success" or "error". */
  const setFeedback = (element, message, type) => {
    element.textContent = message;
    element.classList.remove("is-success", "is-error");
    element.classList.add(type === "success" ? "is-success" : "is-error");
    replayAnimation(element);
  };

  const clearFeedback = (element) => {
    element.textContent = "";
    element.classList.remove("is-success", "is-error");
  };

  /** Draws any <i data-lucide="..."> that has not become an SVG yet. */
  const refreshIcons = () => {
    window.lucide?.createIcons();
  };

  /* ---------- Feature registry and start-up ---------- */

  const features = [];
  let hasStarted = false;

  const runFeature = ({ name, init }) => {
    try {
      init();
    } catch (error) {
      console.error(`[Lumina] The "${name}" feature failed to start.`, error);
    }
  };

  const register = (name, init) => {
    const feature = { name, init };
    features.push(feature);
    if (hasStarted) {
      runFeature(feature);
      refreshIcons();
    }
  };

  const start = () => {
    // Typing in a field removes its error straight away
    document.addEventListener("input", (event) => {
      if (event.target.matches?.(".field__control")) clearFieldError(event.target);
    });

    features.forEach(runFeature);
    hasStarted = true;
    refreshIcons();
  };

  // Deferred scripts run while readyState is "interactive", before DOMContentLoaded.
  // Waiting for that event guarantees every feature file has registered first.
  if (document.readyState === "complete") start();
  else document.addEventListener("DOMContentLoaded", start);

  /* ---------- Public API ---------- */

  window.Lumina = Object.freeze({
    register,
    format: Object.freeze({ peso: formatPeso, number: formatNumber, escapeHTML }),
    validate: Object.freeze({ number: validateNumber }),
    dom: Object.freeze({ $, $$ }),
    ui: Object.freeze({
      setFieldError,
      clearFieldError,
      showResult,
      setFeedback,
      clearFeedback,
      replayAnimation,
      refreshIcons
    })
  });
})();
