import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import styles from "./layout.module.scss";
import "./globals.scss";

export const metadata: Metadata = {
  title: "LOOK DDAK",
  description: "LOOK DDAK 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <div className={styles.appFrame}>
          {children}
        </div>
      </body>
    </html>
  );
}
