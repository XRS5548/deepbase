"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Database } from "lucide-react"
import type { WorkflowNodeData } from "@/lib/workflow-types"

function DatabaseTriggerNode(nodeProps: NodeProps) {
  const { data, selected } = nodeProps
  const nodeData = data as unknown as WorkflowNodeData
  const cfg = nodeData.config as { action?: string; dbName?: string }

  return (
    <div
      className={`
        relative w-64 rounded-xl border-2 bg-card transition-all duration-200
        ${selected ? "border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-border/60 hover:border-border"}
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20 rounded-t-xl">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
          <Database className="w-4.5 h-4.5 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{nodeData.label}</p>
          <p className="text-[10px] text-muted-foreground">Database Action</p>
        </div>
      </div>

      <div className="px-4 py-2.5 space-y-1.5">
        {cfg.action && (
          <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300">
            {cfg.action.replace(/_/g, " ")}
          </span>
        )}
        {cfg.dbName ? (
          <p className="text-xs font-mono text-muted-foreground truncate">DB: {cfg.dbName}</p>
        ) : null}
        {!cfg.action && (
          <p className="text-xs text-muted-foreground/50 italic">Configure action...</p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-emerald-400 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-emerald-400 !bg-emerald-500"
      />
    </div>
  )
}

export default memo(DatabaseTriggerNode)
