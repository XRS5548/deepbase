"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Plus, X, Loader2, Server, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type EmailAccount = {
  id: string
  name: string
  email: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  useSSL: boolean
  createdAt: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function EmailsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "", useSSL: false,
  })

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/email/accounts")
      if (!res.ok) throw new Error("Failed to load")
      setAccounts(await res.json())
    } catch { toast.error("Failed to load email accounts") }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAccounts() }, [])

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.smtpHost.trim() || !form.smtpUser.trim()) {
      toast.error("All fields are required"); return
    }
    const isEdit = !!editingId
    if (!isEdit && !form.smtpPass.trim()) { toast.error("Password is required"); return }
    setSaving(true)
    try {
      const body: Record<string, unknown> = { ...form, smtpPort: Number(form.smtpPort) }
      if (isEdit && !body.smtpPass) delete body.smtpPass
      const url = isEdit ? `/api/email/accounts/${editingId}` : "/api/email/accounts"
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success(isEdit ? "Account updated" : "Account added")
      setShowAdd(false)
      setEditingId(null)
      setForm({ name: "", email: "", smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "", useSSL: false })
      loadAccounts()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const startEdit = (acc: EmailAccount) => {
    setForm({
      name: acc.name,
      email: acc.email,
      smtpHost: acc.smtpHost,
      smtpPort: String(acc.smtpPort),
      smtpUser: acc.smtpUser,
      smtpPass: "",
      useSSL: acc.useSSL,
    })
    setEditingId(acc.id)
    setShowAdd(true)
  }

  const closeModal = () => {
    setShowAdd(false)
    setEditingId(null)
    setForm({ name: "", email: "", smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "", useSSL: false })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this email account?")) return
    try {
      const res = await fetch(`/api/email/accounts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Account deleted")
      setAccounts(prev => prev.filter(a => a.id !== id))
    } catch { toast.error("Failed to delete") }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading email accounts...</p>
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
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Email Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your SMTP email accounts and send emails.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Account</span>
        </Button>
      </motion.div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={closeModal}
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
                    <CardTitle>{editingId ? "Edit Email Account" : "Add Email Account"}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={closeModal}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Work Email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">SMTP Host</label>
                      <Input value={form.smtpHost} onChange={e => setForm({ ...form, smtpHost: e.target.value })} placeholder="smtp.gmail.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">SMTP Port</label>
                      <Input value={form.smtpPort} onChange={e => setForm({ ...form, smtpPort: e.target.value })} placeholder="587" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SMTP Username</label>
                    <Input value={form.smtpUser} onChange={e => setForm({ ...form, smtpUser: e.target.value })} placeholder="you@gmail.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SMTP Password / App Password</label>
                    <Input type="password" value={form.smtpPass} onChange={e => setForm({ ...form, smtpPass: e.target.value })} placeholder={editingId ? "Leave blank to keep current" : "App password or SMTP password"} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.useSSL} onChange={e => setForm({ ...form, useSSL: e.target.checked })} className="rounded" />
                    Use SSL (port 465)
                  </label>
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Add Account"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {accounts.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Mail className="w-12 h-12 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No email accounts</h3>
              <p className="text-sm mb-6">Add an SMTP account to start sending emails.</p>
              <Button onClick={() => setShowAdd(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(acc => (
            <motion.div key={acc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Link href={`/dashboard/emails/${acc.id}`} className="block">
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{acc.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{acc.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={e => { e.preventDefault(); startEdit(acc) }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                        <button
                          onClick={e => { e.preventDefault(); handleDelete(acc.id) }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Server className="w-3.5 h-3.5" />
                      <span>{acc.smtpHost}:{acc.smtpPort}</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
