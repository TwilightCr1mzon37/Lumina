/* ==========================================================================
   Lumina · Navigation
   --------------------------------------------------------------------------
   Shows one view at a time and keeps the rest of the shell in step with it.

   - Routing uses the URL hash (#conversion, #payroll, ...). That works when
     index.html is opened straight from a folder, and gives working back and
     forward buttons and links that can be shared.
   - On phones and tablets the sidebar is a drawer. Opening it hides the page
     behind it from keyboard and screen readers, Escape closes it, and focus
     goes back to the menu button.

   Depends on app.js.
   ========================================================================== */

(() => {
  "use strict";

  const { $, $$ } = Lumina.dom;
  const { replayAnimation } = Lumina.ui;

  const DEFAULT_ROUTE = "dashboard";
  const DRAWER_QUERY = "(max-width: 900px)"; // keep in step with the tablet breakpoint in style.css
  const APP_NAME = "Lumina";

  /** "#tax" -> "tax" when that route exists, otherwise null. */
  const routeFromHash = (hash, routes) => {
    const name = hash.replace(/^#/, "");
    return routes.has(name) ? name : null;
  };

  const init = () => {
    const views = $$(".view");
    const navLinks = $$(".nav-link[data-route]");
    const routes = new Set(views.map((view) => view.id));

    const mainContent = $("#main-content");
    const mainColumn = $(".main");
    const sidebar = $("#sidebar");
    const scrim = $("#scrim");
    const menuToggle = $("#menu-toggle");
    const headerTitle = $("#header-title");
    const drawerQuery = window.matchMedia(DRAWER_QUERY);

    /* ---------- Drawer ---------- */

    const isDrawerOpen = () => sidebar.classList.contains("is-open");

    const openDrawer = () => {
      sidebar.classList.add("is-open");
      scrim.hidden = false;
      mainColumn.inert = true; // the page behind the drawer cannot be tabbed into
      document.body.classList.add("is-drawer-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close navigation");
      ($(".nav-link.is-active", sidebar) ?? $(".nav-link", sidebar)).focus();
    };

    const closeDrawer = ({ returnFocus = false } = {}) => {
      if (!isDrawerOpen()) return;
      sidebar.classList.remove("is-open");
      scrim.hidden = true;
      mainColumn.inert = false;
      document.body.classList.remove("is-drawer-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      if (returnFocus) menuToggle.focus();
    };

    /* ---------- Routing ---------- */

    /** Shows one view and updates the sidebar, header and page title to match. */
    const showRoute = (name, { moveFocus = true } = {}) => {
      views.forEach((view) => {
        const isActive = view.id === name;
        view.classList.toggle("is-active", isActive);
        if (isActive) replayAnimation(view, "anim-view-enter");
      });

      let title = "";
      navLinks.forEach((link) => {
        const isActive = link.dataset.route === name;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
          title = link.textContent.trim();
        } else {
          link.removeAttribute("aria-current");
        }
      });

      headerTitle.textContent = title;
      document.title = name === DEFAULT_ROUTE ? APP_NAME : `${title} · ${APP_NAME}`;

      closeDrawer();

      if (moveFocus) {
        mainContent.focus({ preventScroll: true }); // lets screen readers start at the new page
        window.scrollTo({ top: 0 });
      }
    };

    /* ---------- Events ---------- */

    window.addEventListener("hashchange", () => {
      // Hashes that are not routes (such as the skip link's #main-content) leave the page as it is
      const name = routeFromHash(window.location.hash, routes);
      if (name) showRoute(name);
    });

    menuToggle.addEventListener("click", () => {
      if (isDrawerOpen()) closeDrawer({ returnFocus: true });
      else openDrawer();
    });

    scrim.addEventListener("click", () => closeDrawer({ returnFocus: true }));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isDrawerOpen()) closeDrawer({ returnFocus: true });
    });

    // Choosing the page you are already on triggers no hashchange, so close the drawer here too
    sidebar.addEventListener("click", (event) => {
      if (!event.target.closest(".nav-link")) return;
      closeDrawer();
      mainContent.focus({ preventScroll: true });
    });

    // Growing the window past the breakpoint turns the drawer back into a fixed sidebar
    drawerQuery.addEventListener("change", (event) => {
      if (!event.matches) closeDrawer();
    });

    /* ---------- First view ---------- */

    // No focus move on first load, so the page does not jump or announce itself
    showRoute(routeFromHash(window.location.hash, routes) ?? DEFAULT_ROUTE, { moveFocus: false });
  };

  Lumina.register("navigation", init);
})();
