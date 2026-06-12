"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  User,
  LogOut,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { getUserTeams, createTeam, deleteTeam, leaveTeam, type TeamWithDetails } from "@/lib/actions/teams"
import Image from "next/image"
import { teamIcons, iconColorClasses } from "@/lib/team-icons"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import CloudinaryUpload from "@/components/cloudinary-upload"

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  leader: { label: "Leader", icon: ShieldCheck, color: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
  admin: { label: "Admin", icon: Shield, color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  member: { label: "Member", icon: User, color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("")
  const [teamImage, setTeamImage] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    getUserTeams()
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(formData: FormData) {
    setCreating(true)
    setError("")
    try {
      if (selectedIcon) formData.set("icon", selectedIcon)
      if (teamImage) formData.set("image", teamImage)
      const res = await createTeam(formData)
      if (res.success) {
        setTeams((prev) => [res.team as TeamWithDetails, ...prev])
        setShowCreate(false)
        setSelectedIcon("")
        setTeamImage("")
        formRef.current?.reset()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create team")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(teamId: string) {
    try {
      await deleteTeam(teamId)
      setTeams((prev) => prev.filter((t) => t.id !== teamId))
    } catch {
      // silently fail
    }
  }

  async function handleLeave(teamId: string) {
    try {
      await leaveTeam(teamId)
      setTeams((prev) => prev.filter((t) => t.id !== teamId))
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading teams...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Teams</h1>
          <p className="text-muted-foreground mt-1">Manage your teams and collaborate with members.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Team</span>
        </Button>
      </motion.div>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowCreate(false)
              setSelectedIcon("")
              setTeamImage("")
            }}
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
                    <CardTitle>Create Team</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowCreate(false)
                        setSelectedIcon("")
                        setTeamImage("")
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <form action={handleCreate} ref={formRef}>
                  <CardContent className="space-y-5">
                    {/* Team Icon */}
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

                    {/* Team Image */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Team Image</label>
                      <CloudinaryUpload value={teamImage} onChange={setTeamImage} />
                      <input type="hidden" name="image" value={teamImage} />
                    </div>

                    {/* Team Name */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Team Name
                      </label>
                      <Input id="name" name="name" placeholder="Enter team name" required />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        placeholder="What's this team for?"
                        rows={3}
                        className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreate(false)
                        setSelectedIcon("")
                        setTeamImage("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating} className="gap-2">
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      {creating ? "Creating..." : "Create Team"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="w-12 h-12 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No teams yet</h3>
              <p className="text-sm mb-6">Create your first team to start collaborating.</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Team
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team, i) => {
            const role = roleConfig[team.role] ?? roleConfig.member
            const RoleIcon = role.icon
            const teamIconDef = teamIcons.find((t) => t.name === team.icon)
            const TeamIconComponent = teamIconDef?.icon || Users
            const colorIdx = teamIcons.findIndex((t) => t.name === team.icon)
            const iconColor = colorIdx >= 0 ? iconColorClasses[colorIdx % iconColorClasses.length] : "bg-gradient-to-br from-violet-500 to-purple-600"

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/dashboard/teams/${team.id}`}>
                  <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group overflow-hidden">
                    {team.image && (
                      <div className="relative w-full h-24 -mb-2">
                        <Image src={team.image} alt="" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${team.icon ? iconColor : "bg-gradient-to-br from-violet-500 to-purple-600"}`}>
                            {team.icon ? (
                              <TeamIconComponent className="w-5 h-5" />
                            ) : (
                              <Users className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">{team.name}</CardTitle>
                            {team.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{team.description}</p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 mt-1 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{team.memberCount} {team.memberCount === 1 ? "member" : "members"}</span>
                        </div>
                        <Badge variant="secondary" className={`gap-1 text-xs px-2 py-0.5 ${role.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          {role.label}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                          {team.role === "leader" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-muted-foreground hover:text-red-500"
                              onClick={() => handleDelete(team.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {team.role !== "leader" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-muted-foreground hover:text-orange-500"
                              onClick={() => handleLeave(team.id)}
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
