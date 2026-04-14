"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// ---- Sign Up ----

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }

  // No session means Supabase email confirmation is required.
  // Signal the caller so it can show a "check your inbox" message instead
  // of proceeding to profile setup (which requires an active session).
  if (data.user && !data.session) {
    return { emailConfirmationRequired: true }
  }

  // Auto-create a default wishlist for the new user
  if (data.user) {
    await supabase.from("wishlists").insert({
      user_id: data.user.id,
      title: "My wishlist",
      slug: "my-wishlist-" + Date.now().toString(36),
      type: "personal",
      visibility: "public",
    })
  }

  // Do NOT redirect here — the caller (modal or page) handles navigation
  return { success: true }
}

// ---- Sign In ----

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }
  // Return destination instead of calling redirect() inside a server action —
  // redirect() throws NEXT_REDIRECT which can be swallowed by useTransition in
  // some Next.js 15/16 builds, producing "Failed to fetch fetchServerAction".
  return { redirect: "/dashboard" }
}

// ---- Sign Out ----

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

// ---- Profile Setup (post-signup) ----

export async function setupProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Use return instead of redirect() — redirect() throws NEXT_REDIRECT which
  // is swallowed by useTransition in Next.js 15/16 causing "unexpected response".
  if (!user) return { redirect: "/login" }

  const firstName = formData.get("first_name") as string
  const lastName  = formData.get("last_name")  as string

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name:    firstName,
      last_name:     lastName,
      full_name:     `${firstName} ${lastName}`.trim(),
      date_of_birth: formData.get("date_of_birth") as string || null,
      gender:        formData.get("gender") as string || null,
    })
    .eq("id", user.id)

  if (error) return { error: error.message }

  // Create a default wishlist if the user doesn't have one yet (OAuth signup path)
  const { count } = await supabase
    .from("wishlists")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (count === 0) {
    await supabase.from("wishlists").insert({
      user_id:    user.id,
      title:      "My wishlist",
      slug:       "my-wishlist-" + Date.now().toString(36),
      type:       "personal",
      visibility: "public",
    })
  }

  return { redirect: "/dashboard" }
}

// ---- Update Profile (settings page) ----

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const firstName = formData.get("first_name") as string
  const lastName  = formData.get("last_name")  as string

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name:    firstName,
      last_name:     lastName,
      full_name:     `${firstName} ${lastName}`.trim(),
      date_of_birth: formData.get("date_of_birth") as string || null,
      gender:        formData.get("gender") as string || null,
      phone:         formData.get("phone") as string || null,
      zip_code:      formData.get("zip_code") as string || null,
      country:       formData.get("country") as string || null,
      is_private:    formData.get("is_private") === "true",
      language:      formData.get("language") as string || "en",
      updated_at:    new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) return { error: error.message }
  return { success: true }
}

// ---- Change Password ----

export async function changePassword(formData: FormData) {
  const password = formData.get("password") as string
  const confirm  = formData.get("confirm")  as string

  if (password !== confirm) return { error: "Passwords do not match." }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }
  return { success: true }
}

// ---- Delete Account ----

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Delete profile (cascades to wishlists, wishes, etc.)
  await supabase.from("profiles").delete().eq("id", user.id)
  await supabase.auth.signOut()
  redirect("/")
}
