"use client"

import { useState } from "react"
import Link from "next/link"
import type { Wishlist } from "@/types"
import EditWishlistModal from "./EditWishlistModal"
import DeleteConfirmModal from "./DeleteConfirmModal"

export const WISHLIST_COLOR_PRESETS: Record<string, string> = {
  blue:   "linear-gradient(135deg, #38A3C7 0%, #1E6B88 100%)",
  purple: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
  amber:  "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  green:  "linear-gradient(135deg, #10B981 0%, #059669 100%)",
  pink:   "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)",
  red:    "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  orange: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
  teal:   "linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)",
  coral:  "linear-gradient(135deg, #FB7185 0%, #BE123C 100%)",
  slate:  "linear-gradient(135deg, #64748B 0%, #334155 100%)",
}

const DEFAULT_GRADIENTS = Object.values(WISHLIST_COLOR_PRESETS)

export interface WishlistWithCounts extends Wishlist {
  wish_count: number
  follower_count: number
  profiles?: { username: string; first_name?: string; last_name?: string } | null
}

interface Props {
  wishlist: WishlistWithCounts
  isOwner: boolean
  showOwner?: boolean
}

export default function WishlistCard({ wishlist, isOwner, showOwner = false }: Props) {
  const [hovered, setHovered] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const gradient = wishlist.color && WISHLIST_COLOR_PRESETS[wishlist.color]
    ? WISHLIST_COLOR_PRESETS[wishlist.color]
    : DEFAULT_GRADIENTS[wishlist.title.charCodeAt(0) % DEFAULT_GRADIENTS.length]

  const ownerName = wishlist.profiles
    ? (wishlist.profiles.first_name
        ? `${wishlist.profiles.first_name} ${wishlist.profiles.last_name ?? ""}`.trim()
        : wishlist.profiles.username)
    : null

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: "relative" }}
      >
        <Link href={`/wishlists/${wishlist.id}`} style={{ display: "block", textDecoration: "none" }}>
          {/* Image / gradient */}
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              height: 160,
              position: "relative",
              background: wishlist.cover_image_url ? "transparent" : gradient,
              boxShadow: hovered ? "0 6px 24px rgba(0,0,0,0.14)" : "0 1px 4px rgba(0,0,0,0.08)",
              transition: "box-shadow 0.2s",
            }}
          >
            {wishlist.cover_image_url && (
              <img
                src={wishlist.cover_image_url}
                alt={wishlist.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}

            {/* Wish count badge */}
            {wishlist.wish_count > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0F172A",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                }}
              >
                {wishlist.wish_count}
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ padding: "10px 2px 0" }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: "#0F172A",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {wishlist.title}
            </p>
            {showOwner && ownerName && (
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {ownerName}
              </p>
            )}
          </div>
        </Link>

        {/* Owner hover actions */}
        {isOwner && hovered && (
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
            <button
              onClick={(e) => { e.preventDefault(); setEditOpen(true) }}
              title="Edit"
              style={{
                width: 28, height: 28, borderRadius: 8, background: "white",
                border: "none", cursor: "pointer", fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              ✏️
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setDeleteOpen(true) }}
              title="Delete"
              style={{
                width: 28, height: 28, borderRadius: 8, background: "#FEE2E2",
                border: "none", cursor: "pointer", fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {editOpen && <EditWishlistModal wishlist={wishlist} onClose={() => setEditOpen(false)} />}
      {deleteOpen && (
        <DeleteConfirmModal
          wishlistId={wishlist.id}
          title={wishlist.title}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </>
  )
}
