"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Upload, Download, Bell } from "lucide-react"
import { Button } from "./ui-components"
import { EditableTable } from "./EditableTable"
import { Modal } from "./ui-components"
import { TriggerLogs } from "./TriggerLogs"
import { checkPendingTriggers } from "@/lib/actions/triggers2"
import * as XLSX from "xlsx"

interface DataTabProps {
  dbId: string
  columns: any[]
  records: any[]
  canWrite: boolean
  onAddRecord: (values: Record<string, any>) => Promise<void>
  onUpdateRecord: (recordId: string, values: Record<string, any>) => Promise<void>
  onDeleteRecord: (recordId: string) => Promise<void>
  onStar: (recordId: string, starred: boolean) => void
  onImportCsv: (columns: { name: string; slug: string }[], rows: Record<string, any>[]) => Promise<void>
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field"
}

export function DataTab({ 
  dbId,
  columns, 
  records, 
  canWrite, 
  onAddRecord, 
  onUpdateRecord, 
  onDeleteRecord, 
  onStar,
  onImportCsv
}: DataTabProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showTriggerLogs, setShowTriggerLogs] = useState(false)
  const [recordForm, setRecordForm] = useState<Record<string, any>>({})
  const [importPreview, setImportPreview] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check pending triggers on page load
  useEffect(() => {
    checkPendingTriggers(dbId)
    // Check every minute
    const interval = setInterval(() => checkPendingTriggers(dbId), 60000)
    return () => clearInterval(interval)
  }, [dbId])

  const openAddModal = () => {
    const init: Record<string, any> = {}
    columns.forEach((c) => { init[c.slug] = "" })
    setRecordForm(init)
    setShowAddModal(true)
  }

  const handleSaveRecord = async () => {
    const values: Record<string, any> = {}
    columns.forEach((c) => { 
      let val = recordForm[c.slug] || null
      if (c.type === "boolean") val = val === "true" || val === true
      values[c.slug] = val
    })
    setShowAddModal(false)
    setRecordForm({})
    await onAddRecord(values)
  }

  const handleUpdateCell = async (recordId: string, columnSlug: string, value: any) => {
    const record = records.find(r => r.id === recordId)
    if (record) {
      const newValues = { ...record.values, [columnSlug]: value }
      await onUpdateRecord(recordId, newValues)
    }
  }

  const readFile = (file: File): Promise<{ headers: string[]; rows: any[][] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 })
          if (json.length < 2) return resolve({ headers: [], rows: [] })
          const headers = (json[0] || []).map((h: string) => String(h).trim())
          const rows = json.slice(1).map((row: any[]) =>
            (row || []).map((c: unknown) => String(c ?? ""))
          ).filter((r: any[]) => r.some((c: string) => c.trim()))
          resolve({ headers, rows })
        } catch { reject(new Error("Failed to parse file")) }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await readFile(file)
      setImportPreview(result)
    } catch (error) {
      console.error(error)
    }
  }

  const handleImport = async () => {
    if (!importPreview) return
    const cols = importPreview.headers.map((h: string) => ({ name: h, slug: slugify(h) }))
    const rows = importPreview.rows.map((row: any[]) => {
      const obj: Record<string, any> = {}
      importPreview.headers.forEach((_: any, i: number) => {
        obj[cols[i]?.slug || `col_${i}`] = row[i] || null
      })
      return obj
    })
    setShowImportModal(false)
    setImportPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    await onImportCsv(cols, rows)
  }

  const downloadSampleCsv = () => {
    const headers = columns.map((c) => c.name).join(",") || "name,email,phone"
    const sampleRows = columns.length ? [columns.map((c) => `sample_${c.slug}`).join(",")] : ["John Doe,john@example.com,1234567890"]
    const csv = [headers, ...sampleRows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {canWrite && (
            <>
              <Button onClick={openAddModal} className="gap-2">
                <Plus className="w-4 h-4" />Add Record
              </Button>
              <Button variant="outline" onClick={() => setShowImportModal(true)} className="gap-2">
                <Upload className="w-4 h-4" />Import CSV/Excel
              </Button>
            </>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowTriggerLogs(!showTriggerLogs)} className="gap-2">
          <Bell className="w-4 h-4" />
          {showTriggerLogs ? "Hide" : "Show"} Trigger Logs
        </Button>
      </div>

      <EditableTable
        columns={columns}
        records={records}
        canWrite={canWrite}
        onStar={onStar}
        onDeleteRecord={onDeleteRecord}
        onUpdateCell={handleUpdateCell}
        onAddRecord={openAddModal}
      />

      {showTriggerLogs && <TriggerLogs dbId={dbId} />}

      {/* Add Record Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Record</h3>
            <div className="space-y-4">
              {columns.filter(c => c.type !== "trigger").map((col) => (
                <div key={col.id} className="space-y-1.5">
                  <label className="text-sm font-medium">{col.name}</label>
                  {col.type === "boolean" ? (
                    <select
                      value={recordForm[col.slug] || "false"}
                      onChange={(e) => setRecordForm({ ...recordForm, [col.slug]: e.target.value })}
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  ) : col.type === "date" ? (
                    <input
                      type="date"
                      value={recordForm[col.slug] || ""}
                      onChange={(e) => setRecordForm({ ...recordForm, [col.slug]: e.target.value })}
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
                    />
                  ) : col.type === "number" ? (
                    <input
                      type="number"
                      value={recordForm[col.slug] || ""}
                      onChange={(e) => setRecordForm({ ...recordForm, [col.slug]: e.target.value })}
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={recordForm[col.slug] || ""}
                      onChange={(e) => setRecordForm({ ...recordForm, [col.slug]: e.target.value })}
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
                      placeholder={col.name}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleSaveRecord}>Add Record</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <Modal onClose={() => setShowImportModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-4">Import Data</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 dark:file:bg-gray-800 cursor-pointer"
                />
                <Button variant="outline" onClick={downloadSampleCsv} className="gap-2">
                  <Download className="w-4 h-4" />Sample
                </Button>
              </div>
              {importPreview && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {importPreview.headers.length} columns, {importPreview.rows.length} rows
                  </p>
                  <div className="overflow-x-auto rounded border max-h-[300px]">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {importPreview.headers.map((h: string, i: number) => (
                            <th key={i} className="p-2 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.rows.slice(0, 5).map((row: any[], i: number) => (
                          <tr key={i} className="border-t">
                            {row.map((cell: string, j: number) => (
                              <td key={j} className="p-2 truncate max-w-[150px]">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowImportModal(false)}>Cancel</Button>
              <Button onClick={handleImport} disabled={!importPreview}>Import</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}