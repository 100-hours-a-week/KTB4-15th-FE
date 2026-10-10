import type { Metadata, Viewport } from "next";
import "sonner/dist/styles.css";
import { AppToaster } from "@/shared/ui/toast";
import styles from "./layout.module.scss";
import "./globals.scss";
import { ClarityAnalytics } from "./clarity-analytics";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LOOK DDAK",
  description: "LOOK DDAK 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
