// 8 distinct colors for user cursors and avatars
const USER_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
];

/**
 * Generates a deterministic color for a user based on their ID
 * @param userId - The user's unique identifier
 * @returns A color hex string
 */
export function getUserColor(userId: string): string {
  // Simple hash function to get a number from the user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Get absolute value and map to color array
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}
