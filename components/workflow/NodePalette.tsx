"use client"

import { useCallback, type DragEvent } from "react"
import { STEP_TYPE_DEFS, type WorkflowNodeType } from "@/lib/workflow-types"
import { getStepDef } from "@/lib/workflow-types"
import {
  Workflow,
  Mail,
  Bell,
  Webhook,
  Timer,
  GitBranch,
  Database,
} from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  Workflow,
  Mail,
  Bell,
  Webhook,
  Timer,
  GitBranch,
  Database,
}

// Filter out trigger — it's always present
const draggableTypes = STEP_TYPE_DEFS.filter((d) => d.type !== "trigger")

export default function NodePalette() {
  const onDragStart = useCallback(
    (event: DragEvent, nodeType: WorkflowNodeType) => {
      event.dataTransfer.setData("application/reactflow", nodeType)
      event.dataTransfer.effectAllowed = "move"
    },
    [],
  )

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Add Nodes
      </p>
      {draggableTypes.map((def) => {
        const Icon = iconMap[def.icon] || Workflow
        return (
          <div
            key={def.type}
            draggable
            onDragStart={(e) => onDragStart(e, def.type)}
            className="flex items-center gap-3 p-3 rounded-xl border border-input hover:border-primary/30 hover:bg-accent/40 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing group"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${def.bg} group-hover:scale-105 transition-transform shrink-0`}
            >
              <Icon className={`w-4.5 h-4.5 ${def.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{def.label}</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">{def.description}</p>
            </div>
            <div className="w-2 h-2 rounded-full border border-muted-foreground/30 group-hover:border-primary/50 transition-colors shrink-0" />
          </div>
        )
      })}
    </div>
  )
}
