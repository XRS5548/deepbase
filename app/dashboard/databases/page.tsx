"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Database, Plus, Trash2, X, Loader2, ChevronRight, Columns3, Rows3, Users, LogOut } from "lucide-react"
import Link from "next/link"
import { getUserDatabases, createDatabase, deleteDatabase, leaveDatabase, type DatabaseWithMeta } from "@/lib/actions/databases"
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

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<DatabaseWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("")
  const [dbImage, setDbImage] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    getUserDatabases()
      .then(setDatabases)
      .catch(() => setDatabases([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(formData: FormData) {
    setCreating(true)
    setError("")
    try {
      if (selectedIcon) formData.set("icon", selectedIcon)
      if (dbImage) formData.set("image", dbImage)
      const res = await createDatabase(formData)
      if (res.success) {
        setDatabases((prev) => [res.database as DatabaseWithMeta, ...prev])
        setShowCreate(false)
        setSelectedIcon("")
        setDbImage("")
        formRef.current?.reset()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create database")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(dbId: string) {
    if (!confirm("Delete this database and all its data?")) return
    try {
      await deleteDatabase(dbId)
      setDatabases((prev) => prev.filter((d) => d.id !== dbId))
    } catch {
      // silently fail
    }
  }

  async function handleLeave(dbId: string) {
    if (!confirm("Leave this database? You will lose access.")) return
    try {
      await leaveDatabase(dbId)
      setDatabases((prev) => prev.filter((d) => d.id !== dbId))
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading databases...</p>
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Databases</h1>
          <p className="text-muted-foreground mt-1">Create and manage your structured databases.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Database</span>
        </Button>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => { setShowCreate(false); setSelectedIcon(""); setDbImage("") }}
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
                    <CardTitle>Create Database</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => { setShowCreate(false); setSelectedIcon(""); setDbImage("") }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <form action={handleCreate} ref={formRef}>
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
                      <CloudinaryUpload value={dbImage} onChange={setDbImage} />
                      <input type="hidden" name="image" value={dbImage} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Name</label>
                      <Input id="name" name="name" placeholder="e.g. Customer CRM" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium">Description</label>
                      <textarea
                        id="description" name="description" placeholder="What data does this store?" rows={3}
                        className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setSelectedIcon(""); setDbImage("") }}>Cancel</Button>
                    <Button type="submit" disabled={creating} className="gap-2">
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      {creating ? "Creating..." : "Create Database"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {databases.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Database className="w-12 h-12 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No databases yet</h3>
              <p className="text-sm mb-6">Create your first database to start storing structured data.</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Database
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {databases.map((db_, i) => {
            const iconDef = teamIcons.find((t) => t.name === db_.icon)
            const DbIcon = iconDef?.icon || Database
            const colorIdx = teamIcons.findIndex((t) => t.name === db_.icon)
            const iconColor = colorIdx >= 0 ? iconColorClasses[colorIdx % iconColorClasses.length] : "bg-gradient-to-br from-cyan-500 to-blue-600"

            return (
              <motion.div
                key={db_.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/dashboard/databases/${db_.id}`}>
                  <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group overflow-hidden">
                    {db_.image && (
                      <div className="relative w-full h-24 -mb-2">
                        <Image src={db_.image} alt="" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${db_.icon ? iconColor : "bg-gradient-to-br from-cyan-500 to-blue-600"}`}>
                            <DbIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">{db_.name}</CardTitle>
                            {db_.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{db_.description}</p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 mt-1 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Columns3 className="w-3.5 h-3.5" />{db_.fieldCount ?? 0} fields</span>
                        <span className="flex items-center gap-1"><Rows3 className="w-3.5 h-3.5" />{db_.rowCount ?? 0} rows</span>
                      </div>
                      {(db_.sharedViaTeams?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <Users className="w-3 h-3 text-muted-foreground/60" />
                          {db_.sharedViaTeams.map((t) => (
                            <span key={t.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t border-border/50 pt-3">
                      <div className="flex justify-end w-full gap-1" onClick={(e) => e.preventDefault()}>
                        {db_.isOwner ? (
                          <Button
                            variant="ghost" size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(db_.id)}
                            title="Delete database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        ) : db_.hasDirectAllotment ? (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 gap-1 text-xs text-muted-foreground hover:text-orange-500"
                            onClick={() => handleLeave(db_.id)}
                            title="Leave database"
                          >
                            <LogOut className="w-3.5 h-3.5" />Leave
                          </Button>
                        ) : null}
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
