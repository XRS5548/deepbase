"use client"

import { useState, useCallback } from "react"
import { Copy, Check, ExternalLink } from "lucide-react"
import { getWorkflowFireUrl, getWorkflowFireEndpoint } from "@/lib/workflow-api"

interface FireUrlBarProps {
  workflowId: string
  webhookSecret: string | null
  isActive: boolean
}

export default function FireUrlBar({ workflowId, webhookSecret, isActive }: FireUrlBarProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  const fireUrl = webhookSecret ? getWorkflowFireUrl(webhookSecret) : null
  const firePath = webhookSecret ? getWorkflowFireEndpoint(webhookSecret) : null

  const handleCopy = useCallback(() => {
    if (!fireUrl) return
    navigator.clipboard.writeText(fireUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [fireUrl])

  if (!isActive) {
    return (
      <div className="px-6 py-2.5 bg-muted/30 border-b border-border/40">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <span>
            Activate this workflow to get a unique fire URL for triggering execution.
          </span>
        </div>
      </div>
    )
  }

  if (!fireUrl) return null

  return (
    <div className="border-b border-border/40 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-2.5 text-xs"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-foreground/80">Fire URL</span>
          <span className="text-muted-foreground/60">
            Call this URL to trigger the workflow
          </span>
        </div>
        <span className="text-muted-foreground/40 text-[10px]">{isOpen ? "Hide" : "Show"}</span>
      </button>

      {isOpen && (
        <div className="px-6 pb-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/60">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-foreground/80 truncate">{fireUrl}</p>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Copy fire URL"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <a
              href={fireUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Open in browser"
              onClick={(e) => {
                e.preventDefault()
                if (firePath) {
                  fetch(firePath, { method: "POST" })
                    .then((r) => r.json())
                    .then((data) => {
                      alert(`Workflow triggered! Status: ${data.status}`)
                    })
                    .catch(() => alert("Failed to trigger workflow"))
                }
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/50">
            Send a POST or GET request to this URL to execute the workflow. Share this link with anyone who needs to trigger it.
          </p>
        </div>
      )}
    </div>
  )
}
