"use client"

import { motion } from "framer-motion"
import type { Insight } from "@/lib/wrapped-engine"

type Props = {
  insights: Insight[]
  onContinue: () => void
}

export function WrappedInsights({ insights, onContinue }: Props) {
  return (
    <div className="wr-screen wr-insights">
      <div className="wr-screen-inner">
        <motion.div
          className="wr-insights-eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          BY THE NUMBERS
        </motion.div>

        <div className="wr-insights-list">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              className="wr-insight-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.4 + i * 0.2,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="wr-insight-number">{String(i + 1).padStart(2, "0")}</div>
              <div className="wr-insight-content">
                <div className="wr-insight-label">{insight.label}</div>
                <div className="wr-insight-caption">{insight.caption}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          className="wr-continue-btn"
          onClick={onContinue}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + insights.length * 0.2 + 0.3, duration: 0.5 }}
          whileTap={{ scale: 0.97 }}
        >
          See Your Card
        </motion.button>
      </div>
    </div>
  )
}
