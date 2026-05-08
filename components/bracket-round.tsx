"use client"

import { motion } from "framer-motion"
import { BracketCard } from "./bracket-card"
import type { Match } from "@/lib/build-bracket"
import { ROUND_LABELS } from "@/lib/build-bracket"

type BracketRoundProps = {
  round: number
  matches: Match[]
  onSelectWinner: (matchId: string, winnerId: string) => void
  side?: "left" | "right" | "center"
}

export function BracketRound({ round, matches, onSelectWinner, side = "center" }: BracketRoundProps) {
  const label = ROUND_LABELS[round] || `Round ${round}`
  const isCompact = round >= 3 // QF and beyond are more compact

  return (
    <motion.div
      className={`bracket-round bracket-round--${side} bracket-round--r${round}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: (round - 1) * 0.1 }}
    >
      <div className="bracket-round-header">
        <span className="bracket-round-label">{label}</span>
        <span className="bracket-round-count">{matches.length} {matches.length === 1 ? "match" : "matches"}</span>
      </div>
      
      <div className="bracket-round-matches">
        {matches.map((match) => (
          <BracketCard
            key={match.id}
            match={match}
            onSelectWinner={onSelectWinner}
            compact={isCompact}
          />
        ))}
      </div>
    </motion.div>
  )
}
