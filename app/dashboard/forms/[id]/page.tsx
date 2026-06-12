"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft, FormInput, Pencil, Trash2, X, Plus,
  Columns3, Rows3, Star, StarOff, Users, Shield,
  Settings, Mail, Building2, LogOut, Globe, DollarSign,
  Text, CheckSquare, List, Star as StarIcon, Mail as MailIcon, Phone, Hash, AlignLeft,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  getForm, updateForm, deleteForm, addColumn, updateFormColumn, deleteFormColumn,
  getSubmissions, deleteSubmission, updateSubmissionStar,
  getUserTeamsSimple, addFormAllotment, updateFormAllotmentPermission, removeFormAllotment, leaveForm,
} from "@/lib/form-api"
import type { FormDetail, FormSubmission, SimpleTeam } from "@/lib/actions/forms"
import { teamIcons, iconColorClasses } from "@/lib/team-icons"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import CloudinaryUpload from "@/components/cloudinary-upload"

type Tab = "fields" | "submissions" | "sharing" | "settings"

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "fields", label: "Fields", icon: Columns3 },
  { key: "submissions", label: "Submissions", icon: Rows3 },
  { key: "sharing", label: "Sharing", icon: Users },
  { key: "settings", label: "Settings", icon: Settings },
]

const fieldTypes = [
  { value: "text", label: "Text", icon: Text },
  { value: "textarea", label: "Textarea", icon: AlignLeft },
  { value: "email", label: "Email", icon: MailIcon },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "number", label: "Number", icon: Hash },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "radio", label: "Radio", icon: List },
  { value: "select", label: "Select", icon: List },
  { value: "rating", label: "Rating", icon: StarIcon },
]

const permLabel: Record<string, string> = { f: "Full", rw: "Read & Write", r: "Read Only" }
const permColor: Record<string, string> = {
  f: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  rw: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  r: "bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400",
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field"
}

