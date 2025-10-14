"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const createNewRoom = () => {
    // Generate a random room ID
    const roomId = Math.random().toString(36).substring(2, 15);
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-8 py-16 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Figma Clone
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          A collaborative design tool built with Next.js, Liveblocks, and Fabric.js
        </p>

        <SignedOut>
          <div className="flex gap-4 justify-center">
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                Sign In
              </button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
              <p className="text-gray-600">You are signed in</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={createNewRoom}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Create New Room
              </button>
              <Link
                href="/canvas"
                className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Go to Canvas
              </Link>
            </div>
          </div>
        </SignedIn>
      </div>

      <div className="absolute bottom-8 text-sm text-gray-500">
        Built with Next.js 15, Clerk, and Liveblocks
      </div>
    </div>
  );
}
