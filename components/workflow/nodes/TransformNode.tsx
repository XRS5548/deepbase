"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Code } from "lucide-react"
import type { WorkflowNodeData } from "@/lib/workflow-types"

function TransformNode(nodeProps: NodeProps) {
  const { data, selected } = nodeProps
  const nodeData = data as unknown as WorkflowNodeData
  const cfg = nodeData.config as { expression?: string }

  return (
    <div className="relative w-64 transition-all duration-200">
      <div
        className={`
          relative rounded-xl border-2 bg-card p-4
          ${selected ? "border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-border/60 hover:border-border"}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <Code className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{nodeData.label}</p>
            <p className="text-[10px] text-muted-foreground">Transform</p>
          </div>
        </div>
        {cfg.expression && (
          <div className="mt-2 px-2 py-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30">
            <pre className="text-[9px] font-mono text-indigo-600 dark:text-indigo-300 truncate max-h-12 overflow-hidden">
              {cfg.expression}
            </pre>
          </div>
        )}
        {!cfg.expression && (
          <p className="text-[10px] text-muted-foreground/50 italic mt-2 text-center">
            Configure expression...
          </p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-indigo-400 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-indigo-400 !bg-indigo-500"
      />
    </div>
  )
}

export default memo(TransformNode)
