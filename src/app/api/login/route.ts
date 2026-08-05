import { NextRequest } from "next/server";
import { getSession, safeEqual } from "@/lib/session";
import { errorJson, json } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const expectedUser = process.env.APP_USERNAME;
  const expectedPass = process.env.APP_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return errorJson(
      "Server is not configured for login (APP_USERNAME / APP_PASSWORD missing).",
      500
    );
  }

  let body: { username?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return errorJson("Invalid JSON body.", 400);
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  const ok =
    username.length > 0 &&
    safeEqual(username, expectedUser) &&
    safeEqual(password, expectedPass);

  if (!ok) {
    return errorJson("Invalid username or password.", 401);
  }

  const session = await getSession();
  session.user = username;
  await session.save();

  return json({ ok: true, user: username });
}
