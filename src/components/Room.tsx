"use client";

import { ReactNode, useEffect } from "react";
import { RoomProvider as LiveblocksRoomProvider, useUpdateMyPresence, useSelf } from "@/liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import { LiveMap } from "@liveblocks/client";
import { useUser } from "@clerk/nextjs";
import { getUserColor } from "@/lib/colors";

type RoomProps = {
  roomId: string;
  children: ReactNode;
};

function RoomContent({ children }: { children: ReactNode }) {
  const updateMyPresence = useUpdateMyPresence();
  const { user } = useUser();
  const self = useSelf();

  useEffect(() => {
    if (!user) return;

    // Only set user info if it hasn't been set yet
    if (!self?.presence?.user) {
      const userInfo = {
        id: user.id,
        name: user.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : user.emailAddresses[0]?.emailAddress || "Anonymous",
        color: getUserColor(user.id),
      };

      updateMyPresence({ user: userInfo });
    }
  }, [user, self, updateMyPresence]);

  return <>{children}</>;
}

export function Room({ roomId, children }: RoomProps) {
  return (
    <LiveblocksRoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        user: null,
      }}
      initialStorage={{
        objects: new LiveMap(),
      }}
    >
      <ClientSideSuspense fallback={<RoomLoading />}>
        {() => <RoomContent>{children}</RoomContent>}
      </ClientSideSuspense>
    </LiveblocksRoomProvider>
  );
}

function RoomLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-gray-600">Connecting to room...</p>
      </div>
    </div>
  );
}
