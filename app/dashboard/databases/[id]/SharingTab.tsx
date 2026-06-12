"use client"

import { useState } from "react"
import { Users, Plus, Building2, Shield, Mail, X, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, Modal } from "./ui-components"
import { permLabel, permColor } from "@/utils/helpers"

interface SharingTabProps {
  allotments: any[]
  teams: { id: string; name: string }[]
  isOwner: boolean
  onShare: (target: any, permission: "f" | "rw" | "r") => Promise<void>
  onUpdatePermission: (allotId: string, permission: "f" | "rw" | "r") => Promise<void>
  onRemoveShare: (allotId: string) => Promise<void>
}

export function SharingTab({ allotments, teams, isOwner, onShare, onUpdatePermission, onRemoveShare }: SharingTabProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareType, setShareType] = useState<"user" | "team">("user")
  const [shareEmail, setShareEmail] = useState("")
  const [shareTeamId, setShareTeamId] = useState("")
  const [sharePermission, setSharePermission] = useState<"f" | "rw" | "r">("rw")
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState("")

  const handleShare = async () => {
    setSharing(true)
    setShareError("")
    try {
      await onShare(
        shareType === "user" ? { type: "user", email: shareEmail } : { type: "team", teamId: shareTeamId },
        sharePermission
      )
      setShowShareModal(false)
      setShareEmail("")
      setShareTeamId("")
    } catch (err: any) {
      setShareError(err.message || "Failed to share")
    } finally {
      setSharing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />Access
          </CardTitle>
          {isOwner && (
            <Button onClick={() => setShowShareModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />Share
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {allotments.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            No one else has access. Click Share to add users or teams.
          </p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {allotments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3 flex-wrap">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  {a.teamName ? <Building2 className="w-4 h-4 text-gray-500" /> : <Shield className="w-4 h-4 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.teamName || a.userName || a.userEmail || "Unknown"}</p>
                  <p className="text-xs text-gray-500">{a.teamName ? "Team" : "User"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <select
                      value={a.permission}
                      onChange={(e) => onUpdatePermission(a.id, e.target.value as "f" | "rw" | "r")}
                      className="text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                    >
                      <option value="f">Full</option>
                      <option value="rw">Read & Write</option>
                      <option value="r">Read Only</option>
                    </select>
                  ) : (
                    <Badge className={`text-xs ${permColor[a.permission]}`}>
                      {permLabel[a.permission]}
                    </Badge>
                  )}
                  {isOwner && (
                    <button 
                      className="p-1 hover:bg-red-100 rounded text-red-400" 
                      onClick={() => onRemoveShare(a.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Share Modal */}
      {showShareModal && (
        <Modal onClose={() => setShowShareModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Share Database</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setShareType("user")} 
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    shareType === "user" 
                      ? "border-gray-900 bg-gray-100 dark:border-gray-100 dark:bg-gray-800" 
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  User
                </button>
                <button 
                  onClick={() => setShareType("team")} 
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    shareType === "team" 
                      ? "border-gray-900 bg-gray-100 dark:border-gray-100 dark:bg-gray-800" 
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  Team
                </button>
              </div>

              {shareType === "user" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input 
                      type="email" 
                      placeholder="user@example.com" 
                      className="pl-10" 
                      value={shareEmail} 
                      onChange={(e) => setShareEmail(e.target.value)} 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team</label>
                  <select
                    value={shareTeamId}
                    onChange={(e) => setShareTeamId(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white dark:bg-gray-900 px-3 text-sm"
                  >
                    <option value="">Select a team...</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Permission</label>
                <div className="flex gap-2">
                  {(["f", "rw", "r"] as const).map((p) => (
                    <button 
                      key={p} 
                      onClick={() => setSharePermission(p)} 
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                        sharePermission === p 
                          ? `${permColor[p]} border-gray-900/30` 
                          : "text-gray-500 border-gray-300"
                      }`}
                    >
                      {permLabel[p]}
                    </button>
                  ))}
                </div>
              </div>

              {shareError && <p className="text-sm text-red-500">{shareError}</p>}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowShareModal(false)}>Cancel</Button>
              <Button onClick={handleShare} disabled={sharing} className="gap-2">
                {sharing && <Loader2 className="w-4 h-4 animate-spin" />}
                Share
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  )
}