export default function FormDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [form, setForm] = useState<FormDetail | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [teams, setTeams] = useState<SimpleTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("fields")

  // Settings state
  const [selectedIcon, setSelectedIcon] = useState("")
  const [formImage, setFormImage] = useState("")

  // Column editor state
  const [fieldEditor, setFieldEditor] = useState<{ col?: FormDetail["columns"][number] } | null>(null)
  const [fieldName, setFieldName] = useState("")
  const [fieldType, setFieldType] = useState("text")
  const [fieldRequired, setFieldRequired] = useState(false)
  const [fieldOptions, setFieldOptions] = useState("")

  // Allotment state
  const [showAllot, setShowAllot] = useState(false)
  const [allotType, setAllotType] = useState<"user" | "team">("user")
  const [allotEmail, setAllotEmail] = useState("")
  const [allotTeamId, setAllotTeamId] = useState("")
  const [allotPerm, setAllotPerm] = useState<"f" | "rw" | "r">("rw")

  useEffect(() => {
    let mounted = true
    Promise.all([getForm(id), getSubmissions(id), getUserTeamsSimple()])
      .then(([data, subs, tms]) => {
        if (mounted) {
          setForm(data)
          setSubmissions(subs)
          setTeams(tms)
        }
      })
      .catch(() => {
        if (mounted) router.push("/dashboard/forms")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [id, router])

  async function load() {
    const [data, subs, tms] = await Promise.all([
      getForm(id),
      getSubmissions(id),
      getUserTeamsSimple(),
    ])
    setForm(data)
    setSubmissions(subs)
    setTeams(tms)
  }

  // Settings
  function openSettings() {
    if (!form) return
    setSelectedIcon(form.icon || "")
    setFormImage(form.image || "")
    setTab("settings")
  }

  async function handleSaveSettings(formData: FormData) {
    if (selectedIcon) formData.set("icon", selectedIcon)
    if (formImage) formData.set("image", formImage)
    await updateForm(id, formData)
    await load()
  }

  async function handleDelete() {
    if (!confirm("Delete this form permanently?")) return
    await deleteForm(id)
    router.push("/dashboard/forms")
  }

  async function handleLeave() {
    if (!confirm("Leave this form? You will lose access.")) return
    await leaveForm(id)
    router.push("/dashboard/forms")
  }

  // Column editor
  function openFieldEditor(col?: FormDetail["columns"][number]) {
    if (col) {
      setFieldName(col.name)
      setFieldType(col.type)
      setFieldRequired(col.required)
      setFieldOptions(
        col.type === "radio" || col.type === "select"
          ? (Array.isArray(col.options) ? col.options.join("\n") : "")
          : col.type === "rating"
            ? String(col.options || 5)
            : ""
      )
      setFieldEditor({ col })
    } else {
      setFieldName("")
      setFieldType("text")
      setFieldRequired(false)
      setFieldOptions("")
      setFieldEditor({})
    }
  }

  async function handleSaveField() {
    if (!fieldName.trim()) return
    setFieldEditor(null)
    const options = ["radio", "select"].includes(fieldType) && fieldOptions.trim()
      ? fieldOptions.split("\n").map((s) => s.trim()).filter(Boolean)
      : undefined
    const ratingOptions = fieldType === "rating" && fieldOptions.trim()
      ? parseInt(fieldOptions) || 5
      : undefined

    if (fieldEditor?.col) {
      await updateFormColumn(fieldEditor.col.id, id, {
        name: fieldName.trim(),
        slug: slugify(fieldName.trim()),
        type: fieldType,
        required: fieldRequired,
        options: options || ratingOptions || undefined,
      })
    } else {
      await addColumn(id, fieldName.trim(), fieldType)
    }
    await load()
  }

  async function handleDeleteColumn(colId: string) {
    if (!confirm("Delete this field? Data for this field will be lost.")) return
    await deleteFormColumn(colId, id)
    await load()
  }

  // Submissions
  async function handleDeleteSubmission(submissionId: string) {
    if (!confirm("Delete this submission?")) return
    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId))
    await deleteSubmission(submissionId, id)
    const subs = await getSubmissions(id)
    setSubmissions(subs)
  }

  async function handleStar(submissionId: string, starred: boolean) {
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, starred } : s)))
    await updateSubmissionStar(submissionId, id, starred)
  }

  // Allotments
  async function handleAddAllotment() {
    setShowAllot(false)
    await addFormAllotment(
      id,
      allotType === "user" ? { type: "user", email: allotEmail } : { type: "team", teamId: allotTeamId },
      allotPerm
    )
    setAllotEmail("")
    setAllotTeamId("")
    await load()
  }

  async function handleUpdatePerm(allotId: string, permission: "f" | "rw" | "r") {
    await updateFormAllotmentPermission(allotId, id, permission)
    await load()
  }

  async function handleRemoveAllot(allotId: string) {
    await removeFormAllotment(allotId, id)
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading form...</p>
        </div>
      </div>
    )
  }

  if (!form) return null

  const iconDef = teamIcons.find((t) => t.name === form.icon)
  const FcIcon = iconDef?.icon || FormInput
  const colorIdx = teamIcons.findIndex((t) => t.name === form.icon)
  const iconColor = colorIdx >= 0 ? iconColorClasses[colorIdx % iconColorClasses.length] : "bg-gradient-to-br from-violet-500 to-pink-600"
  const isOwner = form.isOwner
  const canManage = isOwner || form.userPermission === "f"
  const canWrite = canManage || form.userPermission === "rw"

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/forms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Forms
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        {form.image && (
          <div className="relative w-full h-36">
            <Image src={form.image} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-2xl ${form.icon ? iconColor : "bg-gradient-to-br from-violet-500 to-pink-600"}`}>
                <FcIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {form.name}
                  {form.isPublic && <Globe className="w-4 h-4 text-emerald-500" aria-label="Public" />}
                  {form.paid && <DollarSign className="w-4 h-4 text-amber-500" aria-label="Paid" />}
                </CardTitle>
                {form.description && <p className="text-sm text-muted-foreground mt-1">{form.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Columns3 className="w-3.5 h-3.5" />{form.columns.length} fields</span>
                  <span className="flex items-center gap-1"><Rows3 className="w-3.5 h-3.5" />{submissions.length} submissions</span>
                </div>
                {form.sharedViaTeams.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Users className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-[11px] text-muted-foreground">Shared via:</span>
                    {form.sharedViaTeams.map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={openSettings} className="gap-2">
                <Pencil className="w-4 h-4" /><span className="hidden sm:inline">Edit</span>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.key
                ? "bg-accent text-foreground border border-border border-b-background -mb-px"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ───── Fields Tab ───── */}
      {tab === "fields" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Columns3 className="w-4 h-4" />Fields</CardTitle>
              {canWrite && (
                <Button size="sm" onClick={() => openFieldEditor()} className="gap-2">
                  <Plus className="w-4 h-4" />Add Field
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {form.columns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Columns3 className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm mb-4">No fields yet. Add your first field to start collecting data.</p>
                {canWrite && (
                  <Button size="sm" onClick={() => openFieldEditor()} className="gap-2">
                    <Plus className="w-4 h-4" />Add Field
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {form.columns.map((col, i) => {
                  const ft = fieldTypes.find((t) => t.value === col.type)
                  const FtIcon = ft?.icon || Text
                  return (
                    <div
                      key={col.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-accent/20 hover:bg-accent/40 transition-colors group"
                    >
                      <span className="text-xs text-muted-foreground/50 w-5 text-right font-mono">{i + 1}.</span>
                      <div className="w-8 h-8 rounded-lg bg-accent/70 flex items-center justify-center shrink-0">
                        <FtIcon className="w-4 h-4 text-foreground/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{col.name}</span>
                          {col.required && <span className="text-[10px] text-red-400 font-medium">*</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-accent/60 text-muted-foreground px-1.5 py-0.5 rounded font-medium">{col.type}</span>
                          {col.type === "radio" || col.type === "select" ? (
                            <span className="text-[10px] text-muted-foreground">{Array.isArray(col.options) ? col.options.length : 0} options</span>
                          ) : col.type === "rating" ? (
                            <span className="text-[10px] text-muted-foreground">1–{typeof col.options === "number" ? col.options : 5}</span>
                          ) : null}
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => openFieldEditor(col)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => handleDeleteColumn(col.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Field Modal */}
      <AnimatePresence>
        {fieldEditor !== null && (
          <Modal onClose={() => setFieldEditor(null)}>
            <Card className="w-full max-w-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{fieldEditor?.col ? "Edit Field" : "Add Field"}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setFieldEditor(null)}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Field Name</label>
                  <Input
                    placeholder="e.g. Full Name"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Field Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {fieldTypes.map((ft) => (
                      <button
                        key={ft.value}
                        type="button"
                        onClick={() => {
                          setFieldType(ft.value)
                          setFieldOptions(ft.value === "rating" ? "5" : "")
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                          fieldType === ft.value
                            ? "border-foreground bg-accent ring-1 ring-foreground/20"
                            : "border-input hover:bg-accent/50 hover:border-foreground/30"
                        }`}
                      >
                        <ft.icon className={`w-5 h-5 ${fieldType === ft.value ? "text-foreground" : "text-muted-foreground"}`} />
                        <span className={`text-[11px] font-medium leading-tight ${fieldType === ft.value ? "text-foreground" : "text-muted-foreground"}`}>{ft.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {["radio", "select"].includes(fieldType) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Options <span className="text-muted-foreground font-normal">(one per line)</span></label>
                    <textarea
                      value={fieldOptions}
                      onChange={(e) => setFieldOptions(e.target.value)}
                      rows={4}
                      placeholder={"Option 1\nOption 2\nOption 3"}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}

                {fieldType === "rating" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maximum Rating</label>
                    <Input
                      type="number" min="2" max="10"
                      value={fieldOptions}
                      onChange={(e) => setFieldOptions(e.target.value)}
                      className="w-24"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2.5 text-sm cursor-pointer p-3 rounded-lg border border-input hover:bg-accent/30 transition-colors">
                  <input type="checkbox" checked={fieldRequired} onChange={(e) => setFieldRequired(e.target.checked)} className="rounded border-input" />
                  <div>
                    <span className="font-medium">Required</span>
                    <p className="text-xs text-muted-foreground">Users must fill this field before submitting</p>
                  </div>
                </label>
              </CardContent>
              <CardFooter className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setFieldEditor(null)}>Cancel</Button>
                <Button onClick={handleSaveField} disabled={!fieldName.trim()}>
                  {fieldEditor?.col ? "Save Changes" : "Add Field"}
                </Button>
              </CardFooter>
            </Card>
          </Modal>
        )}
      </AnimatePresence>

      {/* ───── Submissions Tab ───── */}
      {tab === "submissions" && (
        <div className="space-y-4">
          {submissions.length === 0 && form.columns.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Add fields in the Fields tab first, then share the form to collect submissions.</CardContent></Card>
          ) : submissions.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No submissions yet. Share the form to start collecting responses.</CardContent></Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-accent/50 border-b border-border">
                    <th className="text-left p-3 w-10"></th>
                    <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Email</th>
                    {form.columns.map((col) => (
                      <th key={col.id} className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">{col.name}</th>
                    ))}
                    <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Submitted</th>
                    {canWrite && <th className="text-right p-3 w-24">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-accent/30 transition-colors">
                      <td className="p-3">
                        <button onClick={() => handleStar(s.id, !s.starred)} className="text-muted-foreground hover:text-amber-400 transition-colors">
                          {s.starred ? <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> : <StarOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-3 truncate max-w-[150px]">{s.name || "—"}</td>
                      <td className="p-3 truncate max-w-[200px]">{s.email || "—"}</td>
                      {form.columns.map((col) => (
                        <td key={col.id} className="p-3 truncate max-w-[200px]">{String(s.values[col.slug] ?? "")}</td>
                      ))}
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {new Date(s.submittedAt).toLocaleDateString()}
                      </td>
                      {canWrite && (
                        <td className="p-3 text-right">
                          <Button size="sm" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => handleDeleteSubmission(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ───── Sharing Tab ───── */}
      {tab === "sharing" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" />Access</CardTitle>
              {isOwner && <Button size="sm" onClick={() => setShowAllot(true)} className="gap-2"><Plus className="w-4 h-4" />Share</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {form.allotments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No one else has access. Click Share to add users or teams.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {form.allotments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      {a.teamName ? <Building2 className="w-4 h-4 text-muted-foreground" /> : <Shield className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.teamName || a.userName || a.userEmail || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{a.teamName ? "Team" : "User"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <select
                          value={a.permission}
                          onChange={(e) => handleUpdatePerm(a.id, e.target.value as "f" | "rw" | "r")}
                          className="text-xs rounded border border-input bg-transparent px-2 py-1"
                        >
                          <option value="f">Full</option>
                          <option value="rw">Read & Write</option>
                          <option value="r">Read Only</option>
                        </select>
                      )}
                      {!isOwner && (
                        <Badge variant="secondary" className={`text-xs ${permColor[a.permission]}`}>{permLabel[a.permission]}</Badge>
                      )}
                      {isOwner && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-400" onClick={() => handleRemoveAllot(a.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Allotment Modal */}
      <AnimatePresence>
        {showAllot && (
          <Modal onClose={() => { setShowAllot(false) }}>
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Share Form</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => { setShowAllot(false) }}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={allotType === "user" ? "default" : "outline"} size="sm"
                    onClick={() => setAllotType("user")}
                  >
                    <Mail className="w-4 h-4 mr-1" />User
                  </Button>
                  <Button
                    variant={allotType === "team" ? "default" : "outline"} size="sm"
                    onClick={() => setAllotType("team")}
                  >
                    <Building2 className="w-4 h-4 mr-1" />Team
                  </Button>
                </div>
                {allotType === "user" ? (
                  <Input placeholder="user@example.com" value={allotEmail} onChange={(e) => setAllotEmail(e.target.value)} />
                ) : (
                  <select
                    value={allotTeamId}
                    onChange={(e) => setAllotTeamId(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="">Select a team...</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
                <select
                  value={allotPerm}
                  onChange={(e) => setAllotPerm(e.target.value as "f" | "rw" | "r")}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="rw">Read & Write</option>
                  <option value="r">Read Only</option>
                  <option value="f">Full</option>
                </select>
              </CardContent>
              <CardFooter className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowAllot(false) }}>Cancel</Button>
                <Button onClick={handleAddAllotment}>Add Access</Button>
              </CardFooter>
            </Card>
          </Modal>
        )}
      </AnimatePresence>

      {/* ───── Settings Tab ───── */}
      {tab === "settings" && (
        <Card>
          <form action={handleSaveSettings}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" />Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {teamIcons.map(({ name: iconName, icon: Icon }, idx) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(selectedIcon === iconName ? "" : iconName)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        selectedIcon === iconName
                          ? `${iconColorClasses[idx % iconColorClasses.length]} ring-2 ring-offset-2 ring-foreground scale-110 shadow-sm`
                          : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground border border-input"
                      }`}
                      title={iconName}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
                <input type="hidden" name="icon" value={selectedIcon} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Image</label>
                <CloudinaryUpload value={formImage} onChange={setFormImage} />
                <input type="hidden" name="image" value={formImage} />
              </div>
              <div className="space-y-2">
                <label htmlFor="s-name" className="text-sm font-medium">Name</label>
                <Input id="s-name" name="name" defaultValue={form.name} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="s-desc" className="text-sm font-medium">Description</label>
                <textarea id="s-desc" name="description" defaultValue={form.description ?? ""} rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring" />
              </div>
              {isOwner && (
                <>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="s-public" name="isPublic" defaultChecked={form.isPublic} className="rounded border-input" />
                    <label htmlFor="s-public" className="text-sm font-medium cursor-pointer">Public — anyone with the link can submit</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="s-paid" name="paid" defaultChecked={form.paid} className="rounded border-input" />
                    <label htmlFor="s-paid" className="text-sm font-medium cursor-pointer">Paid form</label>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="s-amount" className="text-sm font-medium">Pay Amount</label>
                    <Input id="s-amount" name="payAmount" type="number" step="0.01" min="0" defaultValue={form.payAmount ?? ""} placeholder="0.00" />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                {isOwner && (
                  <Button type="button" variant="outline" onClick={handleDelete} className="gap-2 text-red-500"><Trash2 className="w-4 h-4" />Delete Form</Button>
                )}
                {!isOwner && form.hasDirectAllotment && (
                  <Button type="button" variant="outline" onClick={handleLeave} className="gap-2 text-orange-500"><LogOut className="w-4 h-4" />Leave Form</Button>
                )}
              </div>
              {isOwner && <Button type="submit">Save Changes</Button>}
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}
