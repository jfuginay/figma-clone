type CursorProps = {
  x: number;
  y: number;
  color: string;
  name: string;
};

export default function Cursor({ x, y, color, name }: CursorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {/* Custom SVG Cursor Pointer */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <path
          d="M5.65376 12.3673L13.6538 14.3673L11.6538 22.3673L5.65376 12.3673Z"
          fill={color}
        />
        <path
          d="M5.65376 12.3673L13.6538 14.3673L11.6538 22.3673L5.65376 12.3673Z"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.65376 12.3673L18.6538 5.36731L11.6538 22.3673"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User Name Label */}
      <div
        className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{
          backgroundColor: color,
        }}
      >
        {name}
      </div>
    </div>
  );
}
