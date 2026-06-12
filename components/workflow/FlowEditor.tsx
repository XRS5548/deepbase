"use client"

import { useCallback, useRef, type DragEvent } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type OnConnect,
  type Connection,
  type NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  TriggerNode,
  SendEmailNode,
  NotificationNode,
  WebhookNode,
  DelayNode,
  ConditionNode,
  DatabaseTriggerNode,
  TransformNode,
  LogNode,
} from "@/components/workflow/nodes"
import type { WorkflowFlowNode, WorkflowFlowEdge, EmailAccount, WorkflowNodeType } from "@/lib/workflow-types"

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  send_email: SendEmailNode,
  notification: NotificationNode,
  webhook: WebhookNode,
  delay: DelayNode,
  condition: ConditionNode,
  trigger_db: DatabaseTriggerNode,
  transform: TransformNode,
  log: LogNode,
}

interface FlowEditorProps {
  nodes: WorkflowFlowNode[]
  edges: WorkflowFlowEdge[]
  onNodesChange: (nodes: WorkflowFlowNode[]) => void
  onEdgesChange: (edges: WorkflowFlowEdge[]) => void
  onConnect: OnConnect
  onNodeClick: (nodeId: string) => void
  onAddNode: (type: WorkflowNodeType, position: { x: number; y: number }) => void
  onDeleteNode: (nodeId: string) => void
  emailAccounts: EmailAccount[]
  selectedNodeId: string | null
}

function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onAddNode,
  onDeleteNode,
}: FlowEditorProps) {
  const reactFlowInstance = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData("application/reactflow") as WorkflowNodeType | null
      if (!type || !reactFlowInstance) return
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      onAddNode(type, position)
    },
    [reactFlowInstance, onAddNode],
  )

  const isValidConnection = useCallback(
    (connection: Edge | Connection): boolean => {
      const conn = connection as Connection
      if (conn.source === conn.target) return false

      const targetNode = nodes.find((n) => n.id === conn.target)
      if (targetNode?.type === "trigger") return false

      const sourceNode = nodes.find((n) => n.id === conn.source)
      if (sourceNode?.type === "condition" && !conn.sourceHandle) return false

      const exists = edges.some(
        (e) => e.source === conn.source && e.target === conn.target,
      )
      if (exists) return false

      return true
    },
    [nodes, edges],
  )

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          // @ts-expect-error React Flow v12 types are generic; we handle it
          onNodesChange(changes)
        }}
        onEdgesChange={(changes) => {
          // @ts-expect-error React Flow v12 types are generic; we handle it
          onEdgesChange(changes)
        }}
        onConnect={(connection) => {
          const sourceNode = nodes.find((n) => n.id === connection.source)
          if (sourceNode?.type === "condition" && !connection.sourceHandle) return
          onConnect(connection)
        }}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#94a3b8", strokeWidth: 2 },
          animated: false,
        }}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode={["Delete", "Backspace"]}
      >
        <Background color="#94a3b8" gap={20} size={1} />
        <Controls className="!rounded-lg !border-border !shadow-sm" />
        <MiniMap
          nodeStrokeWidth={3}
          className="!rounded-lg !border-border !shadow-sm"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}

export default function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  )
}
