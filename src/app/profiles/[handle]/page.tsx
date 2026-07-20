import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileHeader } from "@/features/profiles/components/profile-header";
import { ProfilePersonaDetails } from "@/features/profiles/components/profile-persona-details";
import { ProfilePostList } from "@/features/profiles/components/profile-post-list";
import { getPersona } from "@/lib/ai/personas";
import { GetProfileError } from "@/lib/services/errors";
import { getAiAccounts } from "@/lib/services/get-ai-accounts";
import { getProfile } from "@/lib/services/get-profile";
import { listProfilePosts } from "@/lib/services/list-profile-posts";
import { DEFAULT_TIMELINE_LIMIT } from "@/lib/validations/common";
import { getProfileParamsSchema } from "@/lib/validations/profile";

/** Profile reads live DB data; do not statically prerender at build time. */
export const dynamic = "force-dynamic";

type ProfilePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const parsedParams = getProfileParamsSchema.safeParse({ handle });
  if (!parsedParams.success) {
    notFound();
  }

  let profileResponse;
  try {
    profileResponse = await getProfile({
      handle: parsedParams.data.handle,
    });
  } catch (error: unknown) {
    if (error instanceof GetProfileError) {
      notFound();
    }
    throw error;
  }

  const account = profileResponse.data;
  const personaDetails =
    account.accountType === "ai" && account.personaKey !== null
      ? getPersona(account.personaKey).profileDetails
      : null;

  const [postsResult, aiAccountsResponse] = await Promise.all([
    listProfilePosts({
      authorId: account.id,
      limit: DEFAULT_TIMELINE_LIMIT,
    }),
    getAiAccounts(),
  ]);

  return (
    <section aria-labelledby="profile-heading" className="space-y-4">
      <div className="space-y-3">
        <Link
          href="/"
          className="text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3"
        >
          ← タイムラインへ戻る
        </Link>

        <ProfileHeader account={account} />
        {personaDetails !== null ? (
          <ProfilePersonaDetails details={personaDetails} />
        ) : null}
      </div>

      <div className="space-y-3">
        <h2 className="text-foreground text-base font-semibold tracking-tight">
          ルート投稿
        </h2>
        <ProfilePostList
          posts={postsResult.posts}
          aiAccounts={aiAccountsResponse.data}
        />
      </div>
    </section>
  );
}
