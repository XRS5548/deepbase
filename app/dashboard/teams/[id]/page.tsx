"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  User,
  Pencil,
  Trash2,
  LogOut,
  X,
  Loader2,
  Plus,
  Mail,
  Calendar,
  Crown,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  getTeamWithMembers,
  updateTeam,
  addMember,
  updateMemberRole,
  removeMember,
  deleteTeam,
  leaveTeam,
  type TeamDetail,
} from "@/lib/actions/teams"
import { teamIcons, iconColorClasses } from "@/lib/team-icons"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import CloudinaryUpload from "@/components/cloudinary-upload"

const roleLabel: Record<string, string> = { leader: "Leader", admin: "Admin", member: "Member" }
const roleColor: Record<string, string> = {
  leader: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  admin: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  member: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
}
const roleIcon: Record<string, React.ElementType> = { leader: Crown, admin: ShieldCheck, member: User }

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [showEdit, setShowEdit] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState("")
  const [teamImage, setTeamImage] = useState("")
  const [saving, setSaving] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState("")
  const [memberRole, setMemberRole] = useState<"leader" | "admin" | "member">("member")
  const [memberError, setMemberError] = useState("")
  const editFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    getTeamWithMembers(id)
      .then((data) => {
        if (!data.currentUserRole) { router.push("/dashboard/teams"); return }
        setTeam(data)
      })
      .catch(() => setError("Team not found"))
      .finally(() => setLoading(false))
  }, [id, router])

  function openEdit() {
    if (!team) return
    setSelectedIcon(team.icon || "")
    setTeamImage(team.image || "")
    setShowEdit(true)
  }

  async function handleEdit(formData: FormData) {
    setSaving(true)
    setError("")
    try {
      if (selectedIcon) formData.set("icon", selectedIcon)
      if (teamImage) formData.set("image", teamImage)
      await updateTeam(id, formData)
      const reloaded = await getTeamWithMembers(id)
      setTeam(reloaded)
      setShowEdit(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update team")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddMember() {
    if (!memberEmail.trim()) return
    setAddingMember(true)
    setMemberError("")
    try {
      await addMember(id, memberEmail.trim(), memberRole)
      setMemberEmail("")
      setShowAddMember(false)
      const reloaded = await getTeamWithMembers(id)
      setTeam(reloaded)
    } catch (e: unknown) {
      setMemberError(e instanceof Error ? e.message : "Failed to add member")
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRoleChange(memberUserId: string, newRole: "leader" | "admin" | "member") {
    try {
      await updateMemberRole(id, memberUserId, newRole)
      const reloaded = await getTeamWithMembers(id)
      setTeam(reloaded)
    } catch {
      // silently fail
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    try {
      await removeMember(id, memberUserId)
      const reloaded = await getTeamWithMembers(id)
      setTeam(reloaded)
    } catch {
      // silently fail
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this team?")) return
    try {
      await deleteTeam(id)
      router.push("/dashboard/teams")
    } catch {
      // silently fail
    }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this team?")) return
    try {
      await leaveTeam(id)
      router.push("/dashboard/teams")
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading team...</p>
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Team not found</h3>
            <p className="text-sm mb-6">{error || "The team you're looking for doesn't exist."}</p>
            <Link href="/dashboard/teams">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Teams
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canManage = team.currentUserRole === "leader" || team.currentUserRole === "admin"
  const teamIconDef = teamIcons.find((t) => t.name === team.icon)
  const TeamIconComponent = teamIconDef?.icon || Users
  const colorIdx = teamIcons.findIndex((t) => t.name === team.icon)
  const iconColor = colorIdx >= 0 ? iconColorClasses[colorIdx % iconColorClasses.length] : "bg-gradient-to-br from-violet-500 to-purple-600"

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/teams" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Teams
      </Link>

      {/* Team Header */}
      <Card className="overflow-hidden">
        {team.image && (
          <div className="relative w-full h-36">
            <Image src={team.image} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-2xl ${team.icon ? iconColor : "bg-gradient-to-br from-violet-500 to-purple-600"}`}>
                {team.icon ? <TeamIconComponent className="w-7 h-7" /> : <Users className="w-7 h-7 text-white" />}
              </div>
              <div>
                <CardTitle className="text-2xl">{team.name}</CardTitle>
                {team.description && <p className="text-sm text-muted-foreground mt-1">{team.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{team.members.length} members</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Created {timeAgo(team.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canManage && (
                <Button variant="outline" size="sm" onClick={openEdit} className="gap-2">
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              {team.currentUserRole === "leader" ? (
                <Button variant="outline" size="sm" onClick={handleDelete} className="gap-2 text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleLeave} className="gap-2 text-orange-500 hover:text-orange-600">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Leave</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <CardTitle>Members ({team.members.length})</CardTitle>
            </div>
            {canManage && (
              <Button size="sm" onClick={() => setShowAddMember(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Member</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {team.members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No members in this team.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {team.members.map((member) => {
                const RoleIcon = roleIcon[member.role] || User
                const initials = member.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
                const isLeader = member.role === "leader"
                const canManageMember = canManage && !isLeader

                return (
                  <div key={member.id} className="flex items-center gap-4 py-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={member.image ?? undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManage && canManageMember && team.currentUserRole === "leader" ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className={`gap-1 text-xs px-2 py-0.5 ${roleColor[member.role]}`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleLabel[member.role]}
                          </Badge>
                          <div className="flex">
                            {(["admin", "member"] as const).filter(r => r !== member.role).map(r => (
                              <button
                                key={r}
                                onClick={() => handleRoleChange(member.userId, r)}
                                className="text-[10px] px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                              >
                                {roleLabel[r]}
                              </button>
                            ))}
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              className="text-[10px] px-1.5 py-0.5 text-red-400 hover:text-red-500 hover:bg-accent rounded ml-1"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary" className={`gap-1 text-xs px-2 py-0.5 ${roleColor[member.role]}`}>
                          <RoleIcon className="w-3 h-3" />
                          {roleLabel[member.role]}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowEdit(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Edit Team</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setShowEdit(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <form action={handleEdit} ref={editFormRef}>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Team Icon</label>
                      <div className="flex flex-wrap gap-2">
                        {teamIcons.map(({ name: iconName, icon: Icon }, idx) => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setSelectedIcon(selectedIcon === iconName ? "" : iconName)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                              selectedIcon === iconName
                                ? `${iconColorClasses[idx % iconColorClasses.length]} ring-2 ring-offset-2 ring-foreground scale-110 shadow-sm`
                                : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground border border-input"
                            }`}
                            title={iconName}
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                      <input type="hidden" name="icon" value={selectedIcon} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Team Image</label>
                      <CloudinaryUpload value={teamImage} onChange={setTeamImage} />
                      <input type="hidden" name="image" value={teamImage} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="edit-name" className="text-sm font-medium">Team Name</label>
                      <Input id="edit-name" name="name" defaultValue={team.name} required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="edit-desc" className="text-sm font-medium">Description</label>
                      <textarea
                        id="edit-desc"
                        name="description"
                        defaultValue={team.description ?? ""}
                        rows={3}
                        className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
                    <Button type="submit" disabled={saving} className="gap-2">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => { setShowAddMember(false); setMemberError("") }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Add Member</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => { setShowAddMember(false); setMemberError("") }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="colleague@example.com" className="pl-10" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <div className="flex gap-2">
                      {(["member", "admin", "leader"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setMemberRole(r)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            memberRole === r
                              ? `${roleColor[r]} border-foreground/30`
                              : "text-muted-foreground border-input hover:border-foreground/30"
                          }`}
                        >
                          {(() => { const Icon = roleIcon[r] || User; return <Icon className="w-3.5 h-3.5" />; })()}
                          {roleLabel[r]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {memberError && <p className="text-sm text-red-500">{memberError}</p>}
                </CardContent>
                  <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => { setShowAddMember(false); setMemberError("") }}>Cancel</Button>
                    <Button onClick={handleAddMember} disabled={addingMember || !memberEmail.trim()} className="gap-2">
                      {addingMember && <Loader2 className="w-4 h-4 animate-spin" />}
                      {addingMember ? "Adding..." : "Add Member"}
                    </Button>
                  </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
