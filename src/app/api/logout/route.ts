import { getSession } from "@/lib/session";
import { json } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return json({ ok: true });
}
