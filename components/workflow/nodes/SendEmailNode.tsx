"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Mail } from "lucide-react"
import type { WorkflowNodeData } from "@/lib/workflow-types"

function SendEmailNode(nodeProps: NodeProps) {
  const { data, selected } = nodeProps
  const nodeData = data as unknown as WorkflowNodeData
  const cfg = nodeData.config as { to?: string; subject?: string; accountName?: string }

  return (
    <div
      className={`
        relative w-64 rounded-xl border-2 bg-card transition-all duration-200
        ${selected ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-border/60 hover:border-border"}
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 rounded-t-xl">
        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <Mail className="w-4.5 h-4.5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{nodeData.label}</p>
          <p className="text-[10px] text-muted-foreground">Send Email</p>
        </div>
      </div>

      <div className="px-4 py-2.5 space-y-1.5">
        {cfg.accountName && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <p className="text-xs text-muted-foreground truncate">Account: {cfg.accountName}</p>
          </div>
        )}
        {cfg.to && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-muted-foreground/70">To:</span>
            <p className="text-xs text-muted-foreground truncate">{cfg.to}</p>
          </div>
        )}
        {cfg.subject && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-muted-foreground/70">Subj:</span>
            <p className="text-xs text-muted-foreground truncate">{cfg.subject}</p>
          </div>
        )}
        {!cfg.to && !cfg.subject && !cfg.accountName && (
          <p className="text-xs text-muted-foreground/50 italic">Configure email...</p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-blue-400 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-blue-400 !bg-blue-500"
      />
    </div>
  )
}

export default memo(SendEmailNode)
