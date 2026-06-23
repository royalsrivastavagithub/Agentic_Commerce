"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { User } from "@/types/api"
import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { User as UserIcon, Save, Trash2, CalendarIcon } from "lucide-react"
import { DynamicShell as Shell } from "@/components/features/dynamic-shell"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { toast } from "sonner"

export default function ProfileContent() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login")
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return <ProfileInner />
}

function ProfileInner() {
  const { user, login } = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    date_of_birth: user?.date_of_birth || "",
    gender: user?.gender || "",
  })

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<User>("/auth/users/me"),
  })

  const updateProfile = useMutation({
    mutationFn: () => api.put<User>("/auth/users/me", form),
    onSuccess: (data) => {
      login(useAuthStore.getState().token!, data)
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      setEditing(false)
      toast.success("Profile updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteAddress = useMutation({
    mutationFn: (addrId: number) => api.delete(`/users/me/addresses/${addrId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      toast.success("Address deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const p = profile || user

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amazon-nav text-white">
            <UserIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-sm text-muted-foreground">{p?.email}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 dark:border-border dark:bg-card">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">First Name</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Last Name</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Date of Birth</label>
                  <div className="relative flex items-center gap-1">
                    <input
                      type="text" inputMode="numeric" maxLength={2} placeholder="DD"
                      value={form.date_of_birth ? (() => { const [y,m,d] = form.date_of_birth.split("-"); return ["",undefined].includes(d)?"":d })() : ""}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, "").slice(0,2)
                        const [y,m] = form.date_of_birth ? form.date_of_birth.split("-") : ["",""]
                        setForm({ ...form, date_of_birth: `${y||""}-${m||""}-${d}` })
                        if (d.length === 2) (e.target.nextElementSibling as HTMLElement)?.focus()
                      }}
                      className="w-12 rounded border px-2 py-2 text-sm text-center outline-none focus:border-amazon-link dark:border-border dark:bg-card"
                    />
                    <span className="text-muted-foreground">/</span>
                    <input
                      type="text" inputMode="numeric" maxLength={2} placeholder="MM"
                      value={form.date_of_birth ? (() => { const [y,m] = form.date_of_birth.split("-"); return ["",undefined].includes(m)?"":m })() : ""}
                      onChange={(e) => {
                        const m = e.target.value.replace(/\D/g, "").slice(0,2)
                        const [y,,d] = form.date_of_birth ? form.date_of_birth.split("-") : ["","",""]
                        setForm({ ...form, date_of_birth: `${y||""}-${m}-${d||""}` })
                        if (m.length === 2) setTimeout(() => (e.target.nextElementSibling?.nextElementSibling as HTMLElement)?.focus(), 10)
                      }}
                      className="w-12 rounded border px-2 py-2 text-sm text-center outline-none focus:border-amazon-link dark:border-border dark:bg-card"
                    />
                    <span className="text-muted-foreground">/</span>
                    <input
                      type="text" inputMode="numeric" maxLength={4} placeholder="YYYY"
                      value={form.date_of_birth ? (() => { const [y] = form.date_of_birth.split("-"); return ["",undefined].includes(y)?"":y })() : ""}
                      onChange={(e) => {
                        const y = e.target.value.replace(/\D/g, "").slice(0,4)
                        const [,m,d] = form.date_of_birth ? form.date_of_birth.split("-") : ["","",""]
                        setForm({ ...form, date_of_birth: `${y}-${m||""}-${d||""}` })
                      }}
                      className="w-14 rounded border px-2 py-2 text-sm text-center outline-none focus:border-amazon-link dark:border-border dark:bg-card"
                    />
                    <Popover>
                      <PopoverTrigger className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-accent shrink-0">
                        <CalendarIcon className="h-4 w-4" />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={form.date_of_birth && /^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth) ? new Date(form.date_of_birth + "T00:00:00") : undefined}
                          onSelect={(date) => {
                            if (date) setForm({ ...form, date_of_birth: format(date, "yyyy-MM-dd") })
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-1 rounded bg-amazon-link px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded border px-4 py-2 text-sm dark:border-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">First Name</p>
                  <p className="text-sm font-medium">{p?.first_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Name</p>
                  <p className="text-sm font-medium">{p?.last_name || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{p?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{p?.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="text-sm font-medium">{p?.date_of_birth || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="text-sm font-medium capitalize">{p?.gender || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Verified</p>
                <p className="text-sm font-medium">{p?.is_verified ? "Yes" : "No"}</p>
              </div>
              {p?.addresses && p.addresses.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Saved Addresses</p>
                  <div className="space-y-2">
                    {p.addresses.map((addr) => (
                      <div key={addr.id} className="flex items-start justify-between rounded-md border bg-muted/50 p-3 text-sm dark:border-border">
                        <div>
                          <p className="font-medium">{addr.label}</p>
                          <p className="text-muted-foreground">{addr.street}, {addr.city}, {addr.state} {addr.pincode}</p>
                        </div>
                        <Dialog>
                          <DialogTrigger className="shrink-0 text-xs text-destructive hover:underline cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Address</DialogTitle>
                              <DialogDescription>Are you sure you want to delete this address?</DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-3">
                              <button type="button" className={buttonVariants({ variant: "outline" })} onClick={() => {}}>Cancel</button>
                              <Button
                                variant="destructive"
                                onClick={() => { deleteAddress.mutate(addr.id); setDeletingId(addr.id) }}
                                disabled={deleteAddress.isPending && deletingId === addr.id}
                              >
                                Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setForm({ first_name: p?.first_name || "", last_name: p?.last_name || "", phone: p?.phone || "", date_of_birth: p?.date_of_birth || "", gender: p?.gender || "" })
                  setEditing(true)
                }}
                className="rounded bg-amazon-cart px-4 py-2 text-sm font-semibold text-black hover:brightness-95"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}
