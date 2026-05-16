(function () {
  "use strict";

  const slides = window.TF_SLIDES || [];
  const app = document.getElementById("tf-app");

  if (!app || !slides.length) return;

  let current = 0;
  let isAnimating = false;
  let scrollTimer = null;
  let lastWheelTime = 0;
  let touchStartY = null;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function pad(i) {
    return String(i).padStart(2, "0");
  }

  function getMaxScroll() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function getScrollForIndex(index) {
    const maxScroll = getMaxScroll();
    const maxIndex = Math.max(1, slides.length - 1);
    return (index / maxIndex) * maxScroll;
  }

  function getIndexFromScroll() {
    const maxScroll = getMaxScroll();
    const progress = clamp(window.scrollY / maxScroll, 0, 1);
    return Math.round(progress * (slides.length - 1));
  }

  function buildSlide(slide, index) {
    const el = document.createElement("section");
    el.className = "tf-slide";
    el.dataset.index = String(index);
    el.dataset.theme = slide.theme || "black";

    const headline = (slide.headline || [])
      .map(function (line) {
        return '<span class="tf-hline"><span class="tf-hin">' + line + "</span></span>";
      })
      .join("");

    el.innerHTML =
      '<div class="tf-slide-content">' +
        '<div class="tf-eyebrow">' + (slide.eyebrow || pad(index)) + "</div>" +
        '<h1 class="tf-headline">' + headline + "</h1>" +
        '<p class="tf-subcopy">' + (slide.sub || "") + "</p>" +
      "</div>";

    return el;
  }

  function buildMenu() {
    return slides.map(function (slide, index) {
      return (
        '<button class="tf-menu-item" data-go="' + index + '">' +
          '<span class="tf-menu-index">' + pad(index) + "</span>" +
          '<span class="tf-menu-title">' + (slide.chapter || slide.id || pad(index)) + "</span>" +
        "</button>"
      );
    }).join("");
  }

  function render() {
    app.innerHTML =
      '<div class="tf-stage">' +
        '<div class="tf-bg-grid"></div>' +
        '<div class="tf-vignette"></div>' +

        '<div class="tf-topbar">' +
          '<div class="tf-logo">T<span class="tf-logo-dot">•</span>F</div>' +
        "</div>" +

        '<div class="tf-chapter-track">' +
          '<div class="tf-track-line"></div>' +
          '<div class="tf-track-fill"></div>' +
          '<div class="tf-track-dot"></div>' +
          '<div class="tf-track-label"></div>' +
        "</div>" +

        '<button class="tf-menu-btn" type="button" aria-label="Open menu">' +
          "<span></span><span></span><span></span>" +
        "</button>" +

        '<div class="tf-menu-overlay">' +
          '<div class="tf-menu-list">' + buildMenu() + "</div>" +
        "</div>" +

        '<div class="tf-arrows">' +
          '<button class="tf-arrow tf-arrow-up" type="button" aria-label="Previous slide">' +
            '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>' +
          "</button>" +
          '<button class="tf-arrow tf-arrow-down" type="button" aria-label="Next slide">' +
            '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>' +
          "</button>" +
        "</div>" +
      "</div>";

    const stage = app.querySelector(".tf-stage");

    slides.forEach(function (slide, index) {
      stage.appendChild(buildSlide(slide, index));
    });

    bindEvents();
    update(0, false);
  }

  function update(index, shouldScroll) {
    const next = clamp(index, 0, slides.length - 1);
    current = next;

    const slideEls = app.querySelectorAll(".tf-slide");
    slideEls.forEach(function (el, i) {
      if (i === current) {
        el.classList.remove("is-active");
        void el.offsetWidth;
        el.classList.add("is-active");
      } else {
        el.classList.remove("is-active");
      }
    });

    const progress = slides.length <= 1 ? 0 : (current / (slides.length - 1)) * 100;

    const fill = app.querySelector(".tf-track-fill");
    const dot = app.querySelector(".tf-track-dot");
    const label = app.querySelector(".tf-track-label");

    if (fill) fill.style.width = progress + "%";
    if (dot) dot.style.left = progress + "%";
    if (label) {
      label.style.left = progress + "%";
      label.textContent = slides[current].chapter || slides[current].id || pad(current);
    }

    const up = app.querySelector(".tf-arrow-up");
    const down = app.querySelector(".tf-arrow-down");

    if (up) up.classList.toggle("is-disabled", current === 0);
    if (down) down.classList.toggle("is-disabled", current === slides.length - 1);

    const menuItems = app.querySelectorAll(".tf-menu-item");
    menuItems.forEach(function (item, i) {
      item.classList.toggle("is-active", i === current);
    });

    if (shouldScroll) {
      isAnimating = true;
      window.scrollTo({
        top: getScrollForIndex(current),
        behavior: "smooth"
      });
      window.setTimeout(function () {
        isAnimating = false;
      }, 620);
    }
  }

  function goToSlide(index) {
    update(index, true);
  }

  function nextSlide() {
    goToSlide(current + 1);
  }

  function prevSlide() {
    goToSlide(current - 1);
  }

  function toggleMenu(force) {
    const open = typeof force === "boolean" ? force : !app.classList.contains("tf-menu-open");
    app.classList.toggle("tf-menu-open", open);
  }

  function bindEvents() {
    const up = app.querySelector(".tf-arrow-up");
    const down = app.querySelector(".tf-arrow-down");
    const menuBtn = app.querySelector(".tf-menu-btn");

    if (up) up.addEventListener("click", prevSlide);
    if (down) down.addEventListener("click", nextSlide);
    if (menuBtn) menuBtn.addEventListener("click", function () { toggleMenu(); });

    app.querySelectorAll(".tf-menu-item").forEach(function (item) {
      item.addEventListener("click", function () {
        const index = Number(this.dataset.go);
        toggleMenu(false);
        goToSlide(index);
      });
    });

    window.addEventListener("keydown", function (e) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Escape") {
        toggleMenu(false);
        return;
      }

      if (app.classList.contains("tf-menu-open")) return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      }

      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        prevSlide();
      }

      if (e.key === "Home") {
        e.preventDefault();
        goToSlide(0);
      }

      if (e.key === "End") {
        e.preventDefault();
        goToSlide(slides.length - 1);
      }
    });

    window.addEventListener("wheel", function (e) {
      if (app.classList.contains("tf-menu-open")) return;

      const now = Date.now();
      if (now - lastWheelTime < 720) {
        e.preventDefault();
        return;
      }

      if (Math.abs(e.deltaY) < 18) return;

      e.preventDefault();
      lastWheelTime = now;

      if (e.deltaY > 0) nextSlide();
      else prevSlide();
    }, { passive: false });

    window.addEventListener("touchstart", function (e) {
      if (!e.touches || !e.touches.length) return;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener("touchend", function (e) {
      if (touchStartY === null) return;
      if (!e.changedTouches || !e.changedTouches.length) return;

      const dy = touchStartY - e.changedTouches[0].clientY;
      touchStartY = null;

      if (Math.abs(dy) < 42) return;
      if (dy > 0) nextSlide();
      else prevSlide();
    }, { passive: true });

    window.addEventListener("scroll", function () {
      if (isAnimating) return;

      clearTimeout(scrollTimer);

      scrollTimer = window.setTimeout(function () {
        const index = getIndexFromScroll();
        if (index !== current) {
          update(index, false);
        }

        window.scrollTo({
          top: getScrollForIndex(index),
          behavior: "smooth"
        });
      }, 120);
    }, { passive: true });

    window.addEventListener("resize", function () {
      window.scrollTo({
        top: getScrollForIndex(current),
        behavior: "auto"
      });
    });
  }

  render();
})();
