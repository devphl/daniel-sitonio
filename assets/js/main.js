/*
 * scripts principais do site Daniel Sitônio Advocacia
 *
 * Este arquivo reúne as funcionalidades de interação e animação em um único local,
 * facilitando a manutenção e melhorando a performance ao evitar trechos de
 * JavaScript espalhados pelo CSS. Todas as funções são carregadas quando o
 * documento é totalmente parseado e pronto (DOMContentLoaded).
 */

/* Seletores utilitários */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* Throttle simples para eventos de rolagem/redimensionamento */
function throttle(fn, wait = 100) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}

/* Menu mobile acessível */
function initMobileMenu() {
  const toggle = $(".menu-toggle");
  const menu = $("#menu");
  if (!toggle || !menu) return;

  const close = () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener(
    "click",
    () => {
      const isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    },
    { passive: true }
  );

  $$("#menu a").forEach((a) => a.addEventListener("click", close, { passive: true }));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) close();
  });
  window.addEventListener(
    "resize",
    throttle(() => {
      if (window.innerWidth > 920) close();
    }, 150),
    { passive: true }
  );
}

/* Destaca o link de navegação ativo conforme a rolagem */
function initActiveLinkHighlight() {
  const links = $$("#menu a[href^='#']");
  if (!links.length) return;

  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);

  const setActive = () => {
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 80;
    const y = window.scrollY + navH + 60;
    let idx = 0;
    sections.forEach((sec, i) => {
      if (sec.offsetTop <= y) idx = i;
    });
    links.forEach((a, i) => {
      const isActive = i === idx;
      a.classList.toggle("active", isActive);
      if (isActive) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  };

  window.addEventListener("scroll", throttle(setActive, 100), { passive: true });
  setActive();
}

/* Rotator A11y: sincroniza o texto lido por leitores de tela com a animação */
function initRotatorA11y() {
  const reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sr = $("#sr-rotator");
  const slides = $$(".rotator-block .slide");
  if (!sr || !slides.length) return;

  if (reduce) {
    const v = $(".hero-video");
    if (v) {
      v.removeAttribute("autoplay");
      v.removeAttribute("loop");
      try {
        v.pause();
      } catch (err) {
        /* noop */
      }
    }
    return;
  }

  let i = 0;
  setInterval(() => {
    const slide = slides[i % slides.length];
    const term = $(".term", slide)?.textContent?.trim() || "";
    const def = $(".definition", slide)?.textContent?.trim() || "";
    sr.textContent = `${term} — ${def}`;
    i++;
  }, 4000);
}

/* Revela elementos ao rolar usando IntersectionObserver */
function initRevealOnScroll() {
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const els = $$(".reveal");
  if (!("IntersectionObserver" in window) || !els.length) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.18 }
  );

  els.forEach((el) => io.observe(el));
}

/* Acordeão de seleção única para missão/visão/valores */
function initAccordion() {
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
    btn.addEventListener("click", () => {
      toggleItem();
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleItem();
      }
    });
  });
}

/* Alterna transparência do cabeçalho ao sair da hero */
function initHeaderTransparency() {
  const header = document.querySelector(".site-header");
  const hero = document.querySelector("#home");
  if (!header || !hero) return;

  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;left:0;right:0;bottom:-1px;height:1px;";

  if (getComputedStyle(hero).position === "static") hero.style.position = "relative";
  hero.appendChild(sentinel);

  const toggle = (offHome) => header.classList.toggle("is-translucent", offHome);

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(([entry]) => {
      toggle(!entry.isIntersecting);
    }, { threshold: 0 });
    io.observe(sentinel);
  } else {
    const onScroll = () => {
      const headerH = header.offsetHeight || 80;
      const heroBottom = hero.getBoundingClientRect().bottom;
      toggle(heroBottom <= headerH);
    };
    onScroll();
    window.addEventListener("scroll", throttle(onScroll, 100), { passive: true });
    window.addEventListener("resize", throttle(onScroll, 150), { passive: true });
  }
}

/* Contador animado */
function initMetricsCounter() {
  const section = document.querySelector("#numeros");
  if (!section) return;

  const counters = Array.from(section.querySelectorAll(".count"));
  if (!counters.length) return;

  const reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    const io = new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) {
        runAll();
        obs.disconnect();
      }
    }, { threshold: 0.35 });
    io.observe(section);
  } else {
    runAll();
  }
}

/* Carrossel de depoimentos com paginação e autoplay */
function initTestimonials() {
  const track = document.querySelector(".testi-track");
  const dots = Array.from(document.querySelectorAll(".testi-dots .dot"));
  if (!track || !dots.length) return;

  const pages = Array.from(track.children);

  const scrollToPage = (i) => {
    const page = pages[i];
    if (!page) return;
    track.scrollTo({ left: page.offsetLeft, behavior: "smooth" });
  };

  const update = () => {
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
  track.addEventListener("scroll", throttle(update, 80), { passive: true });
  window.addEventListener("resize", throttle(update, 120), { passive: true });
  update();

  let autoTimer = setInterval(() => {
    const activeIdx = dots.findIndex((d) => d.classList.contains("is-active"));
    const nextIdx = (activeIdx + 1) % pages.length;
    scrollToPage(nextIdx);
  }, 8000);

  const clearAuto = () => clearInterval(autoTimer);
  const restartAuto = () => {
    clearAuto();
    autoTimer = setInterval(() => {
      const activeIdx = dots.findIndex((d) => d.classList.contains("is-active"));
      const nextIdx = (activeIdx + 1) % pages.length;
      scrollToPage(nextIdx);
    }, 8000);
  };

  track.addEventListener("pointerenter", clearAuto);
  track.addEventListener("pointerleave", restartAuto);
}

/* Inicialização */
document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initActiveLinkHighlight();
  initRotatorA11y();
  initRevealOnScroll();
  initAccordion();
  initHeaderTransparency();
  initMetricsCounter();
  initTestimonials();
});