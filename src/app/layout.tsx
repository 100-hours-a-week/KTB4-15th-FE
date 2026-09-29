import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "sonner/dist/styles.css";
import { AppToaster } from "@/shared/ui/toast";
import styles from "./layout.module.scss";
import "./globals.scss";
import { ClarityAnalytics } from "./clarity-analytics";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LOOK DDAK",
  description: "LOOK DDAK 서비스",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <div className={styles.appFrame}>{children}</div>
          <AppToaster />
        </Providers>
        <ClarityAnalytics />
      </body>
    </html>
  );
}
