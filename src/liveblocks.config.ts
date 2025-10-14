import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { LiveMap } from "@liveblocks/client";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 16,
});

// Presence represents the properties that exist on every user in the Room
// and that will automatically be kept in sync. Accessible through the
// `user.presence` property. Must be JSON-serializable.
type Presence = {
  cursor: { x: number; y: number } | null;
  user: {
    id: string;
    name: string;
    color: string;
  } | null;
};

// Storage represents the shared document that persists in the Room, even after
// all users leave. Fields under Storage typically are LiveList, LiveMap,
// LiveObject instances, for which updates are automatically persisted and
// synced to all connected clients.
type Storage = {
  objects: LiveMap<string, {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    version?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
  }>;
};

// Optionally, UserMeta represents static/readonly metadata on each user, as
// provided by your own custom auth back end (if used). Useful for data that
// will not change during a session, like a user's name or avatar.
type UserMeta = {
  id: string;
  info: {
    name: string;
    email?: string;
    avatar?: string;
  };
};

// Optionally, the type of custom events broadcast and listened to in this
// room. Use a union for multiple events. Must be JSON-serializable.
type RoomEvent = {
  type: "SHAPE_UPDATED";
  shapeId: string;
};

// Optionally, when using Comments, ThreadMetadata represents metadata on
// each thread. Can only contain booleans, strings, and numbers.
export type ThreadMetadata = {
  resolved: boolean;
  x: number;
  y: number;
};

export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useSelf,
    useOthers,
    useOthersMapped,
    useOthersConnectionIds,
    useOther,
    useBroadcastEvent,
    useEventListener,
    useErrorListener,
    useStorage,
    useMutation,
    useStatus,
    useLostConnectionListener,
    useThreads,
    useCreateThread,
    useEditThreadMetadata,
    useCreateComment,
    useEditComment,
    useDeleteComment,
    useAddReaction,
    useRemoveReaction,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(
  client
);

export { LiveMap };
