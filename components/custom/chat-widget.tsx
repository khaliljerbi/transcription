"use client";
import { usePlayerRef } from "@/context/player-context";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 } from "uuid";

interface Message {
  id: string;
  isBot: boolean;
  text?: string;
  loading?: boolean;
}

interface Transcriptions {
  summary: string | null;
  resourceId: string;
  transcriptionId: string;
}
interface ChatWidgetProps {
  transcriptions: Transcriptions[] | string;
}

const ChatWidget = ({ transcriptions }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  const { id: videoId } = useParams();

  const searchParams = useSearchParams();

  const searchTranscription = searchParams.get("transcription");

  const { playerRef } = usePlayerRef();

  const isResourcePage = videoId !== undefined;

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: v4(),
      isBot: false,
      text,
      loading: false,
    };

    // set request message
    setMessages((prev) => [...prev, userMessage]);

    const loadingMessage: Message = {
      id: v4(),
      isBot: true,
      loading: true,
    };

    // set loading message
    setMessages((prev) => [...prev, loadingMessage]);
    setMessage("");

    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: text,
        videoId,
        transcriptionId: searchTranscription
          ? searchTranscription
          : transcriptions,
      }),
    });

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const { data } = await response.json();

    setMessages((prev) => [
      ...prev.slice(0, -1),
      { id: v4(), text: data, isBot: true },
    ]);

    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLParagraphElement>) => {
      const clickedElement = e.target as HTMLElement;
      if (clickedElement.tagName === "A") {
        e.preventDefault();
        const url = clickedElement.getAttribute("href") || "";

        if (url.includes("t=")) {
          const fullUrl = new URL(url);
          const timeParam = fullUrl.searchParams.get("t");
          if (timeParam && isResourcePage) {
            if (playerRef) {
              playerRef.current.seekTo(parseInt(timeParam));
            }
            // const resourceId = fullUrl.searchParams.get("v")
          }
          return;
        }

        router.push(url);
      }
    },
    [isResourcePage, playerRef, router]
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[450px] h-[500px] bg-white rounded-lg shadow-xl flex flex-col border">
          <div className="p-4 border-b bg-blue-500 text-white rounded-t-lg">
            <h3 className="font-semibold">Ask anything</h3>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg max-w-[80%] ${
                      m.isBot ? "bg-gray-100" : "bg-blue-500 text-white"
                    }`}
                  >
                    {m.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : m.isBot ? (
                      <p
                        onClick={handleLinkClick}
                        dangerouslySetInnerHTML={{
                          __html: m.text as string,
                        }}
                      />
                    ) : (
                      <p>{m.text}</p>
                    )}
                  </div>
                ))}
                <div ref={scrollRef}></div>
              </div>
            </div>
          </div>

          <div className="border-t">
            <div className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      handleSendMessage(message);
                    }
                  }}
                />
                <button
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  onClick={() => {
                    handleSendMessage(message);
                  }}
                  disabled={
                    messages.length > 1 && messages[messages.length - 1].loading
                  }
                >
                  <Send size={20} />
                </button>
              </div>
            </div>

            {isResourcePage && (
              <div className="p-3 bg-gray-50 border-t text-center">
                <button
                  onClick={() => router.push("/")}
                  className="text-gray-600 hover:text-blue-600 text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle size={16} />
                  New search across all resources
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
