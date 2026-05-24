"use client"

import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft } from "lucide-react"

export type RitualStep = "groups" | "thirdPlace" | "bracket" | "wrap"

interface StepContent {
  step: string
  series: string
}

const STEP_CONTENT: Record<RitualStep, StepContent> = {
  groups: {
    step: "Group stage",
    series: "FIFA World Cup 2026",
  },
  thirdPlace: {
    step: "Best third-place teams",
    series: "FIFA World Cup 2026",
  },
  bracket: {
    step: "Knockout",
    series: "FIFA World Cup 2026",
  },
  wrap: {
    step: "Your prophecy complete",
    series: "World Cup 2026",
  },
}

interface RitualHeaderProps {
  currentStep: RitualStep
  canContinue: boolean
  /** Clicking the logo mark returns to the homepage hero */
  onHome?: () => void
  /** Step-aware back navigation — only rendered when provided */
  onBack?: () => void
  onContinue?: () => void
  continueLabel?: string
  rightExtra?: ReactNode
}

export function RitualHeader({
  currentStep,
  canContinue,
  onHome,
  onBack,
  onContinue,
  continueLabel = "Continue",
  rightExtra,
}: RitualHeaderProps) {
  const content = STEP_CONTENT[currentStep]

  return (
    <motion.header
      className="ritual-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ritual-header__inner">
        {/* Left: Logo mark — always navigates home. Back button appears to its right when onBack is provided */}
        <div className="ritual-header__left">
          <motion.button
            className="ritual-logo-btn"
            onClick={onHome}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Return to home"
            disabled={!onHome}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/b26-mark.svg"
              alt="bracket26"
              className="ritual-logo-img"
              width={35}
              height={26}
            />
          </motion.button>

          {onBack && (
            <motion.button
              className="ritual-nav-btn ritual-nav-btn--back"
              onClick={onBack}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Go back"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <ArrowLeft className="ritual-nav-icon" />
              <span className="ritual-nav-label">Back</span>
            </motion.button>
          )}
        </div>

        {/* Center: Step · Series */}
        <div className="ritual-header__center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              className="ritual-titles"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="ritual-title">
                <span className="ritual-title-step">{content.step}</span>
                <span className="ritual-title-sep"> · </span>
                <span className="ritual-title-series">{content.series}</span>
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: optional extra + Continue */}
        <div className="ritual-header__right">
          {rightExtra}
          {onContinue && (
            <motion.button
              className={`ritual-nav-btn ritual-nav-btn--continue ${canContinue ? "is-enabled" : ""}`}
              onClick={onContinue}
              disabled={!canContinue}
              whileHover={canContinue ? { x: 2 } : {}}
              whileTap={canContinue ? { scale: 0.98 } : {}}
              aria-label={canContinue ? "Continue to next step" : "Complete requirements to continue"}
            >
              <span className="ritual-nav-label">{continueLabel}</span>
              <ArrowRight className="ritual-nav-icon" />

              {canContinue && (
                <motion.div
                  className="ritual-continue-glow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  )
}
