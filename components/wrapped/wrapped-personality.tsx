"use client"

import { motion } from "framer-motion"
import type { PersonalityArchetype } from "@/lib/wrapped-engine"

type Props = {
  archetype: PersonalityArchetype
  tagline: string
  volatilityScore: number // 0–1
  onContinue: () => void
}

const ARCHETYPE_COLORS: Record<PersonalityArchetype, string> = {
  "Chaos Agent": "#FF4D4D",
  "The Contrarian": "#C084FC",
  "The Loyalist": "#60A5FA",
  "The Prophet": "#34D399",
  "The Traditionalist": "#94A3B8",
  "The Romantic": "#FB923C",
}

const DOT_COUNT = 5

export function WrappedPersonality({ archetype, tagline, volatilityScore, onContinue }: Props) {
  const color = ARCHETYPE_COLORS[archetype]
  // How many dots are "filled" — volatilityScore 0→1 maps to 0→5 dots
  const filledDots = Math.round(volatilityScore * DOT_COUNT)

  return (
    <div className="wr-screen wr-personality">
      <div className="wr-screen-inner">
        <motion.div
          className="wr-personality-eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          YOUR BRACKET PERSONALITY
        </motion.div>

        <motion.h1
          className="wr-personality-archetype"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {archetype}
        </motion.h1>

        <motion.p
          className="wr-personality-tagline"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {tagline}
        </motion.p>

        {/* Volatility bar */}
        <motion.div
          className="wr-volatility"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <span className="wr-volatility-label">Risk Profile</span>
          <div className="wr-volatility-dots">
            {Array.from({ length: DOT_COUNT }, (_, i) => (
              <motion.div
                key={i}
                className="wr-volatility-dot"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.0 + i * 0.08, duration: 0.3, type: "spring" }}
                style={{
                  background: i < filledDots ? color : "rgba(255,255,255,0.12)",
                  boxShadow: i < filledDots ? `0 0 8px ${color}60` : "none",
                }}
              />
            ))}
          </div>
          <span className="wr-volatility-hint">
            {filledDots <= 1 ? "By the book" : filledDots <= 2 ? "Measured" : filledDots <= 3 ? "Bold" : filledDots <= 4 ? "Daring" : "Pure chaos"}
          </span>
        </motion.div>

        <motion.button
          className="wr-continue-btn"
          onClick={onContinue}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          whileTap={{ scale: 0.97 }}
        >
          Continue
        </motion.button>
      </div>
    </div>
  )
}
