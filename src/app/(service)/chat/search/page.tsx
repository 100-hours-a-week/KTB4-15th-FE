import { Suspense } from "react";
import { ChatSearchScreen } from "@/features/chat/chat-search-screen";

export default function ChatSearchPage() {
  return (
    <Suspense>
      <ChatSearchScreen />
    </Suspense>
  );
}
