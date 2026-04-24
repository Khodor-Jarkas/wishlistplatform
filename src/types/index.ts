export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ---- Auth ----

export interface Profile {
  id: string
  username: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bio: string | null
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  zip_code: string | null
  country: string | null
  is_private: boolean
  is_creator: boolean
  language: string
  created_at: string
  updated_at: string
}

// ---- Wishlists ----

export type WishlistOccasion =
  | "birthday"
  | "christmas"
  | "wedding"
  | "baby_shower"
  | "graduation"
  | "anniversary"
  | "other"

export type WishlistType = "personal" | "together" | "on_behalf"
export type WishlistVisibility = "public" | "hidden" | "private"

export interface Wishlist {
  id: string
  user_id: string
  title: string
  description: string | null
  slug: string
  type: WishlistType
  visibility: WishlistVisibility
  cover_image_url: string | null
  occasion: WishlistOccasion | null
  event_date: string | null
  is_for_others: boolean
  beneficiary_name: string | null
  color: string | null
  created_at: string
  updated_at: string
  // Relations (joined)
  profile?: Profile
  wishes?: Wish[]
  // Aggregates (when fetched with counts)
  wish_count?: number
  follower_count?: number
}

export interface WishlistFollower {
  wishlist_id: string
  user_id: string
  followed_at: string
  profile?: Profile
}

// ---- Wishes ----

export type WishPriority = 0 | 1 | 2 // 0=normal, 1=high, 2=must-have

export interface Wish {
  id: string
  wishlist_id: string
  title: string
  description: string | null
  price: number | null
  currency: string
  url: string | null
  image_url: string | null
  priority: WishPriority
  quantity: number
  is_reserved: boolean
  is_received: boolean
  created_at: string
  updated_at: string
  // Relations (joined)
  reservation?: Reservation | null
  reservations?: Reservation[]
  // Server-computed: true when the viewing user has reserved this wish
  isReservedByMe?: boolean
}

// ---- Friends ----

export type FriendshipStatus = "pending" | "accepted" | "declined"

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  // Relations (joined)
  requester?: Profile
  addressee?: Profile
}

// ---- Reservations ----

export type ReservationStatus = "reserved" | "bought"

export interface Reservation {
  id: string
  wish_id: string
  reserved_by: string | null
  status: ReservationStatus
  note: string | null
  reserved_at: string
  // Relations (joined)
  profile?: Profile
}

// ---- Notifications ----

export type NotificationType = "friend_request" | "friend_accepted" | "wishlist_followed" | "wish_reserved"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string | null
  target_id: string | null
  meta: Record<string, unknown> | null
  is_read: boolean
  created_at: string
  // Relations (joined)
  actor?: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url"> | null
}

// ---- Activity ----

export type ActivityType = "wishlist_created" | "wish_added" | "friendship_started"

export interface Activity {
  id: string
  user_id: string
  type: ActivityType
  target_id: string | null
  meta: Record<string, unknown> | null
  created_at: string
  // Relations (joined)
  profile?: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url"> | null
}

// ---- UI helpers ----

export interface SelectOption {
  label: string
  value: string
}

export interface ApiError {
  message: string
  code?: string
}
