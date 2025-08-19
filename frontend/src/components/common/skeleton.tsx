import React from "react";

export default function Skeleton({ className = "" }: { className?: string }) {
    return (
      <div
        className={`animate-pulse bg-[hsl(222,37%,14%)]/70 rounded-xl ${className}`}
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(200,200,255,0.06) 50%, rgba(255,255,255,0) 100%)",
          backgroundSize: "200% 100%",
        }}
      />
    );
  }
  