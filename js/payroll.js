/* ==========================================================================
   Lumina · Payroll
   --------------------------------------------------------------------------
   Add employees, work out their pay, and delete a line by its number.

     Gross pay = days worked x daily rate
     Net pay   = gross pay - deduction

   Each employee is one object in the `employees` array, and the table, the
   count and the totals are all drawn from that array by render(). Nothing is
   saved: the list resets when the page is refreshed, as in the assignment.

   Rules, checked before anything is added:
   - Every field must be filled in.
   - Days worked, daily rate and deduction cannot be negative.
   - The deduction cannot be more than the gross pay.

   Depends on app.js.
   ========================================================================== */

(() => {
  "use strict";

  const { format, validate, dom, ui } = Lumina;
  const { $ } = dom;

  const COLUMN_COUNT = 7;

  /* ---------- Calculation (no page code) ---------- */

  /** Rounds to whole centavos, so repeated sums never drift (0.1 + 0.2). */
  const roundToCents = (amount) => Math.round(amount * 100) / 100;

  /** Builds one employee record from already-validated numbers. */
  const createEmployee = ({ name, daysWorked, dailyRate, deduction }) => {
    const grossPay = roundToCents(daysWorked * dailyRate);
    const deductionAmount = roundToCents(deduction);
    return {
      name,
      daysWorked,
      dailyRate,
      grossPay,
      deduction: deductionAmount,
      netPay: roundToCents(grossPay - deductionAmount)
    };
  };

  const calculateTotals = (list) => list.reduce(
    (totals, employee) => ({
      gross: roundToCents(totals.gross + employee.grossPay),
      deductions: roundToCents(totals.deductions + employee.deduction),
      net: roundToCents(totals.net + employee.netPay)
    }),
    { gross: 0, deductions: 0, net: 0 }
  );

  const countLabel = (count) => `${count} ${count === 1 ? "employee" : "employees"}`;

  /* ---------- Page ---------- */

  const init = () => {
    const employees = []; // each record is an object; see createEmployee()

    const form = $("#payroll-form");
    const nameInput = $("#employee-name");
    const daysInput = $("#days-worked");
    const rateInput = $("#daily-rate");
    const deductionInput = $("#deduction");
    const feedback = $("#payroll-feedback");

    const deleteForm = $("#delete-form");
    const deleteInput = $("#delete-line");

    const tableBody = $("#payroll-body");
    const countOutput = $("#payroll-count");
    const grossOutput = $("#total-gross");
    const deductionsOutput = $("#total-deductions");
    const netOutput = $("#total-net");

    /* ---------- Drawing ---------- */

    const emptyRow = () => `
      <tr>
        <td class="empty-state" colspan="${COLUMN_COUNT}">
          <i data-lucide="users" class="icon" aria-hidden="true"></i>
          <p>No employees yet. Add one above to start the list.</p>
        </td>
      </tr>`;

    const employeeRow = (employee, index) => `
      <tr>
        <td data-label="No.">${index + 1}</td>
        <td class="col-text" data-label="Employee Name">${format.escapeHTML(employee.name)}</td>
        <td class="col-num" data-label="Days Worked">${format.number(employee.daysWorked, 2)}</td>
        <td class="col-num" data-label="Daily Rate">${format.peso(employee.dailyRate)}</td>
        <td class="col-num" data-label="Gross Pay">${format.peso(employee.grossPay)}</td>
        <td class="col-num" data-label="Deduction">${format.peso(employee.deduction)}</td>
        <td class="col-num" data-label="Net Pay"><strong>${format.peso(employee.netPay)}</strong></td>
      </tr>`;

    /** Redraws the table, the count and the totals from the employees array. */
    const render = ({ newRowIndex = -1 } = {}) => {
      tableBody.innerHTML = employees.length
        ? employees.map(employeeRow).join("")
        : emptyRow();

      if (newRowIndex >= 0) tableBody.rows[newRowIndex]?.classList.add("anim-row-enter");

      const totals = calculateTotals(employees);
      countOutput.textContent = countLabel(employees.length);
      grossOutput.textContent = format.peso(totals.gross);
      deductionsOutput.textContent = format.peso(totals.deductions);
      netOutput.textContent = format.peso(totals.net);

      ui.refreshIcons(); // draws the icon in the empty state
    };

    /* ---------- Add an employee ---------- */

    /** Checks a numeric field and shows its error. Returns the number, or null. */
    const readNumber = (input, label) => {
      const { value, error } = validate.number(input.value, { label, min: 0 });
      if (error) {
        ui.setFieldError(input, error);
        return null;
      }
      return value;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      ui.clearFeedback(feedback);
      [nameInput, daysInput, rateInput, deductionInput].forEach(ui.clearFieldError); // start from a clean slate

      const name = nameInput.value.trim();
      if (name === "") ui.setFieldError(nameInput, "Enter the employee name.");

      // Every field is checked, so all the mistakes show at once
      const daysWorked = readNumber(daysInput, "Days worked");
      const dailyRate = readNumber(rateInput, "Daily rate");
      const deduction = readNumber(deductionInput, "Deduction amount");

      const firstInvalid = [nameInput, daysInput, rateInput, deductionInput]
        .find((input) => input.getAttribute("aria-invalid") === "true");
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const employee = createEmployee({ name, daysWorked, dailyRate, deduction });

      if (employee.deduction > employee.grossPay) {
        ui.setFieldError(
          deductionInput,
          `Deduction cannot be more than the gross pay (${format.peso(employee.grossPay)}).`
        );
        deductionInput.focus();
        return;
      }

      employees.push(employee);
      render({ newRowIndex: employees.length - 1 });

      form.reset();
      ui.setFeedback(feedback, `${employee.name} was added to the payroll list.`, "success");
      nameInput.focus();
    });

    /* ---------- Delete a line ---------- */

    deleteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      ui.clearFeedback(feedback);

      if (employees.length === 0) {
        ui.setFieldError(deleteInput, "The payroll list is empty, so there is nothing to delete.");
        deleteInput.focus();
        return;
      }

      const { value: lineNumber, error } = validate.number(deleteInput.value, {
        label: "Line number",
        min: 1,
        integer: true
      });
      if (error) {
        ui.setFieldError(deleteInput, error);
        deleteInput.focus();
        return;
      }

      if (lineNumber > employees.length) {
        ui.setFieldError(
          deleteInput,
          `Line ${format.number(lineNumber)} does not exist. The list has ${countLabel(employees.length)}.`
        );
        deleteInput.focus();
        return;
      }

      const [removed] = employees.splice(lineNumber - 1, 1);
      render();

      deleteInput.value = "";
      ui.clearFieldError(deleteInput);
      ui.setFeedback(feedback, `${removed.name} was deleted. The totals and line numbers were updated.`, "success");
    });

    render();
  };

  Lumina.register("payroll", init);
})();
