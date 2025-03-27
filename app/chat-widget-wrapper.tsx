import { getAllTranscriptions } from "@/actions/ressources";
import ChatWidget from "@/components/custom/chat-widget";

interface Transcriptions {
  summary: string | null;
  resourceId: string;
  transcriptionId: string;
}

async function ChatWidgetWrapper() {
  const transcriptionIds: Transcriptions[] | undefined =
    await getAllTranscriptions();
  if (!transcriptionIds) return <p>no data...</p>;

  return <ChatWidget transcriptions={transcriptionIds} />;
}

export default ChatWidgetWrapper;
