import type { Metadata } from "next";
import { LandingScreen } from "./landing/landing-screen";

export const metadata: Metadata = {
  title: "룩딱 LOOKDDAK | AI 코디 추천 · 가상 피팅",
  description:
    "어떤 옷을 입을지 고민될 때, 룩딱에서 AI와 대화하며 코디를 추천받고 내 사진으로 가상 피팅해 보세요.",
};

export default function LandingPage() {
  return <LandingScreen />;
}
