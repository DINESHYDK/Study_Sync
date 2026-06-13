"use client";

/**
 * ScrollAnimations — GSAP ScrollTrigger orchestration for the landing page.
 *
 * Mount once, anywhere inside the page. It sets up all scroll-driven
 * animations and cleans up properly on unmount.
 *
 * Rules to avoid React conflicts:
 * - NEVER mutate innerHTML / textContent of React-managed elements.
 * - All animations use gsap.from() / gsap.to() on live DOM nodes only.
 * - Cleanup via gsap.context().revert() + ScrollTrigger.getAll().forEach kill.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

export function ScrollAnimations() {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // ── 1. Hero heading — simple fade+scale (no DOM mutation) ─────────────
      // We CANNOT split the h1's words because it contains <br> and <span>
      // children managed by React. Mutating innerHTML would desync the VDOM.
      gsap.from("[data-anim='hero-h1']", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
      });

      // ── 2. Hero sub-text + CTA buttons ────────────────────────────────────
      gsap.from("[data-anim='hero-sub']", {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.12,
        delay: 0.25,
      });

      // ── 2b. Hero timer preview ────────────────────────────────────────────
      gsap.from("[data-anim='timer-preview']", {
        y: 48,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.45,
      });

      // ── 3. Hero parallax background orb ───────────────────────────────────
      gsap.to("[data-anim='hero-orb']", {
        y: -90,
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
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.07,
          });
        },
        start: "top 88%",
        once: true,
      });

      // ── 5. How-It-Works steps — alternate slide-in ────────────────────────
      const steps = gsap.utils.toArray<Element>("[data-anim='hiw-step']");
      steps.forEach((step, i) => {
        gsap.from(step, {
          x: i % 2 === 0 ? -36 : 36,
          opacity: 0,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: {
            trigger: step,
            start: "top 86%",
            once: true,
          },
        });
      });

      // Connector arrows — scaleX reveal from left
      gsap.from("[data-anim='hiw-arrow']", {
        scaleX: 0,
        opacity: 0,
        transformOrigin: "left center",
        duration: 0.45,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: "[data-anim='hiw-arrow']",
          start: "top 86%",
          once: true,
        },
      });

      // ── 6. FeatureSpotlight — text from left, visual from right ───────────
      const spotlights = gsap.utils.toArray<Element>("[data-anim='spotlight']");
      spotlights.forEach((section) => {
        const text = section.querySelector("[data-anim='spotlight-text']");
        const visual = section.querySelector("[data-anim='spotlight-visual']");

        if (text) {
          gsap.from(text, {
            x: -52,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              once: true,
            },
          });
        }

        if (visual) {
          gsap.from(visual, {
            x: 52,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              once: true,
            },
          });
        }
      });

      // ── 7. Final CTA — scale entrance + repeating glow ───────────────────
      const cta = document.querySelector("[data-anim='final-cta']");
      if (cta) {
        gsap.from(cta, {
          scale: 0.93,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cta,
            start: "top 84%",
            once: true,
          },
          onComplete: () => {
            gsap.to(cta, {
              boxShadow: "0 0 80px rgba(45, 212, 191, 0.2)",
              duration: 1.8,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
          },
        });
      }

      // ── 8. Section headings ────────────────────────────────────────────────
      const headings = gsap.utils.toArray<Element>("[data-anim='section-heading']");
      headings.forEach((heading) => {
        gsap.from(heading, {
          y: 32,
          opacity: 0,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: {
            trigger: heading,
            start: "top 88%",
            once: true,
          },
        });
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null;
}
