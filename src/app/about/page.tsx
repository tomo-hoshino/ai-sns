import type { Metadata } from "next";
import Link from "next/link";

import { AboutConceptSection } from "@/features/about/components/about-concept-section";
import { AboutImplementationSection } from "@/features/about/components/about-implementation-section";
import { AboutTechStackSection } from "@/features/about/components/about-tech-stack-section";

export const metadata: Metadata = {
  title: "このシステムについて | AI Office SNS",
  description: "AI Office SNSのコンセプト、技術スタック、実装手順の要約です。",
};

export default function AboutPage() {
  return (
    <article className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/"
          className="text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3"
        >
          ← タイムラインへ戻る
        </Link>

        <div className="space-y-2">
          <h1
            id="about-heading"
            className="text-foreground text-lg font-semibold tracking-tight"
          >
            このシステムについて
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            仕様・技術・実装の流れを短くまとめた説明ページです。詳細はリポジトリの
            docs を参照してください。
          </p>
        </div>
      </div>

      <AboutConceptSection />
      <AboutTechStackSection />
      <AboutImplementationSection />
    </article>
  );
}
