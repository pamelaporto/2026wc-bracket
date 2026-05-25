"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Download, RotateCcw } from "lucide-react"
import { computeFlagGradient } from "@/lib/flags"
import type { WrappedProfile } from "@/lib/wrapped-engine"
import type { BracketState } from "@/lib/build-bracket"
import { ShareSheet } from "@/components/share-sheet"
import { extractShareCard } from "@/lib/share"

type Props = {
  profile: WrappedProfile
  bracket: BracketState | null
  onReplay: () => void
}

export function WrappedShare({ profile, bracket, onReplay }: Props) {
  const [shareSheetOpen, setShareSheetOpen] = useState(false)

  const handleOpenShare = useCallback(() => {
    setShareSheetOpen(true)
  }, [])

  return (
    <div className="wr-screen wr-share">
      <div className="wr-screen-inner wr-share-inner">
        {/* The shareable card */}
        <motion.div
          className="wr-card"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Card header */}
          <div className="wr-card-header">
            <div className="wr-card-eyebrow">FIFA WORLD CUP 2026</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/b26-mark.svg" alt="bracket26" className="wr-card-logo" width={35} height={26} />
          </div>

          {/* Champion section */}
          <div className="wr-card-champion">
            <div
              className="wr-card-flag"
              style={{ backgroundImage: computeFlagGradient(profile.champion.colors) }}
            />
            <div className="wr-card-champion-info">
              <div className="wr-card-champion-label">CHAMPION</div>
              <div className="wr-card-champion-name">{profile.champion.name}</div>
              {profile.finalOpponent && (
                <div className="wr-card-champion-final">def. {profile.finalOpponent.name}</div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="wr-card-divider" />

          {/* Personality + headline */}
          <div className="wr-card-personality">
            <div className="wr-card-archetype">{profile.personalityArchetype}</div>
            <div className="wr-card-headline">"{profile.headline}"</div>
          </div>

          {/* Stats row */}
          <div className="wr-card-stats">
            <div className="wr-card-stat">
              <span className="wr-card-stat-value">{profile.upsetCount}</span>
              <span className="wr-card-stat-label">upsets</span>
            </div>
            <div className="wr-card-stat">
              <span className="wr-card-stat-value">{profile.totalMatches}</span>
              <span className="wr-card-stat-label">matches picked</span>
            </div>
            <div className="wr-card-stat">
              <span className="wr-card-stat-value">{Math.round(profile.volatilityScore * 100)}%</span>
              <span className="wr-card-stat-label">chaos score</span>
            </div>
          </div>

          {/* Name + footer */}
          <div className="wr-card-footer">
            <span className="wr-card-name">{profile.displayName}</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="wr-share-actions"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.button
            className="wr-share-btn"
            onClick={handleOpenShare}
            whileTap={{ scale: 0.97 }}
          >
            <Download className="w-4 h-4" />
            <span>Download &amp; Share Your Prophecy</span>
          </motion.button>

          <button className="wr-replay-btn" onClick={onReplay}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>
        </motion.div>
      </div>

      {/* Share Sheet */}
      {bracket && (
        <ShareSheet
          card={extractShareCard(bracket)}
          isOpen={shareSheetOpen}
          onClose={() => setShareSheetOpen(false)}
        />
      )}
    </div>
  )
}
