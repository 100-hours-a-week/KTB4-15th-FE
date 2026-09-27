"use client";

import Image, { type StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import chatStyleImage from "../../public/images/onboarding/chat-style.png";
import saveTimeImage from "../../public/images/onboarding/save-time.png";
import virtualFittingImage from "../../public/images/onboarding/virtual-fitting.png";
import { Button } from "@/shared/ui/button";
import styles from "./page.module.scss";

const ONBOARDING_STORAGE_KEY = "look-ddak:onboarding-completed";

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

const getOnboardingCompleted = () =>
  window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";

const getServerSnapshot = () => false;

type OnboardingItem = {
  image: StaticImageData;
  imageAlt: string;
  eyebrow: string;
  title: string;
  description: string;
};

const onboardingItems: OnboardingItem[] = [
  {
    image: chatStyleImage,
    imageAlt: "말풍선과 니트로 표현한 맞춤 스타일 추천",
    eyebrow: "AI 스타일 추천",
    title: "원하는 옷을\n대화로 찾아요",
    description: "상황과 취향을 알려주면\n나에게 맞는 옷만 골라드려요.",
  },
  {
    image: virtualFittingImage,
    imageAlt: "거울 속 재킷으로 표현한 가상 피팅",
    eyebrow: "가상 피팅",
    title: "어울리는 모습까지\n미리 확인해요",
    description: "내 사진에 추천받은 옷을 입혀보고\n구매 전 고민을 줄여보세요.",
  },
  {
    image: saveTimeImage,
    imageAlt: "시계와 옷걸이로 표현한 빠른 옷 선택",
    eyebrow: "빠른 선택",
    title: "옷 고르는 시간은 줄이고\n만족은 더 높여요",
    description: "추천부터 비교, 피팅까지\n룩딱 하나로 빠르게 끝내세요.",
  },
];

export default function Home() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const isCompleted = useSyncExternalStore(
    subscribeToStorage,
    getOnboardingCompleted,
    getServerSnapshot,
  );
  const isLast = currentIndex === onboardingItems.length - 1;
  const currentItem = onboardingItems[currentIndex];

  useEffect(() => {
    if (isCompleted) {
      router.replace("/login");
    }
  }, [isCompleted, router]);

  const completeOnboarding = (destination: "/login" | "/signup") => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    router.push(destination);
  };

  const handlePrimaryAction = () => {
    if (isLast) {
      completeOnboarding("/signup");
      return;
    }

    setCurrentIndex((index) => index + 1);
  };

  if (isCompleted) {
    return <main aria-label="룩딱 시작 화면" className={styles.loading} />;
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.logo}>LOOK DDAK</span>
        <button
          className={styles.skipButton}
          onClick={() => completeOnboarding("/login")}
          type="button"
        >
          건너뛰기
        </button>
      </header>

      <section aria-live="polite" className={styles.content}>
        <div className={styles.visual}>
          <div aria-hidden="true" className={styles.glow} />
          <Image
            alt={currentItem.imageAlt}
            className={`${styles.image} ${currentIndex > 0 ? styles.imageEnter : ""}`}
            key={currentItem.image.src}
            preload={currentIndex === 0}
            sizes="(max-width: 480px) 100vw, 360px"
            src={currentItem.image}
          />
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>{currentItem.eyebrow}</p>
          <h1>{currentItem.title}</h1>
          <p className={styles.description}>{currentItem.description}</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div
          aria-label={`${onboardingItems.length}개 중 ${currentIndex + 1}번째`}
          className={styles.pagination}
        >
          {onboardingItems.map((item, index) => (
            <button
              aria-current={index === currentIndex ? "step" : undefined}
              aria-label={`${index + 1}번째 소개 보기`}
              className={index === currentIndex ? styles.activeDot : styles.dot}
              key={item.title}
              onClick={() => setCurrentIndex(index)}
              type="button"
            />
          ))}
        </div>

        <Button fullWidth onClick={handlePrimaryAction} size="large">
          {isLast ? "룩딱 시작하기" : "다음"}
        </Button>
        {isLast && (
          <button
            className={styles.loginButton}
            onClick={() => completeOnboarding("/login")}
            type="button"
          >
            이미 계정이 있어요
          </button>
        )}
      </footer>
    </main>
  );
}
