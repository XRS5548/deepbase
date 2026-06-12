import { NextRequest } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { emailAccounts, emailLogs } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { sendEmail } from "@/lib/email-utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    const { to, subject, body } = await req.json()

    if (!subject?.trim()) {
      return errorResponse("Subject is required")
    }

    const recipients: string[] = Array.isArray(to)
      ? to
      : String(to || "").split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean)

    if (recipients.length === 0) {
      return errorResponse("At least one recipient is required")
    }

    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(and(eq(emailAccounts.id, id), eq(emailAccounts.userId, session.user.id)))

    if (!account) return errorResponse("Account not found", 404)

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const enqueue = (data: unknown) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"))
          } catch {}
        }

        enqueue({ type: "start", total: recipients.length, recipients })

        const smtp = {
          host: account.smtpHost,
          port: account.smtpPort,
          user: account.smtpUser,
          pass: account.smtpPass,
          useSSL: account.useSSL,
        }

        const allResults: { to: string; success: boolean; error?: string }[] = []

        for (const recipient of recipients) {
          const email = recipient.trim()

          enqueue({ type: "sending", current: email })

          try {
            await sendEmail(smtp, account.name, email, subject.trim(), body || "")
            allResults.push({ to: email, success: true })
            enqueue({ type: "result", current: email, success: true })
          } catch (e) {
            const error = e instanceof Error ? e.message : "Unknown error"
            allResults.push({ to: email, success: false, error })
            enqueue({ type: "result", current: email, success: false, error })
          }
        }

        for (const r of allResults) {
          try {
            await db.insert(emailLogs).values({
              accountId: id,
              fromEmail: account.email,
              toEmail: r.to,
              subject: subject.trim(),
              body: body || null,
              status: r.success ? "sent" : "failed",
              error: r.success ? null : (r.error || null),
            })
          } catch {}
        }

        enqueue({ type: "complete", sent: allResults.filter(r => r.success).length, failed: allResults.filter(r => !r.success).length })

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Failed to send email")
  }
}
