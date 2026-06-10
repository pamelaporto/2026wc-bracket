"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Link2, Share2, Check, X } from "lucide-react"
import { buildOgUrl, buildShareUrl, copyToClipboard, type ShareCard } from "@/lib/share"

type ShareSheetProps = {
  card: ShareCard
  isOpen: boolean
  onClose: () => void
}

type CopyState = "idle" | "copied" | "error"

export function ShareSheet({ card, isOpen, onClose }: ShareSheetProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle")
  const [imgError, setImgError] = useState(false)

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const ogUrl = buildOgUrl(card, origin)
  const shareUrl = buildShareUrl(card, origin)

  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl)
    setCopyState(ok ? "copied" : "error")
    setTimeout(() => setCopyState("idle"), 2200)
  }, [shareUrl])

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: "My FIFA World Cup 2026 Prediction",
        text: card.champion
          ? `I predicted ${card.champion.name} will win the 2026 World Cup!`
          : "My World Cup 2026 bracket prediction",
        url: shareUrl,
      })
    } catch {
      // User dismissed — no-op
    }
  }, [card.champion, shareUrl])

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="ss-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="ss-sheet"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="ss-header">
              <div className="ss-header-text">
                <span className="ss-eyebrow">Your Prediction</span>
                <h2 className="ss-title">Download & share</h2>
              </div>
              <button className="ss-close" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Card preview */}
            <div className="ss-preview-wrap">
              {!imgError ? (
                <img
                  src={ogUrl}
                  alt="Your bracket share card"
                  className="ss-preview-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="ss-preview-fallback">
                  <span>Preview unavailable</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="ss-actions">
              {/* Download */}
              <a
                href={ogUrl}
                download="my-prediction-2026.png"
                className="ss-action-btn ss-action-btn--primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={16} />
                <span>Download image</span>
              </a>

              {/* Copy link */}
              <button
                className={`ss-action-btn ss-action-btn--secondary ${copyState === "copied" ? "is-copied" : ""}`}
                onClick={handleCopyLink}
              >
                {copyState === "copied" ? (
                  <>
                    <Check size={16} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 size={16} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              {/* Native share */}
              {canNativeShare && (
                <button
                  className="ss-action-btn ss-action-btn--secondary"
                  onClick={handleNativeShare}
                >
                  <Share2 size={16} />
                  <span>Share…</span>
                </button>
              )}
            </div>

            {/* Footer note */}
            <p className="ss-footnote">
              Link opens your share image — no account needed.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
