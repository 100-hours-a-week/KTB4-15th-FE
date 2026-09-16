import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "LOOK DDAK",
  description: "LOOK DDAK 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
