"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { User, Address } from "@/types/api"
import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { User as UserIcon, Pencil, Check, X, Plus, Trash2, CalendarIcon } from "lucide-react"
import { DynamicShell as Shell } from "@/components/features/dynamic-shell"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { toast } from "sonner"
import { INDIA_STATES, INDIA_LOCATIONS } from "@/lib/india-locations"

export default function ProfileContent() {
  const { isAuthenticated } = useAuthStore()
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
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Per-field editing state
  const [editField, setEditField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  // Address form
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddr, setEditingAddr] = useState<Address | null>(null)
  const [addrForm, setAddrForm] = useState({
    label: "Home", street: "", city: "", state: "", pincode: "", country: "India",
  })

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<User>("/auth/users/me"),
  })

  const updateProfile = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put<User>("/auth/users/me", data),
    onSuccess: (data) => {
      login(useAuthStore.getState().token!, data)
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      setEditField(null)
      toast.success("Profile updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createAddress = useMutation({
    mutationFn: () => api.post("/users/me/addresses", addrForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      toast.success("Address added")
      setShowAddForm(false)
      setAddrForm({ label: "Home", street: "", city: "", state: "", pincode: "", country: "India" })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/users/me/addresses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      toast.success("Address updated")
      setEditingAddr(null)
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
  const addresses = (p as User & { addresses?: Address[] })?.addresses || []

  const startEdit = (field: string, currentValue: string) => {
    setEditField(field)
    setEditValue(currentValue)
  }

  const cancelEdit = () => {
    setEditField(null)
    setEditValue("")
  }

  const saveField = () => {
    if (!editField) return
    updateProfile.mutate({ [editField]: editValue })
  }

  const resetAddrForm = (addr?: Address) => {
    if (addr) {
      setAddrForm({ label: addr.label, street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country || "India" })
    } else {
      setAddrForm({ label: "Home", street: "", city: "", state: "", pincode: "", country: "India" })
    }
  }

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

        <div className="space-y-2">
          <EditableRow label="First Name" field="first_name" value={p?.first_name || ""} editField={editField} editValue={editValue} setEditValue={setEditValue} startEdit={startEdit} cancelEdit={cancelEdit} saveField={saveField} isSaving={updateProfile.isPending} />
          <EditableRow label="Last Name" field="last_name" value={p?.last_name || ""} editField={editField} editValue={editValue} setEditValue={setEditValue} startEdit={startEdit} cancelEdit={cancelEdit} saveField={saveField} isSaving={updateProfile.isPending} />
          <EditableRow label="Phone" field="phone" value={p?.phone || ""} editField={editField} editValue={editValue} setEditValue={setEditValue} startEdit={startEdit} cancelEdit={cancelEdit} saveField={saveField} isSaving={updateProfile.isPending} />
          <EditableRow label="Date of Birth" field="date_of_birth" value={p?.date_of_birth || ""} displayValue={p?.date_of_birth ? (() => { const [y,m,d] = p.date_of_birth!.split("-"); return `${d}/${m}/${y}` })() : "-"} editField={editField} editValue={editValue} setEditValue={setEditValue} startEdit={startEdit} cancelEdit={cancelEdit} saveField={saveField} isSaving={updateProfile.isPending}
            renderEdit={(val, onChange) => (
              <div className="flex items-center gap-1">
                 {["DD", "MM", "YYYY"].map((ph, i) => {
                  const maxLen = [2, 2, 4]
                  const idx = [2, 1, 0] // parts = [year, month, day]; UI order = [day, month, year]
                  const parts = val ? val.split("-") : ["", "", ""]
                  return (
                    <span key={i} className="flex items-center gap-1">
                      <input type="text" inputMode="numeric" maxLength={maxLen[i]} placeholder={ph}
                        value={["", undefined].includes(parts[idx[i]]) ? "" : parts[idx[i]]}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, maxLen[i])
                          const newParts = [...parts]
                          newParts[idx[i]] = v
                          onChange(newParts.join("-"))
                          if (v.length === maxLen[i] && i < 2) {
                            const next = (e.target.parentElement?.parentElement?.children[i * 2 + 1]?.querySelector("input")) as HTMLElement
                            setTimeout(() => next?.focus(), 10)
                          }
                        }}
                        onBlur={() => {
                          if (i < 2 && parts[idx[i]].length === 1) {
                            const newParts = [...parts]
                            newParts[idx[i]] = "0" + parts[idx[i]]
                            onChange(newParts.join("-"))
                          }
                        }}
                        className={`w-${i < 2 ? "10" : "14"} rounded border px-1 py-1 text-sm text-center outline-none focus:border-amazon-link dark:border-border dark:bg-card`}
                      />
                      {i < 2 && <span className="text-muted-foreground">/</span>}
                    </span>
                  )
                })}
                <Popover>
                  <PopoverTrigger className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-accent">
                    <CalendarIcon className="h-3.5 w-3.5" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single"
                      selected={val && /^\d{4}-\d{2}-\d{2}$/.test(val) ? new Date(val + "T00:00:00") : undefined}
                      onSelect={(date) => { if (date) onChange(format(date, "yyyy-MM-dd")) }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          />
          <EditableRow label="Gender" field="gender" value={p?.gender || ""} editField={editField} editValue={editValue} setEditValue={setEditValue} startEdit={startEdit} cancelEdit={cancelEdit} saveField={saveField} isSaving={updateProfile.isPending}
            renderEdit={(val, onChange) => (
              <select value={val} onChange={(e) => onChange(e.target.value)}
                className="flex-1 rounded border px-2 py-1 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unspecified">Prefer not to say</option>
              </select>
            )}
          />

        </div>

        {/* Addresses */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Addresses</h2>
            {!showAddForm && !editingAddr && (
              <button onClick={() => { setShowAddForm(true); resetAddrForm() }}
                className="flex items-center gap-1 rounded bg-amazon-link px-3 py-1.5 text-sm font-medium text-white hover:brightness-95">
                <Plus className="h-4 w-4" /> Add Address
              </button>
            )}
          </div>

          {(showAddForm || editingAddr) && (
            <div className="mb-4 space-y-3 rounded-lg border bg-muted/50 p-4">
              <input placeholder="Label (Home/Work)" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card" />
              <input placeholder="Street address" value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card" />
              <div className="grid grid-cols-2 gap-3">
                <select value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} disabled={!addrForm.state} className="rounded border px-3 py-2 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">{addrForm.state ? "Select city" : "Select state first"}</option>
                  {addrForm.state && INDIA_LOCATIONS[addrForm.state]?.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select value={addrForm.state} onChange={(e) => { setAddrForm({ ...addrForm, state: e.target.value, city: '' }) }} className="rounded border px-3 py-2 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card">
                  <option value="">State</option>
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <input placeholder="Pincode" inputMode="numeric" maxLength={6} value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value.replace(/\D/g, '') })} className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card" />
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => editingAddr ? updateAddress.mutate({ id: editingAddr.id, data: addrForm }) : createAddress.mutate()}
                  disabled={createAddress.isPending || updateAddress.isPending || !addrForm.street || !addrForm.city || !addrForm.state || addrForm.pincode.length !== 6}
                  className="rounded bg-amazon-link px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50">
                  Save Address
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); setEditingAddr(null) }} className="rounded border px-4 py-2 text-sm dark:border-border">Cancel</button>
              </div>
            </div>
          )}

          {addresses.length === 0 && !showAddForm && !editingAddr ? (
            <p className="text-sm text-muted-foreground">No addresses saved.</p>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div key={addr.id} className="flex items-start justify-between rounded-md border bg-muted/50 p-3 text-sm dark:border-border">
                  <div>
                    <p className="font-medium">{addr.label}</p>
                    <p className="text-muted-foreground">{addr.street}, {addr.city}, {addr.state} {addr.pincode}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => { setEditingAddr(addr); resetAddrForm(addr); setShowAddForm(false) }} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <Dialog>
                      <DialogTrigger className="p-1 text-destructive"><Trash2 className="h-3.5 w-3.5" /></DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Address</DialogTitle>
                          <DialogDescription>Are you sure you want to delete this address?</DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3">
                          <button type="button" className={buttonVariants({ variant: "outline" })} onClick={() => {}}>Cancel</button>
                          <Button variant="destructive" onClick={() => { deleteAddress.mutate(addr.id); setDeletingId(addr.id) }} disabled={deleteAddress.isPending && deletingId === addr.id}>
                            Delete
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}

