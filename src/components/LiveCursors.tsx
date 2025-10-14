"use client";

import { useOthers } from "@/liveblocks.config";
import Cursor from "./Cursor";

export default function LiveCursors() {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (!presence?.cursor || !presence?.user) {
          return null;
        }

        return (
          <Cursor
            key={connectionId}
            x={presence.cursor.x}
            y={presence.cursor.y}
            color={presence.user.color}
            name={presence.user.name}
          />
        );
      })}
    </>
  );
}
