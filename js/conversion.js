/* ==========================================================================
   Lumina · Conversion
   --------------------------------------------------------------------------
   Four conversions: Celsius <-> Fahrenheit and meters <-> feet.

   Each conversion is one entry in CONVERSIONS: its labels, its formula and
   its limits. Adding a fifth conversion means adding one more entry; no other
   code changes. The formulas are pure functions, kept apart from the page so
   they are easy to check by hand.

   Depends on app.js.
   ========================================================================== */

(() => {
  "use strict";

  const { format, validate, dom, ui } = Lumina;
  const { $ } = dom;

  const FEET_PER_METER = 1 / 0.3048; // one foot is defined as exactly 0.3048 m

  const CONVERSIONS = Object.freeze({
    "c-to-f": {
      quantity: "Temperature",
      inputLabel: "Temperature in °C",
      placeholder: "e.g. 36.5",
      from: "°C",
      to: "°F",
      decimals: 2,
      minimum: -273.15,
      minimumMessage: "Temperature cannot be below absolute zero (-273.15 °C).",
      convert: (celsius) => (celsius * 9) / 5 + 32,
      opposite: "f-to-c"
    },
    "f-to-c": {
      quantity: "Temperature",
      inputLabel: "Temperature in °F",
      placeholder: "e.g. 98.6",
      from: "°F",
      to: "°C",
      decimals: 2,
      minimum: -459.67,
      minimumMessage: "Temperature cannot be below absolute zero (-459.67 °F).",
      convert: (fahrenheit) => ((fahrenheit - 32) * 5) / 9,
      opposite: "c-to-f"
    },
    "m-to-ft": {
      quantity: "Length",
      inputLabel: "Length in meters",
      placeholder: "e.g. 1.75",
      from: "m",
      to: "ft",
      decimals: 5,
      minimum: 0,
      minimumMessage: "Length cannot be negative.",
      convert: (meters) => meters * FEET_PER_METER,
      opposite: "ft-to-m"
    },
    "ft-to-m": {
      quantity: "Length",
      inputLabel: "Length in feet",
      placeholder: "e.g. 6",
      from: "ft",
      to: "m",
      decimals: 5,
      minimum: 0,
      minimumMessage: "Length cannot be negative.",
      convert: (feet) => feet * 0.3048,
      opposite: "m-to-ft"
    }
  });

  /** Rounds to a set number of decimals and avoids showing "-0". */
  const roundTo = (value, decimals) => {
    const rounded = Number(value.toFixed(decimals));
    return rounded === 0 ? 0 : rounded;
  };

  const EMPTY_RESULT_TEXT = "Your result will appear here.";

  const init = () => {
    const form = $("#conversion-form");
    const typeSelect = $("#conversion-type");
    const input = $("#conversion-input");
    const inputLabel = $("#conversion-input-label");
    const swapButton = $("#conversion-swap");
    const resultPanel = $("#conversion-result");

    let lastResult = null; // the most recent converted value, used by "Swap direction"

    const currentConversion = () => CONVERSIONS[typeSelect.value];

    /** Updates the label and example to match the chosen conversion. */
    const applyConversionType = () => {
      const { inputLabel: labelText, placeholder } = currentConversion();
      inputLabel.textContent = labelText;
      input.placeholder = placeholder;
      ui.clearFieldError(input);
    };

    const resetResult = () => {
      $(".result__value", resultPanel).textContent = EMPTY_RESULT_TEXT;
      $(".result__detail", resultPanel).textContent = "";
      resultPanel.classList.add("is-empty");
      lastResult = null;
    };

    const rejectInput = (message) => {
      ui.setFieldError(input, message);
      input.focus();
    };

    /** Validates the input and shows the converted value. */
    const calculate = () => {
      const conversion = currentConversion();
      const { value, error } = validate.number(input.value, { label: conversion.quantity });

      if (error) return rejectInput(error);
      if (value < conversion.minimum) return rejectInput(conversion.minimumMessage);

      const result = roundTo(conversion.convert(value), conversion.decimals);
      if (!Number.isFinite(result)) return rejectInput("That number is too large to convert.");

      const shownResult = `${format.number(result, conversion.decimals)} ${conversion.to}`;
      ui.clearFieldError(input);
      ui.showResult(resultPanel, {
        value: shownResult,
        detail: `${format.number(value)} ${conversion.from} = ${shownResult}`
      });
      lastResult = result;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      calculate();
    });

    typeSelect.addEventListener("change", () => {
      applyConversionType();
      resetResult(); // an old result would no longer match the chosen conversion
    });

    // Swap direction: switch to the opposite conversion and carry the result across
    swapButton.addEventListener("click", () => {
      const carriedValue = lastResult;
      typeSelect.value = currentConversion().opposite;
      applyConversionType();

      if (carriedValue === null) {
        resetResult();
      } else {
        input.value = String(carriedValue);
        calculate();
      }
    });

    applyConversionType();
  };

  Lumina.register("conversion", init);
})();
