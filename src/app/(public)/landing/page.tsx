import type { Metadata } from "next";
import { LandingScreen } from "./landing-screen";

export const metadata: Metadata = {
  title: "LOOK DDAK | 입어보기 전, 나에게 룩딱",
  description:
    "마음에 드는 옷을 나에게. AI 스타일 추천부터 가상 피팅까지 룩딱에서 만나보세요.",
};

export default function LandingPage() {
  return <LandingScreen />;
}
