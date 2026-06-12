"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FormInput, Plus, Trash2, X, ChevronRight, Columns3, Rows3, Users, LogOut, Globe, DollarSign, Copy, Check } from "lucide-react"
import Link from "next/link"
import { getUserForms, createForm, deleteForm, leaveForm } from "@/lib/form-api"
import type { FormWithMeta } from "@/lib/actions/forms"
import { teamIcons, iconColorClasses } from "@/lib/team-icons"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CloudinaryUpload from "@/components/cloudinary-upload"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState("")
  const [formImage, setFormImage] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    getUserForms()
      .then(setForms)
      .catch(() => setForms([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(formData: FormData) {
    if (selectedIcon) formData.set("icon", selectedIcon)
    if (formImage) formData.set("image", formImage)
    const res = await createForm(formData)
    setForms((prev) => [res.form, ...prev])
    setShowCreate(false)
    setSelectedIcon("")
    setFormImage("")
    formRef.current?.reset()
  }

  async function handleDelete(formId: string) {
    if (!confirm("Delete this form and all its submissions?")) return
    setForms((prev) => prev.filter((f) => f.id !== formId))
    await deleteForm(formId)
  }

  const [copiedId, setCopiedId] = useState<string | null>(null)

  function handleCopyLink(formId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/form/${formId}`)
    setCopiedId(formId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleLeave(formId: string) {
    if (!confirm("Leave this form? You will lose access.")) return
    setForms((prev) => prev.filter((f) => f.id !== formId))
    await leaveForm(formId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading forms...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Forms</h1>
          <p className="text-muted-foreground mt-1">Create and manage your data collection forms.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Form</span>
        </Button>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => { setShowCreate(false); setSelectedIcon(""); setFormImage("") }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Create Form</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => { setShowCreate(false); setSelectedIcon(""); setFormImage("") }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <form action={handleCreate}>
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
                      <label htmlFor="name" className="text-sm font-medium">Name</label>
                      <Input id="name" name="name" placeholder="e.g. Job Application" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium">Description</label>
                      <textarea
                        id="description" name="description" placeholder="What is this form for?" rows={3}
                        className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setSelectedIcon(""); setFormImage("") }}>Cancel</Button>
                    <Button type="submit">Create Form</Button>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {forms.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FormInput className="w-12 h-12 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No forms yet</h3>
              <p className="text-sm mb-6">Create your first form to start collecting data.</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Form
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((f, i) => {
            const iconDef = teamIcons.find((t) => t.name === f.icon)
            const FcIcon = iconDef?.icon || FormInput
            const colorIdx = teamIcons.findIndex((t) => t.name === f.icon)
            const iconColor = colorIdx >= 0 ? iconColorClasses[colorIdx % iconColorClasses.length] : "bg-gradient-to-br from-violet-500 to-pink-600"

            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/dashboard/forms/${f.id}`}>
                  <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group overflow-hidden">
                    {f.image && (
                      <div className="relative w-full h-24 -mb-2">
                        <Image src={f.image} alt="" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${f.icon ? iconColor : "bg-gradient-to-br from-violet-500 to-pink-600"}`}>
                            <FcIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate flex items-center gap-2">
                              {f.name}
                              {f.isPublic && <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                              {f.paid && <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            </CardTitle>
                            {f.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{f.description}</p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 mt-1 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Columns3 className="w-3.5 h-3.5" />{f.fieldCount} fields</span>
                        <span className="flex items-center gap-1"><Rows3 className="w-3.5 h-3.5" />{f.submissionCount} submissions</span>
                      </div>
                      {(f.sharedViaTeams?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <Users className="w-3 h-3 text-muted-foreground/60" />
                          {f.sharedViaTeams.map((t) => (
                            <span key={t.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t border-border/50 pt-3">
                      <div className="flex w-full gap-1" onClick={(e) => e.preventDefault()}>
                        <div className="flex-1">
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-emerald-600"
                            onClick={() => handleCopyLink(f.id)}
                            title="Copy submission link"
                          >
                            {copiedId === f.id ? (
                              <><Check className="w-3.5 h-3.5 text-emerald-500" />Copied!</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" />Copy Link</>
                            )}
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          {f.isOwner ? (
                            <Button
                              variant="ghost" size="icon"
                              className="w-7 h-7 text-muted-foreground hover:text-red-500"
                              onClick={() => handleDelete(f.id)}
                              title="Delete form"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          ) : f.hasDirectAllotment ? (
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 gap-1 text-xs text-muted-foreground hover:text-orange-500"
                              onClick={() => handleLeave(f.id)}
                              title="Leave form"
                            >
                              <LogOut className="w-3.5 h-3.5" />Leave
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
