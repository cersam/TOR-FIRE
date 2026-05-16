(function () {
  "use strict";

  var slides = window.TF_SLIDES || [];
  var app = document.getElementById("tf-app");

  if (!app || !slides.length) return;

  var current = 0;
  var isAnimating = false;
  var lastWheelTime = 0;
  var scrollTimer = null;
  var touchStartY = null;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function pad(i) {
    return String(i).padStart(2, "0");
  }

  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === "string") el.textContent = text;
    return el;
  }

  function getMaxScroll() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function getScrollForIndex(index) {
    var maxScroll = getMaxScroll();
    var maxIndex = Math.max(1, slides.length - 1);
    return (index / maxIndex) * maxScroll;
  }

  function getIndexFromScroll() {
    var maxScroll = getMaxScroll();
    var progress = clamp(window.scrollY / maxScroll, 0, 1);
    return Math.round(progress * (slides.length - 1));
  }

  function buildSlide(slide, index) {
    var section = make("section", "tf-slide");
    section.dataset.index = String(index);
    section.dataset.theme = slide.theme || "black";

    var content = make("div", "tf-slide-content");

    var eyebrow = make("div", "tf-eyebrow", slide.eyebrow || pad(index));
    content.appendChild(eyebrow);

    var h1 = make("h1", "tf-headline");

    (slide.headline || []).forEach(function (line) {
      var outer = make("span", "tf-hline");
      var inner = make("span", "tf-hin", line);
      outer.appendChild(inner);
      h1.appendChild(outer);
    });

    content.appendChild(h1);

    var sub = make("p", "tf-subcopy", slide.sub || "");
    content.appendChild(sub);

    section.appendChild(content);
    return section;
  }

  function buildApp() {
    app.innerHTML = "";

    var stage = make("div", "tf-stage");

    stage.appendChild(make("div", "tf-bg-grid"));
    stage.appendChild(make("div", "tf-vignette"));

    var topbar = make("div", "tf-topbar");
    var logo = make("div", "tf-logo");
    logo.innerHTML = 'T<span class="tf-logo-dot">•</span>F';
    topbar.appendChild(logo);
    stage.appendChild(topbar);

    var track = make("div", "tf-chapter-track");
    track.appendChild(make("div", "tf-track-line"));
    track.appendChild(make("div", "tf-track-fill"));
    track.appendChild(make("div", "tf-track-dot"));
    track.appendChild(make("div", "tf-track-label"));
    stage.appendChild(track);

    var menuButton = make("button", "tf-menu-btn");
    menuButton.type = "button";
    menuButton.setAttribute("aria-label", "Open menu");
    menuButton.appendChild(make("span"));
    menuButton.appendChild(make("span"));
    menuButton.appendChild(make("span"));
    stage.appendChild(menuButton);

    var overlay = make("div", "tf-menu-overlay");
    var list = make("div", "tf-menu-list");

    slides.forEach(function (slide, index) {
      var item = make("button", "tf-menu-item");
      item.type = "button";
      item.dataset.go = String(index);

      item.appendChild(make("span", "tf-menu-index", pad(index)));
      item.appendChild(make("span", "tf-menu-title", slide.chapter || slide.id || pad(index)));

      list.appendChild(item);
    });

    overlay.appendChild(list);
    stage.appendChild(overlay);

    var arrows = make("div", "tf-arrows");

    var up = make("button", "tf-arrow tf-arrow-up", "↑");
    up.type = "button";
    up.setAttribute("aria-label", "Previous slide");

    var down = make("button", "tf-arrow tf-arrow-down", "↓");
    down.type = "button";
    down.setAttribute("aria-label", "Next slide");

    arrows.appendChild(up);
    arrows.appendChild(down);
    stage.appendChild(arrows);

    slides.forEach(function (slide, index) {
      stage.appendChild(buildSlide(slide, index));
    });

    app.appendChild(stage);

    bindEvents();
    update(0, false);
  }

  function update(index, shouldScroll) {
    current = clamp(index, 0, slides.length - 1);

    var slideEls = app.querySelectorAll(".tf-slide");

    slideEls.forEach(function (el, i) {
      if (i === current) {
        el.classList.remove("is-active");
        void el.offsetWidth;
        el.classList.add("is-active");
      } else {
        el.classList.remove("is-active");
      }
    });

    var progress = slides.length <= 1 ? 0 : (current / (slides.length - 1)) * 100;

    var fill = app.querySelector(".tf-track-fill");
    var dot = app.querySelector(".tf-track-dot");
    var label = app.querySelector(".tf-track-label");

    if (fill) fill.style.width = progress + "%";
    if (dot) dot.style.left = progress + "%";

    if (label) {
      label.style.left = progress + "%";
      label.textContent = slides[current].chapter || slides[current].id || pad(current);
    }

    var up = app.querySelector(".tf-arrow-up");
    var down = app.querySelector(".tf-arrow-down");

    if (up) up.classList.toggle("is-disabled", current === 0);
    if (down) down.classList.toggle("is-disabled", current === slides.length - 1);

    app.querySelectorAll(".tf-menu-item").forEach(function (item, i) {
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
    var open = typeof force === "boolean" ? force : !app.classList.contains("tf-menu-open");
    app.classList.toggle("tf-menu-open", open);
  }

  function bindEvents() {
    var up = app.querySelector(".tf-arrow-up");
    var down = app.querySelector(".tf-arrow-down");
    var menuButton = app.querySelector(".tf-menu-btn");

    if (up) up.addEventListener("click", prevSlide);
    if (down) down.addEventListener("click", nextSlide);
    if (menuButton) menuButton.addEventListener("click", function () { toggleMenu(); });

    app.querySelectorAll(".tf-menu-item").forEach(function (item) {
      item.addEventListener("click", function () {
        var index = Number(this.dataset.go);
        toggleMenu(false);
        goToSlide(index);
      });
    });

    window.addEventListener("keydown", function (e) {
      var tag = document.activeElement && document.activeElement.tagName;
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

      var now = Date.now();

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

      var dy = touchStartY - e.changedTouches[0].clientY;
      touchStartY = null;

      if (Math.abs(dy) < 42) return;

      if (dy > 0) nextSlide();
      else prevSlide();
    }, { passive: true });

    window.addEventListener("scroll", function () {
      if (isAnimating) return;

      clearTimeout(scrollTimer);

      scrollTimer = window.setTimeout(function () {
        var index = getIndexFromScroll();

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

  buildApp();
})();
