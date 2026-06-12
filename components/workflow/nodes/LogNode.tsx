"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { FileText } from "lucide-react"
import type { WorkflowNodeData } from "@/lib/workflow-types"

function LogNode(nodeProps: NodeProps) {
  const { data, selected } = nodeProps
  const nodeData = data as unknown as WorkflowNodeData
  const cfg = nodeData.config as { message?: string; level?: string }

  const levelColor = cfg.level === "error" ? "text-red-500" : cfg.level === "warn" ? "text-amber-500" : "text-slate-500"

  return (
    <div className="relative w-64 transition-all duration-200">
      <div
        className={`
          relative rounded-xl border-2 bg-card p-4
          ${selected ? "border-slate-500 shadow-lg shadow-slate-500/20" : "border-border/60 hover:border-border"}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900/40 flex items-center justify-center shrink-0 ${levelColor}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{nodeData.label}</p>
            <p className="text-[10px] text-muted-foreground">Log</p>
          </div>
        </div>
        {cfg.message && (
          <div className="mt-2 px-2 py-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50">
            <p className="text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate">
              {cfg.message}
            </p>
          </div>
        )}
        {!cfg.message && (
          <p className="text-[10px] text-muted-foreground/50 italic mt-2 text-center">
            Configure log message...
          </p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-slate-400 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-slate-400 !bg-slate-500"
      />
    </div>
  )
}

export default memo(LogNode)
