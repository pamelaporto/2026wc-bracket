"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { GroupStack } from "@/components/group-stack"
import { HomeCarousel } from "@/components/home-carousel"
import { RitualHeader, type RitualStep } from "@/components/ritual-header"
import teamsData from "@/data/teams.json"
import {
  rankThirdPlaceTeams,
  type ThirdPlaceTeam,
  type RankedThirdPlaceTeam,
} from "@/lib/thirdPlace"
import { ThirdPlaceStep } from "@/components/third-place-step"
import { CountdownTimer } from "@/components/countdown-timer"

type TeamOption = {
  id: string
  name: string
  colors?: string[]
}

type TeamUI = {
  id: string
  name: string
  colors?: string[]
  is_placeholder: boolean
  placeholder_options?: TeamOption[]
}

type GroupsState = Record<string, TeamUI[]>

const STORAGE_KEY = "wc2026-bracket-draft-v5"
const THIRD_PLACE_KEY = "wc2026-third-place-selection-v1"
const BRACKET_PICKS_KEY = "wc2026-bracket-picks-v1"
const WRAPPED_NAME_KEY = "wc2026-wrapped-name-v1"
const WRAPPED_VISITED_KEY = "wc2026-wrapped-visited-v1"
const BRACKET_SOURCE_KEY = "wc2026-bracket-source-v1"
const FLOW_STEP_KEY = "wc2026-flow-step-v1"

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
}




