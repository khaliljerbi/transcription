import { getUtterancesApi } from "@/actions/lemur";
import { formatTime } from "@/lib/utils";
import { TranscriptUtterance } from "assemblyai";
import { useEffect, useMemo, useState } from "react";

function Utterances({
  utterances,
  transcriptId,
}: {
  utterances: TranscriptUtterance[];
  transcriptId: string;
}) {
  const [receivedUtts, setReceivedUtts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const getUtterances = async () => {
      const response = await getUtterancesApi(transcriptId, utterances);
      setReceivedUtts(JSON.parse(response));
      setIsLoading(false);
    };

    getUtterances();
  }, [transcriptId, utterances]);

  const updatedUtts = useMemo(() => {
    return utterances.map(({ channel, confidence, words, ...ut }) => ({
      ...ut,
      speaker: receivedUtts[ut.start],
    }));
  }, [receivedUtts, utterances]);

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-[420px]">
        <div className="animate-pulse flex flex-col gap-4 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="flex gap-4 items-center">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-h-[420px] overflow-scroll">
      {" "}
      <div className={"flex flex-col gap-4 "}>
        {updatedUtts.map((utt, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 overflow-hidden text-wrap"
          >
            <div className="flex gap-4 items-center">
              <span
                className="text-sm text-blue-500 cursor-pointer hover:underline hover:text-blue-500/60"
                // onClick={() => onChapterClick(text.start / 1000)}
              >
                {formatTime(utt.start)}
              </span>
              <h2 className="font-semibold text-md underline">
                {utt.speaker}:
              </h2>
            </div>
            <span className="flex flex-wrap">{utt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Utterances;
