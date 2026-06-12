import type { FormWithMeta, FormDetail, FormSubmission, SimpleTeam } from "@/lib/actions/forms"
import { toastApi } from "@/lib/toast-api"
import { api } from "@/lib/proxy"

export function getUserForms(): Promise<FormWithMeta[]> {
  return api("/api/forms")
}

export function createForm(formData: FormData) {
  return toastApi(
    api<{ success: boolean; form: FormWithMeta }>("/api/forms", { method: "POST", body: formData }),
    { loading: "Creating form...", success: "Form created!" },
  )
}

export function deleteForm(id: string) {
  return toastApi(
    api<{ success: boolean }>(`/api/forms/${id}`, { method: "DELETE" }),
    { loading: "Deleting form...", success: "Form deleted" },
  )
}

export function leaveForm(id: string) {
  return toastApi(
    api<{ success: boolean }>(`/api/forms/${id}/leave`, { method: "POST" }),
    { loading: "Leaving form...", success: "Left form" },
  )
}

export function getForm(id: string): Promise<FormDetail> {
  return api(`/api/forms/${id}`)
}

export function updateForm(id: string, formData: FormData) {
  return toastApi(
    api<{ success: boolean }>(`/api/forms/${id}`, { method: "PUT", body: formData }),
    { loading: "Saving changes...", success: "Changes saved!" },
  )
}

export function addColumn(formId: string, name: string, type = "text", options?: unknown, required?: boolean) {
  return toastApi(
    api<{ success: boolean; column: unknown }>(`/api/forms/${formId}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, options, required }),
    }),
    { loading: "Adding field...", success: "Field added!" },
  )
}

export function updateFormColumn(colId: string, formId: string, data: Record<string, unknown>) {
  return toastApi(
    api<{ success: boolean }>(`/api/forms/${formId}/columns/${colId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    { loading: "Saving field...", success: "Field updated!" },
  )
}

export function deleteFormColumn(colId: string, formId: string) {
  return toastApi(
    api<{ success: boolean }>(`/api/forms/${formId}/columns/${colId}`, { method: "DELETE" }),
    { loading: "Deleting field...", success: "Field deleted" },
  )
}

export function getSubmissions(formId: string): Promise<FormSubmission[]> {
  return api(`/api/forms/${formId}/submissions`)
}

export function deleteSubmission(submissionId: string, formId: string) {
  return toastApi(
    api<{ success: boolean }>(`/api/forms/${formId}/submissions/${submissionId}`, { method: "DELETE" }),
    { loading: "Deleting submission...", success: "Submission deleted" },
  )
}

export function updateSubmissionStar(submissionId: string, formId: string, starred: boolean) {
  return api<{ success: boolean }>(`/api/forms/${formId}/submissions/${submissionId}/star`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ starred }),
  })
}

export function getUserTeamsSimple(): Promise<SimpleTeam[]> {
  return api("/api/teams/simple")
}

export function addFormAllotment(
  formId: string,
  target: { type: "user" | "team"; email?: string; teamId?: string },
  permission: "f" | "rw" | "r",
) {
  return toastApi(
    api<{ success: boolean }>(`/api/forms/${formId}/allotments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...target, permission }),
    }),
    { loading: "Adding access...", success: "Access added!" },
  )
}

export function updateFormAllotmentPermission(allotmentId: string, formId: string, permission: "f" | "rw" | "r") {
  return toastApi(
    api<{ success: boolean }>(`/api/forms/${formId}/allotments/${allotmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission }),
    }),
    { loading: "Updating permission...", success: "Permission updated!" },
  )
}

export function removeFormAllotment(allotmentId: string, formId: string) {
  return toastApi(
    api<{ success: boolean }>(`/api/forms/${formId}/allotments/${allotmentId}`, { method: "DELETE" }),
    { loading: "Removing access...", success: "Access removed" },
  )
}
