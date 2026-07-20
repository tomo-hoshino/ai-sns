export type ProfilePersonaDetailsData = {
  summary: string;
  speakingStyle: string;
  focusPoints: readonly string[];
};

export type ProfilePersonaDetailsProps = {
  details: ProfilePersonaDetailsData;
};

export function ProfilePersonaDetails({ details }: ProfilePersonaDetailsProps) {
  return (
    <section
      aria-labelledby="persona-details-heading"
      className="border-border bg-card space-y-4 rounded-xl border p-4 sm:p-5"
    >
      <h2
        id="persona-details-heading"
        className="text-foreground text-base font-semibold tracking-tight"
      >
        キャラクター
      </h2>

      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-foreground text-sm font-medium">人物像</h3>
          <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
            {details.summary}
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="text-foreground text-sm font-medium">話し方</h3>
          <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
            {details.speakingStyle}
          </p>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-foreground text-sm font-medium">
            こんなところを見ます
          </h3>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            {details.focusPoints.map((point) => (
              <li key={point} className="break-words">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
