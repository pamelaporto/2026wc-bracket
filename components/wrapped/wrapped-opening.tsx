"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { computeFlagGradient } from "@/lib/flags"
import type { QualifiedTeam } from "@/lib/build-bracket"

type Props = {
  displayName: string
  champion: QualifiedTeam
  onContinue: () => void
}

export function WrappedOpening({ displayName, champion, onContinue }: Props) {
  // Auto-advance after 4 seconds
  useEffect(() => {
    const t = setTimeout(onContinue, 4000)
    return () => clearTimeout(t)
  }, [onContinue])

  return (
    <div className="wr-opening" onClick={onContinue}>
      <div className="wr-opening-bg" style={{ backgroundImage: computeFlagGradient(champion.colors) }} />
      <div className="wr-opening-overlay" />

      <motion.div
        className="wr-opening-inner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="wr-opening-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          FIFA WORLD CUP 2026
        </motion.div>

        <motion.h1
          className="wr-opening-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {displayName ? `${displayName}'s` : "Your"}
          <br />
          prediction
        </motion.h1>

        <motion.p
          className="wr-opening-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          48 nations. One trophy. Your call.
        </motion.p>

        <motion.div
          className="wr-opening-skip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ delay: 1.8, duration: 0.4 }}
        >
          Tap to continue
        </motion.div>
      </motion.div>
    </div>
  )
}
