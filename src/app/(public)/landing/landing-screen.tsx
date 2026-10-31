"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { LandingStartButton } from "./landing-start-button";
import { LandingCta } from "./landing-cta";
import { LandingFooter } from "./landing-footer";
import { LandingFaq } from "./landing-faq";
import { LandingFeatures } from "./landing-features";
import { LandingHero } from "./landing-hero";
import styles from "./landing-screen.module.scss";

export function LandingScreen() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const landing = root.current!;
    const theme = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const originalTheme = theme?.content;
    const originalHtml = document.documentElement.style.backgroundColor;
    const originalBody = document.body.style.backgroundColor;
    const backgroundState = {
      color: getComputedStyle(document.body).backgroundColor,
    };
    let targetColor = "";
    let colorFrame = 0;
    const updateBackground = () => {
      colorFrame = 0;
      const middle = window.innerHeight / 2;
      const section = Array.from(landing.querySelectorAll("section")).findLast(
        (element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top <= middle && bounds.bottom > middle;
        },
      );
      const background = section && getComputedStyle(section).backgroundColor;
      const color =
        background && background !== "rgba(0, 0, 0, 0)"
          ? background
          : getComputedStyle(landing).backgroundColor;
      if (targetColor === color) return;
      targetColor = color;
      gsap.to(backgroundState, {
        color,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 0.4,
        ease: "none",
        overwrite: true,
        onUpdate: () => {
          document.documentElement.style.backgroundColor =
            backgroundState.color;
          document.body.style.backgroundColor = backgroundState.color;
          if (theme) theme.content = backgroundState.color;
        },
      });
    };
    const scheduleBackground = () => {
      if (!colorFrame) colorFrame = requestAnimationFrame(updateBackground);
    };
    window.addEventListener("scroll", scheduleBackground, { passive: true });
    window.addEventListener("resize", scheduleBackground);
    const details = root.current!.querySelector<HTMLElement>("[data-details]")!;
    const imagePreload = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        details.querySelectorAll("img").forEach((image) => {
          image.loading = "eager";
        });
        imagePreload.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const scene = root.current!.querySelector<HTMLElement>("[data-scene]")!;
        const phone = scene.querySelector<HTMLElement>("[data-phone]")!;
        const stage = phone.parentElement!;
        const fitPhone = () => {
          const scale = Math.min(
            1.2,
            (stage.clientWidth - 8) / phone.offsetWidth,
            Math.max(0, stage.clientHeight - phone.offsetTop) /
              phone.offsetHeight,
          );
          phone.style.setProperty("--phone-scale", String(scale));
        };
        fitPhone();
        const phoneResize = new ResizeObserver(fitPhone);
        phoneResize.observe(stage);
        phoneResize.observe(phone);
        const garment = scene.querySelector<HTMLElement>("[data-garment]")!;
        const photo = scene.querySelector<HTMLElement>("[data-photo]")!;
        const productVisual = scene.querySelector<HTMLElement>(
          "[data-product-visual]",
        )!;
        const alignGarment = () => {
          const stageBounds = garment.parentElement!.getBoundingClientRect();
          const productBounds = productVisual.getBoundingClientRect();
          const scale = stageBounds.width / garment.parentElement!.offsetWidth;
          gsap.set(garment, {
            left: (productBounds.left - stageBounds.left) / scale,
            top: (productBounds.top - stageBounds.top) / scale,
            width: productBounds.width / scale,
            height: productBounds.height / scale,
          });
        };
        alignGarment();
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: scene,
            start: "top top",
            end: "+=2600",
            pin: true,
            anticipatePin: 1,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onRefreshInit: alignGarment,
          },
        });
        timeline
          .fromTo(
            "[data-chat-reply]",
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.4 },
            0.2,
          )
          .fromTo(
            "[data-recommendation]",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.4 },
            0.7,
          )
          .fromTo(
            garment,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.01 },
            1.9,
          )
          .to(
            "[data-demo-cursor]",
            { autoAlpha: 1, x: 0, y: 0, duration: 0.25 },
            1.1,
          )
          .from("[data-demo-cursor]", { x: 16, y: 12, duration: 0.25 }, 1.1)
          .to(
            "[data-try-on]",
            {
              scale: 0.92,
              backgroundColor: "#28664d",
              duration: 0.2,
              repeat: 1,
              yoyo: true,
            },
            1.35,
          )
          .to("[data-try-on-label]", { autoAlpha: 0, duration: 0.1 }, 1.55)
          .to("[data-try-on-pending]", { autoAlpha: 1, duration: 0.1 }, 1.55)
          .to("[data-demo-cursor]", { autoAlpha: 0, duration: 0.15 }, 1.75)
          .fromTo(
            "[data-fitting]",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.4 },
            2,
          )
          .to("[data-chat]", { autoAlpha: 0, duration: 0.5 }, 1.9)
          .to(
            garment,
            {
              left: () => {
                const parent = garment.parentElement!;
                const bounds = parent.getBoundingClientRect();
                return (
                  (photo.getBoundingClientRect().left - bounds.left) /
                  (bounds.width / parent.offsetWidth)
                );
              },
              top: () => {
                const parent = garment.parentElement!;
                const bounds = parent.getBoundingClientRect();
                return (
                  (photo.getBoundingClientRect().top - bounds.top) /
                  (bounds.height / parent.offsetHeight)
                );
              },
              width: () => photo.offsetWidth,
              height: () => photo.offsetHeight,
              borderRadius: 18,
              "--knit-bottom-padding": "90px",
              backgroundColor: "#eeeae2",
              duration: 1,
            },
            1.9,
          )
          .fromTo(
            "[data-processing]",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.3 },
            2.4,
          )
          .to("[data-morph-knit]", { autoAlpha: 0, duration: 0.3 }, 2.9)
          .to("[data-processing]", { autoAlpha: 0, duration: 0.2 }, 3.2)
          .fromTo(
            "[data-result], [data-result-details]",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.7 },
            3.3,
          )
          .to(garment, { autoAlpha: 0, duration: 0.4 }, 3.3)
          .to("[data-intro]", { autoAlpha: 0, y: -20, duration: 0.4 }, 3)
          .fromTo(
            "[data-outro]",
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.5 },
            3.5,
          )
          .to({}, { duration: 0.7 });

        const section =
          root.current!.querySelector<HTMLElement>("[data-details]")!;
        const viewport = section.querySelector<HTMLElement>("[data-viewport]")!;
        const track = section.querySelector<HTMLElement>("[data-track]")!;
        gsap.set(viewport, { overflow: "clip", scrollSnapType: "none" });
        const bell = section.querySelector<HTMLElement>("[data-bell]")!;
        const bellShake = gsap
          .timeline({ paused: true, delay: 0.4 })
          .to(bell, { rotation: -5, duration: 0.15, ease: "sine.inOut" })
          .to(bell, { rotation: 5, duration: 0.2, ease: "sine.inOut" })
          .to(bell, { rotation: -4, duration: 0.2, ease: "sine.inOut" })
          .to(bell, { rotation: 4, duration: 0.2, ease: "sine.inOut" })
          .to(bell, { rotation: 0, duration: 0.15, ease: "sine.inOut" });
        const crown = section.querySelector<HTMLElement>("[data-crown]")!;
        const crownSettle = gsap
          .timeline({ paused: true })
          .to(crown, { y: 5, duration: 0.6, ease: "sine.inOut" })
          .to(crown, { y: 0, duration: 0.6, ease: "sine.inOut" });
        const playedSlides = new Set<number>();

        const featuresTimeline = gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=2200",
              snap: {
                snapTo: (progress) => {
                  const position = progress * 2200;
                  for (const start of [400, 1300]) {
                    if (position > start && position < start + 500) {
                      return (
                        (position < start + 250 ? start : start + 500) / 2200
                      );
                    }
                  }
                  return progress;
                },
                inertia: false,
                directional: false,
                delay: 0.15,
                duration: 0.3,
                ease: "power1.inOut",
              },
              onToggle: ({ isActive }) => {
                section.toggleAttribute("data-pinned", isActive);
              },
              onUpdate: ({ progress }) => {
                const slide =
                  progress <= 0
                    ? -1
                    : progress < 900 / 2200
                      ? 0
                      : progress < 1800 / 2200
                        ? 1
                        : 2;
                if (slide === 1 && !playedSlides.has(slide)) {
                  playedSlides.add(slide);
                  crownSettle.play();
                }
                if (slide === 2 && !playedSlides.has(slide)) {
                  playedSlides.add(slide);
                  bellShake.play();
                }
              },
              pin: true,
              anticipatePin: 1,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          .to({}, { duration: 400 })
          .to(track, { x: () => -viewport.clientWidth, duration: 500 })
          .to({}, { duration: 400 })
          .to(track, { x: () => -viewport.clientWidth * 2, duration: 500 })
          .to({}, { duration: 400 });
        let wheelLimit: number | undefined;
        let wheelDirection = 0;
        let wheelTimer: ReturnType<typeof setTimeout>;
        const limitWheel = (event: WheelEvent) => {
          if (event.ctrlKey || !event.cancelable || !event.deltaY) return;
          const trigger = featuresTimeline.scrollTrigger!;
          if (!trigger.isActive) return;
          const direction = Math.sign(event.deltaY);
          const position = window.scrollY - trigger.start;
          if (wheelLimit === undefined || direction !== wheelDirection) {
            wheelDirection = direction;
            wheelLimit =
              direction > 0
                ? position < 900
                  ? 900
                  : position < 1800
                    ? 1800
                    : Infinity
                : position > 1300
                  ? 1300
                  : position > 400
                    ? 400
                    : -Infinity;
          }
          clearTimeout(wheelTimer);
          // shortcut: 250ms gaps separate wheel gestures; tune with real trackpads if needed.
          wheelTimer = setTimeout(() => {
            wheelLimit = undefined;
          }, 250);
          const delta =
            event.deltaY *
            (event.deltaMode === 1
              ? 16
              : event.deltaMode === 2
                ? window.innerHeight
                : 1);
          const destination = position + delta;
          if (
            direction > 0
              ? destination >= wheelLimit
              : destination <= wheelLimit
          ) {
            event.preventDefault();
            window.scrollTo(0, trigger.start + wheelLimit);
          }
        };
        window.addEventListener("wheel", limitWheel, { passive: false });
        return () => {
          window.removeEventListener("wheel", limitWheel);
          clearTimeout(wheelTimer);
          section.removeAttribute("data-pinned");
          phoneResize.disconnect();
          phone.style.removeProperty("--phone-scale");
        };
      },
      root,
    );
    imagePreload.observe(details);
    updateBackground();
    return () => {
      window.removeEventListener("scroll", scheduleBackground);
      window.removeEventListener("resize", scheduleBackground);
      cancelAnimationFrame(colorFrame);
      gsap.killTweensOf(backgroundState);
      document.documentElement.style.backgroundColor = originalHtml;
      document.body.style.backgroundColor = originalBody;
      if (theme && originalTheme !== undefined) theme.content = originalTheme;
      imagePreload.disconnect();
      media.revert();
    };
  }, []);

  return (
    <main className={styles.landing} data-landing ref={root}>
      <header className={styles.header}>
        <Link aria-label="룩딱 랜딩 처음으로" className={styles.logo} href="/">
          LOOK DDAK
        </Link>
        <LandingStartButton className={styles.headerLink} />
      </header>

      <LandingHero />
      <LandingFeatures />
      <LandingFaq />

      <div className={styles.closing}>
        <LandingCta />
        <LandingFooter />
      </div>
    </main>
  );
}
