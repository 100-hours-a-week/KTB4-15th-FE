"use client";

import { ChatComposer } from "./chat-composer";
import { ChatLanding } from "./chat-landing";
import styles from "./chat-home.module.scss";

type ChatHomeProps = {
  date: string;
};

export function ChatHome({ date }: ChatHomeProps) {
  const handleSubmit = async () => {
    await Promise.resolve();
  };

  return (
    <>
      <ChatLanding date={date} />
      <div className={styles.composerDock}>
        <ChatComposer isSubmitting={false} onSubmit={handleSubmit} />
      </div>
    </>
  );
}
