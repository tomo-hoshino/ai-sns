"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout(): Promise<void> {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isSigningOut}
      onClick={() => {
        void handleLogout();
      }}
    >
      {isSigningOut ? "ログアウト中…" : "ログアウト"}
    </Button>
  );
}
