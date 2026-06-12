"use client"

import { useState, useEffect } from "react"
import { getWorkflowExecutions } from "@/lib/workflow-api"
import { Loader2, CheckCircle2, XCircle, Clock, Play } from "lucide-react"

interface ExecutionHistoryProps {
  workflowId: string
  open: boolean
  onClose: () => void
}

type Execution = {
  id: string
  workflowId: string
  triggeredBy: string
  status: "running" | "completed" | "failed"
  stepsLog: { stepId: string; nodeType: string; label: string; status: string; error?: string }[]
  error: string | null
  startedAt: string
  completedAt: string | null
}

export default function ExecutionHistory({ workflowId, open, onClose }: ExecutionHistoryProps) {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null)

  useEffect(() => {
    if (open && workflowId) {
      setLoading(true)
      getWorkflowExecutions(workflowId)
        .then((data: any) => setExecutions(data.executions || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, workflowId])

  if (!open) return null

  return (
    <div className="w-[380px] h-full flex flex-col border-l border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Execution History</span>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && executions.length === 0 && (
          <div className="text-center py-8">
            <Play className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No executions yet</p>
            <p className="text-xs text-muted-foreground/50">Run the workflow to see history here.</p>
          </div>
        )}

        {executions.map((exec) => {
          const isSelected = selectedExecution === exec.id
          const duration = exec.completedAt
            ? Math.round(
                (new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000,
              )
            : null
          const totalSteps = exec.stepsLog.length
          const failedSteps = exec.stepsLog.filter((s) => s.status === "failed").length
          const completedSteps = exec.stepsLog.filter((s) => s.status === "completed").length

          return (
            <div key={exec.id}>
              <button
                onClick={() => setSelectedExecution(isSelected ? null : exec.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  exec.status === "completed"
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : exec.status === "failed"
                      ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
                      : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  {exec.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : exec.status === "failed" ? (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground capitalize">{exec.status}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(exec.startedAt).toLocaleString()}
                    </p>
                  </div>
                  {duration !== null && (
                    <span className="text-[10px] text-muted-foreground/60">{duration}s</span>
                  )}
                </div>

                <div className="flex gap-2 text-[10px] text-muted-foreground/60">
                  <span>{totalSteps} steps</span>
                  {completedSteps > 0 && <span>{completedSteps} completed</span>}
                  {failedSteps > 0 && <span className="text-red-500">{failedSteps} failed</span>}
                </div>

                {exec.error && (
                  <p className="mt-1 text-[10px] text-red-500 truncate">{exec.error}</p>
                )}
              </button>

              {/* Expanded step logs */}
              {isSelected && exec.stepsLog.length > 0 && (
                <div className="mt-1 ml-4 space-y-1">
                  {exec.stepsLog.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/30"
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : step.status === "failed" ? (
                        <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                      ) : step.status === "running" ? (
                        <Loader2 className="w-3 h-3 text-amber-500 animate-spin shrink-0" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" />
                      )}
                      <span className="text-[10px] font-medium text-foreground truncate">
                        {step.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 ml-auto">
                        {step.nodeType}
                      </span>
                      {step.error && (
                        <span className="text-[9px] text-red-400 truncate max-w-[100px]">
                          {step.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
