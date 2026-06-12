"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Webhook } from "lucide-react"
import type { WorkflowNodeData } from "@/lib/workflow-types"

function WebhookNode(nodeProps: NodeProps) {
  const { data, selected } = nodeProps
  const nodeData = data as unknown as WorkflowNodeData
  const cfg = nodeData.config as { url?: string; method?: string }

  return (
    <div
      className={`
        relative w-64 rounded-xl border-2 bg-card transition-all duration-200
        ${selected ? "border-violet-500 shadow-lg shadow-violet-500/20" : "border-border/60 hover:border-border"}
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-gradient-to-r from-violet-50/50 to-transparent dark:from-violet-950/20 rounded-t-xl">
        <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
          <Webhook className="w-4.5 h-4.5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{nodeData.label}</p>
          <p className="text-[10px] text-muted-foreground">Webhook</p>
        </div>
      </div>

      <div className="px-4 py-2.5 space-y-1">
        {cfg.method && (
          <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
            {cfg.method}
          </span>
        )}
        {cfg.url ? (
          <p className="text-xs font-mono text-muted-foreground truncate">{cfg.url}</p>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">Configure webhook URL...</p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-violet-400 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-violet-400 !bg-violet-500"
      />
    </div>
  )
}

export default memo(WebhookNode)
