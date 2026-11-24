/* ==========================================================================
   Lumina · Loop Lab
   --------------------------------------------------------------------------
   Three small calculations, each written with a different kind of loop:

     Factorial   while loop      n! = 1 x 2 x ... x n        (0! is 1)
     Sum         do-while loop   1 + 2 + ... + n
     Average     for loop        (1 + 2 + ... + n) / n

   The loops are the point of this page, so each one is written out plainly
   in its own function rather than replaced by a formula or a library call.
   The functions are pure (no page code), which keeps them easy to check by hand.

   Factorials grow very fast: 171! is already too big for a normal JavaScript
   number. The factorial therefore uses BigInt, so every answer up to 1,000!
   is exact. A very long answer gets a short scientific-notation headline,
   and its full exact digits are always printed underneath.

   Depends on app.js.
   ========================================================================== */

(() => {
  "use strict";

  const { format, validate, dom, ui } = Lumina;
  const { $ } = dom;

  const FACTORIAL_MAX = 1000;
  const SUM_MAX = 100_000;

  // Answers up to this many digits are shown in full, with thousands separators
  const FULL_DIGITS_LIMIT = 25;
  // Digits kept in the scientific-notation form of a very long factorial
  const SCIENTIFIC_DIGITS = 12;
  // Largest n whose working (5 x 4 x 3 x 2 x 1) is spelled out in the detail line
  const WORKING_LIMIT = 10;

  /* ---------- Calculations (no page code) ---------- */

  /** while loop: multiplies every whole number from 1 up to n. Returns a BigInt. */
  const factorial = (n) => {
    let result = 1n;
    let counter = 1n;
    const limit = BigInt(n);

    while (counter <= limit) {
      result *= counter;
      counter++;
    }

    return result;
  };

  /** do-while loop: adds every whole number from 1 up to n. n is at least 1. */
  const sumUpTo = (n) => {
    let total = 0;
    let counter = 1;

    do {
      total += counter;
      counter++;
    } while (counter <= n);

    return total;
  };

  /** for loop: adds the whole numbers from 1 up to n, then divides by how many there are. */
  const averageUpTo = (n) => {
    let total = 0;

    for (let counter = 1; counter <= n; counter++) {
      total += counter;
    }

    return { total, average: total / n };
  };

  /* ---------- Wording ---------- */

  /** 120n -> "120", 1234567n -> "1,234,567" (BigInt-safe). */
  const formatBig = (value) => new Intl.NumberFormat("en-PH").format(value);

  /** "5 × 4 × 3 × 2 × 1" (only used for n of 2 or more). */
  const describeWorking = (n) => {
    const factors = [];
    for (let factor = n; factor >= 1; factor--) factors.push(factor);
    return factors.join(" × ");
  };

  /** Describes a factorial answer: the headline value and the line under it. */
  const describeFactorial = (n, result) => {
    const digits = result.toString();
    const name = `${format.number(n)}!`;

    if (digits.length <= FULL_DIGITS_LIMIT) {
      const working = n >= 2 && n <= WORKING_LIMIT ? `${describeWorking(n)} = ` : "";
      return { value: formatBig(result), detail: `${name} = ${working}${formatBig(result)}` };
    }

    // Too long for a headline: 4.02387260077e+2567, with every exact digit in the detail line
    const mantissa = `${digits[0]}.${digits.slice(1, SCIENTIFIC_DIGITS)}`;
    return {
      value: `${mantissa}e+${digits.length - 1}`,
      detail: `${name} has ${format.number(digits.length)} digits. Exact value: ${digits}`
    };
  };

  /** "1 + 2 + 3 + … + 10 = 55" */
  const describeSum = (n, total) => {
    const shown = n <= 3
      ? Array.from({ length: n }, (_, index) => index + 1).join(" + ")
      : `1 + 2 + 3 + … + ${format.number(n)}`;
    return `${shown} = ${format.number(total)}`;
  };

  /* ---------- Page ---------- */

  /**
   * Wires one loop card: validates the typed number, runs the calculation and
   * shows the result. `calculate(n)` returns { value, detail }.
   */
  const setUpTool = ({ name, label, min, max, calculate }) => {
    const form = $(`#${name}-form`);
    const input = $(`#${name}-input`);
    const resultPanel = $(`#${name}-result`);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const { value: n, error } = validate.number(input.value, { label, min, max, integer: true });
      if (error) {
        ui.setFieldError(input, error);
        input.focus();
        return;
      }

      ui.clearFieldError(input);
      ui.showResult(resultPanel, calculate(n));
    });
  };

  const init = () => {
    setUpTool({
      name: "factorial",
      label: "Number n",
      min: 0,
      max: FACTORIAL_MAX,
      calculate: (n) => describeFactorial(n, factorial(n))
    });

    setUpTool({
      name: "sum",
      label: "Number n",
      min: 1,
      max: SUM_MAX,
      calculate: (n) => {
        const total = sumUpTo(n);
        return { value: format.number(total), detail: describeSum(n, total) };
      }
    });

    setUpTool({
      name: "average",
      label: "Number n",
      min: 1,
      max: SUM_MAX,
      calculate: (n) => {
        const { total, average } = averageUpTo(n);
        return {
          value: format.number(average),
          detail: `Sum ${format.number(total)} ÷ ${format.number(n)} ${n === 1 ? "number" : "numbers"} = ${format.number(average)}`
        };
      }
    });
  };

  Lumina.register("loops", init);
})();
