"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Workflow, Plus, Trash2, Pencil, ToggleLeft, ToggleRight,
  Layers, Play, Sparkles, ChevronRight, Clock, GitBranch,
  MoreHorizontal, Copy,
} from "lucide-react"
import Link from "next/link"
import { getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow, type WorkflowItem } from "@/lib/workflow-api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const gradientPairs = [
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-600",
]

function getStepTypeCounts(steps: { type: string }[]): { label: string; count: number }[] {
  const map: Record<string, number> = {}
  steps.forEach((s) => { map[s.type] = (map[s.type] || 0) + 1 })
  return Object.entries(map).map(([type, count]) => ({ label: type.replace("_", " "), count }))
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<WorkflowItem | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [quickCreate, setQuickCreate] = useState(false)

  useEffect(() => {
    getWorkflows()
      .then(setWorkflows)
      .catch(() => setWorkflows([]))
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setName("")
    setDescription("")
  }

  function openCreate() {
    resetForm()
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(w: WorkflowItem) {
    setName(w.name)
    setDescription(w.description || "")
    setEditing(w)
    setShowForm(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setShowForm(false)
    if (editing) {
      await updateWorkflow(editing.id, { name: name.trim(), description: description.trim() || "" })
      const list = await getWorkflows()
      setWorkflows(list)
    } else {
      const res = await createWorkflow({ name: name.trim(), description: description.trim() || undefined })
      setWorkflows((prev) => [res.workflow, ...prev])
    }
    resetForm()
  }

  async function handleQuickCreate() {
    const res = await createWorkflow({ name: "Untitled Workflow" })
    setWorkflows((prev) => [res.workflow, ...prev])
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow?")) return
    setWorkflows((prev) => prev.filter((w) => w.id !== id))
    await deleteWorkflow(id)
  }

  async function toggleActive(w: WorkflowItem) {
    setWorkflows((prev) => prev.map((x) => (x.id === w.id ? { ...x, isActive: !x.isActive } : x)))
    await updateWorkflow(w.id, { isActive: !w.isActive })
  }

  async function handleDuplicate(w: WorkflowItem) {
    const res = await createWorkflow({ name: w.name + " (copy)", description: w.description || undefined })
    // Copy steps separately
    if (w.steps?.length) {
      await updateWorkflow(res.workflow.id, { steps: w.steps.map((s) => ({ ...s, id: crypto.randomUUID() })) })
    }
    const list = await getWorkflows()
    setWorkflows(list)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading workflows...</p>
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Workflows</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Build and manage automated workflows</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleQuickCreate} className="gap-1.5 hidden sm:flex">
            <Plus className="w-3.5 h-3.5" /> Quick Create
          </Button>
          <Button onClick={openCreate} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">New Workflow</span>
          </Button>
        </div>
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => { setShowForm(false); resetForm() }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Card className="shadow-xl border-border/60">
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Workflow className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold">{editing ? "Edit Workflow" : "Create Workflow"}</h2>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Daily Report Automation"
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                      placeholder="What does this workflow do?"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 px-6 pb-6">
                  <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancel</Button>
                  <Button onClick={handleSave} disabled={!name.trim()}>
                    {editing ? "Save Changes" : "Create Workflow"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {workflows.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-border/60 flex items-center justify-center mb-6">
                <GitBranch className="w-9 h-9 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No workflows yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-8">
                Workflows help you automate repetitive tasks. Create your first one to get started.
              </p>
              <div className="flex items-center gap-3">
                <Button onClick={openCreate} className="gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> Create Workflow
                </Button>
                <Button variant="outline" onClick={handleQuickCreate} className="gap-2">
                  <Sparkles className="w-4 h-4" /> Quick Start
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Stats Bar */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Workflow className="w-4 h-4" />
              <strong className="text-foreground">{workflows.length}</strong> total
            </span>
            <span className="w-px h-4 bg-border" />
            <span className="flex items-center gap-1.5">
              <ToggleRight className="w-4 h-4 text-emerald-500" />
              <strong className="text-foreground">{workflows.filter((w) => w.isActive).length}</strong> active
            </span>
            <span className="w-px h-4 bg-border" />
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <strong className="text-foreground">{workflows.reduce((a, w) => a + (w.steps?.length || 0), 0)}</strong> total steps
            </span>
          </motion.div>

          {/* Workflow Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((w, idx) => {
              const gradient = gradientPairs[idx % gradientPairs.length]
              const stepCount = w.steps?.length || 0
              const typeCounts = getStepTypeCounts(w.steps || [])
              return (
                <motion.div key={w.id} layout className="group">
                  <Card className="h-full border-border/60 hover:border-border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
                    {/* Color accent bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

                    <div className="p-5 flex flex-col h-full">
                      {/* Top row: icon + toggle */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xs`}>
                          <Workflow className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleActive(w)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              w.isActive ? "text-emerald-500 hover:text-emerald-600" : "text-muted-foreground hover:text-foreground"
                            }`}
                            title={w.isActive ? "Deactivate" : "Activate"}
                          >
                            {w.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openEdit(w)} className="cursor-pointer">
                                <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(w)} className="cursor-pointer">
                                <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(w.id)} className="cursor-pointer text-red-500">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Content */}
                      <Link href={`/dashboard/workflows/${w.id}`} className="flex-1 block">
                        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{w.name}</h3>
                        {w.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{w.description}</p>
                        )}

                        {/* Step type badges */}
                        {typeCounts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {typeCounts.slice(0, 3).map((t) => (
                              <Badge key={t.label} variant="outline" className="text-[10px] px-2 py-0 font-normal bg-muted/30">
                                {t.count}× {t.label}
                              </Badge>
                            ))}
                            {typeCounts.length > 3 && (
                              <Badge variant="outline" className="text-[10px] px-2 py-0 font-normal bg-muted/30">
                                +{typeCounts.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </Link>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/40">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {stepCount} step{stepCount !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {timeAgo(w.updatedAt)}
                          </span>
                        </div>
                        <Badge variant={w.isActive ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">
                          {w.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {/* Open Editor CTA */}
                      <Link href={`/dashboard/workflows/${w.id}`}>
                        <Button variant="ghost" size="sm" className="w-full mt-3 gap-1.5 text-muted-foreground hover:text-foreground group/btn opacity-0 group-hover:opacity-100 transition-opacity">
                          Open Editor <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Bottom CTA for quick add */}
          <motion.div variants={itemVariants} className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickCreate}
              className="gap-2 border-dashed border-border hover:border-primary/50 px-8"
            >
              <Plus className="w-3.5 h-3.5" /> Quick Create Workflow
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
