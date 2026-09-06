"use client";

import React, { useState } from "react";
import { JobPlatform, PLATFORMS_CONFIG } from "@/types/job";

interface PlatformLogoProps {
  platform: JobPlatform | string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  showBorder?: boolean;
  variant?: "app" | "icon";
}

/**
 * High-definition SVG vectors and official app icons for Job Portals
 * (Greenhouse, Lever, Workable, Wellfound)
 */
export function PlatformLogo({
  platform,
  size = "md",
  className = "",
  showBorder = false,
  variant = "app",
}: PlatformLogoProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const normalizedKey = (platform || "greenhouse").toLowerCase() as JobPlatform;
  const config = PLATFORMS_CONFIG[normalizedKey] || PLATFORMS_CONFIG.greenhouse;

  // Determine dimension classes or inline sizes
  const sizeMap: Record<string, { sizeClass: string; px: number; rounded: string }> = {
    xs: { sizeClass: "size-4", px: 16, rounded: "rounded-md" },
    sm: { sizeClass: "size-5", px: 20, rounded: "rounded-md" },
    md: { sizeClass: "size-7", px: 28, rounded: "rounded-lg" },
    lg: { sizeClass: "size-10", px: 40, rounded: "rounded-xl" },
    xl: { sizeClass: "size-14", px: 56, rounded: "rounded-2xl" },
  };

  const currentSize = typeof size === "number"
    ? { sizeClass: "", px: size, rounded: size > 32 ? "rounded-xl" : "rounded-md" }
    : sizeMap[size] || sizeMap.md;

  const styleDimension = typeof size === "number" ? { width: size, height: size } : undefined;

  // Render standalone inline SVG vector glyph
  const renderSvgGlyph = () => {
    switch (normalizedKey) {
      case "greenhouse":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16.279 7.13c0 1.16-.49 2.185-1.293 2.987-.891.891-2.184 1.114-2.184 1.872 0 1.025 1.65.713 3.231 2.295 1.048 1.047 1.694 2.43 1.694 4.034C17.727 21.482 15.187 24 12 24c-3.187 0-5.727-2.518-5.727-5.68 0-1.607.646-2.989 1.694-4.036 1.582-1.582 3.23-1.27 3.23-2.295 0-.758-1.292-.98-2.183-1.872-.802-.802-1.293-1.827-1.293-3.03 0-2.318 1.895-4.19 4.212-4.19.446 0 .847.067 1.181.067.602 0 .914-.268.914-.691 0-.245-.112-.557-.112-.891 0-.758.647-1.382 1.427-1.382s1.404.646 1.404 1.426c0 .825-.647 1.204-1.137 1.382-.401.134-.713.312-.713.713 0 .758 1.382 1.493 1.382 3.61zm-.446 11.19c0-2.206-1.627-3.99-3.833-3.99-2.206 0-3.833 1.784-3.833 3.99 0 2.184 1.627 3.989 3.833 3.989 2.206 0 3.833-1.808 3.833-3.99zM14.518 7.086c0-1.404-1.136-2.562-2.518-2.562S9.482 5.682 9.482 7.086 10.618 9.65 12 9.65s2.518-1.159 2.518-2.563z" />
          </svg>
        );

      case "lever":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="currentColor"
            className="size-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.5 5C2.67157 5 2 5.67157 2 6.5V21.5C2 22.3284 2.67157 23 3.5 23C4.32843 23 5 22.3284 5 21.5V6.5C5 5.67157 4.32843 5 3.5 5ZM10.5 11C9.67157 11 9 11.6716 9 12.5V21.5C9 22.3284 9.67157 23 10.5 23C11.3284 23 12 22.3284 12 21.5V12.5C12 11.6716 11.3284 11 10.5 11ZM17.5 7C16.6716 7 16 7.67157 16 8.5V21.5C16 22.3284 16.6716 23 17.5 23C18.3284 23 19 22.3284 19 21.5V8.5C19 7.67157 18.3284 7 17.5 7ZM24.5 15C23.6716 15 23 15.6716 23 16.5V21.5C23 22.3284 23.6716 23 24.5 23C25.3284 23 26 22.3284 26 21.5V16.5C26 15.6716 25.3284 15 24.5 15Z"
            />
          </svg>
        );

      case "workable":
        return (
          <svg
            viewBox="0 0 512 512"
            fill="currentColor"
            className="size-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M381.511 242.629C381.285 243.756 381.06 244.883 380.834 246.235C374.07 297.623 344.307 341.122 299.211 317.231C298.309 318.358 297.407 319.71 296.505 320.837C291.996 326.246 286.81 330.754 282.075 334.586C281.849 334.586 281.849 334.36 281.624 334.36C286.584 337.516 291.545 339.995 296.505 341.798C351.973 363.209 402.706 310.244 407.666 243.756L381.511 242.629Z" />
            <path d="M296.506 284.324C306.427 266.745 311.613 251.193 311.388 239.248C311.162 224.373 305.3 213.329 296.506 206.116C270.35 184.254 218.941 195.974 219.618 239.924C219.843 256.602 227.96 278.014 248.93 303.933C248.93 303.933 260.655 293.565 263.135 284.099C207.442 208.37 324.465 204.313 266.292 288.156C266.292 288.156 259.527 299.2 250.959 306.412C232.695 323.541 216.236 328.95 202.03 326.696C152.2 318.583 144.308 244.206 140.475 200.031H104.173C104.173 200.482 104.173 200.933 104.173 201.609V209.948C105.976 297.622 168.209 419.554 267.419 323.766C277.34 313.85 282.752 306.187 282.752 306.187C287.938 298.298 292.673 291.086 296.506 284.324Z" />
          </svg>
        );

      case "wellfound":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M23.998 8.128c.063-1.379-1.612-2.376-2.795-1.664-1.23.598-1.322 2.52-.156 3.234 1.2.862 2.995-.09 2.951-1.57zm0 7.748c.063-1.38-1.612-2.377-2.795-1.665-1.23.598-1.322 2.52-.156 3.234 1.2.863 2.995-.09 2.951-1.57zm-20.5 1.762L0 6.364h3.257l2.066 8.106 2.245-8.106h3.267l2.244 8.106 2.065-8.106h3.257l-3.54 11.274H11.39c-.73-2.713-1.46-5.426-2.188-8.14l-2.233 8.14H3.5z" />
          </svg>
        );

      default:
        return (
          <span className="font-extrabold text-[10px] tracking-tight">
            {config.name.slice(0, 2).toUpperCase()}
          </span>
        );
    }
  };

  // If "icon" variant requested:
  if (variant === "icon") {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${currentSize.sizeClass} ${className}`}
        style={{ ...styleDimension, color: config.accentColor }}
      >
        {renderSvgGlyph()}
      </span>
    );
  }

  // Full official web app icon
  const logoPath = `/platforms/${normalizedKey}.svg`;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-sm transition-transform ${currentSize.sizeClass} ${currentSize.rounded} ${
        showBorder ? "ring-1 ring-white/10" : ""
      } ${className}`}
      style={styleDimension}
    >
      {!hasImageError ? (
        <img
          src={logoPath}
          alt={`${config.name} Web App Icon`}
          loading="lazy"
          onError={() => setHasImageError(true)}
          className={`size-full object-cover select-none ${currentSize.rounded}`}
        />
      ) : (
        <div
          className={`size-full flex items-center justify-center p-1 font-bold ${currentSize.rounded}`}
          style={{
            backgroundColor: `${config.accentColor}25`,
            color: config.accentColor,
            border: `1px solid ${config.accentColor}40`,
          }}
        >
          {renderSvgGlyph()}
        </div>
      )}
    </div>
  );
}
