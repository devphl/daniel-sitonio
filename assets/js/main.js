/**
 * Main application scripts for Daniel Sitônio Advocacia
 *
 * Organizes interactions, accessibility (a11y), animations, and forms logic.
 * Adheres to modern Javascript best practices (ES6+), maximizing modularity
 * and performance without requiring a build step.
 */

"use strict";

const App = (function () {
  /**
   * Utility to safely select an element.
   * @param {string} sel - The CSS selector.
   * @param {Document|Element} ctx - The context.
   * @returns {HTMLElement|null}
   */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  /**
   * Utility to safely select multiple elements.
   * @param {string} sel - The CSS selector.
   * @param {Document|Element} ctx - The context.
   * @returns {HTMLElement[]}
   */
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /**
   * Restricts the rate at which a function is executed.
   * @param {Function} fn - The function to throttle.
   * @param {number} wait - Time in ms to wait.
   * @returns {Function}
   */
  const throttle = (fn, wait = 100) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn(...args);
      }
    };
  };

  /**
   * Determines if the user prefers reduced motion for animations.
   * @returns {boolean}
   */
  const prefersReducedMotion = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * Initializes mobile navigation menu and its accessibility traits.
   */
  const initMobileMenu = () => {
    const toggle = $(".menu-toggle");
    const menu = $("#menu");
    if (!toggle || !menu) return;

    const closeMenu = () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener(
      "click",
      () => {
        const isOpen = menu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      },
      { passive: true },
    );

    $$("#menu a").forEach((a) => {
      a.addEventListener("click", closeMenu, { passive: true });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });

    window.addEventListener(
      "resize",
      throttle(() => {
        if (window.innerWidth > 920) closeMenu();
      }, 150),
      { passive: true },
    );
  };

  /**
   * Highlights the active navigation link based on the scroll position.
   */
  const initActiveLinkHighlight = () => {
    const links = $$("#menu a[href^='#']");
    if (!links.length) return;

    const sections = links
      .map((a) => {
        const target = $(a.getAttribute("href"));
        return target ? { link: a, target } : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    const setActive = () => {
      const navH =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-h",
          ),
        ) || 80;
      const scrollPos = window.scrollY + navH + 60;

      let activeIndex = 0;
      sections.forEach((sec, i) => {
        if (sec.target.offsetTop <= scrollPos) activeIndex = i;
      });

      sections.forEach((sec, i) => {
        const isActive = i === activeIndex;
        sec.link.classList.toggle("active", isActive);
        if (isActive) {
          sec.link.setAttribute("aria-current", "page");
        } else {
          sec.link.removeAttribute("aria-current");
        }
      });
    };

    window.addEventListener("scroll", throttle(setActive, 100), {
      passive: true,
    });
    setActive();
  };

  /**
   * Updates text for Screen Readers in sync with the visual hero rotator.
   */
  const initRotatorA11y = () => {
    const reduce = prefersReducedMotion();
    const sr = $("#sr-rotator");
    const slides = $$(".rotator-block .slide");

    if (!sr || !slides.length) return;

    if (reduce) {
      const video = $(".hero-video");
      if (video) {
        video.removeAttribute("autoplay");
        video.removeAttribute("loop");
        try {
          video.pause();
        } catch (err) {}
      }
      return;
    }

    let currentSlide = 0;
    setInterval(() => {
      const slide = slides[currentSlide % slides.length];
      const term = $(".term", slide)?.textContent?.trim() || "";
      const def = $(".definition", slide)?.textContent?.trim() || "";
      sr.textContent = `${term} — ${def}`;
      currentSlide++;
    }, 4000);
  };

  /**
   * Reveals elements incrementally on scroll.
   */
  const initRevealOnScroll = () => {
    if (prefersReducedMotion()) return;

    const els = $$(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.18 },
    );

    els.forEach((el) => observer.observe(el));
  };

  /**
   * Initializes accordion panels ensuring accessibility best practices.
   */
  const initAccordion = () => {
    const items = $$(".accordion .item");
    if (!items.length) return;

    items.forEach((item) => {
      const btn = $(".trigger", item);
      const panel = $(".answer", item);
      if (!btn || !panel) return;

      const toggleItem = () => {
        const isOpen = item.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(isOpen));
        panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : "0px";

        // Close others
        items.forEach((other) => {
          if (other !== item) {
            other.classList.remove("open");
            const b = $(".trigger", other);
            const p = $(".answer", other);
            if (b) b.setAttribute("aria-expanded", "false");
            if (p) p.style.maxHeight = "0px";
          }
        });
      };

      btn.addEventListener("click", toggleItem);
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleItem();
        }
      });
    });
  };

  /**
   * Controls the background styling of the sticky header on scroll.
   */
  const initHeaderTransparency = () => {
    const header = $(".site-header");
    const hero = $("#home");
    if (!header || !hero) return;

    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText =
      "position:absolute;left:0;right:0;bottom:-1px;height:1px;";

    if (getComputedStyle(hero).position === "static") {
      hero.style.position = "relative";
    }
    hero.appendChild(sentinel);

    const toggle = (offHome) =>
      header.classList.toggle("is-translucent", offHome);

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          toggle(!entry.isIntersecting);
        },
        { threshold: 0 },
      );
      observer.observe(sentinel);
    } else {
      const onScroll = () => {
        const headerH = header.offsetHeight || 80;
        const heroBottom = hero.getBoundingClientRect().bottom;
        toggle(heroBottom <= headerH);
      };
      window.addEventListener("scroll", throttle(onScroll, 100), {
        passive: true,
      });
      onScroll();
    }
  };

  /**
   * Animates numeric values incrementally on intersection.
   */
  const initMetricsCounter = () => {
    const section = $("#numeros");
    if (!section) return;

    const counters = $$(".count", section);
    if (!counters.length) return;

    const reduceMotion = prefersReducedMotion();

    const animate = (el) => {
      const end = parseInt(el.dataset.to || "0", 10);
      if (!Number.isFinite(end)) return;
      if (reduceMotion) {
        el.textContent = end.toLocaleString("pt-BR");
        return;
      }

      const duration = Math.min(1600, 600 + String(end).length * 300);
      const start = 0;
      const t0 = performance.now();

      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const value = Math.round(start + (end - start) * eased);
        el.textContent = value.toLocaleString("pt-BR");
        if (p < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const runAll = () => counters.forEach(animate);

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          if (entries.some((e) => e.isIntersecting)) {
            runAll();
            obs.disconnect();
          }
        },
        { threshold: 0.35 },
      );
      observer.observe(section);
    } else {
      runAll();
    }
  };

  /**
   * Prepares and initializes the auto-scrolling testimonial track.
   */
  const initTestimonials = () => {
    const track = $(".testi-track");
    const dots = $$(".testi-dots .dot");
    if (!track || !dots.length) return;

    const pages = Array.from(track.children);

    const scrollToPage = (index) => {
      const page = pages[index];
      if (!page) return;
      track.scrollTo({ left: page.offsetLeft, behavior: "smooth" });
    };

    const updateActiveDot = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let active = 0;
      pages.forEach((p, i) => {
        if (p.offsetLeft <= mid) active = i;
      });
      dots.forEach((d, i) => {
        const isActive = i === active;
        d.classList.toggle("is-active", isActive);
        d.setAttribute("aria-selected", String(isActive));
      });
    };

    dots.forEach((d, i) => d.addEventListener("click", () => scrollToPage(i)));
    track.addEventListener("scroll", throttle(updateActiveDot, 80), {
      passive: true,
    });
    window.addEventListener("resize", throttle(updateActiveDot, 120), {
      passive: true,
    });
    updateActiveDot();

    const startAutoplay = () => {
      return setInterval(() => {
        const activeIdx = dots.findIndex((d) =>
          d.classList.contains("is-active"),
        );
        const nextIdx = (activeIdx + 1) % pages.length;
        scrollToPage(nextIdx);
      }, 8000);
    };

    let autoTimer = startAutoplay();

    track.addEventListener("pointerenter", () => clearInterval(autoTimer), {
      passive: true,
    });
    track.addEventListener(
      "pointerleave",
      () => {
        clearInterval(autoTimer);
        autoTimer = startAutoplay();
      },
      { passive: true },
    );
  };

  /**
   * Initializes the contact form logic, mapping data to WhatsApp.
   */
  const initContactForm = () => {
    const form = document.getElementById("contactForm");
    const feedback = document.getElementById("contactFeedback");
    if (!form || !feedback) return;

    // Contact number configured for redirection
    const WHATSAPP_NUMBER = "5583998004935";

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const inputs = {
        first: document.getElementById("first").value.trim(),
        last: document.getElementById("last").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        message: document.getElementById("message").value.trim(),
      };

      if (!inputs.first || !inputs.email || !inputs.phone) {
        alert("Por favor, preencha os campos obrigatórios.");
        return;
      }

      const text = `📩 *Contato pelo site*
👤 Nome: ${inputs.first} ${inputs.last}
📧 E-mail: ${inputs.email}
📞 Telefone: ${inputs.phone}
💬 Mensagem: ${inputs.message || "Não informada"}`;

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");

      feedback.textContent =
        "Você será redirecionado para o WhatsApp para concluir o envio.";
      form.reset(); // Optionally clear the form
    });
  };

  /**
   * Initializes the Team Carousel with infinite auto-scroll and drag support.
   */
  const initDynamicCarousel = () => {
    const track = document.getElementById("teamTrack");
    const wrapper = $(".team-carousel-wrapper");
    if (!track || !wrapper) return;

    // Clone items for infinite loop effect
    const originalItems = Array.from(track.children);

    // Duplicate twice to have enough buffer
    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      // Prevent image dragging on desktop
      const img = clone.querySelector("img");
      if (img) img.style.pointerEvents = "none";
      track.appendChild(clone);
    });

    // We clone a second set to ensure smoothest infinite scroll on large screens
    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      const img = clone.querySelector("img");
      if (img) img.style.pointerEvents = "none";
      track.appendChild(clone);
    });

    let x = 0;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let reqId;

    // Adjust speed here (higher = faster)
    const speed = 0.5;
    let singleSetWidth = 0;

    const calculateWidth = () => {
      const gap = parseFloat(getComputedStyle(track).gap) || 24;
      // Calculate width of one original set including gaps
      singleSetWidth = originalItems.reduce(
        (acc, item) => acc + item.offsetWidth + gap,
        0,
      );
    };

    const tick = () => {
      if (!isDown) {
        x -= speed;
        // Reset position to create infinite illusion
        if (Math.abs(x) >= singleSetWidth) {
          x += singleSetWidth;
        }
        track.style.transform = `translateX(${x}px)`;
      }
      reqId = requestAnimationFrame(tick);
    };

    const start = (e) => {
      isDown = true;
      startX = e.pageX || e.touches[0].pageX;
      scrollLeft = x;
      wrapper.style.cursor = "grabbing";
      // Cancel animation frame to prevent conflict during drag
      cancelAnimationFrame(reqId);
    };

    const end = () => {
      if (!isDown) return;
      isDown = false;
      wrapper.style.cursor = "grab";
      // Resume auto-scroll
      tick();
    };

    const move = (e) => {
      if (!isDown) return;

      const pageX = e.pageX || e.touches[0].pageX;
      const walk = pageX - startX;
      x = scrollLeft + walk;

      // Wrap around logic during drag
      if (x > 0) x -= singleSetWidth;
      if (Math.abs(x) >= singleSetWidth) x += singleSetWidth;

      track.style.transform = `translateX(${x}px)`;
    };

    wrapper.addEventListener("mousedown", start);
    wrapper.addEventListener("touchstart", start, { passive: true });

    wrapper.addEventListener("mouseleave", end);
    wrapper.addEventListener("mouseup", end);
    wrapper.addEventListener("touchend", end);

    wrapper.addEventListener("mousemove", move);
    // passive: false needed if we were preventing default, but we want to allow vertical scroll
    // so we use passive: true for performance unless we specifically want to block vertical
    wrapper.addEventListener("touchmove", move, { passive: true });

    window.addEventListener("resize", calculateWidth);

    if (document.readyState === "complete") {
      calculateWidth();
      tick();
    } else {
      window.addEventListener("load", () => {
        calculateWidth();
        tick();
      });
    }
  };

  // Public Initialization API
  return {
    init: () => {
      initMobileMenu();
      initActiveLinkHighlight();
      initRotatorA11y();
      initRevealOnScroll();
      initAccordion();
      initHeaderTransparency();
      initMetricsCounter();
      initTestimonials();
      initContactForm();
      initDynamicCarousel();
    },
  };
})();

// Bootstrap the application once DOM is entirely loaded
document.addEventListener("DOMContentLoaded", App.init);
