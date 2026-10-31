import styles from "./landing-faq.module.scss";

const questions = [
  {
    question: "어떤 사진을 등록해야 하나요?",
    answer:
      "혼자 정면을 바라보고, 머리부터 발끝까지 양팔과 양다리가 잘 보이는 밝고 선명한 전신 사진을 등록해 주세요. JPG·JPEG·PNG 형식, 10MB 이하 파일을 사용할 수 있어요. 사진을 등록하면 가상 피팅에 적합한지 확인해드려요.",
  },
  {
    question: "가상 피팅으로 무엇을 확인할 수 있나요?",
    answer:
      "추천받은 옷을 내 사진에 입혀 색상과 스타일이 어우러지는 모습을 미리 살펴볼 수 있어요. AI가 만든 이미지이므로 실제 착용 모습과 차이가 있을 수 있으며, 정확한 사이즈나 핏을 측정하는 기능은 아니에요. 구매 전 상품의 실측 정보와 사이즈 가이드도 함께 확인해 주세요.",
  },
  {
    question: "추천받은 상품은 어디서 구매하나요?",
    answer:
      "채팅의 추천 상품 카드에서 ‘상품 보기’를 누르면 연결된 29CM 상품 페이지로 이동해요. 상품의 상세 정보와 옵션을 확인한 뒤 해당 판매처에서 구매할 수 있어요. 결제는 룩딱 안에서 진행되지 않아요.",
  },
  {
    question: "찜 기반 추천은 어떻게 이용하나요?",
    answer:
      "채팅에서 추천받은 상품 카드의 하트를 눌러 마음에 드는 옷을 찜해보세요. 저장한 상품은 찜 목록에서 다시 볼 수 있어요. 찜한 상품이 10개 이상이면 새 채팅 화면에 나타나는 찜 목록 기반 코디 추천 질문으로 내 취향을 담은 추천을 시작할 수 있어요.",
  },
];

export function LandingFaq() {
  return (
    <section aria-labelledby="faq-title" className={styles.faq}>
      <div className={styles.heading}>
        <p>BEFORE YOU START</p>
        <h2 id="faq-title">궁금한 점이 있나요?</h2>
        <span>룩딱을 시작하기 전에, 가볍게 확인해보세요.</span>
      </div>
      <div className={styles.questions}>
        {questions.map(({ question, answer }) => (
          <details className={styles.item} key={question}>
            <summary>
              <span>{question}</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                <path
                  d="m5 7.5 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
