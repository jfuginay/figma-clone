import { getLiveblocks } from "@/lib/liveblocks";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Get the current user from Clerk
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get the room ID from the request body
  const { room } = await request.json();

  // Prepare user info for Liveblocks
  const userInfo = {
    name: user.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user.emailAddresses[0]?.emailAddress || "Anonymous",
    email: user.emailAddresses[0]?.emailAddress,
    avatar: user.imageUrl,
  };

  // Create a session for the current user. Defer Liveblocks
  // instantiation until runtime so missing env vars produce a
  // helpful runtime error instead of failing the build.
  const liveblocks = getLiveblocks();
  const session = (liveblocks.prepareSession(userId, {
    userInfo,
  }) as import("@/lib/liveblocks").LiveblocksSession);

  // Grant access to the room
  if (room) {
    session.allow(room, session.FULL_ACCESS);
  }

  // Authorize the user and return the result
  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
