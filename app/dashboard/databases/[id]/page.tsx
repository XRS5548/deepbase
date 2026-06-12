"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Columns3, Rows3, Users, Settings, RefreshCw, Database } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import { DatabaseHeader } from "./DatabaseHeader"
import { SchemaTab } from "./SchemaTab"
import { DataTab } from "./DataTab"
import { SharingTab } from "./SharingTab"
import { SettingsTab } from "./SettingsTab"
import { addTriggerColumn } from "@/lib/actions/databases"

type Tab = "schema" | "data" | "sharing" | "settings"

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "schema", label: "Schema", icon: Columns3 },
  { key: "data", label: "Data", icon: Rows3 },
  { key: "sharing", label: "Sharing", icon: Users },
  { key: "settings", label: "Settings", icon: Settings },
]

export default function DatabaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("schema")

  const {
    db,
    records,
    teams,
    loading,
    error,
    reload,
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
  } = useDatabase(id)

  const handleAddTriggerColumn = async (name: string, dateColumnId: string, messageColumnId?: string, staticMessage?: string) => {
    await addTriggerColumn(id, name, dateColumnId, messageColumnId, staticMessage)
    await reload()
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-72 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 pb-0.5">
          {tabs.map((t) => (
            <div key={t.key} className="h-10 w-24 bg-gray-100 dark:bg-gray-800/50 rounded-t-lg" />
          ))}
        </div>
        <div className="flex items-center justify-center h-[40vh]">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Database className="w-8 h-8 animate-pulse" />
            <p className="text-sm">Loading database...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !db) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Database className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Unable to load database</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {error || "The database you're looking for doesn't exist or you may not have access."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => router.push("/dashboard/databases")}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Back to Databases
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isOwner = db.isOwner
  const canManage = isOwner || db.userPermission === "f"
  const canWrite = canManage || db.userPermission === "rw"

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <DatabaseHeader 
        db={db} 
        recordsCount={records.length} 
        isOwner={isOwner} 
        onEdit={() => setTab("settings")} 
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 pb-0.5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              tab === t.key
                ? "text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800/30"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/20"
            }`}
          >
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "schema" && (
        <SchemaTab
          columns={db.columns}
          canWrite={canWrite}
          canManage={canManage}
          onAddColumn={addNewColumn}
          onAddTriggerColumn={handleAddTriggerColumn}
          onUpdateColumn={updateColumnData}
          onDeleteColumn={deleteColumnData}
        />
      )}

      {tab === "data" && (
        <DataTab
          dbId={id}
          columns={db.columns}
          records={records}
          canWrite={canWrite}
          onAddRecord={addNewRecord}
          onUpdateRecord={updateRecordData}
          onDeleteRecord={deleteRecordData}
          onStar={toggleStar}
          onImportCsv={importCsvData}
        />
      )}

      {tab === "sharing" && (
        <SharingTab
          allotments={db.allotments}
          teams={teams}
          isOwner={isOwner}
          onShare={shareDatabase}
          onUpdatePermission={updateSharePermission}
          onRemoveShare={removeShare}
        />
      )}

      {tab === "settings" && (
        <SettingsTab
          db={db}
          onSave={updateDatabaseSettings}
          onDelete={async () => {
            await deleteDatabaseNow()
            router.push("/dashboard/databases")
          }}
          onLeave={async () => {
            await leaveDatabaseNow()
            router.push("/dashboard/databases")
          }}
        />
      )}
    </div>
  )
}