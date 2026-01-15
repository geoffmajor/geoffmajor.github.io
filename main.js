// main.js

document.getElementById("year").textContent = new Date().getFullYear();

      // Form: prevent double submit + show status (and spinner)
      const form = document.getElementById("contact-form");
      const statusEl = document.getElementById("form-status");
      const submitBtn = document.getElementById("submit-btn");
      const btnText = submitBtn.querySelector(".btn-text");

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
        if (el) el.focus();
      }

      function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (submitting) return;

        const name = form.querySelector("#name").value.trim();
        const email = form.querySelector("#email").value.trim();
        const message = form.querySelector("#message").value.trim();

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
        } catch (err) {
          setStatus("Network error. Please try again, or email me directly.", "error");
        } finally {
          setSubmitting(false);
        }
      });

      // Reveal on scroll
      const reveals = document.querySelectorAll(".reveal");
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
        document.documentElement.style.setProperty("--header-h", `${Math.ceil(headerEl.getBoundingClientRect().height)}px`);
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
          const id = a.getAttribute("href").slice(1);
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
