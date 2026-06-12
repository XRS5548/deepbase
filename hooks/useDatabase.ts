"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  getDatabase, updateDatabase, addColumn, updateColumn, deleteColumn, deleteDatabase,
  getRecords, addRecord, updateRecord, deleteRecord, updateRecordStar, importCsv,
  getUserTeamsSimple, addAllotment, updateAllotmentPermission, removeAllotment, leaveDatabase,
  type DatabaseDetail, type RecordRow, type SimpleTeam,
} from "@/lib/actions/databases"
import { toastApi } from "@/lib/toast-api"

export function useDatabase(id: string) {
  const [db, setDb] = useState<DatabaseDetail | null>(null)
  const [records, setRecords] = useState<RecordRow[]>([])
  const [teams, setTeams] = useState<SimpleTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const loadData = useCallback(async (showToast = false) => {
    if (!id) return
    const toastId = showToast ? toast.loading("Loading database...") : null
    try {
      const [data, recs, tms] = await Promise.all([
        getDatabase(id),
        getRecords(id),
        getUserTeamsSimple(),
      ])
      setDb(data)
      setRecords(recs)
      setTeams(tms)
      setError("")
      if (toastId) toast.success("Database loaded", { id: toastId })
    } catch (err: any) {
      const msg = err.message || "Failed to load database"
      setError(msg)
      if (toastId) toast.error(msg, { id: toastId })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  const updateDatabaseSettings = async (formData: FormData) => {
    await toastApi(updateDatabase(id, formData), {
      loading: "Updating database...",
      success: "Database updated",
    })
    await loadData(false)
  }

  const addNewColumn = async (name: string, type: string) => {
    await toastApi(addColumn(id, name, type), {
      loading: "Adding column...",
      success: "Column added",
    })
    await loadData()
  }

  const updateColumnData = async (colId: string, data: any) => {
    await toastApi(updateColumn(colId, data), {
      loading: "Updating column...",
      success: "Column updated",
    })
    await loadData()
  }

  const deleteColumnData = async (colId: string) => {
    await toastApi(deleteColumn(colId), {
      loading: "Deleting column...",
      success: "Column deleted",
    })
    await loadData()
  }

  const addNewRecord = async (values: Record<string, unknown>) => {
    await toastApi(addRecord(id, values), {
      loading: "Adding record...",
      success: "Record added",
    })
    await loadData()
  }

  const updateRecordData = async (recordId: string, values: Record<string, unknown>) => {
    await toastApi(updateRecord(recordId, values), {
      loading: "Updating record...",
      success: "Record updated",
    })
    await loadData()
  }

  const deleteRecordData = async (recordId: string) => {
    await toastApi(deleteRecord(recordId), {
      loading: "Deleting record...",
      success: "Record deleted",
    })
    await loadData()
  }

  const toggleStar = async (recordId: string, starred: boolean) => {
    await toastApi(updateRecordStar(recordId, starred), {
      loading: starred ? "Starring record..." : "Unstarring record...",
      success: starred ? "Record starred" : "Record unstarred",
    })
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, starred } : r))
  }

  const importCsvData = async (columns: { name: string; slug: string }[], rows: Record<string, unknown>[]) => {
    await toastApi(importCsv(id, columns, rows), {
      loading: "Importing CSV...",
      success: "CSV imported",
    })
    await loadData()
  }

  const shareDatabase = async (target: any, permission: "f" | "rw" | "r") => {
    await toastApi(addAllotment(id, target, permission), {
      loading: "Sharing database...",
      success: "Database shared",
    })
    await loadData()
  }

  const updateSharePermission = async (allotId: string, permission: "f" | "rw" | "r") => {
    await toastApi(updateAllotmentPermission(allotId, permission), {
      loading: "Updating permission...",
      success: "Permission updated",
    })
    await loadData()
  }

  const removeShare = async (allotId: string) => {
    await toastApi(removeAllotment(allotId), {
      loading: "Removing share...",
      success: "Share removed",
    })
    await loadData()
  }

  const leaveDatabaseNow = async () => {
    await toastApi(leaveDatabase(id), {
      loading: "Leaving database...",
      success: "Left database",
    })
  }

  const deleteDatabaseNow = async () => {
    await toastApi(deleteDatabase(id), {
      loading: "Deleting database...",
      success: "Database deleted",
    })
  }

  return {
    db,
    records,
    teams,
    loading,
    error,
    reload: loadData,
    updateDatabaseSettings,
    addNewColumn,
    updateColumnData,
    deleteColumnData,
    addNewRecord,
    updateRecordData,
    deleteRecordData,
    toggleStar,
    importCsvData,
    shareDatabase,
    updateSharePermission,
    removeShare,
    leaveDatabaseNow,
    deleteDatabaseNow,
  }
}