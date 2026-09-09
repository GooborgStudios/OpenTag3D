/*
 * OpenTag3D site-wide helpers: flash alert messages (`msg()`) and the
 * animated dropdown ".btn-menu" widget used across multiple pages.
 */

// --- DOM helper ---
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") {
      el.className = v;
    } else if (k === "for") {
      el.htmlFor = v;
    } else if (k === "required") {
      el.setAttribute("aria-required", "true");
      el.required = true;
    } else if (k.startsWith("on")) {
      el.addEventListener(k.slice(2), v);
    } else {
      el.setAttribute(k, v);
    }
  }
  for (const k of kids) el.append(k);
  return el;
};

// --- Flash alert messages ---
const flashTimeouts = new Map();

// Lazily creates the #messages container so any page can call msg() without
// needing to add the markup itself.
const getMessagesContainer = () => {
  let container = document.getElementById("messages");
  if (!container) {
    container = h("div", { id: "messages", "aria-live": "polite" });
    document.body.append(container);
  }
  return container;
};

const dismissFlashAlert = (alert) => {
  if (alert.classList.contains("is-hiding")) return;
  clearTimeout(flashTimeouts.get(alert));
  flashTimeouts.delete(alert);
  alert.classList.replace("is-visible", "is-hiding");
  setTimeout(() => alert.remove(), 200);
};

const msg = (message, isErr = false) => {
  const alert = h("div", {
    class: `flash-alert${isErr ? " is-error" : ""}`,
    role: isErr ? "alert" : "status",
  });
  alert.textContent = message;
  alert.addEventListener("click", () => dismissFlashAlert(alert));
  getMessagesContainer().append(alert);
  requestAnimationFrame(() => alert.classList.add("is-visible"));

  const timeout = isErr ? 8000 : 4000;
  if (timeout > 0) {
    flashTimeouts.set(
      alert,
      setTimeout(() => dismissFlashAlert(alert), timeout),
    );
  }

  (isErr ? console.error : console.log)(message);
};

// --- Dropdown button menus (".btn-menu") ---
// Animated opening/closing, closes on outside click or when a panel button is clicked.
const initBtnMenus = () => {
  const menus = [...document.querySelectorAll(".btn-menu")];
  if (!menus.length) return;

  const closeMenu = (menu) => {
    if (!menu.hasAttribute("open") || menu.classList.contains("is-closing"))
      return;
    menu.classList.remove("is-open");
    menu.classList.add("is-closing");
    setTimeout(() => {
      menu.removeAttribute("open");
      menu.classList.remove("is-closing");
    }, 150);
  };
  const openMenu = (menu) => {
    menu.classList.remove("is-closing");
    menu.setAttribute("open", "");
    requestAnimationFrame(() => {
      menu.classList.add("is-open");
    });
  };

  menus.forEach((menu) => {
    const summary = menu.querySelector("summary");
    if (summary) {
      summary.addEventListener("click", (e) => {
        e.preventDefault();
        if (
          menu.hasAttribute("open") &&
          !menu.classList.contains("is-closing")
        ) {
          closeMenu(menu);
        } else {
          menus.forEach((other) => other !== menu && closeMenu(other));
          openMenu(menu);
        }
      });
    }
    menu
      .querySelectorAll(".btn-menu__panel button")
      .forEach((btn) => btn.addEventListener("click", () => closeMenu(menu)));
  });
  document.addEventListener("click", (e) => {
    menus.forEach((menu) => {
      if (menu.hasAttribute("open") && !menu.contains(e.target)) {
        closeMenu(menu);
      }
    });
  });
};

window.addEventListener("DOMContentLoaded", initBtnMenus);
