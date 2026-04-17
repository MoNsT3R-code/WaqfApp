import React from "react";
import { motion } from "motion/react";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({ className, showTagline = true, size = "md" }) => {
  const sizes = {
    sm: { icon: "w-8 h-8", text: "text-lg", tagline: "text-[8px]" },
    md: { icon: "w-16 h-16", text: "text-3xl", tagline: "text-[10px]" },
    lg: { icon: "w-24 h-24", text: "text-5xl", tagline: "text-xs" },
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`relative ${sizes[size].icon}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id="digitalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
          </defs>

          {/* Hand Silhouette */}
          <path
            d="M20 75C20 75 25 65 40 65C55 65 60 75 60 85C60 95 35 98 20 95C5 92 5 75 20 75Z"
            fill="#E5E7EB"
            opacity="0.8"
          />
          <path
            d="M35 65C35 65 40 55 55 55C70 55 85 65 85 80C85 95 70 98 55 98C40 98 35 65 35 65Z"
            fill="#D1D5DB"
          />

          {/* Tree Trunk */}
          <path
            d="M48 65L52 65L55 40L45 40L48 65Z"
            fill="#78350F"
          />

          {/* Organic Leaves */}
          <motion.path
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            d="M50 40C50 40 40 30 35 40C30 50 40 55 50 40Z"
            fill="url(#leafGradient)"
          />
          <motion.path
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            d="M50 40C50 40 60 30 65 40C70 50 60 55 50 40Z"
            fill="url(#leafGradient)"
          />
          
          {/* Digital Pixel Leaves */}
          <motion.rect
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            x="42" y="25" width="8" height="8" rx="1"
            fill="url(#digitalGradient)"
          />
          <motion.rect
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            x="52" y="18" width="6" height="6" rx="1"
            fill="url(#digitalGradient)"
          />
          <motion.rect
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            x="35" y="15" width="5" height="5" rx="1"
            fill="url(#digitalGradient)"
          />
          
          {/* Connecting Nodes */}
          <circle cx="46" cy="22" r="1.5" fill="#4ADE80" />
          <circle cx="55" cy="15" r="1.5" fill="#4ADE80" />
          <path d="M46 22L52 18" stroke="#4ADE80" strokeWidth="0.5" strokeDasharray="2 1" />
        </svg>
      </div>

      <div className="text-center">
        <h1 className={`${sizes[size].text} font-light tracking-tight text-[var(--text-p)] italic`}>
          WaqfApp
        </h1>
        {showTagline && (
          <p className={`${sizes[size].tagline} text-[var(--text-s)] uppercase tracking-[0.2em] mt-1 font-medium`}>
            Empowering Continuous Charity Through Technology.
          </p>
        )}
      </div>
    </div>
  );
};
