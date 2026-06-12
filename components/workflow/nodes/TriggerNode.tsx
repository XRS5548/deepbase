"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Sparkles } from "lucide-react"
import type { WorkflowNodeData } from "@/lib/workflow-types"

function TriggerNode(nodeProps: NodeProps) {
  const { data, selected } = nodeProps
  const nodeData = data as unknown as WorkflowNodeData

  return (
    <div
      className={`
        relative px-5 py-3 rounded-full border-2 transition-all duration-200
        ${selected ? "border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-emerald-200 dark:border-emerald-800"}
        bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30
      `}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800/60 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Trigger</p>
          <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60">
            {(nodeData.config as { description?: string })?.description || "Workflow starts here"}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-emerald-400 !bg-emerald-500"
      />
    </div>
  )
}

export default memo(TriggerNode)
