"use client";

import { useOthers, useSelf } from "@/liveblocks.config";

export default function ActiveUsers() {
  const others = useOthers();
  const self = useSelf();

  // Get all users (including self)
  const allUsers = [
    ...(self?.presence?.user ? [{ ...self.presence.user, isSelf: true }] : []),
    ...others
      .map((other) => other.presence?.user)
      .filter((user): user is NonNullable<typeof user> => user !== null && user !== undefined),
  ];

  const visibleUsers = allUsers.slice(0, 5);
  const remainingCount = allUsers.length - 5;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user, index) => (
          <div
            key={user.id}
            className="relative inline-block"
            style={{ zIndex: visibleUsers.length - index }}
            title={user.name}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium shadow-sm"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-xs font-medium shadow-sm"
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-gray-700">
        {allUsers.length} online
      </span>
    </div>
  );
}
