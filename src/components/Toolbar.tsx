"use client";

import { useState } from "react";

// Export Tool type separately so it can be imported by other components
export type Tool = "select" | "rectangle" | "circle" | "text";

const COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F97316", // orange
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#14B8A6", // teal
  "#EAB308", // yellow
];

interface ToolbarProps {
  activeTool: Tool;
  activeColor: string;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
}

export default function Toolbar({
  activeTool,
  activeColor,
  onToolChange,
  onColorChange,
}: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: "select", label: "Select", icon: "⌃" },
    { id: "rectangle", label: "Rectangle", icon: "▭" },
    { id: "circle", label: "Circle", icon: "○" },
    { id: "text", label: "Text", icon: "T" },
  ];

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-2 flex items-center gap-1">
        {/* Tool Buttons */}
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all
              flex items-center justify-center min-w-[44px]
              ${
                activeTool === tool.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }
            `}
            title={tool.label}
          >
            <span className="text-lg">{tool.icon}</span>
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 mx-2" />

        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-10 h-10 rounded-md border-2 border-gray-300 shadow-sm hover:border-gray-400 transition-colors"
            style={{ backgroundColor: activeColor }}
            title="Change color"
          />

          {showColorPicker && (
            <div className="absolute top-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onColorChange(color);
                    setShowColorPicker(false);
                  }}
                  className={`
                    w-8 h-8 rounded-md border-2 transition-all
                    ${
                      activeColor === color
                        ? "border-gray-800 scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
