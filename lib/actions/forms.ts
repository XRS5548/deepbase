export type FormWithMeta = {
  id: string
  name: string
  description: string | null
  icon: string | null
  image: string | null
  isPublic: boolean
  paid: boolean
  payAmount: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  fieldCount: number
  submissionCount: number
  sharedViaTeams: { id: string; name: string }[]
  isOwner: boolean
  hasDirectAllotment: boolean
}

export type FormColumnDef = {
  id: string
  formId: string
  name: string
  slug: string
  type: string
  options: unknown
  required: boolean
  bgColor: string | null
  icon: string | null
  order: number | null
}

export type FormSubmission = {
  id: string
  formId: string
  name: string | null
  email: string | null
  userId: string | null
  values: Record<string, unknown>
  bgColor: string | null
  starred: boolean
  submittedAt: Date
}

export type FormAllotmentWithDetails = {
  id: string
  formId: string
  permission: "f" | "rw" | "r"
  createdAt: Date
  userId: string | null
  teamId: string | null
  userEmail: string | null
  userName: string | null
  userImage: string | null
  teamName: string | null
}

export type FormDetail = {
  id: string
  name: string
  description: string | null
  icon: string | null
  image: string | null
  isPublic: boolean
  paid: boolean
  payAmount: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  columns: FormColumnDef[]
  allotments: FormAllotmentWithDetails[]
  isOwner: boolean
  userPermission: "f" | "rw" | "r" | null
  sharedViaTeams: { id: string; name: string }[]
  hasDirectAllotment: boolean
}

export type SimpleTeam = { id: string; name: string }
