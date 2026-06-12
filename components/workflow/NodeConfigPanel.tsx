"use client"

import { useCallback, useState, useEffect } from "react"
import { STEP_TYPE_DEFS, type WorkflowNodeType, type NodeConfig } from "@/lib/workflow-types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, RefreshCw, Plus, Trash2 } from "lucide-react"

interface NodeConfigPanelProps {
  nodeType: WorkflowNodeType | null
  nodeId: string | null
  config: NodeConfig
  label: string
  onUpdateLabel: (label: string) => void
  onUpdateConfig: (key: string, value: string) => void
  onClose: () => void
  emailAccounts?: { id: string; name: string; email: string; smtpHost: string; smtpPort: number; useSSL: boolean }[]
}

type DbTableInfo = {
  id: string
  name: string
  description: string | null
  columns: { name: string; slug: string; type: string }[]
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs font-medium text-muted-foreground">{children}</Label>
}

function FieldDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-muted-foreground/60">{children}</p>
}

export default function NodeConfigPanel({
  nodeType,
  nodeId,
  config,
  label,
  onUpdateLabel,
  onUpdateConfig,
  onClose,
  emailAccounts = [],
}: NodeConfigPanelProps) {
  const def = STEP_TYPE_DEFS.find((d) => d.type === nodeType)
  const [dbTables, setDbTables] = useState<DbTableInfo[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [selectedDbId, setSelectedDbId] = useState<string>((config as { dbId?: string }).dbId || "")

  // Fields for dynamic data input
  const [dynamicFields, setDynamicFields] = useState<{ key: string; value: string }[]>(() => {
    const dataStr = (config as { data?: string }).data || "{}"
    try {
      const parsed = JSON.parse(dataStr)
      return Object.entries(parsed).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    } catch {
      return []
    }
  })

  // Load DB tables for trigger_db node
  useEffect(() => {
    if (nodeType === "trigger_db") {
      setLoadingTables(true)
      fetch("/api/tables")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setDbTables(data as DbTableInfo[])
        })
        .catch(() => {})
        .finally(() => setLoadingTables(false))
    }
  }, [nodeType])

  const handleDbSelect = useCallback(
    (dbId: string) => {
      setSelectedDbId(dbId)
      const db = dbTables.find((t) => t.id === dbId)
      onUpdateConfig("dbId", dbId)
      onUpdateConfig("dbName", db?.name || "")
    },
    [onUpdateConfig, dbTables],
  )

  const handleAddField = useCallback(() => {
    setDynamicFields((prev) => [...prev, { key: "", value: "" }])
  }, [])

  const handleRemoveField = useCallback((index: number) => {
    setDynamicFields((prev) => {
      const next = prev.filter((_, i) => i !== index)
      updateDataJson(next)
      return next
    })
  }, [])

  const handleFieldChange = useCallback(
    (index: number, key: string, value: string) => {
      const next = dynamicFields.map((f, i) => (i === index ? { key, value } : f))
      setDynamicFields(next)
      updateDataJson(next)
    },
    [dynamicFields],
  )

  function updateDataJson(fields: { key: string; value: string }[]) {
    const obj: Record<string, string> = {}
    for (const f of fields) {
      if (f.key.trim()) obj[f.key.trim()] = f.value
    }
    onUpdateConfig("data", JSON.stringify(obj))
  }

  // Load current table columns when table changes
  const currentDb = dbTables.find((t) => t.id === selectedDbId)

  if (!nodeType || !nodeId) return null

  const renderConfigFields = () => {
    switch (nodeType) {
      case "trigger":
        return (
          <div className="space-y-2">
            <FieldLabel>Description</FieldLabel>
            <Input
              placeholder="What triggers this workflow?"
              value={(config as { description?: string }).description || ""}
              onChange={(e) => onUpdateConfig("description", e.target.value)}
            />
            <FieldDescription>
              This workflow starts when the fire URL is called.
            </FieldDescription>
          </div>
        )

      case "send_email":
        return (
          <>
            <div className="space-y-2">
              <FieldLabel>SMTP Account</FieldLabel>
              <Select
                value={(config as { accountId?: string }).accountId || ""}
                onValueChange={(val) => {
                  const account = emailAccounts.find((a) => a.id === val)
                  onUpdateConfig("accountId", val)
                  if (account) {
                    onUpdateConfig("accountName", account.name)
                    onUpdateConfig("accountEmail", account.email)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an email account..." />
                </SelectTrigger>
                <SelectContent>
                  {emailAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(config as { accountId?: string }).accountId && (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Account Details
                  </p>
                  {(() => {
                    const account = emailAccounts.find((a) => a.id === (config as { accountId?: string }).accountId)
                    return account ? (
                      <div className="space-y-0.5">
                        <p className="text-xs text-foreground">Name: {account.name}</p>
                        <p className="text-xs text-muted-foreground">Email: {account.email}</p>
                        <p className="text-xs text-muted-foreground">
                          SMTP: {account.smtpHost}:{account.smtpPort}
                        </p>
                        <p className="text-xs text-muted-foreground">SSL: {account.useSSL ? "Yes" : "No"}</p>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
              {emailAccounts.length === 0 && (
                <p className="text-[10px] text-amber-500">
                  No email accounts found. Add one in Settings &rarr; Email Accounts first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <FieldLabel>To</FieldLabel>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={(config as { to?: string }).to || ""}
                onChange={(e) => onUpdateConfig("to", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Subject</FieldLabel>
              <Input
                placeholder="Email subject"
                value={(config as { subject?: string }).subject || ""}
                onChange={(e) => onUpdateConfig("subject", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Body</FieldLabel>
              <Textarea
                placeholder="Email body text"
                value={(config as { body?: string }).body || ""}
                onChange={(e) => onUpdateConfig("body", e.target.value)}
              />
            </div>
          </>
        )

      case "notification":
        return (
          <>
            <div className="space-y-2">
              <FieldLabel>Title</FieldLabel>
              <Input
                placeholder="Notification title"
                value={(config as { title?: string }).title || ""}
                onChange={(e) => onUpdateConfig("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Message</FieldLabel>
              <Textarea
                placeholder="Notification message"
                value={(config as { message?: string }).message || ""}
                onChange={(e) => onUpdateConfig("message", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>URL (optional)</FieldLabel>
              <Input
                type="url"
                placeholder="https://..."
                value={(config as { url?: string }).url || ""}
                onChange={(e) => onUpdateConfig("url", e.target.value)}
              />
            </div>
          </>
        )

      case "webhook":
        return (
          <>
            <div className="space-y-2">
              <FieldLabel>URL</FieldLabel>
              <Input
                type="url"
                placeholder="https://api.example.com/webhook"
                value={(config as { url?: string }).url || ""}
                onChange={(e) => onUpdateConfig("url", e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Method</FieldLabel>
              <Select
                value={(config as { method?: string }).method || "POST"}
                onValueChange={(val) => onUpdateConfig("method", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel>Body (JSON)</FieldLabel>
              <Textarea
                placeholder='{"key": "value"}'
                value={(config as { body?: string }).body || ""}
                onChange={(e) => onUpdateConfig("body", e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </>
        )

      case "delay":
        return (
          <div className="space-y-2">
            <FieldLabel>Duration</FieldLabel>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="5"
                  value={((config as { duration?: string }).duration || "").replace(/[smhd]/g, "")}
                  onChange={(e) => {
                    const unit = ((config as { unit?: string }).unit || "seconds")
                    const suffix = unit === "hours" ? "h" : unit === "minutes" ? "m" : "s"
                    onUpdateConfig("duration", `${e.target.value || "0"}${suffix}`)
                  }}
                />
              </div>
              <div className="w-28">
                <Select
                  value={(config as { unit?: string }).unit || "seconds"}
                  onValueChange={(val) => {
                    const num = ((config as { duration?: string }).duration || "5").replace(/[smhd]/g, "") || "5"
                    const suffix = val === "hours" ? "h" : val === "minutes" ? "m" : "s"
                    onUpdateConfig("unit", val)
                    onUpdateConfig("duration", `${num}${suffix}`)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <FieldDescription>
              Max 55 seconds in serverless environments.
            </FieldDescription>
          </div>
        )

      case "condition":
        return (
          <>
            <div className="space-y-2">
              <FieldLabel>Context Field</FieldLabel>
              <Input
                placeholder="e.g. status, score, role"
                value={(config as { field?: string }).field || ""}
                onChange={(e) => onUpdateConfig("field", e.target.value)}
              />
              <FieldDescription>
                The field name from the webhook context or previous step output.
              </FieldDescription>
            </div>
            <div className="space-y-2">
              <FieldLabel>Operator</FieldLabel>
              <Select
                value={(config as { operator?: string }).operator || "equals"}
                onValueChange={(val) => onUpdateConfig("operator", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="greater_than">Greater than</SelectItem>
                  <SelectItem value="less_than">Less than</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel>Value</FieldLabel>
              <Input
                placeholder="Expected value"
                value={(config as { value?: string }).value || ""}
                onChange={(e) => onUpdateConfig("value", e.target.value)}
              />
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30">
              <p className="text-[10px] text-rose-600 dark:text-rose-300">
                <strong>TRUE</strong> (left) and <strong>FALSE</strong> (right) handles connect to different branches.
              </p>
            </div>
          </>
        )

      case "trigger_db":
        return (
          <>
            <div className="space-y-2">
              <FieldLabel>Action</FieldLabel>
              <Select
                value={(config as { action?: string }).action || "create_record"}
                onValueChange={(val) => onUpdateConfig("action", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create_record">Create Record</SelectItem>
                  <SelectItem value="update_record">Update Record</SelectItem>
                  <SelectItem value="delete_record">Delete Record</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel>Database</FieldLabel>
              {loadingTables ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading databases...
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={selectedDbId} onValueChange={handleDbSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a database..." />
                      </SelectTrigger>
                      <SelectContent>
                        {dbTables.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setLoadingTables(true)
                      fetch("/api/tables")
                        .then((r) => r.json())
                        .then((data) => {
                          if (Array.isArray(data)) setDbTables(data as DbTableInfo[])
                        })
                        .catch(() => {})
                        .finally(() => setLoadingTables(false))
                    }}
                    className="shrink-0"
                    title="Refresh databases"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              <FieldDescription>
                Select your database collection from the dashboard.
              </FieldDescription>
            </div>

            {/* Show columns for selected database */}
            {currentDb && currentDb.columns.length > 0 && (
              <div className="space-y-2">
                <FieldLabel>Available Columns (slug)</FieldLabel>
                <div className="flex flex-wrap gap-1">
                  {currentDb.columns.map((col) => (
                    <Badge key={col.slug} variant="outline" className="text-[10px] font-mono">
                      {col.name}
                      <span className="ml-1 text-muted-foreground/60">({col.type})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic data fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel>Field Values</FieldLabel>
                <Button variant="ghost" size="sm" onClick={handleAddField} className="h-6 text-xs gap-1">
                  <Plus className="w-3 h-3" />
                  Add
                </Button>
              </div>
              {dynamicFields.length === 0 && (
                <p className="text-[10px] text-muted-foreground/50 italic">
                  {currentDb
                    ? "Click Add to set field values for this record."
                    : "Add field-value pairs for the record data."}
                </p>
              )}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {dynamicFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="flex-1 min-w-0">
                      {currentDb ? (
                        <Select
                          value={field.key}
                          onValueChange={(val) => handleFieldChange(index, val, field.value)}
                        >
                          <SelectTrigger className="text-[10px]">
                            <SelectValue placeholder="Column" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentDb.columns.map((col) => (
                              <SelectItem key={col.slug} value={col.slug} className="font-mono text-[10px]">
                                {col.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Field slug"
                          value={field.key}
                          onChange={(e) => handleFieldChange(index, e.target.value, field.value)}
                          className="text-[10px]"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, field.key, e.target.value)}
                        className="text-[10px]"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveField(index)}
                      className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Record ID for update/delete */}
            {(config as { action?: string }).action !== "create_record" && (
              <div className="space-y-2">
                <FieldLabel>Record ID</FieldLabel>
                <Input
                  placeholder='{{context.recordId}}'
                  value={(config as { filter?: string }).filter || ""}
                  onChange={(e) => onUpdateConfig("filter", e.target.value)}
                />
                <FieldDescription>
                  The record ID to {(config as { action?: string }).action === "update_record" ? "update" : "delete"}. Use <code className="text-[9px] bg-muted px-1 rounded">{"{{context.fieldName}}"}</code> for dynamic values from context.
                </FieldDescription>
              </div>
            )}
          </>
        )

      case "transform":
        return (
          <>
            <div className="space-y-2">
              <FieldLabel>Expression</FieldLabel>
              <Textarea
                placeholder={'context.status === "active" ? "yes" : "no"'}
                value={(config as { expression?: string }).expression || ""}
                onChange={(e) => onUpdateConfig("expression", e.target.value)}
                className="font-mono text-xs min-h-[60px]"
              />
              <FieldDescription>
                JavaScript expression. Use <code className="text-[9px] bg-muted px-1 rounded">context.field</code> to access context values.
              </FieldDescription>
            </div>
            <div className="space-y-2">
              <FieldLabel>Output Key</FieldLabel>
              <Input
                placeholder="transformed"
                value={(config as { outputKey?: string }).outputKey || "transformed"}
                onChange={(e) => onUpdateConfig("outputKey", e.target.value)}
              />
              <FieldDescription>
                The result will be stored in context under this key.
              </FieldDescription>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30">
              <p className="text-[10px] text-indigo-600 dark:text-indigo-300">
                <strong>Examples:</strong><br />
                <code className="text-[9px]">context.age &gt;= 18 ? "adult" : "minor"</code><br />
                <code className="text-[9px]">JSON.stringify(context, null, 2)</code>
              </p>
            </div>
          </>
        )

      case "log":
        return (
          <>
            <div className="space-y-2">
              <FieldLabel>Level</FieldLabel>
              <Select
                value={(config as { level?: string }).level || "info"}
                onValueChange={(val) => onUpdateConfig("level", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel>Message</FieldLabel>
              <Textarea
                placeholder={'Processing completed for {{context.name}}'}
                value={(config as { message?: string }).message || ""}
                onChange={(e) => onUpdateConfig("message", e.target.value)}
                className="font-mono text-xs min-h-[60px]"
              />
              <FieldDescription>
                Use <code className="text-[9px] bg-muted px-1 rounded">{"{{context.field}}"}</code> syntax for dynamic values from context.
              </FieldDescription>
            </div>
          </>
        )

      default:
        return <p className="text-sm text-muted-foreground">No configuration available</p>
    }
  }

  return (
    <div className="w-[380px] h-full flex flex-col border-l border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${def?.bg || "bg-muted"}`}>
            {def?.type === "trigger_db" ? (
              <Database className={`w-4 h-4 ${def?.color || ""}`} />
            ) : (
              <span className={`text-sm font-bold ${def?.color || ""}`}>
                {def?.label.charAt(0) || "?"}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{def?.label || "Node"}</p>
            <p className="text-[11px] text-muted-foreground">Configure step settings</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="space-y-2">
          <FieldLabel>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Step Name
          </FieldLabel>
          <Input
            value={label}
            onChange={(e) => onUpdateLabel(e.target.value)}
          />
        </div>

        <div className="border-t border-border/40" />

        {renderConfigFields()}
      </div>
    </div>
  )
}
