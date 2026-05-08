"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LayoutGroup, motion, AnimatePresence } from "framer-motion"
import { GroupStack } from "@/components/group-stack"
import { SaveBar } from "@/components/save-bar"
import { RitualHeader, type RitualStep } from "@/components/ritual-header"
import teamsData from "@/data/teams.json"
import { computeFlagGradient } from "@/lib/flags"
import {
  extractThirdPlaceTeams,
  rankThirdPlaceTeams,
  resolveThirdPlaceSlots,
  type RankedThirdPlaceTeam,
  getDefaultQualifiedTeams,
} from "@/lib/thirdPlace"
import { ThirdPlaceStep } from "@/components/third-place-step"

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
const NAME_KEY = "wc2026-bracket-name-v1"
const SAVED_KEY = "wc2026-bracket-saved"
const THIRD_PLACE_KEY = "wc2026-third-place-selection-v1"

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
}

// 0..1 stable-ish "random"
function hash01(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [savedName, setSavedName] = useState("")
  const [groups, setGroups] = useState<GroupsState>((teamsData as any).groups as GroupsState)

  // intro timing
  const [introExiting, setIntroExiting] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  // Track when user first reorders any team (to show SaveBar)
  const [hasReordered, setHasReordered] = useState(false)

  // Step navigation
  const [currentStep, setCurrentStep] = useState<RitualStep>("groups")

  // Third-place selection state
  const [selectedThirdPlaceGroups, setSelectedThirdPlaceGroups] = useState<Set<string>>(new Set())

  // Always derive letters from teams.json (A–L)
  const groupLetters = useMemo(() => Object.keys((teamsData as any).groups ?? {}).sort(), [])

  // Derive and rank third-place teams from current group standings
  const rankedThirdPlaceTeams = useMemo((): RankedThirdPlaceTeam[] => {
    const thirdPlaceTeams = extractThirdPlaceTeams(groups)
    return rankThirdPlaceTeams(thirdPlaceTeams)
  }, [groups])

  useEffect(() => {
    setMounted(true)

    // restore saved name
    const n = localStorage.getItem(NAME_KEY)
    if (n) setSavedName(n)

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

    // Short + snappy (you wanted shorter)
    const t1 = setTimeout(() => setIntroExiting(true), 1400)
    const t2 = setTimeout(() => setIntroDone(true), 2600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
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

  const completedGroups = useMemo(() => {
    return groupLetters.reduce((count, letter) => {
      const teams = groupsUI[letter] ?? []
      const complete = teams.length > 0 && teams.every((t) => !t.is_placeholder)
      return count + (complete ? 1 : 0)
    }, 0)
  }, [groupLetters, groupsUI])

  const handleTeamsReorder = (groupLetter: string, newTeams: TeamUI[]) => {
    setGroups((prev) => ({ ...prev, [groupLetter]: newTeams }))
    // Show SaveBar on first reorder
    if (!hasReordered) {
      setHasReordered(true)
    }
  }

  const handleSave = (username: string) => {
    const clean = username.trim()
    if (!clean) return
    localStorage.setItem(NAME_KEY, clean)
    setSavedName(clean)
    // Navigate to third-place selection step
    setCurrentStep("thirdPlace")
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
    
    // Resolve slot mappings
    const slotResult = resolveThirdPlaceSlots([...selectedThirdPlaceGroups])
    
    // Store the qualified teams and slot assignments
    localStorage.setItem(THIRD_PLACE_KEY, JSON.stringify([...selectedThirdPlaceGroups]))
    localStorage.setItem("wc2026-third-place-slots-v1", JSON.stringify(slotResult))
    localStorage.setItem(SAVED_KEY, "true")
    
    // Navigate to bracket page
    router.push("/bracket")
  }, [selectedThirdPlaceGroups, router])

  const handleBackToGroups = useCallback(() => {
    setCurrentStep("groups")
  }, [])

  const handleContinueFromGroups = useCallback(() => {
    if (completedGroups === groupLetters.length) {
      // Save current state
      if (savedName) {
        localStorage.setItem(NAME_KEY, savedName)
      }
      setCurrentStep("thirdPlace")
    }
  }, [completedGroups, groupLetters.length, savedName])

  const handleResetThirdPlace = useCallback(() => {
    setSelectedThirdPlaceGroups(new Set())
    localStorage.removeItem(THIRD_PLACE_KEY)
  }, [])

  /**
   * Intro flags must use the SAME ids as the group flags (layoutId = flag-{id})
   * We build them from teamsData (not from localStorage) so the intro is stable.
   */
  const introFlags = useMemo(() => {
    const result: Array<{ id: string; name: string; colors: string[] }> = []

    groupLetters.forEach((letter) => {
      const teams = ((teamsData as any).groups?.[letter] ?? []) as any[]
      teams.forEach((t) => {
        result.push({
          id: t.id ?? t.team_id ?? slugify(t.name ?? "team"),
          name: t.name ?? "Team",
          colors: t.colors ?? ["#6B7280", "#9CA3AF"],
        })
      })
    })

    // enforce 48
    return result.slice(0, 48)
  }, [groupLetters])

  const flagsRowA = useMemo(() => introFlags.slice(0, 24), [introFlags])
  const flagsRowB = useMemo(() => introFlags.slice(24, 48), [introFlags])

  // center → out delay (2 rows x 24 cols) + tiny jitter so it feels alive
  const centerOutDelayMs = (row: number, col: number, id: string) => {
    const centerRow = 0.5
    const centerCol = 11.5
    const dist = Math.abs(row - centerRow) + Math.abs(col - centerCol)
    const jitter = hash01(id) * 70 // 0..70ms
    return Math.round(dist * 28 + jitter)
  }

  if (!mounted) return null

  return (
    <LayoutGroup>
      <div className="wc-page">
        {/* INTRO */}
        {!introDone && (
          <div className={`intro-overlay ${introExiting ? "is-exiting" : ""}`} aria-hidden="true">
            <div className="intro-inner">
              <div className={`intro-brand ${introExiting ? "is-fading" : ""}`}>
                <div className="intro-logo" aria-label="World Cup 2026">
                <img
  src="/wc-logo.svg"
  alt="World Cup 2026"
  className="intro-logo-img"
/>
                </div>
                <div className="intro-wordmark">Every match decides</div>
              </div>

              <h1 className={`intro-title ${introExiting ? "is-fading" : ""}`}>The FIFA World Cup 2026, decided by you</h1>
              <p className={`intro-subtitle ${introExiting ? "is-fading" : ""}`}>
                48 nations, one trophy, infinite stories.
              </p>

              {/* “Wave as a unit” container */}
              <div className="intro-flags intro-flags--wave">
                <div className="intro-flags-row row-a">
                  {flagsRowA.map((team, col) => {
                    const inDelay = centerOutDelayMs(0, col, `a-${team.id}`)
                    const floatPhase = Math.round(hash01(`float-${team.id}`) * 900)
                    return (
                      <motion.div
                        key={`intro-a-${team.id}`}
                        layoutId={`flag-${team.id}`}
                        className={`flag flag--wavy intro-flag-tile ${introExiting ? "intro-flag-handoff" : ""}`}
                        style={{
                          backgroundImage: computeFlagGradient(team.colors),
                          animationDelay: `${inDelay}ms, ${floatPhase}ms`,
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      />
                    )
                  })}
                </div>

                <div className="intro-flags-row row-b">
                  {flagsRowB.map((team, col) => {
                    const inDelay = centerOutDelayMs(1, col, `b-${team.id}`)
                    const floatPhase = Math.round(hash01(`float-b-${team.id}`) * 900)
                    return (
                      <motion.div
                        key={`intro-b-${team.id}`}
                        layoutId={`flag-${team.id}`}
                        className={`flag flag--wavy intro-flag-tile ${introExiting ? "intro-flag-handoff" : ""}`}
                        style={{
                          backgroundImage: computeFlagGradient(team.colors),
                          animationDelay: `${inDelay}ms, ${floatPhase}ms`,
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN PAGE (mounts once exiting starts, so morph has targets) */}
        <div className={`page-content ${introExiting || introDone ? "is-visible" : ""}`}>
          {/* Ritual Header - persistent navigation */}
          {introDone && (
            <RitualHeader
              currentStep={currentStep}
              canContinue={
                currentStep === "groups" 
                  ? completedGroups === groupLetters.length
                  : currentStep === "thirdPlace"
                  ? selectedThirdPlaceGroups.size === 8
                  : false
              }
              showBack={currentStep !== "groups"}
              onBack={currentStep === "thirdPlace" ? handleBackToGroups : undefined}
              onContinue={
                currentStep === "groups"
                  ? handleContinueFromGroups
                  : currentStep === "thirdPlace"
                  ? handleContinueToRound32
                  : undefined
              }
              continueLabel={currentStep === "thirdPlace" ? "To Bracket" : "Continue"}
            />
          )}
          
          <div className="max-w-[1400px] mx-auto">
            <AnimatePresence mode="wait">
              {currentStep === "groups" && (
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
                  />
                  
                  {/* Floating save bar */}
                  <div className="stack-save-bar-wrapper">
                    <SaveBar
                      onSave={handleSave}
                      progress={{ done: completedGroups, total: groupLetters.length }}
                      defaultName={savedName}
                      visible={hasReordered}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === "thirdPlace" && (
                <motion.div
                  key="third-place-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
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
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LayoutGroup>
  )
}
