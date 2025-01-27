import { formatTime } from "@/lib/utils";
import { TranscriptUtterance } from "assemblyai";

function Utterances({
  utterances,
  onTimestampClick,
}: {
  utterances: TranscriptUtterance[];
  transcriptId: string;
  onTimestampClick: (timestamp: number) => void;
}) {
  return (
    <div className="p-4 max-h-[420px] overflow-scroll">
      {" "}
      <div className={"flex flex-col gap-4 "}>
        {utterances.map((utt, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 overflow-hidden text-wrap"
          >
            <div className="flex gap-4 items-center">
              <span
                className="text-sm text-blue-500 cursor-pointer hover:underline hover:text-blue-500/60"
                onClick={() => onTimestampClick(utt.start / 1000)}
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
