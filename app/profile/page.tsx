import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getMyRunnerProfile } from "@/lib/db/runner-profile";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getMyRunnerProfile();

  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <PageHeader eyebrow="Account" title="Profile" />
      <ProfileForm
        defaults={{
          displayName: profile?.display_name ?? "",
          ageBand: profile?.age_band ?? "",
          experienceLevel: profile?.experience_level ?? "",
        }}
      />
    </main>
  );
}
