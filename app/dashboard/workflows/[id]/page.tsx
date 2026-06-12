"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Workflow, Save, Play, Loader2,
  Settings2, Eye, EyeOff, Plus, X, Clock,
} from "lucide-react"
import { toast } from "sonner"
import {
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react"
import { getWorkflows, updateWorkflow } from "@/lib/workflow-api"
import { executeWorkflow } from "@/lib/workflow-api"
import { fetchEmailAccounts } from "@/lib/workflow-api"
import FlowEditor from "@/components/workflow/FlowEditor"
import NodeConfigPanel from "@/components/workflow/NodeConfigPanel"
import NodePalette from "@/components/workflow/NodePalette"
import ExecutionHistory from "@/components/workflow/ExecutionHistory"
import FireUrlBar from "@/components/workflow/FireUrlBar"
import { Button } from "@/components/ui/button"
import type {
  WorkflowItem,
  WorkflowFlowNode,
  WorkflowFlowEdge,
  WorkflowNodeType,
  NodeConfig,
  EmailAccount,
} from "@/lib/workflow-types"
import { getStepDef } from "@/lib/workflow-types"

export default function WorkflowEditorPage() {
  const params = useParams()
  const router = useRouter()

  const [workflow, setWorkflow] = useState<WorkflowItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)

  // React Flow state
  const [nodes, setNodes] = useState<WorkflowFlowNode[]>([])
  const [edges, setEdges] = useState<WorkflowFlowEdge[]>([])

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(true)
  const [showNodePalette, setShowNodePalette] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showRunDialog, setShowRunDialog] = useState(false)
  const [runContextJson, setRunContextJson] = useState("")
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])

  // Warn about unsaved changes
  useEffect(() => {
    if (dirty) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ""
      }
      window.addEventListener("beforeunload", handler)
      return () => window.removeEventListener("beforeunload", handler)
    }
  }, [dirty])

  // Fetch workflow data on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [list, accounts] = await Promise.all([
          getWorkflows(),
          fetchEmailAccounts().catch(() => [] as EmailAccount[]),
        ])
        if (cancelled) return
        const w = list.find((item) => item.id === params.id)
        if (w) {
          // Auto-generate webhookSecret for legacy workflows
          if (!w.webhookSecret) {
            const newSecret = crypto.randomUUID()
            try {
              await updateWorkflow(w.id, { webhookSecret: newSecret })
              w.webhookSecret = newSecret
            } catch (err) {
              console.error("[workflow] Failed to save webhook secret:", err)
            }
          }
          setWorkflow(w)
          // Use nodes+edges if available, otherwise migrate from steps
          if (w.nodes?.length > 0) {
            setNodes(w.nodes)
            setEdges(w.edges || [])
          } else if (w.steps?.length > 0) {
            migrateFromSteps(w.steps)
          }
          setDirty(false)
        }
        setEmailAccounts(accounts)
        setLoading(false)
      } catch {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [params.id])

  function migrateFromSteps(steps: { id: string; type: string; label: string; config: Record<string, unknown> }[]) {
    const newNodes: WorkflowFlowNode[] = [
      {
        id: "trigger",
        type: "trigger",
        position: { x: 300, y: 50 },
        data: { label: "Start", type: "trigger", config: {} },
      },
    ]
    const newEdges: WorkflowFlowEdge[] = []

    steps.forEach((step, index) => {
      const nodeId = step.id
      newNodes.push({
        id: nodeId,
        type: step.type as WorkflowNodeType,
        position: { x: 300, y: 200 + index * 180 },
        data: { label: step.label, type: step.type as WorkflowNodeType, config: step.config as NodeConfig },
      })
      const sourceId = index === 0 ? "trigger" : steps[index - 1].id
      newEdges.push({ id: `e-${sourceId}-${nodeId}`, source: sourceId, target: nodeId })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }

  const markDirty = useCallback(() => setDirty(true), [])

  // React Flow change handlers
  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((prev) => applyNodeChanges(changes, prev as any) as WorkflowFlowNode[])
    },
    [],
  )

  const onEdgesChange = useCallback(
    (changes: any) => {
      setEdges((prev) => applyEdgeChanges(changes, prev as any) as WorkflowFlowEdge[])
    },
    [],
  )

  const onConnect = useCallback(
    (connection: any) => {
      if (!connection.source || !connection.target) return
      const newEdge: WorkflowFlowEdge = {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
      }
      setEdges((prev) => [...prev, newEdge])
      markDirty()
    },
    [markDirty],
  )

  const onNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    setShowNodePalette(false)
  }, [])

  const onAddNode = useCallback(
    (type: WorkflowNodeType, position: { x: number; y: number }) => {
      const def = getStepDef(type)
      const newNodeId = `node-${crypto.randomUUID().slice(0, 8)}`
      const newNode: WorkflowFlowNode = {
        id: newNodeId,
        type,
        position,
        data: {
          label: def?.label || type,
          type,
          config: {},
        },
      }
      setNodes((prev) => [...prev, newNode])
      setSelectedNodeId(newNodeId)
      setShowNodePalette(false)
      markDirty()
    },
    [markDirty],
  )

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (node?.type === "trigger") {
        toast.error("Cannot delete the Trigger node")
        return
      }
      setNodes((prev) => prev.filter((n) => n.id !== nodeId))
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId))
      if (selectedNodeId === nodeId) setSelectedNodeId(null)
      markDirty()
    },
    [nodes, selectedNodeId, markDirty],
  )

  // Cycle detection
  function hasCycle(nodes: WorkflowFlowNode[], edges: WorkflowFlowEdge[]): boolean {
    const adj = new Map<string, string[]>()
    for (const n of nodes) adj.set(n.id, [])
    for (const e of edges) {
      const list = adj.get(e.source)
      if (list) list.push(e.target)
    }

    const visited = new Set<string>()
    const recStack = new Set<string>()

    function dfs(nodeId: string): boolean {
      visited.add(nodeId)
      recStack.add(nodeId)
      const neighbors = adj.get(nodeId) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true
        } else if (recStack.has(neighbor)) {
          return true
        }
      }
      recStack.delete(nodeId)
      return false
    }

    for (const n of nodes) {
      if (!visited.has(n.id)) {
        if (dfs(n.id)) return true
      }
    }
    return false
  }

  // Save workflow
  async function handleSave() {
    if (hasCycle(nodes, edges)) {
      toast.error("Workflow contains a cycle. Please remove circular connections.")
      return false
    }

    setSaving(true)
    try {
      await updateWorkflow(workflow!.id, {
        nodes,
        edges,
      })
      setDirty(false)
      toast.success("Workflow saved!")
      return true
    } catch (e) {
      toast.error("Failed to save workflow")
      return false
    } finally {
      setSaving(false)
    }
  }

  // Run workflow
  async function handleRun() {
    setRunContextJson("")
    setShowRunDialog(true)
  }

  async function handleExecuteWithContext() {
    setShowRunDialog(false)
    if (dirty) {
      const saved = await handleSave()
      if (!saved) return
    }

    if (!workflow?.webhookSecret) {
      toast.error("Workflow has no webhook secret. Please save the workflow first.")
      return
    }

    let contextBody: unknown = undefined
    if (runContextJson.trim()) {
      try {
        contextBody = JSON.parse(runContextJson)
      } catch {
        toast.error("Invalid JSON in context. Please fix and try again.")
        return
      }
    }

    setRunning(true)
    try {
      const result = await executeWorkflow(workflow.webhookSecret, contextBody)
      if (result.success) {
        toast.success("Workflow completed!", {
          description: `Status: ${result.status}`,
        })
      } else {
        const errorMsg = result.error || "See execution logs for details."
        toast.error("Workflow failed", {
          description: errorMsg,
        })
      }
    } catch (e: any) {
      toast.error("Workflow execution failed", {
        description: e?.message || "Unknown error",
      })
    } finally {
      setRunning(false)
    }
  }

  // Selected node data
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  )

  // Update node label
  function updateNodeLabel(nodeId: string, label: string) {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label } } : n)),
    )
    markDirty()
  }

  // Update node config
  function updateNodeConfig(nodeId: string, key: string, value: string) {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, [key]: value } } }
          : n,
      ),
    )
    markDirty()
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading workflow...</p>
        </div>
      </div>
    )
  }

  // Not found
  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Workflow not found</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/workflows")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xs shrink-0">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground/60">Workflow</p>
              <h1 className="text-lg font-bold text-foreground truncate max-w-[240px]">
                {workflow.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="gap-1.5 hidden sm:flex"
          >
            {showDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowHistory(!showHistory)
              setSelectedNodeId(null)
              setShowNodePalette(false)
            }}
            className="gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowNodePalette(!showNodePalette)
              setSelectedNodeId(null)
              setShowHistory(false)
            }}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Node
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowRunDialog(true)}
            disabled={running}
            className="gap-1.5 shadow-sm"
          >
            {running ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {running ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      {/* Fire URL Bar */}
      <FireUrlBar
        workflowId={workflow.id}
        webhookSecret={workflow.webhookSecret}
        isActive={workflow.isActive}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Details sidebar (collapsible) */}
        {showDetails && (
          <div className="w-72 border-r border-border/60 bg-card/30 backdrop-blur-sm p-4 overflow-y-auto shrink-0 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              Workflow Details
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <input
                value={workflow.name}
                onChange={(e) => {
                  setWorkflow((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  markDirty()
                }}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-hidden focus:ring-2 focus:ring-ring"
                placeholder="Workflow name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={workflow.description || ""}
                onChange={(e) => {
                  setWorkflow((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                  markDirty()
                }}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring resize-none"
                placeholder="What does this workflow do?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const newActive = !workflow.isActive
                    setWorkflow((prev) => (prev ? { ...prev, isActive: newActive } : prev))
                    await updateWorkflow(workflow.id, { isActive: newActive })
                    toast.success(newActive ? "Workflow activated" : "Workflow deactivated")
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    workflow.isActive ? "bg-emerald-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      workflow.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-muted-foreground">
                  {workflow.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="border-t border-border/40 pt-3">
              <p className="text-[11px] text-muted-foreground/60">
                Nodes: {nodes.length} | Edges: {edges.length}
              </p>
              <p className="text-[11px] text-muted-foreground/60">
                Created: {new Date(workflow.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Node palette in sidebar */}
            <div className="border-t border-border/40 pt-3">
              <NodePalette />
            </div>
          </div>
        )}

        {/* Center: Flow Canvas */}
        <div className="flex-1 relative">
          <FlowEditor
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onAddNode={onAddNode}
            onDeleteNode={onDeleteNode}
            emailAccounts={emailAccounts}
            selectedNodeId={selectedNodeId}
          />

          {/* Floating Add Node button (when sidebar is hidden) */}
          {!showDetails && (
            <div className="absolute top-4 left-4 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNodePalette(!showNodePalette)
                  setSelectedNodeId(null)
                }}
                className="gap-1.5 shadow-sm bg-background/80 backdrop-blur-sm"
              >
                <Plus className="w-4 h-4" />
                Add Node
              </Button>
            </div>
          )}
        </div>

        {/* Right: Node Config Panel or Node Palette */}
        {selectedNode && (
          <NodeConfigPanel
            nodeType={selectedNode.type}
            nodeId={selectedNode.id}
            config={selectedNode.data.config}
            label={selectedNode.data.label}
            onUpdateLabel={(label) => updateNodeLabel(selectedNode.id, label)}
            onUpdateConfig={(key, value) => updateNodeConfig(selectedNode.id, key, value)}
            onClose={() => {
              setSelectedNodeId(null)
              markDirty()
            }}
            emailAccounts={emailAccounts}
          />
        )}

        {!selectedNode && showNodePalette && (
          <div className="w-[320px] border-l border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Add Node</span>
              </div>
              <button
                onClick={() => setShowNodePalette(false)}
                className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <NodePalette />
            </div>
          </div>
        )}

        {/* Execution History Panel */}
        <ExecutionHistory
          workflowId={workflow.id}
          open={showHistory}
          onClose={() => setShowHistory(false)}
        />

        {/* Run Dialog */}
        {showRunDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[480px] rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <Play className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold">Run Workflow</span>
                </div>
                <button
                  onClick={() => setShowRunDialog(false)}
                  className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Context Data (JSON) <span className="text-muted-foreground/50">optional</span>
                  </label>
                  <textarea
                    value={runContextJson}
                    onChange={(e) => setRunContextJson(e.target.value)}
                    placeholder='{"status": "active", "score": 85}'
                    rows={6}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring resize-none font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground/60">
                    This data will be available as <code className="text-[9px] bg-muted px-1 rounded">context</code> in condition and transform nodes.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowRunDialog(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleExecuteWithContext} className="gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    Execute
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
