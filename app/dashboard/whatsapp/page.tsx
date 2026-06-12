"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Plus, X, Loader2, QrCode, Plug, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type WaAccount = {
  id: string
  name: string
  phone: string | null
  status: string
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

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  disconnected: { label: "Disconnected", color: "text-muted-foreground", dot: "bg-gray-400" },
  connecting: { label: "Connecting", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500 animate-pulse" },
  connected: { label: "Connected", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
}

export default function WhatsAppPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<WaAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [accountName, setAccountName] = useState("")
  const [creating, setCreating] = useState(false)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrStatus, setQrStatus] = useState<string>("")

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/wa/accounts")
      if (!res.ok) throw new Error()
      setAccounts(await res.json())
    } catch { toast.error("Failed to load WhatsApp accounts") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const handleCreate = async () => {
    if (!accountName.trim()) { toast.error("Name is required"); return }
    setCreating(true)
    try {
      const res = await fetch("/api/wa/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: accountName.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("Account created")
      setShowAdd(false)
      setAccountName("")
      loadAccounts()
    } catch { toast.error("Failed to create") }
    finally { setCreating(false) }
  }

  const handleConnect = async (id: string) => {
    setConnectingId(id)
    setQrData(null)
    setQrStatus("Initializing WhatsApp... This may take a moment.")

    try {
      const res = await fetch(`/api/wa/accounts/${id}/connect`, { method: "POST" })
      const data = await res.json()

      if (data.type === "qr") {
        setQrData(data.qr)
        setQrStatus("Scan this QR code with WhatsApp on your phone")
        pollStatus(id)
      } else if (data.type === "connected") {
        toast.success("Already connected!")
        setConnectingId(null)
        setQrData(null)
        loadAccounts()
      } else {
        throw new Error(data.error || "Connection failed")
      }
    } catch (e: any) {
      toast.error(e.message)
      setConnectingId(null)
      setQrData(null)
    }
  }

  const pollStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/wa/accounts/${id}`)
        const acc = await res.json()
        if (acc.status === "connected") {
          clearInterval(interval)
          toast.success("WhatsApp connected!")
          setConnectingId(null)
          setQrData(null)
          loadAccounts()
        }
      } catch {}
    }, 2000)
    setTimeout(() => clearInterval(interval), 120000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this WhatsApp account?")) return
    try {
      const res = await fetch(`/api/wa/accounts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Account deleted")
      setAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch { toast.error("Failed to delete") }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading WhatsApp accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">WhatsApp Accounts</h1>
          <p className="text-muted-foreground mt-1">Add WhatsApp accounts to send messages and chat via WhatsApp Web.</p>
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
            onClick={() => { setShowAdd(false); setAccountName("") }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Add WhatsApp Account</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => { setShowAdd(false); setAccountName("") }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Name</label>
                    <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="My Personal WhatsApp" />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => { setShowAdd(false); setAccountName("") }}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={creating} className="gap-2">
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      {creating ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {connectingId && qrData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => { setConnectingId(null); setQrData(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><QrCode className="w-4 h-4" />Scan QR Code</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => { setConnectingId(null); setQrData(null) }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 py-6">
                  <img src={qrData} alt="WhatsApp QR Code" className="w-64 h-64 border border-border rounded-lg" />
                  <p className="text-sm text-muted-foreground text-center">{qrStatus}</p>
                  <p className="text-xs text-muted-foreground/60 text-center">
                    Open WhatsApp on your phone, tap Menu or Settings, and select "Linked Devices" or "WhatsApp Web"
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {accounts.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No WhatsApp accounts</h3>
              <p className="text-sm mb-6">Add an account and connect via QR code to start.</p>
              <Button onClick={() => setShowAdd(true)} className="gap-2">
                <Plus className="w-4 h-4" />Add Account
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => {
            const sc = statusConfig[acc.status] || statusConfig.disconnected
            return (
              <motion.div key={acc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card
                  className={`h-full transition-all duration-200 cursor-pointer overflow-hidden ${
                    acc.status === "connected" ? "hover:shadow-md hover:-translate-y-0.5" : ""
                  }`}
                  onClick={() => acc.status === "connected" && router.push(`/dashboard/whatsapp/${acc.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                          acc.status === "connected" ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-gray-400 to-gray-500"
                        }`}>
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{acc.name}</CardTitle>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                            <span className={`text-xs ${sc.color}`}>{sc.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {acc.status === "disconnected" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConnect(acc.id) }}
                            disabled={connectingId === acc.id && !qrData}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                          >
                            {connectingId === acc.id && !qrData ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plug className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(acc.id) }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  {acc.phone && (
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">{acc.phone}</p>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
