import { usePlayerState } from "@/context/player-context";
import { cn, formatTime } from "@/lib/utils";
import { TranscriptUtterance } from "assemblyai";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List, areEqual } from "react-window";

function findCurrentUtteranceIndex(
  utterances: TranscriptUtterance[],
  currentTimeMs: number
): number {
  let low = 0;
  let high = utterances.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const utterance = utterances[mid];

    if (currentTimeMs < utterance.start) {
      high = mid - 1;
    } else if (currentTimeMs > utterance.end) {
      low = mid + 1;
    } else {
      return mid;
    }
  }

  return Math.min(utterances.length - 1, Math.max(0, low));
}

function findCurrentWordIndex(
  utterance: TranscriptUtterance,
  currentTimeMs: number
): number {
  return utterance.words.findIndex(
    (word) => currentTimeMs >= word.start && currentTimeMs <= word.end
  );
}

const Timestamp = React.memo(
  ({
    time,
    onClick,
  }: {
    time: number;
    onClick: (e: React.MouseEvent) => void;
  }) => (
    <span
      className="text-sm text-blue-500 cursor-pointer hover:underline hover:text-blue-500/60 whitespace-nowrap"
      onClick={onClick}
    >
      {formatTime(time)}
    </span>
  )
);

Timestamp.displayName = "Timestamp";

const Word = React.memo(
  ({
    word,
    isHighlighted,
  }: {
    word: { text: string; start: number; end: number };
    isHighlighted: boolean;
  }) => (
    <span
      className={cn(
        "mx-0.5 transition-colors duration-200 inline-block",
        isHighlighted && "bg-yellow-200"
      )}
    >
      {word.text}
    </span>
  ),
  (prev, next) =>
    prev.isHighlighted === next.isHighlighted &&
    prev.word.text === next.word.text
);

Word.displayName = "Word";

interface UtterancesProps {
  utterances: TranscriptUtterance[];
  onTimestampClick: (timestamp: number) => void;
}

const Row = React.memo(
  ({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
    data: {
      utterances: TranscriptUtterance[];
      onTimestampClick: (timestamp: number) => void;
      measurerRef: React.MutableRefObject<{
        [key: number]: HTMLDivElement | null;
      }>;
      rowHeights: React.MutableRefObject<{ [key: number]: number }>;
      listRef: React.RefObject<List>;
    };
  }) => {
    const { currentTime, isPlaying } = usePlayerState();
    const { utterances, onTimestampClick, measurerRef, rowHeights, listRef } =
      data;
    const utt = utterances[index];

    const rowRef = useCallback(
      (node: HTMLDivElement | null) => {
        if (node) {
          measurerRef.current[index] = node;
          const height = node.getBoundingClientRect().height;
          if (height !== rowHeights.current[index]) {
            rowHeights.current[index] = height;
            if (listRef.current) {
              listRef.current.resetAfterIndex(index);
            }
          }
        }
      },
      [index, measurerRef, rowHeights, listRef]
    );

    const handleTimestampClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onTimestampClick(utt.start / 1000);
      },
      [utt.start, onTimestampClick]
    );

    return (
      <div
        ref={rowRef}
        style={{ ...style, height: "auto" }}
        className="px-6 py-4"
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <Timestamp time={utt.start} onClick={handleTimestampClick} />
            <h2 className="font-semibold text-md underline">{utt.speaker}:</h2>
          </div>
          <div className="flex flex-wrap">
            {utt.words.map((word, wordIndex) => (
              <Word
                key={`${word.text}-${wordIndex}`}
                word={word}
                isHighlighted={
                  isPlaying &&
                  currentTime >= word.start / 1000 &&
                  currentTime <= word.end / 1000
                }
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
  areEqual
);

Row.displayName = "Row";

function Utterances({ utterances, onTimestampClick }: UtterancesProps) {
  const listRef = useRef<any>(null);
  const rowHeights = useRef<{ [key: number]: number }>({});
  const [isReady, setIsReady] = useState(false);
  const measurerRef = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const userScrollRef = useRef(false);
  const lastScrolledRef = useRef(0);
  const lastScrolledIndexRef = useRef(-1);

  const { currentTime, isPlaying } = usePlayerState();

  useEffect(() => {
    if (!isReady && utterances.length > 0) {
      requestAnimationFrame(() => {
        Object.values(measurerRef.current).forEach((node, index) => {
          if (node) {
            rowHeights.current[index] = node.getBoundingClientRect().height;
          }
        });
        setIsReady(true);
        if (listRef.current) {
          listRef.current.resetAfterIndex(0);
        }
      });
    }
  }, [utterances, isReady]);

  useEffect(() => {
    if (!isPlaying || !listRef.current || !utterances.length) return;

    if (userScrollRef.current) {
      const timeSinceLastScroll = Date.now() - lastScrolledRef.current;
      if (timeSinceLastScroll < 5000) return; // wait 5 sec before auto scroll again
      userScrollRef.current = false;
    }

    const currentTimeMs = currentTime * 1000;
    const utteranceIndex = findCurrentUtteranceIndex(utterances, currentTimeMs);
    const utterance = utterances[utteranceIndex];
    const wordIndex = findCurrentWordIndex(utterance, currentTimeMs);

    if (wordIndex === -1) return;

    // Calculate the scroll position for the word
    const rowNode = measurerRef.current[utteranceIndex];
    if (!rowNode) {
      return;
    }

    const wordNode = rowNode.querySelectorAll("span")[wordIndex];
    if (!wordNode) return;

    const rowTop = rowNode.offsetTop;
    const wordTop = wordNode.offsetTop;
    const wordHeight = wordNode.offsetHeight;
    const listHeight = listRef.current.props.height as number;
    const scrollTop = listRef.current.state.scrollOffset;

    const visibleTop = scrollTop;
    const visibleBottom = scrollTop + listHeight;

    const wordAbsoluteTop = rowTop + wordTop;
    const wordAbsoluteBottom = wordAbsoluteTop + wordHeight;

    const isWordOutOfView =
      wordAbsoluteTop < visibleTop || wordAbsoluteBottom > visibleBottom;

    if (isWordOutOfView) {
      const targetScrollTop = wordAbsoluteTop - listHeight / 2 + wordHeight / 2;

      // scroll to the word
      requestAnimationFrame(() => {
        listRef.current?.scrollTo(targetScrollTop);
      });

      lastScrolledIndexRef.current = utteranceIndex;
    }
  }, [currentTime, isPlaying, utterances]);

  const getRowHeight = useCallback(
    (index: number) => rowHeights.current[index] || 100,
    []
  );

  const handleUserScroll = useCallback(() => {
    userScrollRef.current = true;
    lastScrolledRef.current = Date.now();
  }, []);

  const itemData = useMemo(
    () => ({
      utterances,
      onTimestampClick,
      measurerRef,
      rowHeights,
      listRef,
    }),
    [utterances, onTimestampClick]
  );

  return (
    <div className="h-[420px] w-full relative">
      <div
        className="absolute inset-0"
        onWheel={handleUserScroll}
        onMouseDown={handleUserScroll}
        onTouchStart={handleUserScroll}
      >
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              width={width}
              height={height}
              itemCount={utterances.length}
              itemSize={getRowHeight}
              itemData={itemData}
              overscanCount={utterances.length}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

export default React.memo(Utterances);