type EditableRowProps = {
  label: string; field: string; value: string
  editField: string | null; editValue: string
  setEditValue: (v: string) => void
  startEdit: (f: string, v: string) => void
  cancelEdit: () => void
  saveField: () => void
  isSaving: boolean
  displayValue?: string
  renderEdit?: (val: string, onChange: (v: string) => void) => React.ReactNode
}

function EditableRow({ label, field, value, editField, editValue, setEditValue, startEdit, cancelEdit, saveField, isSaving, displayValue, renderEdit }: EditableRowProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isEditing = editField === field
  const display = (displayValue ?? value) || "-"

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus()
  }, [isEditing])

  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2.5 text-sm dark:border-border">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {isEditing ? (
          <div className="mt-1 flex items-center gap-1">
            {renderEdit ? (
              renderEdit(editValue, setEditValue)
            ) : (
              <input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveField()}
                className="flex-1 rounded border px-2 py-1 text-sm outline-none focus:border-amazon-link dark:border-border dark:bg-card" />
            )}
            <button onClick={saveField} disabled={isSaving} className="p-1 text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
            <button onClick={cancelEdit} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <p className="font-medium truncate">{display}</p>
        )}
      </div>
      {!isEditing && (
        <button onClick={() => startEdit(field, value || "")} className="p-1 text-muted-foreground hover:text-foreground shrink-0 ml-2">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
