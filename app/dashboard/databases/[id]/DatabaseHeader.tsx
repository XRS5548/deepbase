"use client"

import { Database, Pencil, Users, Columns3, Rows3 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Card, CardHeader, CardTitle } from "./ui-components"
import { teamIcons, iconColorClasses } from "@/lib/team-icons"
import type { DatabaseDetail } from "@/lib/actions/databases"

interface DatabaseHeaderProps {
  db: DatabaseDetail
  recordsCount: number
  isOwner: boolean
  onEdit: () => void
}

export function DatabaseHeader({ db, recordsCount, isOwner, onEdit }: DatabaseHeaderProps) {
  const iconDef = teamIcons.find((t) => t.name === db.icon)
  const DbIcon = iconDef?.icon || Database
  const colorIdx = teamIcons.findIndex((t) => t.name === db.icon)
  const iconColor = colorIdx >= 0 
    ? iconColorClasses[colorIdx % iconColorClasses.length] 
    : "bg-gradient-to-br from-cyan-500 to-blue-600"

  return (
    <div className="space-y-4">
      <Link 
        href="/dashboard/databases" 
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Databases
      </Link>

      <Card className="overflow-hidden">
        {db.image && (
          <div className="relative w-full h-36">
            <Image src={db.image} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-2xl ${db.icon ? iconColor : "bg-gradient-to-br from-cyan-500 to-blue-600"}`}>
                <DbIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{db.name}</CardTitle>
                {db.description && (
                  <p className="text-sm text-gray-500 mt-1">{db.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Columns3 className="w-3.5 h-3.5" />{db.columns.length} fields
                  </span>
                  <span className="flex items-center gap-1">
                    <Rows3 className="w-3.5 h-3.5" />{recordsCount} rows
                  </span>
                </div>
                {db.sharedViaTeams.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Users className="w-3 h-3 text-gray-500/60" />
                    <span className="text-[11px] text-gray-500">Shared via:</span>
                    {db.sharedViaTeams.map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {isOwner && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
            )}
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}