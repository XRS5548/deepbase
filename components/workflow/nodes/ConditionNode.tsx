"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { GitBranch } from "lucide-react"
import type { WorkflowNodeData } from "@/lib/workflow-types"

function ConditionNode(nodeProps: NodeProps) {
  const { data, selected } = nodeProps
  const nodeData = data as unknown as WorkflowNodeData
  const cfg = nodeData.config as { field?: string; operator?: string; value?: string }

  return (
    <div className="relative w-64 transition-all duration-200">
      <div
        className={`
          relative rounded-xl border-2 bg-card p-4
          ${selected ? "border-rose-500 shadow-lg shadow-rose-500/20" : "border-border/60 hover:border-border"}
        `}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-sm font-semibold text-foreground text-center">{nodeData.label}</p>
          <p className="text-[10px] text-muted-foreground">Condition</p>

          {cfg.field && (
            <div className="w-full mt-1 px-2 py-1.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30">
              <p className="text-[10px] font-mono text-rose-600 dark:text-rose-300 text-center truncate">
                {cfg.field} {cfg.operator} {cfg.value}
              </p>
            </div>
          )}
          {!cfg.field && (
            <p className="text-[10px] text-muted-foreground/50 italic">Configure condition...</p>
          )}
        </div>
      </div>

      <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-2">
        <span className="text-[9px] font-bold text-emerald-500">TRUE</span>
        <span className="text-[9px] font-bold text-rose-500">FALSE</span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-rose-400 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-3 !h-3 !border-2 !border-emerald-400 !bg-emerald-500 !left-[25%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-3 !h-3 !border-2 !border-rose-400 !bg-rose-500 !left-[75%]"
      />
    </div>
  )
}

export default memo(ConditionNode)
