import { Button } from "@/shared/ui/button";
import styles from "./shooting-guide.module.scss";

type ShootingGuideProps = {
  onStartShooting: () => void;
};

function TipIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" fill="currentColor" r="8" />
      <path
        d="M10 9v5M10 6.5h.01"
        stroke="white"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ShootingGuide({ onStartShooting }: ShootingGuideProps) {
  return (
    <div className={styles.guide}>
      <ol className={styles.steps}>
        <li>
          <span>01</span>
          <p>
            <strong>머리부터 발끝까지</strong> 한 화면에 나오게 찍어주세요.
          </p>
        </li>
        <li>
          <span>02</span>
          <p>
            <strong>한 사람만</strong> 사진에 나오도록 해주세요.
          </p>
        </li>
        <li>
          <span>03</span>
          <p>
            얼굴과 몸이 가리지 않게 <strong>정면을 보고</strong> 서주세요.
          </p>
        </li>
        <li>
          <span>04</span>
          <p>
            <strong>밝고 선명한 곳</strong>에서 촬영해주세요.
          </p>
        </li>
        <li>
          <span>05</span>
          <p>
            몸 전체 윤곽이 보이도록 <strong>여유 있는 옷차림</strong>을
            권장해요.
          </p>
        </li>
      </ol>
      <div className={styles.tip}>
        <TipIcon />
        <p>
          <strong>TIP</strong> 스마트폰을 허리 높이에서 수평으로 들고 찍으면
          왜곡이 적어요.
        </p>
      </div>
      <Button
        className={styles.startButton}
        fullWidth
        onClick={onStartShooting}
        size="large"
        type="button"
      >
        촬영 시작하기
      </Button>
    </div>
  );
}
