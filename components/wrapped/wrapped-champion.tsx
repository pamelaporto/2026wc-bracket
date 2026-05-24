"use client"

import { motion } from "framer-motion"
import { Trophy } from "lucide-react"
import { computeFlagGradient } from "@/lib/flags"
import type { QualifiedTeam } from "@/lib/build-bracket"

type Props = {
  champion: QualifiedTeam
  finalOpponent: QualifiedTeam | null
  onContinue: () => void
}

export function WrappedChampion({ champion, finalOpponent, onContinue }: Props) {
  return (
    <div className="wr-screen wr-champion">
      {/* Ambient glow from flag colors */}
      <motion.div
        className="wr-champion-ambient"
        style={{ backgroundImage: computeFlagGradient(champion.colors) }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: 1.2 }}
      />

      <div className="wr-screen-inner">
        <motion.div
          className="wr-champion-chip"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>YOUR CHAMPION</span>
        </motion.div>

        <motion.div
          className="wr-champion-flag"
          style={{ backgroundImage: computeFlagGradient(champion.colors) }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.h1
          className="wr-champion-name"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {champion.name}
        </motion.h1>

        {finalOpponent && (
          <motion.p
            className="wr-champion-final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            def. {finalOpponent.name} in the Final
          </motion.p>
        )}

        <motion.button
          className="wr-continue-btn"
          onClick={onContinue}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          whileTap={{ scale: 0.97 }}
        >
          Continue
        </motion.button>
      </div>
    </div>
  )
}
