import Image from "next/image";
import styles from "./landing-features.module.scss";

const introductionSlides = [
  {
    image: "wishlist-recommendation",
    label: "01 / YOUR TASTE",
    title: "찜해둔 취향으로,\n다음 코디까지.",
    description:
      "찜한 옷이 10개 모이면,\n내 취향을 담은 코디 추천을 받아보세요.",
  },
  {
    image: "style-ranking",
    label: "02 / TRENDING",
    title: "요즘 눈길이 가는 옷,\n랭킹에서 한눈에.",
    description:
      "많이 찜한 옷부터 자주 살펴본 옷까지,\n사람들이 주목하는 스타일을 만나보세요.",
  },
  {
    image: "notification",
    label: "03 / STAY IN THE KNOW",
    title: "기다리던 피팅 결과,\n알림으로 바로.",
    description:
      "다른 스타일을 둘러보는 동안에도,\n피팅이 완료되면 알림으로 알려드려요.",
  },
];

export function LandingFeatures() {
  return (
    <section
      aria-labelledby="introduction-title"
      className={styles.details}
      data-details
    >
      <div className={styles.detailsHeading}>
        <p className={styles.eyebrow}>MORE WAYS TO FIND YOUR STYLE.</p>
        <h2 id="introduction-title">
          취향을 쌓고,
          <br />
          발견을 넓혀보세요.
        </h2>
      </div>
      <div
        aria-label="룩딱 기능 소개, 스크롤하여 다음 소개 보기"
        className={styles.featureViewport}
        data-viewport
        tabIndex={0}
      >
        <div className={styles.features} data-track>
          {introductionSlides.map((slide) => (
            <article className={styles.featureSlide} key={slide.image}>
              <div
                className={styles.featureArt}
                data-bell={slide.image === "notification" ? "" : undefined}
              >
                {slide.image !== "style-ranking" ? (
                  <Image
                    alt=""
                    fill
                    sizes="(max-width: 700px) 280px, 440px"
                    src={`/images/landing/${slide.image}.webp`}
                  />
                ) : (
                  <div className={styles.featureComposition}>
                    <Image
                      alt=""
                      fill
                      sizes="(max-width: 700px) 280px, 440px"
                      src="/images/landing/ranking-base.webp"
                    />
                    <div className={styles.crownLayer} data-crown>
                      <Image
                        alt=""
                        fill
                        sizes="120px"
                        src="/images/landing/ranking-crown.webp"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.featureCopy}>
                <span>{slide.label}</span>
                <h3>{slide.title}</h3>
                <p>{slide.description}</p>
                <div aria-hidden="true" className={styles.slideProgress}>
                  {introductionSlides.map((item) => (
                    <i
                      className={
                        item === slide ? styles.currentStep : undefined
                      }
                      key={item.image}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
