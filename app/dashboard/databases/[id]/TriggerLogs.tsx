"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, XCircle, Clock } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui-components"
import { getTriggerLogs } from "@/lib/actions/triggers2"

interface TriggerLogsProps {
  dbId: string
}

export function TriggerLogs({ dbId }: TriggerLogsProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
    // Refresh every 30 seconds
    const interval = setInterval(loadLogs, 30000)
    return () => clearInterval(interval)
  }, [dbId])

  const loadLogs = async () => {
    const data = await getTriggerLogs(dbId)
    setLogs(data)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "executed": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Loading trigger logs...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-4 h-4" />Trigger Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No triggers have been executed yet</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{log.columnName || "Trigger"}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.executedAt).toLocaleString()}
                    </p>
                  </div>
                  {log.message && (
                    <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 capitalize">Status: {log.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}