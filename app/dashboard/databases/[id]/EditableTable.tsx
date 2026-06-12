"use client"

import { useState, useRef, useEffect } from "react"
import { Star, StarOff, Pencil, Trash2, Save, X } from "lucide-react"
import { Button, Input } from "./ui-components"

interface EditableTableProps {
  columns: any[]
  records: any[]
  canWrite: boolean
  onStar: (recordId: string, starred: boolean) => void
  onDeleteRecord: (recordId: string) => void
  onUpdateCell: (recordId: string, columnSlug: string, value: any) => Promise<void>
  onAddRecord?: () => void
}

interface EditingCell {
  recordId: string
  columnSlug: string
  value: any
}

export function EditableTable({ 
  columns, 
  records, 
  canWrite, 
  onStar, 
  onDeleteRecord, 
  onUpdateCell,
  onAddRecord 
}: EditableTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [showSavePopup, setShowSavePopup] = useState<{ recordId: string; columnSlug: string; oldValue: any; newValue: any } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  const handleDoubleClick = (recordId: string, columnSlug: string, currentValue: any) => {
    if (!canWrite) return
    setEditingCell({
      recordId,
      columnSlug,
      value: currentValue ?? ""
    })
  }

  const handleCellChange = (value: any) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value })
    }
  }

  const handleCellSave = () => {
    if (editingCell) {
      const record = records.find(r => r.id === editingCell.recordId)
      const oldValue = record?.values[editingCell.columnSlug] ?? ""
      
      if (JSON.stringify(oldValue) !== JSON.stringify(editingCell.value)) {
        setShowSavePopup({
          recordId: editingCell.recordId,
          columnSlug: editingCell.columnSlug,
          oldValue,
          newValue: editingCell.value
        })
      }
      setEditingCell(null)
    }
  }

  const handleConfirmSave = async () => {
    if (!showSavePopup) return
    const { recordId, columnSlug, newValue } = showSavePopup
    setShowSavePopup(null)
    await onUpdateCell(recordId, columnSlug, newValue)
  }

  const handleCancelSave = () => {
    setShowSavePopup(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellSave()
    } else if (e.key === "Escape") {
      setEditingCell(null)
    }
  }

  const renderCellValue = (record: any, column: any) => {
    const value = record.values[column.slug]
    
    if (column.type === "boolean") {
      return value ? "Yes" : "No"
    }
    if (column.type === "date" && value) {
      return new Date(value).toLocaleDateString("en-IN")
    }
    if (column.type === "trigger") {
      return "🔔 Trigger"
    }
    return value ?? ""
  }

  const renderEditInput = (column: any) => {
    if (column.type === "boolean") {
      return (
        <select
          value={editingCell?.value ? "true" : "false"}
          onChange={(e) => handleCellChange(e.target.value === "true")}
          className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
          autoFocus
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )
    }
    
    if (column.type === "date") {
      return (
        <input
          ref={inputRef}
          type="date"
          value={editingCell?.value || ""}
          onChange={(e) => handleCellChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCellSave}
          className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
        />
      )
    }
    
    if (column.type === "number") {
      return (
        <input
          ref={inputRef}
          type="number"
          value={editingCell?.value || ""}
          onChange={(e) => handleCellChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCellSave}
          className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
        />
      )
    }
    
    return (
      <input
        ref={inputRef}
        type="text"
        value={editingCell?.value || ""}
        onChange={(e) => handleCellChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleCellSave}
        className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Save Confirmation Popup */}
      {showSavePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Changes?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Do you want to save the changes to this cell?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelSave}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <th className="text-left p-3 w-10"></th>
              {columns.map((col) => (
                <th key={col.id} className="text-left p-3 font-medium text-gray-500 whitespace-nowrap">
                  {col.name}
                </th>
              ))}
              {canWrite && <th className="text-right p-3 w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="p-3">
                  <button 
                    onClick={() => onStar(record.id, !record.starred)} 
                    className="text-gray-500 hover:text-amber-400 transition-colors"
                  >
                    {record.starred ? 
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> : 
                      <StarOff className="w-4 h-4" />
                    }
                  </button>
                </td>
                {columns.map((col) => (
                  <td 
                    key={col.id} 
                    className="p-3 truncate max-w-[200px] cursor-pointer"
                    onDoubleClick={() => handleDoubleClick(record.id, col.slug, record.values[col.slug])}
                  >
                    {editingCell?.recordId === record.id && editingCell?.columnSlug === col.slug ? (
                      renderEditInput(col)
                    ) : (
                      <span className={col.type === "boolean" && record.values[col.slug] ? "text-emerald-500 font-medium" : ""}>
                        {renderCellValue(record, col)}
                      </span>
                    )}
                  </td>
                ))}
                {canWrite && (
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={onAddRecord}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:bg-red-100 rounded text-red-400" onClick={() => onDeleteRecord(record.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {records.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No records yet. Click "Add Record" to get started.
        </div>
      )}
    </div>
  )
}