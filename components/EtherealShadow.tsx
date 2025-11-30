import React from "react";
import { cn } from "../lib/utils";

interface EtherealShadowProps {
    className?: string;
    color?: string;
    animation?: {
        scale?: number;
        speed?: number;
    };
    noise?: {
        opacity?: number;
        scale?: number;
    };
    sizing?: "fill" | "contain";
}

export function EtherealShadow({
    className,
    color = "rgba(128, 128, 128, 1)",
    animation = { scale: 100, speed: 90 },
    noise = { opacity: 1, scale: 1.2 },
    sizing = "fill",
}: EtherealShadowProps) {
    const duration = animation.speed ? 100 - animation.speed : 10; // Invert speed for duration (higher speed = lower duration)

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-transparent",
                sizing === "fill" ? "w-full h-full" : "w-[500px] h-[500px]",
                className
            )}
        >
            {/* Shadow Blob */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-60 animate-pulse-slow"
                style={{
                    backgroundColor: color,
                    width: `${animation.scale || 100}%`,
                    height: `${animation.scale || 100}%`,
                    animationDuration: `${Math.max(2, duration)}s`,
                }}
            />

            {/* Noise Overlay */}
            <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay"
                style={{
                    opacity: noise.opacity,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    transform: `scale(${noise.scale})`,
                }}
            />
        </div>
    );
}
