// lib/share.ts
// Utilities for the Download & Share feature (Phase 1+2 — no backend)

import type { BracketState } from "@/lib/build-bracket"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShareTeam = {
  name: string
  colors: string[]
}

export type ShareCard = {
  champion: ShareTeam | null
  finalist1: ShareTeam | null
  finalist2: ShareTeam | null
  /** Up to 4 semi-finalists (team1/team2 of each SF match) */
  semis: Array<ShareTeam | null>
}

// ─── Extract minimal share data from full bracket state ───────────────────────

export function extractShareCard(bracket: BracketState): ShareCard {
  const toShareTeam = (t: { name: string; colors?: string[] } | null): ShareTeam | null =>
    t ? { name: t.name, colors: t.colors ?? ["#6B7280", "#9CA3AF"] } : null

  const finalMatch = bracket.matches.find((m) => m.round === 5 && m.position === 0)
  const sfMatches = bracket.matches.filter((m) => m.round === 4).sort((a, b) => a.position - b.position)

  const semis: Array<ShareTeam | null> = []
  for (const m of sfMatches) {
    semis.push(toShareTeam(m.team1))
    semis.push(toShareTeam(m.team2))
  }

  return {
    champion: toShareTeam(bracket.champion),
    finalist1: toShareTeam(finalMatch?.team1 ?? null),
    finalist2: toShareTeam(finalMatch?.team2 ?? null),
    semis: semis.slice(0, 4),
  }
}

// ─── Encode / decode (URL-safe base64, works in browser + Edge runtime) ───────

export function encodeShareCard(card: ShareCard): string {
  const json = JSON.stringify(card)
  // TextEncoder → Uint8Array → base64 (browser + Edge compatible)
  const bytes = new TextEncoder().encode(json)
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

export function decodeShareCard(encoded: string): ShareCard | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const json = new TextDecoder().decode(bytes)
    return JSON.parse(json) as ShareCard
  } catch {
    return null
  }
}

// ─── URL builders ─────────────────────────────────────────────────────────────

/**
 * Returns the /api/og image URL with encoded bracket state.
 * This URL works on any device — it does NOT depend on localStorage.
 */
export function buildOgUrl(card: ShareCard, origin: string): string {
  return `${origin}/api/og?s=${encodeShareCard(card)}`
}

/**
 * The "Copy Link" URL. Points to the OG image directly — shareable, device-independent.
 * Phase 3 will replace this with a /b/[id] page once KV persistence is added.
 */
export function buildShareUrl(card: ShareCard, origin: string): string {
  return buildOgUrl(card, origin)
}

// ─── Clipboard util ───────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    try {
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      return true
    } catch {
      return false
    }
  }
}
