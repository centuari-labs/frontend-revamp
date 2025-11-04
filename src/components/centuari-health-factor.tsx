"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";

export default function HealthFactor() {
  const [targetValue, setTargetValue] = useState(55);
  const [displayValue, setDisplayValue] = useState(55);
  const progressRef = useRef(null);
  const markerRef = useRef(null);
  const textRef = useRef(null);
  const glowRef = useRef(null);
  const animationRef = useRef({ value: 55 });

  const segments = [
    {
      start: 0,
      end: 60,
      color: "bg-green-500",
      hex: "#22c55e",
      label: "Excellent",
      glow: "shadow-[0_0_20px_rgba(34,197,94,0.6)]",
    },
    {
      start: 60,
      end: 75,
      color: "bg-yellow-500",
      hex: "#eab308",
      label: "Good",
      glow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]",
    },
    {
      start: 75,
      end: 90,
      color: "bg-orange-500",
      hex: "#f97316",
      label: "Warning",
      glow: "shadow-[0_0_20px_rgba(249,115,22,0.6)]",
    },
    {
      start: 90,
      end: 100,
      color: "bg-red-500",
      hex: "#ef4444",
      label: "Critical",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
    },
  ];

  const getActiveSegment = (val: number) => {
    return (
      segments.find((s) => val >= s.start && val < s.end) ||
      segments[segments.length - 1]
    );
  };

  useEffect(() => {
    const duration = (Math.abs(targetValue - displayValue) / 100) * 2;

    gsap.to(animationRef.current, {
      value: targetValue,
      duration: Math.max(duration, 0.5),
      ease: "power2.out",
      onUpdate: () => {
        const currentValue = Math.round(animationRef.current.value);
        setDisplayValue(currentValue);

        if (progressRef.current) {
          gsap.to(progressRef.current, {
            width: `${currentValue}%`,
            duration: 0.1,
            ease: "none",
          });
        }

        if (markerRef.current) {
          gsap.to(markerRef.current, {
            left: `${currentValue}%`,
            duration: 0.1,
            ease: "none",
          });
        }
      },
    });

    if (textRef.current) {
      gsap.fromTo(
        textRef.current,
        { scale: 1.2, opacity: 0.7 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
      );
    }
  }, [targetValue, displayValue]);

  const activeSegment = getActiveSegment(displayValue);

  return (
    <div className="w-full">
      <div className="space-y-8">
        <div className="relative">
          <div className="relative h-1 w-full rounded-full overflow-visible">
            {/* Background segments */}
            <div className="absolute inset-0 flex space-x-1">
              {segments.map((segment, idx) => (
                <div
                  key={idx}
                  className={`h-full ${segment.color} opacity-20 rounded-full`}
                  style={{ width: `${segment.end - segment.start}%` }}
                />
              ))}
            </div>

            {/* Active progress with glow */}
            <div className="absolute inset-0">
              <div
                ref={progressRef}
                className={`h-full ${activeSegment.color} rounded-full transition-all duration-300`}
                style={{
                  width: `${displayValue}%`,
                  boxShadow: `0 0 20px ${activeSegment.hex}80, 0 0 40px ${activeSegment.hex}40`,
                }}
              />
            </div>

            {/* Glow overlay behind progress */}
            <div
              ref={glowRef}
              className="absolute inset-0 -z-10 blur-xl opacity-60 transition-all duration-300"
              style={{
                width: `${displayValue}%`,
                background: `linear-gradient(90deg, transparent, ${activeSegment.hex})`,
              }}
            />
          </div>

          {/* Marker with glow */}
          <div
            ref={markerRef}
            className="absolute -top-2 -translate-x-1/2 -translate-y-1 pointer-events-none transition-all duration-300"
            style={{ left: `${displayValue}%` }}
          >
            <div
              className="relative"
              style={{
                filter: `drop-shadow(0 0 8px ${activeSegment.hex}) drop-shadow(0 0 12px ${activeSegment.hex}80)`,
              }}
            >
              <Image
                className="w-2 rounded-xs"
                src="/icons/marker.svg"
                alt="Progress Marker"
                width={10}
                height={10}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
