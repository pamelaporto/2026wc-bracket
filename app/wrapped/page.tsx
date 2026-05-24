"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { buildWrappedProfile, type WrappedProfile } from "@/lib/wrapped-engine"
import type { BracketState } from "@/lib/build-bracket"
import { WrappedNameGate } from "@/components/wrapped/wrapped-name-gate"
import { WrappedOpening } from "@/components/wrapped/wrapped-opening"
import { WrappedChampion } from "@/components/wrapped/wrapped-champion"
import { WrappedHeadline } from "@/components/wrapped/wrapped-headline"
import { WrappedPersonality } from "@/components/wrapped/wrapped-personality"
import { WrappedInsights } from "@/components/wrapped/wrapped-insights"
import { WrappedShare } from "@/components/wrapped/wrapped-share"

const BRACKET_PICKS_KEY = "wc2026-bracket-picks-v1"
const WRAPPED_NAME_KEY = "wc2026-wrapped-name-v1"
const WRAPPED_VISITED_KEY = "wc2026-wrapped-visited-v1"

type WrappedStep = "name" | "opening" | "champion" | "headline" | "personality" | "insights" | "share"

const STEP_ORDER: WrappedStep[] = [
  "name", "opening", "champion", "headline", "personality", "insights", "share",
]

const SLIDE_VARIANTS = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const SLIDE_TRANSITION = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }

export default function WrappedPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<WrappedStep>("name")
  const [profile, setProfile] = useState<WrappedProfile | null>(null)

  useEffect(() => {
    setMounted(true)

    const bracketRaw = localStorage.getItem(BRACKET_PICKS_KEY)
    if (!bracketRaw) { router.push("/bracket"); return }

    let bracket: BracketState
    try {
      bracket = JSON.parse(bracketRaw)
    } catch {
      router.push("/bracket")
      return
    }

    if (!bracket.champion) { router.push("/bracket"); return }

    const wrappedName = localStorage.getItem(WRAPPED_NAME_KEY) ?? ""
    const hasVisited = localStorage.getItem(WRAPPED_VISITED_KEY) === "true"

    if (wrappedName) {
      const p = buildWrappedProfile(bracket, wrappedName)
      setProfile(p)
      // Return visitors skip straight to share card
      setStep(hasVisited ? "share" : "opening")
    } else {
      // Build profile with empty name for now; name gate will rebuild it
      setProfile(buildWrappedProfile(bracket, ""))
      setStep("name")
    }
  }, [router])

  const handleNameSubmit = useCallback((name: string) => {
    localStorage.setItem(WRAPPED_NAME_KEY, name)
    const bracketRaw = localStorage.getItem(BRACKET_PICKS_KEY)
    if (bracketRaw) {
      try {
        const bracket: BracketState = JSON.parse(bracketRaw)
        setProfile(buildWrappedProfile(bracket, name))
      } catch { /* ignore */ }
    }
    setStep("opening")
  }, [])

  const handleContinue = useCallback(() => {
    setStep((current) => {
      const idx = STEP_ORDER.indexOf(current)
      if (idx < STEP_ORDER.length - 1) return STEP_ORDER[idx + 1]
      return current
    })
    // Mark visited once we reach the share card
    if (step === "insights") {
      localStorage.setItem(WRAPPED_VISITED_KEY, "true")
    }
  }, [step])

  const handleReplay = useCallback(() => {
    setStep("opening")
  }, [])

  if (!mounted) return null

  // Guard: if no profile and not on name step, bail
  if (!profile && step !== "name") return null

  return (
    <div className="wr-shell">
      <AnimatePresence mode="wait">
        {step === "name" && (
          <motion.div key="name" className="wr-step" {...SLIDE_VARIANTS} transition={SLIDE_TRANSITION}>
            <WrappedNameGate onSubmit={handleNameSubmit} />
          </motion.div>
        )}

        {step === "opening" && profile && (
          <motion.div key="opening" className="wr-step" {...SLIDE_VARIANTS} transition={SLIDE_TRANSITION}>
            <WrappedOpening
              displayName={profile.displayName}
              champion={profile.champion}
              onContinue={handleContinue}
            />
          </motion.div>
        )}

        {step === "champion" && profile && (
          <motion.div key="champion" className="wr-step" {...SLIDE_VARIANTS} transition={SLIDE_TRANSITION}>
            <WrappedChampion
              champion={profile.champion}
              finalOpponent={profile.finalOpponent}
              onContinue={handleContinue}
            />
          </motion.div>
        )}

        {step === "headline" && profile && (
          <motion.div key="headline" className="wr-step" {...SLIDE_VARIANTS} transition={SLIDE_TRANSITION}>
            <WrappedHeadline headline={profile.headline} onContinue={handleContinue} />
          </motion.div>
        )}

        {step === "personality" && profile && (
          <motion.div key="personality" className="wr-step" {...SLIDE_VARIANTS} transition={SLIDE_TRANSITION}>
            <WrappedPersonality
              archetype={profile.personalityArchetype}
              tagline={profile.archetypeTagline}
              volatilityScore={profile.volatilityScore}
              onContinue={handleContinue}
            />
          </motion.div>
        )}

        {step === "insights" && profile && (
          <motion.div key="insights" className="wr-step" {...SLIDE_VARIANTS} transition={SLIDE_TRANSITION}>
            <WrappedInsights insights={profile.insights} onContinue={handleContinue} />
          </motion.div>
        )}

        {step === "share" && profile && (
          <motion.div key="share" className="wr-step" {...SLIDE_VARIANTS} transition={SLIDE_TRANSITION}>
            <WrappedShare profile={profile} onReplay={handleReplay} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
