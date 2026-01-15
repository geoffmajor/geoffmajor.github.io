// main.js

(() => {
  "use strict";

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Contact form: prevent double submit + show status
  (function initContactForm() {
    const form = document.getElementById("contact-form");
    const statusEl = document.getElementById("form-status");
    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;

    // If any critical element is missing, fail gracefully.
    if (!form || !statusEl || !submitBtn || !btnText) return;

    let submitting = false;
    let clearStatusTimer = null;

    function setStatus(message, kind) {
      statusEl.textContent = message || "";
      statusEl.classList.remove("ok", "error");
      form.classList.remove("sent");

      if (kind) statusEl.classList.add(kind);
      if (kind === "ok") form.classList.add("sent");

      // Auto-clear success message after a bit (keeps UI feeling "done")
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

      // Calculate the position to scroll to
      const header = document.getElementById("site-header");
      const headerOffset = header ? header.getBoundingClientRect().height : 0;
      const extraPadding = 20; // Extra breathing room
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset - extraPadding;

      // Smooth scroll (respecting user preference)
      const shouldScrollSmooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      window.scrollTo({
        top: offsetPosition,
        behavior: shouldScrollSmooth ? "smooth" : "auto"
      });

      // Focus without disrupting the scroll (prevent jump)
      el.focus({ preventScroll: true });
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    // If a field is currently invalid, re-check on input so errors clear immediately
    function maybeClearErrorOnInput(fieldId) {
      const field = form.querySelector("#" + fieldId);
      if (!field) return;

      // Only do work if the field is currently marked invalid
      if (field.getAttribute("aria-invalid") !== "true") return;

      const value = field.value.trim();

      if (fieldId === "email") {
        if (value && isValidEmail(value)) setFieldError("email", "");
      } else {
        if (value) setFieldError(fieldId, "");
      }

      // If the form-wide error banner is showing and all fields are now valid, clear it
      const anyInvalid = ["name", "email", "message"].some(
        (id) => form.querySelector("#" + id)?.getAttribute("aria-invalid") === "true"
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

      // If the DOM changes and fields go missing, bail out cleanly.
      if (!nameEl || !emailEl || !messageEl) {
        setStatus("Something went wrong. Please try again, or email me directly.", "error");
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
          headers: { Accept: "application/json" }
        });

        if (response.ok) {
          form.reset();
          clearFieldErrors();
          setStatus("✓ Thanks. Your message was sent.", "ok");
        } else {
          setStatus("Something went wrong. Please try again, or email me directly.", "error");
        }
      } catch (_err) {
        setStatus("Network error. Please try again, or email me directly.", "error");
      } finally {
        setSubmitting(false);
      }
    });
  })();

  // Reveal on scroll
  (function initReveal() {
    const reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;

    // If IntersectionObserver is not supported, just reveal everything.
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
      { threshold: 0.12 }
    );

    reveals.forEach((el) => io.observe(el));
  })();

  // Header nav: highlight active section (stable + predictable)
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
    // Keep CSS scroll offsets in sync with the actual sticky header height
    document.documentElement.style.setProperty(
      "--header-h",
      `${Math.ceil(headerEl.getBoundingClientRect().height)}px`
    );
  }

  function getHeaderOffset() {
    return headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;
  }

  // “Activation line” (below the header). Bigger = activates next section earlier.
  function getActivationOffset() {
    const header = getHeaderOffset();
    const extra = Math.min(160, Math.round(window.innerHeight * 0.25));
    return header + extra;
  }

  function getActiveSectionId() {
    if (!sections.length) return null;

    const offset = getActivationOffset();

    // Bottom of page: force last section active
    const nearBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (nearBottom) return sections[sections.length - 1].id;

    // 1) Preferred: section that actually contains the activation line
    for (let i = sections.length - 1; i >= 0; i--) {
      const rect = sections[i].getBoundingClientRect();
      if (rect.top <= offset && rect.bottom > offset) {
        return sections[i].id;
      }
    }

    // 2) Fallback: last section whose top has crossed the activation line
    let lastPassed = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset) {
        lastPassed = section.id;
      }
    }

    return lastPassed;
  }

  // Lock active state during programmatic (nav) scroll so it doesn’t flicker
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
      // Stay locked unless user interrupted
      setActiveNav(lockedId);
      return;
    }

    lockedId = null;
    lockUntil = 0;

    setActiveNav(getActiveSectionId());
  }

  // Clear the lock if the user manually scrolls/interrupts
  ["wheel", "touchstart", "keydown"].forEach((evt) => {
    window.addEventListener(evt, clearLock, { passive: true });
  });

  // On nav click: set active immediately + lock while smooth scroll runs
  headerNavLinks.forEach((a) => {
    a.addEventListener("click", () => {
      const href = a.getAttribute("href");
      const id = href ? href.slice(1) : "";
      if (id) lockActive(id, 900);
    });
  });

  // Throttle with requestAnimationFrame
  let ticking = false;
  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      syncHeaderHeightVar();
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
})();
