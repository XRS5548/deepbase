import { Client, LocalAuth } from "whatsapp-web.js"
import { db } from "@/db"
import { waAccounts } from "@/db/schema"
import { eq } from "drizzle-orm"

export type ConnectionResult =
  | { type: "qr"; qr: string }
  | { type: "connected" }
  | { type: "error"; error: string }

class WAManager {
  private clients = new Map<string, Client>()
  private connecting = new Set<string>()

  async connect(accountId: string): Promise<ConnectionResult> {
    if (this.connecting.has(accountId)) {
      return { type: "error", error: "Already connecting" }
    }
    if (this.clients.has(accountId)) {
      return { type: "connected" }
    }

    this.connecting.add(accountId)

    try {
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: accountId }),
        puppeteer: {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
          executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        },
      })

      const result = await new Promise<ConnectionResult>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ type: "error", error: "Connection timeout" })
        }, 90000)

        client.on("qr", (qr) => {
          clearTimeout(timeout)
          resolve({ type: "qr", qr })
        })

        client.on("ready", async () => {
          clearTimeout(timeout)
          try {
            await db.update(waAccounts).set({ status: "connected", updatedAt: new Date() }).where(eq(waAccounts.id, accountId))
          } catch {}
          resolve({ type: "connected" })
        })

        client.on("disconnected", async () => {
          try {
            await db.update(waAccounts).set({ status: "disconnected", updatedAt: new Date() }).where(eq(waAccounts.id, accountId))
          } catch {}
          this.clients.delete(accountId)
        })

        client.on("auth_failure", (msg) => {
          clearTimeout(timeout)
          resolve({ type: "error", error: msg || "Authentication failed" })
        })

        client.initialize().catch((err) => {
          clearTimeout(timeout)
          resolve({ type: "error", error: err.message || "Failed to initialize" })
        })
      })

      if (result.type === "connected") {
        this.clients.set(accountId, client)
      } else if (result.type === "qr") {
        this.clients.set(accountId, client)
      }

      return result
    } finally {
      this.connecting.delete(accountId)
    }
  }

  getClient(accountId: string): Client | undefined {
    return this.clients.get(accountId)
  }

  async disconnect(accountId: string) {
    const client = this.clients.get(accountId)
    if (client) {
      try { await client.destroy() } catch {}
      this.clients.delete(accountId)
    }
    try {
      await db.update(waAccounts).set({ status: "disconnected", updatedAt: new Date() }).where(eq(waAccounts.id, accountId))
    } catch {}
  }

  async getChats(accountId: string) {
    const client = this.clients.get(accountId)
    if (!client) throw new Error("WhatsApp not connected")
    const chats = await client.getChats()
    return chats.map((c) => ({
      id: c.id._serialized,
      name: c.name || c.id.user || "Unknown",
      lastMessage: c.lastMessage?.body || "",
      unread: c.unreadCount,
      timestamp: c.timestamp,
    }))
  }

  async getMessages(accountId: string, chatId: string) {
    const client = this.clients.get(accountId)
    if (!client) throw new Error("WhatsApp not connected")
    const chat = await client.getChatById(chatId)
    const msgs = await chat.fetchMessages({ limit: 100 })
    return msgs.reverse().map((m) => ({
      id: m.id._serialized,
      fromMe: m.fromMe,
      body: m.body,
      timestamp: m.timestamp,
    }))
  }

  async sendMessage(accountId: string, chatId: string, message: string) {
    const client = this.clients.get(accountId)
    if (!client) throw new Error("WhatsApp not connected")
    const chat = await client.getChatById(chatId)
    return chat.sendMessage(message)
  }

  async sendBulk(accountId: string, recipients: string[], message: string) {
    if (recipients.length > 7) {
      throw new Error("Maximum 7 recipients allowed for bulk messaging")
    }
    const client = this.clients.get(accountId)
    if (!client) throw new Error("WhatsApp not connected")

    const results: { phone: string; success: boolean; error?: string }[] = []

    for (const phone of recipients) {
      const p = phone.trim().replace(/[^0-9]/g, "")
      if (!p) {
        results.push({ phone, success: false, error: "Invalid phone number" })
        continue
      }
      try {
        const chatId = `${p}@c.us`
        await client.sendMessage(chatId, message)
        results.push({ phone, success: true })
      } catch (e) {
        results.push({ phone, success: false, error: e instanceof Error ? e.message : "Failed" })
      }
    }

    return results
  }
}

export const waManager = new WAManager()
