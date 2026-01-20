"use client"

import * as React from "react"
import Image from "next/image"
import { Camera, Loader2, Shield, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { InterestsSelector } from "@/components/user/InterestsSelector"

type UserProfile = {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
  role: string
  about?: string | null
  interests?: string[]
  twoFactorEnabled?: boolean
}

export default function SettingsPage() {
  const [user, setUser] = React.useState<UserProfile | null>(null)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [about, setAbout] = React.useState("")
  const [interests, setInterests] = React.useState<string[]>([])

  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false)

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [toggling2FA, setToggling2FA] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)



  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me")
        if (!res.ok) throw new Error("Failed to fetch user")
        const data: UserProfile = await res.json()

        setUser(data)
        setName(data.name ?? "")
        setEmail(data.email)
        setAvatarUrl(data.avatarUrl)
        setAbout(data.about ?? "")
        setInterests(data.interests ?? [])
        setTwoFactorEnabled(data.twoFactorEnabled ?? false)
      } catch {
        setError("Хэрэглэгчийн мэдээлэл татахад алдаа гарлаа")
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])



  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      const data = await res.json()
      setAvatarUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Зураг хуулахад алдаа гарлаа")
    } finally {
      setUploading(false)
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl, about, interests }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save")
      }

      const updatedUser: UserProfile = await res.json()
      setUser(updatedUser)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа")
    } finally {
      setSaving(false)
    }
  }

  async function toggle2FA() {
    setToggling2FA(true)
    setError(null)

    try {
      const res = await fetch("/api/users/me/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !twoFactorEnabled }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to toggle 2FA")
      }

      setTwoFactorEnabled(!twoFactorEnabled)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "2FA тохируулахад алдаа гарлаа")
    } finally {
      setToggling2FA(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Миний профайл</h1>
        <p className="text-sm text-muted-foreground">Профайл мэдээллээ засах, аккаунтаа удирдах.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
          Амжилттай хадгаллаа!
        </div>
      )}

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Хувийн мэдээлэл</h2>
        <p className="mt-1 text-sm text-muted-foreground">Профайл мэдээллээ засах.</p>

        <form onSubmit={onSave} className="mt-5 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                    {name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Зураг солих бол камер дээр дарна уу.</p>
              <p>JPEG, PNG, WebP, GIF. Max 5MB.</p>
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <div className="text-lg font-semibold">Нэр</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Таны нэр" />
              <p className="text-sm text-muted-foreground">Энэ нэр нь таны профайл дээр нийтэд харагдах болно.</p>
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <div className="text-lg font-semibold">Имэйл</div>
              <Input type="email" value={email} readOnly className="cursor-not-allowed bg-muted" />
              <p className="text-sm text-muted-foreground">Имэйл хаяг өөрчлөх боломжгүй.</p>
            </div>

            {/* About (full width) */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-lg font-semibold">Миний тухай</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={6}
                className="min-h-[180px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Өөрийн тухай товч танилцуулга..."
              />
            </div>

            {/* Interests (full width) */}
            <div className="space-y-3 md:col-span-2">
              <h2 className="text-lg font-semibold">Миний сонирхол</h2>
              <section id="interests" className="rounded-2xl border bg-card p-5 scroll-mt-20">
                <div className="mb-4 flex items-center gap-2">    
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Сонирхлоо сонгоно уу. Бид танд тохирсон эвентүүдийг санал болгоно.
                </p>

                <InterestsSelector
                  initialInterests={interests}
                  onChange={(next: string[]) => setInterests(next)}
                />

                <p className="mt-3 text-sm text-muted-foreground">Таны сонирхолын дагуу эвентүүд санал болгоно.</p>
              </section>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => window.history.back()}>
              Буцах
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Хадгалж байна…" : "Хадгалах"}
            </Button>
          </div>
        </form>
      </div>

      {/* Security / 2FA Section */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Аюулгүй байдал</h2>
        <p className="mt-1 text-sm text-muted-foreground">Хоёр шатлалт баталгаажуулалт (2FA) тохируулах.</p>

        <div className="mt-5 flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            {twoFactorEnabled ? (
              <ShieldCheck className="h-8 w-8 text-green-500" />
            ) : (
              <Shield className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Хоёр шатлалт баталгаажуулалт (2FA)</p>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled
                  ? "Идэвхтэй - Нэвтрэх үед имэйлээр код авна"
                  : "Идэвхгүй - Нэвтрэхэд зөвхөн нууц үг шаардана"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant={twoFactorEnabled ? "secondary" : "default"}
            onClick={toggle2FA}
            disabled={toggling2FA}
          >
            {toggling2FA ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {twoFactorEnabled ? "Унтраах" : "Идэвхжүүлэх"}
          </Button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          2FA идэвхжүүлсний дараа нэвтрэх болгонд имэйлээр 6 оронтой код авч баталгаажуулна.
        </p>
      </div>
    </div>
  )
}
