"use client";

/**
 * ScrollAnimations — GSAP ScrollTrigger orchestration for the landing page.
 *
 * Mount once, anywhere inside the page. It sets up all scroll-driven
 * animations and cleans up properly on unmount.
 *
 * Design decisions:
 * - useLayoutEffect + gsap.context() → safe cleanup, no SSR side-effects.
 * - ScrollTrigger.batch() for staggered card grids (single RAF loop).
 * - SplitText is not used (requires Club licence); word-splitting is done
 *   manually so we keep zero licensing costs.
 * - Parallax uses the efficient `scrub: true` technique (no JS lerp).
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

// ── Helper: split text content into word-spans for stagger ────────────────────

function splitWords(el: Element): HTMLSpanElement[] {
  const text = el.textContent ?? "";
  el.innerHTML = "";
  return text.split(" ").map((word, i, arr) => {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.style.overflow = "hidden";
    const inner = document.createElement("span");
    inner.style.display = "inline-block";
    inner.textContent = word + (i < arr.length - 1 ? "\u00a0" : "");
    span.appendChild(inner);
    el.appendChild(span);
    return inner;
  });
}

export function ScrollAnimations() {
  useLayoutEffect(() => {
    // Wrap everything in a gsap.context so cleanup is automatic.
    const ctx = gsap.context(() => {
      // ── 1. Hero heading — word stagger reveal ──────────────────────────────
      const heroH1 = document.querySelector("[data-anim='hero-h1']");
      if (heroH1) {
        const words = splitWords(heroH1);
        gsap.from(words, {
          y: "110%",
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.06,
          scrollTrigger: {
            trigger: heroH1,
            start: "top 88%",
          },
        });
      }

      // ── 2. Hero sub-text + CTA buttons — stagger fade-up ──────────────────
      gsap.from("[data-anim='hero-sub']", {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: "[data-anim='hero-sub']",
          start: "top 90%",
        },
      });

      // ── 3. Hero parallax background orb ───────────────────────────────────
      gsap.to("[data-anim='hero-orb']", {
        y: -80,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-anim='hero-orb']",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // ── 4. Features grid — batch stagger ──────────────────────────────────
      ScrollTrigger.batch("[data-anim='feature-card']", {
        onEnter: (batch) => {
          gsap.from(batch, {
            y: 48,
            opacity: 0,
            duration: 0.65,
            ease: "power2.out",
            stagger: 0.08,
          });
        },
        start: "top 88%",
        once: true,
      });

      // ── 5. How-It-Works steps — reveal with line progress ─────────────────
      const steps = gsap.utils.toArray<Element>("[data-anim='hiw-step']");
      steps.forEach((step, i) => {
        gsap.from(step, {
          x: i % 2 === 0 ? -40 : 40,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: step,
            start: "top 85%",
            once: true,
          },
        });
      });

      // Animate the connector arrows between steps.
      gsap.from("[data-anim='hiw-arrow']", {
        scaleX: 0,
        opacity: 0,
        transformOrigin: "left center",
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: "[data-anim='hiw-arrow']",
          start: "top 85%",
          once: true,
        },
      });

      // ── 6. FeatureSpotlight sections — text & visual split-in ─────────────
      const spotlights = gsap.utils.toArray<Element>("[data-anim='spotlight']");
      spotlights.forEach((section) => {
        const text = section.querySelector("[data-anim='spotlight-text']");
        const visual = section.querySelector("[data-anim='spotlight-visual']");

        if (text) {
          gsap.from(text, {
            x: -56,
            opacity: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              once: true,
            },
          });
        }

        if (visual) {
          gsap.from(visual, {
            x: 56,
            opacity: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              once: true,
            },
          });
        }
      });

      // ── 7. Final CTA — scale + glow pulse ─────────────────────────────────
      const cta = document.querySelector("[data-anim='final-cta']");
      if (cta) {
        gsap.from(cta, {
          scale: 0.92,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cta,
            start: "top 82%",
            once: true,
          },
        });

        // Subtle glow pulse after the reveal.
        gsap.to(cta, {
          boxShadow: "0 0 80px rgba(45, 212, 191, 0.22)",
          duration: 1.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 1,
        });
      }

      // ── 8. Section headings — slide up ────────────────────────────────────
      gsap.from("[data-anim='section-heading']", {
        y: 36,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: "[data-anim='section-heading']",
          start: "top 88%",
          once: true,
        },
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Renders nothing — purely a side-effect component.
  return null;
}
