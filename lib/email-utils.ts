import nodemailer from "nodemailer"

export type SmtpConfig = {
  host: string
  port: number
  user: string
  pass: string
  useSSL: boolean
}

export type SendResult = { to: string; success: true } | { to: string; success: false; error: string }

function validateEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
}

export async function sendEmail(
  smtp: SmtpConfig,
  from: string,
  to: string,
  subject: string,
  body: string,
) {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.useSSL,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  await transporter.sendMail({
    from: `"${from}" <${smtp.user}>`,
    to,
    subject,
    text: body,
  })
}

export async function sendBulkEmails(
  smtp: SmtpConfig,
  from: string,
  recipients: string[],
  subject: string,
  body: string,
): Promise<SendResult[]> {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.useSSL,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const results: SendResult[] = []

  for (const to of recipients) {
    const email = to.trim()
    if (!email || !validateEmail(email)) {
      results.push({ to: email, success: false, error: "Invalid email address" })
      continue
    }
    try {
      await transporter.sendMail({
        from: `"${from}" <${smtp.user}>`,
        to: email,
        subject,
        text: body,
      })
      results.push({ to: email, success: true })
    } catch (e) {
      results.push({ to: email, success: false, error: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return results
}
