"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { buildWrappedProfile } from "@/lib/wrapped-engine"
import { WrappedShareDocument } from "@/components/wrapped/wrapped-share-document"
import type { BracketState, GroupsState } from "@/lib/build-bracket"

const BRACKET_PICKS_KEY = "wc2026-bracket-picks-v1"
const WRAPPED_NAME_KEY = "wc2026-wrapped-name-v1"
const GROUP_DRAFT_KEY = "wc2026-bracket-draft-v5"
const THIRD_PLACE_KEY = "wc2026-third-place-selection-v1"

export default function MyPredictionPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  const [bracket, setBracket] = useState<BracketState | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [groupsState, setGroupsState] = useState<GroupsState | null>(null)
  const [thirdGroups, setThirdGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)

    const bracketRaw = localStorage.getItem(BRACKET_PICKS_KEY)
    if (!bracketRaw) {
      setReady(true)
      return
    }

    try {
      const b: BracketState = JSON.parse(bracketRaw)
      if (!b.champion) {
        setReady(true)
        return
      }

      setBracket(b)

      const name = localStorage.getItem(WRAPPED_NAME_KEY) ?? ""
      const p = buildWrappedProfile(b, name)
      setProfile(p)

      const groupsRaw = localStorage.getItem(GROUP_DRAFT_KEY)
      if (groupsRaw) {
        try {
          setGroupsState(JSON.parse(groupsRaw))
        } catch {
          // ignore
        }
      }

      const thirdRaw = localStorage.getItem(THIRD_PLACE_KEY)
      if (thirdRaw) {
        try {
          setThirdGroups(new Set(JSON.parse(thirdRaw)))
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    setReady(true)
  }, [])

  if (!mounted || !ready) return null

  // Empty state
  if (!bracket || !profile) {
    return (
      <div className="wc-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 24px" }}>
        <motion.div
          style={{ maxWidth: "480px", textAlign: "center" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "rgba(255,255,255,0.95)", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            You haven't made a prediction yet
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.52)", margin: "0 0 32px", lineHeight: 1.6 }}>
            Create your World Cup 2026 bracket and start predicting the next champion.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              background: "var(--wc-accent)",
              color: "#0a0f00",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "opacity 0.15s ease",
            }}
          >
            Make your prediction
          </a>
        </motion.div>
      </div>
    )
  }

  // Show WrappedShareDocument
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <WrappedShareDocument
        profile={profile}
        bracket={bracket}
        groupsState={groupsState}
        advancingThirdGroups={thirdGroups}
        onReplay={() => router.push("/")}
      />
    </motion.div>
  )
}
