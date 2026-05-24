"use client"

import { motion } from "framer-motion"

type Props = {
  headline: string
  onContinue: () => void
}

export function WrappedHeadline({ headline, onContinue }: Props) {
  // Split into words for staggered reveal
  const words = headline.split(" ")

  return (
    <div className="wr-screen wr-headline">
      <div className="wr-screen-inner">
        <motion.div
          className="wr-headline-eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          YOUR STORY
        </motion.div>

        <h1 className="wr-headline-text">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="wr-headline-word"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.4 + i * 0.07,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          ))}
        </h1>

        <motion.button
          className="wr-continue-btn"
          onClick={onContinue}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + words.length * 0.07 + 0.3, duration: 0.5 }}
          whileTap={{ scale: 0.97 }}
        >
          Continue
        </motion.button>
      </div>
    </div>
  )
}
