"use client"

import { useState } from "react"
import { Settings, Trash2, LogOut, Loader2 } from "lucide-react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, CloudinaryUpload } from "./ui-components"
import { teamIcons, iconColorClasses } from "@/lib/team-icons"

interface SettingsTabProps {
  db: {
    id: string
    name: string
    description: string | null
    icon: string | null
    image: string | null
    isOwner: boolean
    hasDirectAllotment: boolean
  }
  onSave: (formData: FormData) => Promise<void>
  onDelete: () => Promise<void>
  onLeave: () => Promise<void>
}

export function SettingsTab({ db, onSave, onDelete, onLeave }: SettingsTabProps) {
  const [selectedIcon, setSelectedIcon] = useState(db.icon || "")
  const [dbImage, setDbImage] = useState(db.image || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (formData: FormData) => {
    setSaving(true)
    setError("")
    try {
      if (selectedIcon) formData.set("icon", selectedIcon)
      if (dbImage) formData.set("image", dbImage)
      await onSave(formData)
    } catch (err: any) {
      setError(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-4 h-4" />Database Settings
        </CardTitle>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Icon</label>
            <div className="flex flex-wrap gap-2">
              {teamIcons.map(({ name: iconName, icon: Icon }, idx) => (
                <button 
                  key={iconName} 
                  type="button" 
                  onClick={() => setSelectedIcon(selectedIcon === iconName ? "" : iconName)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    selectedIcon === iconName 
                      ? `${iconColorClasses[idx % iconColorClasses.length]} ring-2 ring-offset-2 ring-gray-900 scale-110 shadow-sm` 
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            <input type="hidden" name="icon" value={selectedIcon} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cover Image</label>
            <CloudinaryUpload value={dbImage} onChange={setDbImage} />
            <input type="hidden" name="image" value={dbImage} />
          </div>

          <div className="space-y-2">
            <label htmlFor="s-name" className="text-sm font-medium">Name</label>
            <Input id="s-name" name="name" defaultValue={db.name} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="s-desc" className="text-sm font-medium">Description</label>
            <textarea 
              id="s-desc" 
              name="description" 
              defaultValue={db.description ?? ""} 
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>

        <CardFooter className="flex justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            {db.isOwner && (
              <Button type="button" variant="outline" onClick={onDelete} className="gap-2 text-red-500">
                <Trash2 className="w-4 h-4" />Delete Database
              </Button>
            )}
            {!db.isOwner && db.hasDirectAllotment && (
              <Button type="button" variant="outline" onClick={onLeave} className="gap-2 text-orange-500">
                <LogOut className="w-4 h-4" />Leave Database
              </Button>
            )}
          </div>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}