export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [groups, setGroups] = useState<GroupsState>((teamsData as any).groups as GroupsState)

  // intro timing
  const [introExiting, setIntroExiting] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  // letter the user clicked on the carousel (used to jump GroupStack to that group)
  const [initialGroupLetter, setInitialGroupLetter] = useState<string | undefined>(undefined)

  // Step navigation
  const [currentStep, setCurrentStep] = useState<RitualStep>("groups")

  // Lock count surfaced from GroupStack
  const [lockedGroupsCount, setLockedGroupsCount] = useState(0)

  // Third-place selection state
  const [selectedThirdPlaceGroups, setSelectedThirdPlaceGroups] = useState<Set<string>>(new Set())

  // Confirmation modal — shown when user tries to continue past Groups with a stale bracket
  const [showBracketResetConfirm, setShowBracketResetConfirm] = useState(false)

  // Always derive letters from teams.json (A–L)
  const groupLetters = useMemo(() => Object.keys((teamsData as any).groups ?? {}).sort(), [])

  useEffect(() => {
    setMounted(true)

    // restore saved picks (if they exist)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === "object") {
          setGroups((prev) => {
            const merged: GroupsState = { ...(prev as any) }
            groupLetters.forEach((letter) => {
              if (Array.isArray(parsed[letter])) merged[letter] = parsed[letter]
            })
            return merged
          })
        }
      } catch {
        // ignore
      }
    }

    // restore saved third-place selection
    const savedThirdPlace = localStorage.getItem(THIRD_PLACE_KEY)
    if (savedThirdPlace) {
      try {
        const parsed = JSON.parse(savedThirdPlace)
        if (Array.isArray(parsed)) {
          setSelectedThirdPlaceGroups(new Set(parsed))
        }
      } catch {
        // ignore
      }
    }

    // Restore Third Place step for unfinished flows only.
    // Conditions: step was "thirdPlace" AND third-place picks exist AND no bracket yet.
    // Completed users (bracket exists) always return to the carousel instead.
    const storedStep = localStorage.getItem(FLOW_STEP_KEY)
    const hasThirdPlaceData = !!localStorage.getItem(THIRD_PLACE_KEY)
    const hasBracket = !!localStorage.getItem(BRACKET_PICKS_KEY)

    if (storedStep === "thirdPlace" && hasThirdPlaceData && !hasBracket) {
      // Guard: validate the group data that will actually be used.
      // If STORAGE_KEY is absent or corrupt (groups with < 3 teams), the merge
      // logic would replace teamsData defaults with short arrays, leaving
      // rankedThirdPlaceTeams empty and ThirdPlaceStep with no cards.
      // Reuse `saved` (already parsed above) or fall back to teamsData defaults.
      const groupsSource = (() => {
        try {
          const p = saved ? JSON.parse(saved) : null
          return p && typeof p === "object" ? p : (teamsData as any).groups
        } catch { return (teamsData as any).groups }
      })()
      const groupsAreValid = groupLetters.every(
        (letter) =>
          Array.isArray(groupsSource[letter]) &&
          groupsSource[letter].length >= 3
      )
      if (groupsAreValid) {
        setCurrentStep("thirdPlace")
        setIntroDone(true)
      }
      // If invalid: fall through silently → carousel plays → user re-enters from Groups
    }

  }, [groupLetters])

  useEffect(() => {
    if (mounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }, [groups, mounted])

  // Persist third-place selection
  useEffect(() => {
    if (mounted && selectedThirdPlaceGroups.size > 0) {
      localStorage.setItem(THIRD_PLACE_KEY, JSON.stringify([...selectedThirdPlaceGroups]))
    }
  }, [selectedThirdPlaceGroups, mounted])

  // Called when a carousel card is clicked — letter is which group the user picked
  const handleCarouselSelect = useCallback((letter: string) => {
    setInitialGroupLetter(letter)
    setIntroExiting(true)
    setTimeout(() => setIntroDone(true), 650)
  }, [])

  const groupsUI: GroupsState = useMemo(() => {
    return Object.fromEntries(
      Object.entries(groups).map(([letter, teams]) => [
        letter,
        (teams as any[]).map((t) => ({
          id: t.id ?? t.team_id ?? slugify(t.name ?? "team"),
          name: t.name ?? "Unknown",
          colors: t.colors ?? ["#6B7280", "#9CA3AF"],
          is_placeholder: Boolean(t.is_placeholder),
          placeholder_options: t.placeholder_options?.map((o: any) => ({
            id: o.id ?? o.team_id ?? slugify(o.name ?? "option"),
            name: o.name ?? "Unknown",
            colors: o.colors ?? ["#6B7280", "#9CA3AF"],
          })),
        })),
      ]),
    )
  }, [groups])

  // Derive third-place teams directly from groupsUI: teams[2] for each group A–L.
  // Uses groupLetters (from teamsData, always A–L) rather than Object.keys(groupsUI)
  // so this is immune to localStorage corruption shrinking or reordering group keys.
  const rankedThirdPlaceTeams = useMemo((): RankedThirdPlaceTeam[] => {
    const thirdPlaceTeams: ThirdPlaceTeam[] = groupLetters
      .map((letter) => {
        const team = groupsUI[letter]?.[2]
        if (!team) return null
        return {
          id: team.id,
          name: team.name,
          colors: team.colors,
          groupLetter: letter,
          points: 0,
          goalDifference: 0,
          goalsScored: 0,
          fairPlay: 0,
        }
      })
      .filter((t): t is ThirdPlaceTeam => t !== null)
    const result = rankThirdPlaceTeams(thirdPlaceTeams)
    return result
  }, [groupLetters, groupsUI])

  // Persist current step so interrupted users resume in the right place
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(FLOW_STEP_KEY, currentStep)
    }
  }, [currentStep, mounted, selectedThirdPlaceGroups.size, rankedThirdPlaceTeams.length])

  const completedGroups = useMemo(() => {
    return groupLetters.reduce((count, letter) => {
      const teams = groupsUI[letter] ?? []
      const complete = teams.length > 0 && teams.every((t) => !t.is_placeholder)
      return count + (complete ? 1 : 0)
    }, 0)
  }, [groupLetters, groupsUI])

  const handleTeamsReorder = (groupLetter: string, newTeams: TeamUI[]) => {
    setGroups((prev) => ({ ...prev, [groupLetter]: newTeams }))
  }

  const handleToggleThirdPlace = useCallback((groupLetter: string) => {
    setSelectedThirdPlaceGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupLetter)) {
        newSet.delete(groupLetter)
      } else {
        // Only allow adding if less than 8 selected
        if (newSet.size < 8) {
          newSet.add(groupLetter)
        }
      }
      return newSet
    })
  }, [])

  const handleContinueToRound32 = useCallback(() => {
    if (selectedThirdPlaceGroups.size !== 8) return

    // Persist final third-place selection
    localStorage.setItem(THIRD_PLACE_KEY, JSON.stringify([...selectedThirdPlaceGroups]))

    // Clear the flow step so it doesn't stay "thirdPlace" when returning to /
    localStorage.removeItem(FLOW_STEP_KEY)

    // Navigate to bracket page
    router.push("/bracket")
  }, [selectedThirdPlaceGroups, router])

  const handleGoHome = useCallback(() => {
    setCurrentStep("groups")
    setIntroDone(false)
    setIntroExiting(false)
    setInitialGroupLetter(undefined)
  }, [])

  const handleBackToGroups = useCallback(() => {
    setCurrentStep("groups")
  }, [])

  const handleContinueFromGroups = useCallback(() => {
    const hasBracket = !!localStorage.getItem(BRACKET_PICKS_KEY)

    if (hasBracket) {
      const sourceRaw = localStorage.getItem(BRACKET_SOURCE_KEY)
      if (sourceRaw) {
        try {
          const source = JSON.parse(sourceRaw)
          // Groups are unchanged — safe to proceed without a warning
          if (JSON.stringify(source) === JSON.stringify(groups)) {
            setCurrentStep("thirdPlace")
            return
          }
        } catch { /* treat as changed */ }
      }
      // Groups differ from snapshot (or no snapshot exists) — ask for confirmation
      setShowBracketResetConfirm(true)
      return
    }
    setCurrentStep("thirdPlace")
  }, [groups, selectedThirdPlaceGroups.size, rankedThirdPlaceTeams.length, currentStep, lockedGroupsCount])

  // User confirmed: clear stale bracket + wrapped, then advance to Third Place
  const handleBracketResetConfirm = useCallback(() => {
    localStorage.removeItem(BRACKET_PICKS_KEY)
    localStorage.removeItem(WRAPPED_NAME_KEY)
    localStorage.removeItem(WRAPPED_VISITED_KEY)
    localStorage.removeItem(BRACKET_SOURCE_KEY)
    localStorage.removeItem(THIRD_PLACE_KEY)
    // Reset Third Place selection state to match cleared localStorage
    setSelectedThirdPlaceGroups(new Set())
    setShowBracketResetConfirm(false)
    setCurrentStep("thirdPlace")
  }, [selectedThirdPlaceGroups.size, currentStep])

  // User chose "Keep existing prediction": navigate directly to the saved bracket
  const handleBracketResetCancel = useCallback(() => {
    setShowBracketResetConfirm(false)
    router.push("/bracket")
  }, [router])

  const handleResetThirdPlace = useCallback(() => {
    setSelectedThirdPlaceGroups(new Set())
    localStorage.removeItem(THIRD_PLACE_KEY)
  }, [])


  if (!mounted) return null

  return (
    <LayoutGroup id="group-layout">
      <div className="wc-page">
        {/* ── CAROUSEL INTRO ─────────────────────────────────────────────────
             12 group cards in a spatial 3D arc. Clicking any card instantly
             starts the bracket at that group. Cards are the CTA — no hero
             button needed. The flag scatter has been retired.                 */}
        {!introDone && (
          <div className={`ci-shell ${introExiting ? "is-exiting" : ""}`}>

            {/* 3D card carousel — fills the shell, handles its own perspective */}
            <HomeCarousel
              groups={groupLetters.map(letter => ({
                letter,
                teams: groupsUI[letter] ?? [],
              }))}
              onSelect={handleCarouselSelect}
            />

            {/* Editorial copy — pointer-events: none so mouse reaches the cards */}
            <div className="ci-content ci-content--carousel" aria-hidden="true">
              {/* bracket26 logo — provided SVG asset, includes the wordmark */}
              <motion.div
                className="ci-logo"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bracket26-logo.svg" alt="bracket26" className="ci-logo-img" />
              </motion.div>

              <motion.h1
                className="ci-headline"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.30, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                Predict the next champion
              </motion.h1>

              <motion.p
                className="ci-subheadline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55, duration: 1.0, ease: "easeOut" }}
              >
                OF THE FIFA WORLD CUP 2026 · MEXICO · UNITED STATES · CANADA
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85, duration: 1.0, ease: "easeOut" }}
              >
                <CountdownTimer />
              </motion.div>
            </div>

            {/* Hint — appears after cards are visible */}
            <motion.p
              className="ci-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 1.2, ease: "easeOut" }}
              aria-hidden="true"
            >
              Pick a group to begin
            </motion.p>

            {/* Disclaimer + privacy link */}
            <motion.div
              className="ci-disclaimer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 1.2, ease: "easeOut" }}
            >
              Independent fan-made experience. Not affiliated with FIFA.
              <span className="ci-disclaimer-sep" aria-hidden="true"> · </span>
              <a href="/privacy" className="ci-disclaimer-link">Privacy Policy</a>
              <span className="ci-disclaimer-sep" aria-hidden="true"> · </span>
              <a href="https://www.linkedin.com/in/pamelaporto/" target="_blank" rel="noopener noreferrer" className="ci-disclaimer-link">Created by Pamela Porto</a>
            </motion.div>

          </div>
        )}

        {/* MAIN PAGE (mounts once exiting starts, so morph has targets) */}
        <div className={`page-content ${introExiting || introDone ? "is-visible" : ""}`}>
          {/* Ritual Header - persistent navigation */}
          {introDone && (
            <RitualHeader
              currentStep={currentStep}
              canContinue={
                currentStep === "thirdPlace"
                  ? selectedThirdPlaceGroups.size === 8
                  : lockedGroupsCount === groupLetters.length
              }
              onHome={handleGoHome}
              onBack={
                currentStep === "thirdPlace"
                  ? handleBackToGroups
                  : currentStep === "groups"
                  ? handleGoHome
                  : undefined
              }
              onContinue={
                currentStep === "thirdPlace"
                  ? handleContinueToRound32
                  : handleContinueFromGroups
              }
              continueLabel="Continue"
            />
          )}
          
          <div className="stage-content-main max-w-[1400px] mx-auto">
            {introDone && currentStep === "groups" && (
              <AnimatePresence mode="wait">
                <motion.div
                  key="groups-step"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="h-full"
                >
                  <GroupStack
                    groups={groupLetters.map(letter => ({
                      letter,
                      teams: groupsUI[letter] ?? []
                    }))}
                    onTeamsReorder={handleTeamsReorder}
                    onLockedGroupsChange={setLockedGroupsCount}
                    initialGroupLetter={initialGroupLetter}
                  />
                </motion.div>
              </AnimatePresence>
            )}

            {introDone && currentStep === "thirdPlace" && (
              <AnimatePresence mode="wait">
                <motion.div
                  key="third-place-step"
                  className="h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ThirdPlaceStep
                    teams={rankedThirdPlaceTeams}
                    selectedGroups={selectedThirdPlaceGroups}
                    onToggle={handleToggleThirdPlace}
                    onContinue={handleContinueToRound32}
                    onReset={handleResetThirdPlace}
                    onBack={handleBackToGroups}
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
      {/* ── Bracket reset confirmation modal ─────────────────────────────────
           Shown when a user with an existing bracket tries to continue past
           Groups after changing their group rankings. Clears only on confirm. */}
      <AnimatePresence>
        {showBracketResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(8,10,18,0.82)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24,
            }}
            onClick={handleBracketResetCancel}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{
                background: "linear-gradient(180deg, rgba(28,32,46,0.98) 0%, rgba(20,24,36,0.95) 100%)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: "32px 28px 28px",
                maxWidth: 380,
                width: "100%",
                boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{
                margin: "0 0 10px",
                fontSize: 18,
                fontWeight: 700,
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
                fontFamily: "inherit",
              }}>
                You&apos;ve changed your group predictions.
              </h2>
              <p style={{
                margin: "0 0 28px",
                fontSize: 14,
                color: "rgba(255,255,255,0.52)",
                lineHeight: 1.6,
                fontFamily: "inherit",
              }}>
                Continuing will generate a new bracket and replace your existing prediction.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={handleBracketResetConfirm}
                  style={{
                    padding: "13px 20px",
                    borderRadius: 10,
                    background: "var(--wc-accent)",
                    border: "none",
                    color: "#0a0f00",
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                  }}
                >
                  Generate new bracket
                </button>
                <button
                  onClick={handleBracketResetCancel}
                  style={{
                    padding: "13px 20px",
                    borderRadius: 10,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  Keep existing prediction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </LayoutGroup>
  )
}
