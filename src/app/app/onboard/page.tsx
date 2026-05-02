import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { HfL2Onboard } from "@/components/hf/screens/HfL2Onboard";

export const dynamic = "force-dynamic";

/**
 * First-run onboarding screen — renders the literal HfL2Onboard port.
 * No PageShell because this is a full-screen pre-app view.
 */
export default async function OnboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  return <HfL2Onboard />;
}
