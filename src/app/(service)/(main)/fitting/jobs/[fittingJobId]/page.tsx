import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon } from "@/shared/ui/icon";
import styles from "./page.module.scss";

export default async function FittingJobPage({
  params,
}: PageProps<"/fitting/jobs/[fittingJobId]">) {
  const { fittingJobId } = await params;

  return (
    <>
      <Header
        center={<HeaderTitle>가상 피팅</HeaderTitle>}
        left={
          <HeaderIconLink aria-label="피팅으로 돌아가기" href="/fitting">
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <main className={styles.main}>
        <p className={styles.eyebrow}>FITTING #{fittingJobId}</p>
        <h2>가상 피팅을 준비하고 있어요</h2>
        <p>결과가 준비될 때까지 잠시만 기다려 주세요.</p>
      </main>
    </>
  );
}
