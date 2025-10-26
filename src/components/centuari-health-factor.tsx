"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import Image from "next/image";

export default function HealthFactor() {
  const [targetValue, setTargetValue] = useState(55);
  const [displayValue, setDisplayValue] = useState(55);
  const [inputValue, setInputValue] = useState("55");
  const progressRef = useRef(null);
  const markerRef = useRef(null);
  const textRef = useRef(null);
  const animationRef = useRef({ value: 55 });

  const segments = [
    {
      start: 0,
      end: 60,
      color: "bg-green-500",
      hex: "#22c55e",
      label: "Excellent",
    },
    {
      start: 60,
      end: 75,
      color: "bg-yellow-500",
      hex: "#eab308",
      label: "Good",
    },
    {
      start: 75,
      end: 90,
      color: "bg-orange-500",
      hex: "#f97316",
      label: "Warning",
    },
    {
      start: 90,
      end: 100,
      color: "bg-red-500",
      hex: "#ef4444",
      label: "Critical",
    },
  ];

  const getActiveSegment = (val: number) => {
    return (
      segments.find((s) => val >= s.start && val < s.end) ||
      segments[segments.length - 1]
    );
  };

  useEffect(() => {
    const duration = (Math.abs(targetValue - displayValue) / 100) * 2; // Dynamic duration based on distance

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
  }, [targetValue]);

  const handleInputSubmit = () => {
    const num = parseInt(inputValue);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      animationRef.current.value = displayValue;
      setTargetValue(num);
    }
  };

  const handleQuickSet = (val: number) => {
    animationRef.current.value = displayValue;
    setTargetValue(val);
    setInputValue(val.toString());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputSubmit();
    }
  };

  const activeSegment = getActiveSegment(displayValue);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="space-y-8">
        <div className="relative">
          <div className="relative h-2 rounded-full overflow-hidden">
            <div className="absolute space-x-1 inset-0 flex">
              {segments.map((segment, idx) => (
                <div
                  key={idx}
                  className={`h-full ${segment.color} opacity-20 rounded-full`}
                  style={{ width: `${segment.end - segment.start}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-0">
              <div
                ref={progressRef}
                className={`h-full ${activeSegment.color}`}
                style={{ width: `${displayValue}%` }}
              />
            </div>
          </div>
          <Image
            ref={markerRef}
            className="absolute -top-3.5 -translate-x-1/2 -translate-y-1 w-4 ounded-xs shadow-lg pointer-events-none"
            src="/icons/marker.svg"
            alt="Progress Marker"
            width={16}
            height={16}
            style={{ left: `${displayValue}%` }}
          />
        </div>

        <div className="text-center space-y-4 pt-6">
          <div ref={textRef} className="text-5xl font-bold text-white">
            {displayValue}%
          </div>
          <div
            className={`text-sm font-medium transition-colors duration-300 ${
              displayValue < 60
                ? "text-green-400"
                : displayValue < 75
                ? "text-yellow-400"
                : displayValue < 90
                ? "text-orange-400"
                : "text-red-400"
            }`}
          >
            {activeSegment.label}
          </div>
        </div>

        {/* Quick Set Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            onClick={() => handleQuickSet(0)}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            0%
          </Button>
          <Button
            onClick={() => handleQuickSet(25)}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            25%
          </Button>
          <Button
            onClick={() => handleQuickSet(50)}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            50%
          </Button>
          <Button
            onClick={() => handleQuickSet(75)}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            75%
          </Button>
          <Button
            onClick={() => handleQuickSet(100)}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            100%
          </Button>
          <Button
            onClick={() => handleQuickSet(Math.floor(Math.random() * 101))}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            Random
          </Button>
        </div>
      </div>
    </div>
  );
}
