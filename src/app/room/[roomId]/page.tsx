"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Room } from "@/components/Room";
import Canvas, { Tool } from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import ActiveUsers from "@/components/ActiveUsers";
import { UserButton } from "@clerk/nextjs";

type RoomPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [roomId, setRoomId] = useState<string>("");
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState("#3B82F6");

  useEffect(() => {
    // Unwrap params promise
    params.then((p) => setRoomId(p.roomId));
  }, [params]);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking auth or loading roomId
  if (!isLoaded || !isSignedIn || !roomId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Room roomId={roomId}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Figma Clone</h1>
            <span className="text-sm text-gray-500">Room: {roomId}</span>
          </div>
          <div className="flex items-center gap-4">
            <ActiveUsers />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Canvas Area with Toolbar */}
        <div className="flex-1 relative">
          <Toolbar
            activeTool={activeTool}
            activeColor={activeColor}
            onToolChange={setActiveTool}
            onColorChange={setActiveColor}
          />
          <Canvas 
            activeTool={activeTool} 
            activeColor={activeColor} 
            onToolChange={setActiveTool}
          />
          <KeyboardShortcuts />
        </div>
      </div>
    </Room>
  );
}
