"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Bell } from "lucide-react"
import type { WorkflowNodeData } from "@/lib/workflow-types"

function NotificationNode(nodeProps: NodeProps) {
  const { data, selected } = nodeProps
  const nodeData = data as unknown as WorkflowNodeData
  const cfg = nodeData.config as { message?: string; title?: string }

  return (
    <div
      className={`
        relative w-64 rounded-xl border-2 bg-card transition-all duration-200
        ${selected ? "border-amber-500 shadow-lg shadow-amber-500/20" : "border-border/60 hover:border-border"}
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 rounded-t-xl">
        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
          <Bell className="w-4.5 h-4.5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{nodeData.label}</p>
          <p className="text-[10px] text-muted-foreground">Notification</p>
        </div>
      </div>

      <div className="px-4 py-2.5">
        {cfg.title && (
          <p className="text-xs font-medium text-foreground truncate">{cfg.title}</p>
        )}
        {cfg.message ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            &quot;{cfg.message.slice(0, 50)}{cfg.message.length > 50 ? "..." : ""}&quot;
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">Configure message...</p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-amber-400 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-amber-400 !bg-amber-500"
      />
    </div>
  )
}

export default memo(NotificationNode)
