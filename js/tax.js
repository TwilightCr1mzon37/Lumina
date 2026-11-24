/* ==========================================================================
   Lumina · Income Tax
   --------------------------------------------------------------------------
   Income tax = basic tax + rate x (income over the bracket's starting point),
   using the table from the assignment.

   The table lives in one place, BRACKETS. The calculator, the result panel
   and the reference table on the page are all produced from it, so they can
   never disagree.

   A bracket reads "over `over`, but not over `upTo`". An income exactly on a
   boundary belongs to the lower bracket, as in the assignment table.

   Depends on app.js.
   ========================================================================== */

(() => {
  "use strict";

  const { format, validate, dom, ui } = Lumina;
  const { $ } = dom;

  const BRACKETS = Object.freeze([
    { over: 0,       upTo: 250_000,   baseTax: 0,         rate: 0 },
    { over: 250_000, upTo: 400_000,   baseTax: 0,         rate: 0.20 },
    { over: 400_000, upTo: 800_000,   baseTax: 30_000,    rate: 0.25 },
    { over: 800_000, upTo: 2_000_000, baseTax: 130_000,   rate: 0.30 },
    { over: 2_000_000, upTo: 8_000_000, baseTax: 490_000, rate: 0.32 },
    { over: 8_000_000, upTo: Infinity,  baseTax: 2_410_000, rate: 0.35 }
  ]);

  /* ---------- Calculation (no page code) ---------- */

  const findBracket = (income) => BRACKETS.find(({ upTo }) => income <= upTo);

  const roundToCents = (amount) => Math.round(amount * 100) / 100;

  /** Returns the tax due and the bracket the income falls in. */
  const calculateTax = (income) => {
    const bracket = findBracket(income);
    const { over, baseTax, rate } = bracket;
    const tax = baseTax + (income - over) * rate;
    return { tax: roundToCents(tax), bracket };
  };

  /* ---------- Wording ---------- */

  const peso = (amount) => `₱${format.number(amount, 0)}`; // whole pesos, for the table

  /** "Over ₱400,000 up to ₱800,000" */
  const describeRange = ({ over, upTo }) => {
    if (over === 0) return `Up to ${peso(upTo)}`;
    if (upTo === Infinity) return `Over ${peso(over)}`;
    return `Over ${peso(over)} up to ${peso(upTo)}`;
  };

  /** "₱30,000 + 25% of the excess over ₱400,000" */
  const describeTax = ({ over, baseTax, rate }) => {
    if (rate === 0) return "0%";
    const percentage = `${format.number(rate * 100, 0)}% of the excess over ${peso(over)}`;
    return baseTax === 0 ? percentage : `${peso(baseTax)} + ${percentage}`;
  };

  /* ---------- Page ---------- */

  const init = () => {
    const form = $("#tax-form");
    const input = $("#tax-input");
    const resultPanel = $("#tax-result");
    const resultList = $(".result-list", resultPanel);
    const incomeOutput = $('[data-field="income"]', resultPanel);
    const bracketOutput = $('[data-field="bracket"]', resultPanel);

    const trigger = $("#tax-ref-trigger");
    const triggerLabel = $("#tax-ref-label");
    const panel = $("#tax-ref-panel");
    const panelContent = $(".collapsible__inner", panel);
    const tableBody = $("#tax-bracket-rows");

    /** Builds the reference table from BRACKETS. */
    const renderBracketTable = () => {
      tableBody.innerHTML = BRACKETS.map((bracket, index) => `
        <tr data-bracket="${index}">
          <td class="col-text" data-label="Taxable income">${describeRange(bracket)}</td>
          <td class="col-text" data-label="Tax">${describeTax(bracket)}</td>
        </tr>`).join("");
    };

    /** Marks the table row that matches the latest calculation. */
    const highlightBracket = (bracket) => {
      const currentIndex = BRACKETS.indexOf(bracket);
      [...tableBody.rows].forEach((row, index) => row.classList.toggle("is-current", index === currentIndex));
    };

    const setReferenceOpen = (isOpen) => {
      trigger.setAttribute("aria-expanded", String(isOpen));
      triggerLabel.textContent = isOpen ? "Hide brackets" : "Show brackets";
      panel.classList.toggle("is-open", isOpen);
      panelContent.inert = !isOpen; // keeps hidden content out of keyboard and screen reader reach
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const { value: income, error } = validate.number(input.value, { label: "Net taxable income", min: 0 });
      if (error) {
        ui.setFieldError(input, error);
        input.focus();
        return;
      }

      const { tax, bracket } = calculateTax(income);

      ui.clearFieldError(input);
      incomeOutput.textContent = format.peso(income);
      bracketOutput.textContent = describeRange(bracket);
      resultList.hidden = false;
      ui.showResult(resultPanel, { value: format.peso(tax) });
      highlightBracket(bracket);
    });

    trigger.addEventListener("click", () => {
      setReferenceOpen(trigger.getAttribute("aria-expanded") !== "true");
    });

    renderBracketTable();
    setReferenceOpen(false);
  };

  Lumina.register("tax", init);
})();
