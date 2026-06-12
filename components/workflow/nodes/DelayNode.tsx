"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Timer } from "lucide-react"
import type { WorkflowNodeData } from "@/lib/workflow-types"

function DelayNode(nodeProps: NodeProps) {
  const { data, selected } = nodeProps
  const nodeData = data as unknown as WorkflowNodeData
  const cfg = nodeData.config as { duration?: string }

  return (
    <div
      className={`
        relative w-64 rounded-xl border-2 bg-card transition-all duration-200
        ${selected ? "border-cyan-500 shadow-lg shadow-cyan-500/20" : "border-border/60 hover:border-border"}
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-gradient-to-r from-cyan-50/50 to-transparent dark:from-cyan-950/20 rounded-t-xl">
        <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center shrink-0">
          <Timer className="w-4.5 h-4.5 text-cyan-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{nodeData.label}</p>
          <p className="text-[10px] text-muted-foreground">Delay</p>
        </div>
      </div>

      <div className="px-4 py-2.5">
        {cfg.duration ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
              <Timer className="w-3 h-3 text-cyan-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Wait {cfg.duration}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">Set duration...</p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-cyan-400 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-cyan-400 !bg-cyan-500"
      />
    </div>
  )
}

export default memo(DelayNode)
