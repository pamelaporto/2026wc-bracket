"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"

export type RitualStep = "groups" | "thirdPlace" | "bracket" | "wrap"

interface StepContent {
  title: string
  context: string
  instruction: string
}

const STEP_CONTENT: Record<RitualStep, StepContent> =  {
  groups: {
    
    title: "FIFA World Cup 2026 · Group stage begins ",
    instruction: "Drag teams to shape your groups. Lock when you believe.",
  },
  thirdPlace: {
    title: "FIFA World Cup 2026 · Third-place selection",
    instruction: "Select 8 third-place teams to advance to the knockout rounds.",
  },
  bracket: {
    title: "FIFA World Cup 2026 · Knockout stage",
    instruction: "Pick your winners. The path to the final awaits.",
  },
  wrap: {
    title: "Your Prophecy Complete",
    context: "World Cup 2026 · Final Prediction",
    instruction: "Review your complete bracket and share your vision.",
  },
}

interface RitualHeaderProps {
  currentStep: RitualStep
  canContinue: boolean
  onBack?: () => void
  onContinue?: () => void
  showBack?: boolean
  continueLabel?: string
}

export function RitualHeader({
  currentStep,
  canContinue,
  onBack,
  onContinue,
  showBack = true,
  continueLabel = "Continue",
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
        {/* Left: Back button */}
        <div className="ritual-header__left">
          {showBack && onBack && (
            <motion.button
              className="ritual-nav-btn ritual-nav-btn--back"
              onClick={onBack}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Go back to previous step"
            >
              <ArrowLeft className="ritual-nav-icon" />
              <span className="ritual-nav-label">Back</span>
            </motion.button>
          )}
        </div>

        {/* Center: Titles */}
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
              <h1 className="ritual-title">{content.title}</h1>
              <p className="ritual-context">{content.context}</p>
              <p className="ritual-instruction">{content.instruction}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Continue button */}
        <div className="ritual-header__right">
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
              
              {/* Glow effect when enabled */}
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

      {/* Progress indicator */}
      <div className="ritual-progress" aria-hidden="true">
        <div className="ritual-progress-track">
          {(["groups", "thirdPlace", "bracket", "wrap"] as RitualStep[]).map((step, index) => {
            const stepIndex = ["groups", "thirdPlace", "bracket", "wrap"].indexOf(currentStep)
            const isComplete = index < stepIndex
            const isCurrent = step === currentStep
            
            return (
              <div
                key={step}
                className={`ritual-progress-dot ${isComplete ? "is-complete" : ""} ${isCurrent ? "is-current" : ""}`}
              />
            )
          })}
        </div>
      </div>
    </motion.header>
  )
}
