"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

type Props = {
  onSubmit: (name: string) => void
}

export function WrappedNameGate({ onSubmit }: Props) {
  const [value, setValue] = useState("")

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="wr-gate">
      <motion.div
        className="wr-gate-inner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="wr-gate-eyebrow">FIFA WORLD CUP 2026</div>
        <h1 className="wr-gate-title">Who made this prediction?</h1>
        <p className="wr-gate-hint">Your name goes on the card.</p>

        <div className="wr-gate-field">
          <input
            className="wr-gate-input"
            type="text"
            placeholder="Your name"
            value={value}
            autoFocus
            maxLength={32}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <motion.button
            className="wr-gate-btn"
            onClick={handleSubmit}
            disabled={!value.trim()}
            whileTap={{ scale: 0.96 }}
          >
            <span>Begin</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
