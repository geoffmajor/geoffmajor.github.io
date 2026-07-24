(() => {
  "use strict";

  // Keep footer year current without manual edits.
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Contact form: lightweight client-side validation + async submit.
  (function initContactForm() {
    const form = document.getElementById("contact-form");
    const statusEl = document.getElementById("form-status");
    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;

    // Exit early if markup is incomplete.
    if (!form || !statusEl || !submitBtn || !btnText) return;

    let submitting = false;
    let clearStatusTimer = null;

    function setStatus(message, kind) {
      statusEl.textContent = message || "";
      statusEl.classList.remove("ok", "error");
      form.classList.remove("sent");

      if (kind) statusEl.classList.add(kind);
      if (kind === "ok") form.classList.add("sent");

      // Let success state linger briefly, then reset.
      if (clearStatusTimer) window.clearTimeout(clearStatusTimer);
      if (kind === "ok") {
        clearStatusTimer = window.setTimeout(() => {
          statusEl.textContent = "";
          statusEl.classList.remove("ok");
          form.classList.remove("sent");
        }, 6500);
      }
    }

    function setSubmitting(on) {
      submitting = on;
      submitBtn.disabled = on;
      submitBtn.classList.toggle("loading", on);
      btnText.textContent = on ? "Sending…" : "Send Message";
    }

    function setFieldError(fieldId, message) {
      const field = form.querySelector("#" + fieldId);
      const errEl = document.getElementById(fieldId + "-error");
      if (!field || !errEl) return;

      const hasError = Boolean(message);
      field.setAttribute("aria-invalid", hasError ? "true" : "false");
      errEl.textContent = message || "";
    }

    function clearFieldErrors() {
      setFieldError("name", "");
      setFieldError("email", "");
      setFieldError("message", "");
    }

    function focusFirstInvalid(fieldId) {
      if (!fieldId) return;

      const el = form.querySelector("#" + fieldId);
      if (!el) return;

      // Scroll invalid field into view below sticky header.
      const header = document.getElementById("site-header");
      const headerOffset = header ? header.getBoundingClientRect().height : 0;
      const extraPadding = 20;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset - extraPadding;

      // Respect reduced motion preferences.
      const shouldScrollSmooth = !window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.scrollTo({
        top: offsetPosition,
        behavior: shouldScrollSmooth ? "smooth" : "auto",
      });

      el.focus({ preventScroll: true });
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    // Clear field-level errors as the user fixes input.
    function maybeClearErrorOnInput(fieldId) {
      const field = form.querySelector("#" + fieldId);
      if (!field) return;

      if (field.getAttribute("aria-invalid") !== "true") return;

      const value = field.value.trim();

      if (fieldId === "email") {
        if (value && isValidEmail(value)) setFieldError("email", "");
      } else {
        if (value) setFieldError(fieldId, "");
      }

      const anyInvalid = ["name", "email", "message"].some(
        (id) =>
          form.querySelector("#" + id)?.getAttribute("aria-invalid") === "true",
      );
      if (!anyInvalid && statusEl.classList.contains("error")) setStatus("");
    }

    ["name", "email", "message"].forEach((id) => {
      const field = form.querySelector("#" + id);
      if (!field) return;
      field.addEventListener("input", () => maybeClearErrorOnInput(id));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitting) return;

      const nameEl = form.querySelector("#name");
      const emailEl = form.querySelector("#email");
      const messageEl = form.querySelector("#message");

      if (!nameEl || !emailEl || !messageEl) {
        setStatus(
          "Something went wrong. Please try again, or email me directly.",
          "error",
        );
        return;
      }

      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const message = messageEl.value.trim();

      clearFieldErrors();

      let firstInvalid = null;

      if (!name) {
        setFieldError("name", "Name is required.");
        firstInvalid = firstInvalid || "name";
      }

      if (!email) {
        setFieldError("email", "Email is required.");
        firstInvalid = firstInvalid || "email";
      } else if (!isValidEmail(email)) {
        setFieldError("email", "Please enter a valid email address.");
        firstInvalid = firstInvalid || "email";
      }

      if (!message) {
        setFieldError("message", "Message is required.");
        firstInvalid = firstInvalid || "message";
      }

      if (firstInvalid) {
        setStatus("Please review the highlighted fields.", "error");
        focusFirstInvalid(firstInvalid);
        return;
      }

      setStatus("");
      setSubmitting(true);

      try {
        const data = new FormData(form);
        const response = await fetch(form.action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          form.reset();
          clearFieldErrors();
          setStatus("✓ Thanks. Your message was sent.", "ok");
        } else {
          setStatus(
            "Something went wrong. Please try again, or email me directly.",
            "error",
          );
        }
      } catch (_err) {
        setStatus(
          "Network error. Please try again, or email me directly.",
          "error",
        );
      } finally {
        setSubmitting(false);
      }
    });
  })();

  // Reveal sections as they enter the viewport.
  (function initReveal() {
    const reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;

    // No observer support: render all sections in their final state.
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );

    reveals.forEach((el) => io.observe(el));
  })();

  // Sync header nav active state to scroll position.
  const headerEl = document.getElementById("site-header");

  const headerNavLinks = Array.from(document.querySelectorAll(".nav a"))
    .filter((a) => a.getAttribute("href")?.startsWith("#"))
    .filter((a) => !a.classList.contains("nav-cta"));

  const sections = headerNavLinks
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);

  function setActiveNav(id) {
    headerNavLinks.forEach((a) => {
      const match = id && a.getAttribute("href") === `#${id}`;
      a.classList.toggle("is-active", match);
      if (match) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }

  function syncHeaderHeightVar() {
    if (!headerEl) return;
    // Keep CSS anchor offset aligned to measured header height.
    document.documentElement.style.setProperty(
      "--header-h",
      `${Math.ceil(headerEl.getBoundingClientRect().height)}px`,
    );
  }

  function getHeaderOffset() {
    return headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;
  }

  // Activation line below the header that determines current section.
  function getActivationOffset() {
    const header = getHeaderOffset();
    const extra = Math.min(160, Math.round(window.innerHeight * 0.25));
    return header + extra;
  }

  function getActiveSectionId() {
    if (!sections.length) return null;

    const offset = getActivationOffset();

    // At the bottom, force the final section active.
    const nearBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4;
    if (nearBottom) return sections[sections.length - 1].id;

    // Preferred: section currently intersecting the activation line.
    for (let i = sections.length - 1; i >= 0; i--) {
      const rect = sections[i].getBoundingClientRect();
      if (rect.top <= offset && rect.bottom > offset) {
        return sections[i].id;
      }
    }

    // Fallback: most recent section whose top crossed the line.
    let lastPassed = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset) {
        lastPassed = section.id;
      }
    }

    return lastPassed;
  }

  // Lock active state briefly during anchor scrolling to prevent flicker.
  let lockedId = null;
  let lockUntil = 0;

  function lockActive(id, ms = 900) {
    lockedId = id;
    lockUntil = performance.now() + ms;
    setActiveNav(id);
  }

  function clearLock() {
    lockedId = null;
    lockUntil = 0;
  }

  function updateActiveFromScroll() {
    const now = performance.now();
    if (lockedId && now < lockUntil) {
      setActiveNav(lockedId);
      return;
    }

    lockedId = null;
    lockUntil = 0;

    setActiveNav(getActiveSectionId());
  }

  // Any manual interaction cancels the temporary lock.
  ["wheel", "touchstart", "keydown"].forEach((evt) => {
    window.addEventListener(evt, clearLock, { passive: true });
  });

  // Mark clicked section active immediately.
  headerNavLinks.forEach((a) => {
    a.addEventListener("click", () => {
      const href = a.getAttribute("href");
      const id = href ? href.slice(1) : "";
      if (id) lockActive(id, 900);
    });
  });

  // Throttle scroll/resize work to animation frames.
  let ticking = false;
  function onScrollOrResize(e) {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      // Recompute header height only on resize to avoid scroll jitter.
      if (e && e.type === "resize") {
        syncHeaderHeightVar();
      }
      updateActiveFromScroll();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);

  syncHeaderHeightVar();
  updateActiveFromScroll();
  window.setTimeout(() => {
    syncHeaderHeightVar();
    updateActiveFromScroll();
  }, 50);
  window.setTimeout(() => {
    syncHeaderHeightVar();
  }, 300);

  // Interactive demo: tabbed code view + simulated terminal run.
  (function initDemo() {
    const codeContentEl = document.getElementById("code-content");
    const runBtn = document.getElementById("run-test-btn");
    const termBody = document.getElementById("term-body");
    const tabContainer = document.querySelector(".demo-tabs");
    const codePanel = document.getElementById("code-panel");
    const demoStatus = document.getElementById("demo-status");

    if (!codeContentEl || !runBtn || !termBody || !tabContainer || !codePanel)
      return;

    // Demo content is static by design; render as trusted HTML snippets.
    const demoData = {
      command: "npx playwright test auth.spec.ts",
      files: [
        {
          id: "auth-spec",
          label: "auth.spec.ts",
          code: `
<span class="k">import</span> { test, expect } <span class="k">from</span> <span class="s">'@playwright/test'</span>;
<span class="k">import</span> { DashboardPage, ForgotPage, LoginPage } <span class="k">from</span> <span class="s">'./auth-pages'</span>;
<span class="k">import</span> { loginWithCredentials } <span class="k">from</span> <span class="s">'./auth-utils'</span>;

<span class="k">const</span> ROUTES = {
  login: <span class="s">'/login'</span>,
  dashboard: <span class="s">'/dashboard'</span>,
};

<span class="f">test</span>.<span class="f">describe</span>(<span class="s">'Authentication Workflows'</span>, () => {
  <span class="f">test</span>.<span class="f">beforeEach</span>(<span class="k">async</span> ({ page }) => {
    <span class="k">await</span> page.<span class="f">goto</span>(ROUTES.login);
  });

  <span class="f">test</span>(<span class="s">'admin login flow'</span>, <span class="k">async</span> ({ page }) => {
    <span class="k">const</span> dashboardPage = <span class="k">new</span> <span class="f">DashboardPage</span>(page);

    <span class="k">await</span> <span class="f">loginWithCredentials</span>(page);
    
    <span class="k">await</span> <span class="f">expect</span>(page).<span class="f">toHaveURL</span>(ROUTES.dashboard);
    <span class="k">await</span> <span class="f">expect</span>(dashboardPage.<span class="v">header</span>).<span class="f">toBeVisible</span>();

    <span class="k">await</span> <span class="f">test</span>.<span class="f">step</span>(<span class="s">'Visual regression - dashboard'</span>, <span class="k">async</span> () => {
      <span class="k">await</span> <span class="f">expect</span>(page).<span class="f">toHaveScreenshot</span>(<span class="s">'dashboard.png'</span>);
    });
  });

  <span class="f">test</span>(<span class="s">'reset password flow'</span>, <span class="k">async</span> ({ page }) => {
    <span class="k">const</span> loginPage = <span class="k">new</span> <span class="f">LoginPage</span>(page);
    <span class="k">const</span> forgotPage = <span class="k">new</span> <span class="f">ForgotPage</span>(page);

    <span class="k">await</span> loginPage.<span class="v">forgotLink</span>.<span class="f">click</span>();
    <span class="k">await</span> forgotPage.<span class="f">requestReset</span>(<span class="s">'user@example.com'</span>);
    
    <span class="k">await</span> <span class="f">expect</span>(forgotPage.<span class="v">successMessage</span>).<span class="f">toBeVisible</span>();
  });
});
`,
        },
        {
          id: "auth-pages",
          label: "auth-pages.ts",
          code: `
<span class="k">import</span> { Locator, Page } <span class="k">from</span> <span class="s">'@playwright/test'</span>;

<span class="c">/**
 * Encapsulates login page interactions and locators.
 * Uses strict ARIA-based selection for resilience.
 */</span>
<span class="k">export class</span> <span class="f">LoginPage</span> {
  <span class="v">readonly</span> email: Locator;
  <span class="v">readonly</span> pass: Locator;
  <span class="v">readonly</span> submit: Locator;
  <span class="v">readonly</span> forgotLink: Locator;

  <span class="k">constructor</span>(<span class="v">readonly</span> page: Page) {
    <span class="v">this</span>.email = page.<span class="f">getByLabel</span>(<span class="s">'Email'</span>);
    <span class="v">this</span>.pass = page.<span class="f">getByLabel</span>(<span class="s">'Password'</span>);
    <span class="v">this</span>.submit = page.<span class="f">getByRole</span>(<span class="s">'button'</span>, { name: <span class="s">'Log in'</span> });
    <span class="v">this</span>.forgotLink = page.<span class="f">getByText</span>(<span class="s">'Forgot Password?'</span>);
  }

  <span class="f">/** Fill credentials and submit the form. */</span>
  <span class="k">async</span> <span class="f">login</span>(email: string, pass: string): <span class="f">Promise</span>&lt;<span class="v">void</span>&gt; {
    <span class="k">await</span> <span class="v">this</span>.email.<span class="f">fill</span>(email);
    <span class="k">await</span> <span class="v">this</span>.pass.<span class="f">fill</span>(pass);
    <span class="k">await</span> <span class="v">this</span>.submit.<span class="f">click</span>();
  }
}

<span class="c">/**
 * Post-login dashboard view.
 */</span>
<span class="k">export class</span> <span class="f">DashboardPage</span> {
  <span class="v">readonly</span> header: Locator;

  <span class="k">constructor</span>(<span class="v">readonly</span> page: Page) {
    <span class="v">this</span>.header = page.<span class="f">getByRole</span>(<span class="s">'heading'</span>, { name: <span class="s">'Dashboard'</span> });
  }
}

<span class="c">/**
 * Reset password workflow.
 */</span>
<span class="k">export class</span> <span class="f">ForgotPage</span> {
  <span class="v">readonly</span> email: Locator;
  <span class="v">readonly</span> submit: Locator;
  <span class="v">readonly</span> successMessage: Locator;

  <span class="k">constructor</span>(<span class="v">readonly</span> page: Page) {
    <span class="v">this</span>.email = page.<span class="f">getByLabel</span>(<span class="s">'Email Address'</span>);
    <span class="v">this</span>.submit = page.<span class="f">getByRole</span>(<span class="s">'button'</span>, { name: <span class="s">'Send Link'</span> });
    <span class="v">this</span>.successMessage = page.<span class="f">getByText</span>(<span class="s">'Reset link sent'</span>);
  }

  <span class="f">/** Submit the password reset request. */</span>
  <span class="k">async</span> <span class="f">requestReset</span>(email: string): <span class="f">Promise</span>&lt;<span class="v">void</span>&gt; {
    <span class="k">await</span> <span class="v">this</span>.email.<span class="f">fill</span>(email);
    <span class="k">await</span> <span class="v">this</span>.submit.<span class="f">click</span>();
  }
}
`,
        },
        {
          id: "auth-utils",
          label: "auth-utils.ts",
          code: `
<span class="k">import</span> { Page } <span class="k">from</span> <span class="s">'@playwright/test'</span>;
<span class="k">import</span> { LoginPage } <span class="k">from</span> <span class="s">'./auth-pages'</span>;

<span class="k">const</span> DEFAULT_USER = {
  email: process.env.TEST_USER ?? <span class="s">'admin@example.com'</span>,
  pass: process.env.TEST_PASS ?? <span class="s">'secure-password'</span>
};

<span class="c">/**
 * Standardizes common auth flows to keep spec files focused.
 */</span>
<span class="k">export async function</span> <span class="f">loginWithCredentials</span>(page: Page): <span class="f">Promise</span>&lt;<span class="v">void</span>&gt; {
  <span class="k">const</span> loginPage = <span class="k">new</span> <span class="f">LoginPage</span>(page);
  <span class="k">await</span> loginPage.<span class="f">login</span>(DEFAULT_USER.email, DEFAULT_USER.pass);
}
`,
        },
      ],
      output: [
        {
          segments: [
            { className: "term-info", text: "Running 2 tests using 1 worker" },
          ],
          delay: 800,
        },
        {
          segments: [
            {
              className: "term-muted",
              text: "  1) [chromium] › auth.spec.ts:5 › Authentication › admin login flow",
            },
          ],
          delay: 900,
        },
        {
          segments: [
            { className: "term-success", text: "  ✓" },
            {
              className: "term-muted",
              text: " 1) [chromium] › auth.spec.ts:5 › Authentication › admin login flow (1.2s)",
            },
          ],
          delay: 100,
        },
        {
          segments: [
            {
              className: "term-muted",
              text: "  2) [chromium] › auth.spec.ts:14 › Authentication › reset password flow",
            },
          ],
          delay: 800,
        },
        {
          segments: [
            { className: "term-success", text: "  ✓" },
            {
              className: "term-muted",
              text: " 2) [chromium] › auth.spec.ts:14 › Authentication › reset password flow (0.8s)",
            },
          ],
          delay: 100,
        },
        { segments: [], delay: 50 },
        {
          segments: [
            { className: "term-success", text: "  2 passed" },
            { className: "term-muted", text: " (2.4s)" },
          ],
          delay: 50,
        },
      ],
    };

    let activeFileIndex = 0;
    let isRunning = false;

    function announceDemo(message) {
      if (demoStatus) demoStatus.textContent = message;
    }

    function createTabs() {
      tabContainer.replaceChildren();

      demoData.files.forEach((file, index) => {
        const btn = document.createElement("button");
        btn.className = `demo-tab ${index === activeFileIndex ? "active" : ""}`;
        btn.id = `demo-tab-${file.id}`;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", String(index === activeFileIndex));
        btn.setAttribute("aria-controls", "code-panel");
        btn.tabIndex = index === activeFileIndex ? 0 : -1;
        btn.textContent = file.label;

        btn.addEventListener("click", () => {
          setActiveTab(index, false);
        });

        tabContainer.appendChild(btn);
      });
    }

    function updateTabClasses(focusActive = false) {
      const tabs = tabContainer.querySelectorAll(".demo-tab");
      tabs.forEach((tab, index) => {
        const isActive = index === activeFileIndex;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        if (isActive && focusActive) tab.focus();
      });
    }

    function setActiveTab(index, focusActive) {
      if (index < 0 || index >= demoData.files.length) return;
      activeFileIndex = index;
      updateTabClasses(focusActive);
      renderCode();
    }

    function handleTabKeydown(e) {
      const target = e.target;
      if (
        !(target instanceof HTMLElement) ||
        !target.classList.contains("demo-tab")
      )
        return;

      const count = demoData.files.length;
      if (!count) return;

      let nextIndex = activeFileIndex;
      if (e.key === "ArrowRight") nextIndex = (activeFileIndex + 1) % count;
      else if (e.key === "ArrowLeft")
        nextIndex = (activeFileIndex - 1 + count) % count;
      else if (e.key === "Home") nextIndex = 0;
      else if (e.key === "End") nextIndex = count - 1;
      else return;

      e.preventDefault();
      setActiveTab(nextIndex, true);
    }

    function renderCode() {
      const file = demoData.files[activeFileIndex];
      if (!file) return;
      codeContentEl.innerHTML = file.code.trim();
      codePanel.setAttribute("aria-labelledby", `demo-tab-${file.id}`);
    }

    // Terminal typing effect.
    async function typeText(text, element, delay = 30) {
      for (const char of text) {
        element.textContent += char;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    function createPromptLine(withCursor = true) {
      const line = document.createElement("div");
      line.className = "term-line";

      const prompt = document.createElement("span");
      prompt.className = "term-prompt";
      prompt.textContent = "$";
      line.appendChild(prompt);

      line.appendChild(document.createTextNode(" "));
      if (withCursor) {
        const cursor = document.createElement("span");
        cursor.className = "term-cursor";
        line.appendChild(cursor);
      }
      return line;
    }

    function resetTerminal() {
      termBody.replaceChildren(createPromptLine(true));
    }

    async function runTerminal() {
      if (isRunning) return;
      isRunning = true;
      runBtn.disabled = true;

      const btnLabel = runBtn.querySelector(".btn-label");
      if (btnLabel) btnLabel.textContent = "Running...";
      runBtn.setAttribute("aria-label", "Running suite...");
      announceDemo("Running demo test suite.");

      // Keep terminal in view on smaller screens.
      if (window.innerWidth < 768) {
        const shouldScrollSmooth = !window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        termBody.scrollIntoView({
          behavior: shouldScrollSmooth ? "smooth" : "auto",
          block: "center",
        });
      }

      resetTerminal();

      const lines = termBody.querySelectorAll(".term-line");
      const activeLine = lines[lines.length - 1];
      const cursor = activeLine.querySelector(".term-cursor");

      if (cursor) cursor.remove();

      const cmdSpan = document.createElement("span");
      activeLine.appendChild(cmdSpan);
      await typeText(demoData.command, cmdSpan, 40);

      if (cursor) activeLine.appendChild(cursor);
      await new Promise((r) => setTimeout(r, 600));

      const addLine = (segments, delay = 100) => {
        return new Promise((resolve) => {
          const currentCursor = termBody.querySelector(".term-cursor");
          if (currentCursor) currentCursor.remove();

          const div = document.createElement("div");
          div.className = "term-line";

          for (const segment of segments) {
            const span = document.createElement("span");
            if (segment.className) span.className = segment.className;
            span.textContent = segment.text;
            div.appendChild(span);
          }

          termBody.appendChild(div);

          termBody.scrollTop = termBody.scrollHeight;

          setTimeout(resolve, delay);
        });
      };

      for (const line of demoData.output) {
        await addLine(line.segments, line.delay);
      }

      termBody.appendChild(createPromptLine(true));
      termBody.scrollTop = termBody.scrollHeight;

      isRunning = false;
      runBtn.disabled = false;
      runBtn.setAttribute("aria-label", "Run test suite");
      announceDemo("Demo test suite completed. 2 tests passed.");
      if (btnLabel) btnLabel.textContent = "Run Again";
    }

    runBtn.addEventListener("click", runTerminal);
    tabContainer.addEventListener("keydown", handleTabKeydown);

    createTabs();
    renderCode();
  })();
})();
