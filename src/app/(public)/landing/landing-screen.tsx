"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useRef } from "react";
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
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const scene = root.current!.querySelector<HTMLElement>("[data-scene]")!;
        const phone = scene.querySelector<HTMLElement>("[data-phone]")!;
        const stage = phone.parentElement!;
        const fitPhone = () => {
          const scale = Math.min(
            1,
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
            "[data-try-on]",
            {
              scale: 0.96,
              backgroundColor: "#28664d",
              duration: 0.2,
              repeat: 1,
              yoyo: true,
            },
            1.35,
          )
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

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=4050",
              onUpdate: ({ progress }) => {
                const slide =
                  progress <= 0
                    ? -1
                    : progress < 1650 / 4050
                      ? 0
                      : progress < 3300 / 4050
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
          .to({}, { duration: 750 })
          .to(track, { x: () => -viewport.clientWidth, duration: 900 })
          .to({}, { duration: 750 })
          .to(track, { x: () => -viewport.clientWidth * 2, duration: 900 })
          .to({}, { duration: 750 });
        return () => {
          phoneResize.disconnect();
          phone.style.removeProperty("--phone-scale");
        };
      },
      root,
    );
    return () => media.revert();
  }, []);

  return (
    <main className={styles.landing} data-landing ref={root}>
      <header className={styles.header}>
        <Link
          aria-label="룩딱 랜딩 처음으로"
          className={styles.logo}
          href="/landing"
        >
          LOOK DDAK
        </Link>
        <Link className={styles.headerLink} href="/signup">
          룩딱 시작하기
        </Link>
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
