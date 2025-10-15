import { Liveblocks } from "@liveblocks/node";

export type LiveblocksSession = {
  allow: (room: string, access: unknown) => void;
  FULL_ACCESS: unknown;
  authorize: () => Promise<{ status: number; body: string }>;
};

type LiveblocksLike = {
  prepareSession: (userId: string, options?: { userInfo?: unknown }) => LiveblocksSession;
};

export function getLiveblocks(): Liveblocks | LiveblocksLike {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  // Don't instantiate at module import time. Some build steps (like
  // Next.js collecting page data) import server modules during the
  // build which can cause immediate validation of secrets and fail the
  // build if env vars are not configured in the environment. Defer
  // construction until runtime when the API route actually runs.
  if (!secret) {
    // Return a small object that throws a helpful error when used at
    // runtime instead of failing immediately during build.
    return {
      prepareSession() {
        throw new Error(
          "LIVEBLOCKS_SECRET_KEY is not set. Please add it to your environment variables (e.g. Vercel Project Settings > Environment Variables). The key must start with 'sk_'."
        );
      },
    };
  }

  return new Liveblocks({ secret });
}
