import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { globalSearch } from "@/services/search";
import { HfL2Search } from "@/components/hf/screens/HfL2Search";

export const dynamic = "force-dynamic";

/**
 * Global search page — renders the literal-port HfL2Search. No PageShell:
 * the design has its own search-bar header.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const sp = await searchParams;
  const q = sp.q ?? "";
  const hits = q ? await globalSearch(principal, q) : [];

  return <HfL2Search query={q} results={hits} />;
}
