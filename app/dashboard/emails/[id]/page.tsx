"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Mail, Send, Loader2, Clock, CheckCircle2, XCircle, Users, X, Loader } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
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

type EmailLog = {
  id: string
  toEmail: string
  subject: string
  body: string | null
  status: string
  error: string | null
  sentAt: string
}

type RecipientStatus = {
  to: string
  status: "pending" | "sending" | "sent" | "failed"
  error?: string
}

type ProgressState = {
  show: boolean
  total: number
  sent: number
  failed: number
  results: RecipientStatus[]
}

export default function EmailAccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [account, setAccount] = useState<EmailAccount | null>(null)
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [progress, setProgress] = useState<ProgressState>({ show: false, total: 0, sent: 0, failed: 0, results: [] })
  const progressRef = useRef<ProgressState>({ show: false, total: 0, sent: 0, failed: 0, results: [] })

  useEffect(() => {
    fetch(`/api/email/accounts/${id}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(data => { setAccount(data.account); setLogs(data.logs) })
      .catch(() => { toast.error("Failed to load account"); router.push("/dashboard/emails") })
      .finally(() => setLoading(false))
  }, [id, router])

  const parseRecipients = (val: string) =>
    val.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)

  const handleSend = async () => {
    const recipients = parseRecipients(to)
    if (recipients.length === 0) { toast.error("At least one recipient is required"); return }
    if (!subject.trim()) { toast.error("Subject is required"); return }

    setSending(true)
    const initResults: RecipientStatus[] = recipients.map(r => ({ to: r, status: "pending" }))
    const prog: ProgressState = { show: true, total: recipients.length, sent: 0, failed: 0, results: initResults }
    setProgress(prog)
    progressRef.current = prog

    try {
      const res = await fetch(`/api/email/accounts/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipients, subject: subject.trim(), body }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to send" }))
        throw new Error(err.error || "Failed to send")
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line)
            if (data.type === "progress") continue // skip legacy format

            setProgress(prev => {
              const next = { ...prev }
              switch (data.type) {
                case "start":
                  next.total = data.total
                  next.results = data.recipients.map((r: string) => ({ to: r, status: "pending" as const }))
                  break
                case "sending":
                  next.results = prev.results.map(r =>
                    r.to === data.current ? { ...r, status: "sending" as const } : r
                  )
                  break
                case "result":
                  next.results = prev.results.map(r =>
                    r.to === data.current
                      ? { ...r, status: (data.success ? "sent" : "failed") as "sent" | "failed", error: data.error }
                      : r
                  )
                  if (data.success) next.sent++
                  else next.failed++
                  break
              }
              progressRef.current = next
              return next
            })
          } catch {}
        }
      }

      setTo(""); setSubject(""); setBody("")
      const refreshed = await fetch(`/api/email/accounts/${id}`).then(r => r.json())
      setLogs(refreshed.logs)
    } catch (e: any) {
      setProgress(prev => ({ ...prev, show: false }))
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  const closeProgress = () => setProgress(prev => ({ ...prev, show: false }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading account...</p>
        </div>
      </div>
    )
  }

  if (!account) return null

  const recipientCount = parseRecipients(to).length
  const pct = progress.total > 0 ? Math.round(((progress.sent + progress.failed) / progress.total) * 100) : 0

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <Link href="/dashboard/emails" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Email Accounts
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{account.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{account.email}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{account.smtpHost}:{account.smtpPort}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4" />Compose Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">To</label>
              {recipientCount > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <textarea
              value={to}
              onChange={e => setTo(e.target.value)}
              rows={3}
              placeholder="recipient1@example.com, recipient2@example.com&#10;Or paste multiple emails separated by comma, semicolon, or new line"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder="Write your email message..."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSend} disabled={sending || recipientCount === 0 || !subject.trim()} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : `Send${recipientCount > 1 ? ` to ${recipientCount}` : ""}`}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />Sent History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Mail className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No emails sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 py-3">
                  {log.status === "sent" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{log.subject}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        log.status === "sent"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}>
                        {log.status === "sent" ? "Sent" : "Failed"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">To: {log.toEmail}</p>
                    {log.error && <p className="text-xs text-red-500 mt-0.5">{log.error}</p>}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {new Date(log.sentAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Dialog */}
      {progress.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Send className="w-4 h-4" />
                Sending Emails
              </h2>
              {progress.sent + progress.failed === progress.total && (
                <Button variant="ghost" size="icon" onClick={closeProgress}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{progress.sent} Sent</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">{progress.failed} Failed</span>
                </div>
                <span className="text-muted-foreground">{progress.total} total</span>
              </div>

              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded-lg divide-y divide-border">
                {progress.results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                    {r.status === "pending" && (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    {r.status === "sending" && (
                      <Loader className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                    )}
                    {r.status === "sent" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    )}
                    {r.status === "failed" && (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className={`truncate flex-1 ${r.status === "sending" ? "text-blue-600 dark:text-blue-400 font-medium" : ""}`}>
                      {r.to}
                    </span>
                    {r.status === "sending" && (
                      <span className="text-xs text-blue-500 animate-pulse flex-shrink-0">Sending...</span>
                    )}
                    {r.status === "failed" && r.error && (
                      <span className="text-xs text-red-500 truncate max-w-[140px] flex-shrink-0" title={r.error}>
                        {r.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {progress.sent + progress.failed === progress.total && (
                <div className="flex justify-center pt-2">
                  <Button onClick={closeProgress} size="sm" className="px-6">
                    Done
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
