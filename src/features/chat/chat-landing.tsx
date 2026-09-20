import Image, { type StaticImageData } from "next/image";
import aiImage from "./icon/ai.png";
import knitImage from "./icon/knit.png";
import likeImage from "./icon/like.png";
import shirtImage from "./icon/shirt.png";
import suitImage from "./icon/suit.png";
import styles from "./chat-landing.module.scss";

type SuggestedQuestion = {
  title: string;
  description: string;
  image: StaticImageData;
};

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    title: "찜 목록 기반 코디 추천",
    description: "내 취향 아이템으로 완성하는 맞춤 스타일",
    image: likeImage,
  },
  {
    title: "주말 데이트 5만원대 셔츠",
    description: "깔끔하고 편안한 가성비 옥스포드 셔츠",
    image: shirtImage,
  },
  {
    title: "결혼식 하객룩 8만원대 셋업",
    description: "격식과 트렌드를 모두 잡은 수트 셋업",
    image: suitImage,
  },
  {
    title: "데일리 출근용 2만원대 기본 상의",
    description: "편안하고 단정한 매일 입기 좋은 니트",
    image: knitImage,
  },
];

type ChatLandingProps = {
  date: string;
};

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="m9 5 7 7-7 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ChatLanding({ date }: ChatLandingProps) {
  return (
    <div className={styles.landing}>
      <time className={styles.date}>{date}</time>

      <section aria-label="AI 스타일리스트 인사" className={styles.intro}>
        <Image
          alt="AI 스타일리스트"
          className={styles.avatar}
          priority
          src={aiImage}
        />
        <div className={styles.messageArea}>
          <div className={styles.profile}>
            <strong>AI 스타일리스트</strong>
            <span>스타일리스트</span>
          </div>
          <div className={styles.message}>
            <p>안녕하세요 민우님! 오늘 어떤 룩을 찾고 계신가요?</p>
            <p>
              아래 추천 질문을 누르거나 원하는 무드·예산을 자유롭게 물어보세요
              ✨
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="suggested-questions-title">
        <div className={styles.sectionHeading}>
          <h2 id="suggested-questions-title">💡 추천 질문</h2>
          <span>탭하여 바로 질문</span>
        </div>
        <div className={styles.questionList}>
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              className={styles.question}
              key={question.title}
              type="button"
            >
              <Image
                alt=""
                className={styles.questionImage}
                src={question.image}
              />
              <span className={styles.questionText}>
                <strong>{question.title}</strong>
                <span>{question.description}</span>
              </span>
              <span className={styles.chevron}>
                <ChevronRightIcon />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
