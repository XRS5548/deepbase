"use server"

import { db } from "@/db"
import { forms, formCols, formSubmissions, payments } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import crypto from "crypto"
import { pushNotification } from "@/lib/notification-utils"

export type PublicFormData = {
  id: string
  name: string
  description: string | null
  icon: string | null
  image: string | null
  paid: boolean
  payAmount: string | null
  columns: { id: string; name: string; slug: string; type: string; options: unknown; required: boolean }[]
}

export async function getPublicForm(id: string): Promise<PublicFormData> {
  const [f] = await db.select().from(forms).where(and(eq(forms.id, id), eq(forms.isPublic, true)))
  if (!f) throw new Error("Form not found or not public")

  const cols = await db
    .select({ id: formCols.id, name: formCols.name, slug: formCols.slug, type: formCols.type, options: formCols.options, required: formCols.required })
    .from(formCols)
    .where(eq(formCols.formId, id))
    .orderBy(formCols.order)

  return {
    id: f.id,
    name: f.name,
    description: f.description,
    icon: f.icon,
    image: f.image,
    paid: f.paid,
    payAmount: f.payAmount,
    columns: cols,
  }
}

async function requirePublicForm(formId: string) {
  const [f] = await db.select({ id: forms.id }).from(forms).where(and(eq(forms.id, formId), eq(forms.isPublic, true)))
  if (!f) throw new Error("Form not found or not public")
}

export async function submitForm(
  formId: string,
  values: Record<string, unknown>,
  name?: string | null,
  email?: string | null,
) {
  await requirePublicForm(formId)
  const [sub] = await db
    .insert(formSubmissions)
    .values({ formId, name: name || null, email: email || null, values })
    .returning()

  const [f] = await db.select({ name: forms.name, createdBy: forms.createdBy }).from(forms).where(eq(forms.id, formId))
  if (f?.createdBy) {
    await pushNotification({
      userId: f.createdBy,
      title: `New submission for "${f.name}"`,
      description: name ? `Submitted by ${name}` : "A new submission was received",
      icon: "FormInput",
      url: `/dashboard/forms/${formId}`,
    })
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { success: true, submission: sub }
}

export async function createRazorpayOrder(formId: string) {
  await requirePublicForm(formId)
  const [f] = await db.select({ paid: forms.paid, payAmount: forms.payAmount }).from(forms).where(eq(forms.id, formId))
  if (!f || !f.paid || !f.payAmount) throw new Error("Form is not a paid form")

  const amount = Math.round(parseFloat(f.payAmount) * 100)

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error("Razorpay not configured")

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({ amount, currency: "INR", receipt: `f_${Date.now()}` }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Razorpay order creation failed: ${err}`)
  }

  const order = await res.json()

  const [p] = await db
    .insert(payments)
    .values({ formId, amount: f.payAmount, currency: "INR", razorpayOrderId: order.id, status: "created" })
    .returning()

  return { orderId: order.id, amount: order.amount, currency: order.currency, paymentId: p.id }
}

export async function verifyAndSubmitForm(
  formId: string,
  values: Record<string, unknown>,
  name: string | null | undefined,
  email: string | null | undefined,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
) {
  await requirePublicForm(formId)
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) throw new Error("Razorpay not configured")

  const body = razorpayOrderId + "|" + razorpayPaymentId
  const expectedSig = crypto.createHmac("sha256", keySecret).update(body).digest("hex")

  if (expectedSig !== razorpaySignature) throw new Error("Invalid payment signature")

  const [sub] = await db
    .insert(formSubmissions)
    .values({ formId, name: name || null, email: email || null, values })
    .returning()

  await db
    .update(payments)
    .set({
      submissionId: sub.id,
      razorpayPaymentId,
      razorpaySignature,
      status: "paid",
      name: name || null,
      email: email || null,
      updatedAt: new Date(),
    })
    .where(eq(payments.razorpayOrderId, razorpayOrderId))

  const [f] = await db.select({ name: forms.name, createdBy: forms.createdBy }).from(forms).where(eq(forms.id, formId))
  if (f?.createdBy) {
    await pushNotification({
      userId: f.createdBy,
      title: `New paid submission for "${f.name}"`,
      description: name ? `Submitted by ${name} (paid)` : "A new paid submission was received",
      icon: "FormInput",
      url: `/dashboard/forms/${formId}`,
    })
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { success: true, submission: sub }
}
