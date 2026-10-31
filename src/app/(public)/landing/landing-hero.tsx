import Image from "next/image";
import aiImage from "@/shared/assets/ai-avatar.webp";
import styles from "./landing-hero.module.scss";

export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-title"
      className={styles.scene}
      data-scene
    >
      <div className={styles.copy}>
        <p className={styles.eyebrow}>YOUR NEXT LOOK, LOOK DDAK</p>
        <div className={styles.titles}>
          <h1 data-intro id="landing-title">
            말하면 찾아주고,
            <br />
            나에게 입혀주니까.
          </h1>
          <p className={styles.outro} data-outro>
            추천받은 그 옷,
            <br />
            <em>내 모습으로 룩딱.</em>
          </p>
        </div>
        <p className={styles.subtitle}>
          대화로 찾은 스타일을, 내 사진에 입혀보세요.
        </p>
      </div>

      <div
        aria-label="대화로 추천받은 초록 니트를 내 사진에 입혀보는 서비스 예시"
        className={styles.stage}
        role="img"
      >
        <span aria-hidden="true" className={styles.orbit} />
        <div className={styles.phone} data-phone>
          <span aria-hidden="true" className={styles.phoneIsland}>
            <i />
          </span>
          <div className={styles.phoneDisplay}>
            <div className={styles.phoneBar}>
              <span>9:41</span>
              <svg
                aria-hidden="true"
                className={styles.statusIcons}
                viewBox="0 0 58 14"
                fill="currentColor"
              >
                <rect x="0" y="9" width="3" height="4" rx="0.7" />
                <rect x="5" y="6" width="3" height="7" rx="0.7" />
                <rect x="10" y="3" width="3" height="10" rx="0.7" />
                <rect x="15" y="0" width="3" height="13" rx="0.7" />
                <path d="M23 4a11 11 0 0 1 15 0l-2 2a8 8 0 0 0-11 0Zm3 4a6 6 0 0 1 9 0l-2 2a3 3 0 0 0-5 0Zm3 3a2 2 0 0 1 3 0l-1.5 2Z" />
                <rect
                  x="42"
                  y="2"
                  width="13"
                  height="10"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                />
                <rect x="44" y="4" width="9" height="6" rx="1" />
                <rect x="56" y="5" width="2" height="4" rx="1" />
              </svg>
            </div>
            <div className={styles.phoneScreen}>
              <div className={styles.chatDemo} data-chat>
                <div className={styles.screenHeader}>
                  <span>룩딱 스타일리스트</span>
                </div>
                <div className={styles.userMessage}>
                  주말 데이트 때 뭐 입을까?
                </div>
                <div className={styles.aiMessage} data-chat-reply>
                  <div className={styles.aiIdentity}>
                    <Image alt="" width={26} height={26} src={aiImage} />
                    <span>AI 스타일리스트</span>
                    <small>지금</small>
                  </div>
                  <p>
                    편안하면서 분위기 있게,
                    <br />
                    <strong>초록 니트에 아이보리 팬츠</strong> 어때요?
                  </p>
                </div>
                <div
                  className={styles.productRecommendation}
                  data-recommendation
                >
                  <div className={styles.productVisual} data-product-visual>
                    <Image
                      alt=""
                      data-static-product
                      fill
                      sizes="150px"
                      src="/images/landing/green-knit.webp"
                    />
                    <span className={styles.recommendationRank}>추천 01</span>
                  </div>
                  <div className={styles.productDescription}>
                    <span>
                      포레스트 그린 <small>당신을 위한 추천</small>
                    </span>
                    <strong>포레스트 그린 니트</strong>
                    <p>
                      차분한 색감에 포근한 실루엣.
                      <br />
                      가볍게 나서는 주말에 잘 어울려요.
                    </p>
                    <div className={styles.productActions}>
                      <span>상품 보기 ↗</span>
                      <span className={styles.tryOnHint} data-try-on>
                        피팅룸에서 입어보기 →
                      </span>
                    </div>
                  </div>
                </div>
                <div aria-hidden="true" className={styles.recommendationDots}>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className={styles.chatInput}>
                  이 옷, 나에게 어울릴까?<span>↑</span>
                </div>
              </div>
              <div className={styles.fittingScreen} data-fitting>
                <div className={styles.screenHeader}>
                  <span>가상 피팅</span>
                </div>
                <div className={styles.fittingCard}>
                  <div className={styles.photo} data-photo>
                    <div className={styles.resultLayer} data-result>
                      <Image
                        alt=""
                        className={styles.result}
                        fill
                        preload
                        sizes="260px"
                        src="/images/landing/fitting-model-male.webp"
                      />
                    </div>
                  </div>
                  <div className={styles.phoneFooter} data-result-details>
                    <span>
                      포레스트 그린 니트<small>오늘의 새로운 나</small>
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.garment} data-garment>
                <div className={styles.morphKnit} data-morph-knit>
                  <Image
                    alt=""
                    fill
                    preload
                    sizes="260px"
                    src="/images/landing/green-knit.webp"
                  />
                </div>
                <div className={styles.processing} data-processing>
                  <span aria-hidden="true" className={styles.processingDots}>
                    <i />
                    <i />
                    <i />
                  </span>
                  나에게 입혀보는 중
                </div>
              </div>
            </div>
            <div className={styles.homeIndicator} />
          </div>
        </div>
      </div>
      <p className={styles.scrollHint}>
        <span aria-hidden="true">↓</span>
      </p>
    </section>
  );
}
