import { splitByKeyword } from "../../lib/chat-search";
import styles from "./highlighted-chat-text.module.scss";

export function HighlightedChatText({
  text,
  keyword = "",
}: {
  text: string;
  keyword?: string;
}) {
  return splitByKeyword(text, keyword).map((part, index) =>
    part.highlighted ? (
      <mark className={styles.match} key={index}>
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}
