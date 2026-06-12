"use client"

import { useState, useEffect } from "react"
import { Columns3, Plus, Pencil, Trash2, Save, X, Loader2, Bell } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "./ui-components"
import { slugify } from "@/utils/helpers"
import { AddTriggerColumnModal } from "./AddTriggerColumnModal"

interface SchemaTabProps {
  columns: any[]
  canWrite: boolean
  canManage: boolean
  onAddColumn: (name: string, type: string) => Promise<void>
  onAddTriggerColumn: (name: string, dateColumnId: string, messageColumnId?: string, staticMessage?: string) => Promise<void>
  onUpdateColumn: (colId: string, data: any) => Promise<void>
  onDeleteColumn: (colId: string) => Promise<void>
}

export function SchemaTab({ 
  columns, 
  canWrite, 
  canManage, 
  onAddColumn, 
  onAddTriggerColumn,
  onUpdateColumn, 
  onDeleteColumn 
}: SchemaTabProps) {
  const [newColName, setNewColName] = useState("")
  const [newColType, setNewColType] = useState("string")
  const [addingCol, setAddingCol] = useState(false)
  const [editingCol, setEditingCol] = useState<string | null>(null)
  const [editColName, setEditColName] = useState("")
  const [editColType, setEditColType] = useState("string")
  const [showTriggerModal, setShowTriggerModal] = useState(false)

  // Debug: Log columns to see what's coming in
  useEffect(() => {
    console.log("Columns in SchemaTab:", columns)
    console.log("Date columns:", columns.filter(c => c.type === "date"))
    console.log("Text columns:", columns.filter(c => c.type === "string"))
  }, [columns])

  const handleAddColumn = async () => {
    if (!newColName.trim()) return
    
    if (newColType === "trigger") {
      setShowTriggerModal(true)
      return
    }
    
    setAddingCol(true)
    await onAddColumn(newColName.trim(), newColType)
    setNewColName("")
    setNewColType("string")
    setAddingCol(false)
  }

  const handleAddTrigger = async (name: string, dateColumnId: string, messageColumnId?: string, staticMessage?: string) => {
    await onAddTriggerColumn(name, dateColumnId, messageColumnId, staticMessage)
    setNewColName("")
    setNewColType("string")
    setShowTriggerModal(false)
  }

  const getColumnIcon = (type: string) => {
    switch(type) {
      case "trigger": return <Bell className="w-3.5 h-3.5 text-amber-500" />
      case "date": return "📅"
      case "boolean": return "✅"
      case "number": return "#️⃣"
      default: return "📝"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Columns3 className="w-4 h-4" />Fields
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {canWrite && (
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="New field name..."
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                className="flex-1 min-w-[150px]"
              />
              <select
                value={newColType}
                onChange={(e) => setNewColType(e.target.value)}
                className="h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
              >
                <option value="string">📝 Text</option>
                <option value="number">#️⃣ Number</option>
                <option value="boolean">✅ Yes/No</option>
                <option value="date">📅 Date</option>
                <option value="trigger">🔔 Trigger</option>
              </select>
              <Button onClick={handleAddColumn} disabled={addingCol || !newColName.trim()} className="gap-2">
                {addingCol ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </Button>
            </div>
          )}

          {columns.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No fields yet. Add your first field above.
            </p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {columns.map((col, i) => (
                <div key={col.id} className="flex items-center gap-3 py-3 flex-wrap">
                  <span className="text-xs text-gray-500 w-5">{i + 1}.</span>
                  <span className="text-base">{getColumnIcon(col.type)}</span>
                  {editingCol === col.id ? (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <Input 
                        value={editColName} 
                        onChange={(e) => setEditColName(e.target.value)} 
                        className="h-8 text-sm flex-1 min-w-[150px]" 
                      />
                      <select 
                        value={editColType} 
                        onChange={(e) => setEditColType(e.target.value)} 
                        className="h-8 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-sm"
                      >
                        <option value="string">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Yes/No</option>
                        <option value="date">Date</option>
                        <option value="trigger">Trigger</option>
                      </select>
                      <button onClick={() => onUpdateColumn(col.id, { name: editColName, slug: slugify(editColName), type: editColType })} className="p-1 hover:bg-gray-100 rounded">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingCol(null)} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{col.name}</p>
                        <p className="text-xs text-gray-500">
                          type: {col.type}
                          {col.type === "trigger" && col.triggerDateColumnId && (
                            <span className="ml-2 text-amber-600">
                              (triggers on date change)
                            </span>
                          )}
                        </p>
                      </div>
                      {canWrite && (
                        <button 
                          className="p-1 hover:bg-gray-100 rounded" 
                          onClick={() => { 
                            setEditingCol(col.id)
                            setEditColName(col.name)
                            setEditColType(col.type)
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canManage && (
                        <button 
                          className="p-1 hover:bg-red-100 rounded text-red-400" 
                          onClick={() => onDeleteColumn(col.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddTriggerColumnModal
        isOpen={showTriggerModal}
        onClose={() => setShowTriggerModal(false)}
        columns={columns}
        onAdd={handleAddTrigger}
      />
    </>
  )
}