import { getMentionClass } from "@/features/posts/utils/persona-styles";
import { splitContentWithMentions } from "@/features/posts/utils/split-content-with-mentions";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/account";

export type PostContentProps = {
  content: string;
  aiAccounts: readonly Account[];
};

/** 投稿本文をReact textとして描画し、有効メンションだけを強調する。 */
export function PostContent({ content, aiAccounts }: PostContentProps) {
  const segments = splitContentWithMentions(content, aiAccounts);

  return (
    <p className="text-foreground break-words whitespace-pre-wrap">
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={index}>{segment.value}</span>;
        }

        return (
          <span
            key={index}
            className={cn("font-medium", getMentionClass(segment.account))}
          >
            {segment.value}
          </span>
        );
      })}
    </p>
  );
}
