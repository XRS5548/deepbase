"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import {
  FormInput, Loader2, CheckCircle2, ArrowLeft, DollarSign,
  Star,
} from "lucide-react"
import Link from "next/link"
import { teamIcons, iconColorClasses } from "@/lib/team-icons"
import { getPublicForm, submitForm, createRazorpayOrder, verifyAndSubmitForm, type PublicFormData } from "@/lib/actions/public-forms"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export default function PublicFormPage() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<PublicFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [submitterName, setSubmitterName] = useState("")
  const [submitterEmail, setSubmitterEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getPublicForm(id)
      .then((f) => {
        setForm(f)
        const init: Record<string, string> = {}
        f.columns.forEach((c) => { init[c.slug] = "" })
        setFieldValues(init)
      })
      .catch(() => setError("Form not found or no longer available"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (typeof window.Razorpay !== "undefined") return
    const s = document.createElement("script")
    s.src = "https://checkout.razorpay.com/v1/checkout.js"
    s.async = true
    document.body.appendChild(s)
  }, [])

  function validate(): string | null {
    if (!submitterName.trim()) return "Please enter your name"
    if (!submitterEmail.trim()) return "Please enter your email"
    if (!form) return null
    for (const col of form.columns) {
      if (col.required && !fieldValues[col.slug]?.trim()) return `"${col.name}" is required`
      if (col.type === "email" && fieldValues[col.slug] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValues[col.slug])) return `"${col.name}" is not a valid email`
      if (col.type === "phone" && fieldValues[col.slug] && !/^[\d\s\-\+\(\)]{7,20}$/.test(fieldValues[col.slug])) return `"${col.name}" is not a valid phone number`
    }
    return null
  }

  async function handleSubmit() {
    if (!form) return
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setSubmitting(true)
    setError("")
    try {
      if (form.paid && form.payAmount) {
        const { orderId, amount, currency } = await createRazorpayOrder(form.id)
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        if (!keyId) throw new Error("Razorpay not configured")

        const options = {
          key: keyId,
          amount,
          currency,
          name: form.name,
          description: "Form Payment",
          order_id: orderId,
          handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
            await verifyAndSubmitForm(
              form.id, fieldValues, submitterName || null, submitterEmail || null,
              response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature,
            )
            setSuccess(true)
          },
          modal: { ondismiss: () => setSubmitting(false) },
          prefill: { name: submitterName, email: submitterEmail },
          theme: { color: "#7c3aed" },
        }

        const rzp = new window.Razorpay!(options)
        rzp.open()
      } else {
        await submitForm(form.id, fieldValues, submitterName || null, submitterEmail || null)
        setSuccess(true)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-accent/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-accent/30">
        <Card className="max-w-md w-full mx-4 text-center">
          <CardContent className="py-12">
            <p className="text-muted-foreground">{error}</p>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4">
              <ArrowLeft className="w-4 h-4" /> Go Home
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!form) return null

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-accent/30 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold">Submission Received!</h2>
            <p className="text-sm text-muted-foreground">Thank you for submitting the form{form.paid ? " and completing the payment" : ""}.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const iconDef = teamIcons.find((t) => t.name === form.icon)
  const FcIcon = iconDef?.icon || FormInput
  const colorIdx = teamIcons.findIndex((t) => t.name === form.icon)
  const iconColor = colorIdx >= 0 ? iconColorClasses[colorIdx % iconColorClasses.length] : "bg-gradient-to-br from-violet-500 to-pink-600"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30">
      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <Card className="overflow-hidden">
          {form.image && (
            <div className="relative w-full h-40">
              <Image src={form.image} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>
          )}
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm text-2xl ${form.icon ? iconColor : "bg-gradient-to-br from-violet-500 to-pink-600"}`}>
                <FcIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              {form.name}
              {form.paid && <DollarSign className="w-5 h-5 text-amber-500" aria-label="Paid" />}
            </CardTitle>
            {form.description && <p className="text-sm text-muted-foreground mt-1">{form.description}</p>}
          </CardHeader>

          {/* Form fields */}
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Name</label>
              <Input
                placeholder="Enter your name"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
              />
            </div>

            {form.columns.map((col) => (
              <div key={col.id} className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  {col.name}
                  {col.required && <span className="text-[11px] text-red-400">*</span>}
                </label>
                {col.type === "textarea" ? (
                  <textarea
                    placeholder={col.name}
                    value={fieldValues[col.slug] ?? ""}
                    onChange={(e) => setFieldValues((p) => ({ ...p, [col.slug]: e.target.value }))}
                    rows={4}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                  />
                ) : col.type === "email" ? (
                  <Input type="email" placeholder={col.name} value={fieldValues[col.slug] ?? ""} onChange={(e) => setFieldValues((p) => ({ ...p, [col.slug]: e.target.value }))} />
                ) : col.type === "phone" ? (
                  <Input type="tel" placeholder={col.name} value={fieldValues[col.slug] ?? ""} onChange={(e) => setFieldValues((p) => ({ ...p, [col.slug]: e.target.value }))} />
                ) : col.type === "number" ? (
                  <Input type="number" placeholder={col.name} value={fieldValues[col.slug] ?? ""} onChange={(e) => setFieldValues((p) => ({ ...p, [col.slug]: e.target.value }))} />
                ) : col.type === "checkbox" ? (
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer p-2 rounded-lg border border-input hover:bg-accent/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={fieldValues[col.slug] === "true"}
                      onChange={(e) => setFieldValues((p) => ({ ...p, [col.slug]: e.target.checked ? "true" : "false" }))}
                      className="rounded border-input"
                    />
                    <span>Yes</span>
                  </label>
                ) : col.type === "radio" ? (
                  <div className="space-y-2">
                    {(Array.isArray(col.options) ? col.options : []).map((opt: string) => (
                      <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`field_${col.slug}`}
                          value={opt}
                          checked={fieldValues[col.slug] === opt}
                          onChange={(e) => setFieldValues((p) => ({ ...p, [col.slug]: e.target.value }))}
                          className="border-input"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : col.type === "select" ? (
                  <select
                    value={fieldValues[col.slug] ?? ""}
                    onChange={(e) => setFieldValues((p) => ({ ...p, [col.slug]: e.target.value }))}
                    className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    {(Array.isArray(col.options) ? col.options : []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : col.type === "rating" ? (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: typeof col.options === "number" ? col.options : 5 }, (_, i) => i + 1).map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFieldValues((p) => ({ ...p, [col.slug]: String(star) }))}
                        className="p-0.5 transition-colors"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            parseInt(fieldValues[col.slug] || "0") >= star
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30 hover:text-muted-foreground/50"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input placeholder={col.name} value={fieldValues[col.slug] ?? ""} onChange={(e) => setFieldValues((p) => ({ ...p, [col.slug]: e.target.value }))} />
                )}
              </div>
            ))}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            {form.paid && form.payAmount && (
              <div className="w-full flex items-center justify-between px-1 text-sm">
                <span className="text-muted-foreground">Amount to pay</span>
                <span className="font-semibold">₹{parseFloat(form.payAmount).toFixed(2)}</span>
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full gap-2 h-12 text-base"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
              ) : form.paid ? (
                <><DollarSign className="w-5 h-5" />Pay & Submit</>
              ) : (
                <>Submit</>
              )}
            </Button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
