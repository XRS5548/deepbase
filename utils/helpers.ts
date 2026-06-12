export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field"
}

export const permLabel: Record<string, string> = { f: "Full", rw: "Read & Write", r: "Read Only" }
export const permColor: Record<string, string> = {
  f: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  rw: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  r: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN")
}