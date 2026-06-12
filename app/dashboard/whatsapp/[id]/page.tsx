"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Send, Loader2, Check, CheckCheck, Phone, Video, Search, LogOut } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type WaAccount = {
  id: string
  name: string
  phone: string | null
  status: string
}

type Chat = {
  id: string
  name: string
  lastMessage: string
  unread: number
  timestamp: number
}

type Message = {
  id: string
  fromMe: boolean
  body: string
  timestamp: number
}

export default function WAChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [account, setAccount] = useState<WaAccount | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)
  const msgEndRef = useRef<HTMLDivElement>(null)
  const chatsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/wa/accounts/${id}`)
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((data) => {
        setAccount(data)
        if (data.status !== "connected") {
          toast.error("WhatsApp is not connected")
          router.push("/dashboard/whatsapp")
          return
        }
        loadChats()
      })
      .catch(() => { toast.error("Failed to load account"); router.push("/dashboard/whatsapp") })
      .finally(() => setLoading(false))
  }, [id, router])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch(`/api/wa/accounts/${id}/chats`)
      if (!res.ok) throw new Error()
      setChats(await res.json())
    } catch {}
  }, [id])

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/wa/accounts/${id}/chats/${encodeURIComponent(chatId)}/messages`)
      if (!res.ok) throw new Error()
      setMessages(await res.json())
    } catch {}
  }, [id])

  // Poll chats every 5s
  useEffect(() => {
    if (account?.status !== "connected") return
    loadChats()
    const interval = setInterval(loadChats, 5000)
    return () => clearInterval(interval)
  }, [account, loadChats])

  // Poll messages every 3s for selected chat
  useEffect(() => {
    if (!selectedChat) return
    const interval = setInterval(() => loadMessages(selectedChat), 3000)
    return () => clearInterval(interval)
  }, [selectedChat, loadMessages])

  const handleSelectChat = async (chatId: string) => {
    setSelectedChat(chatId)
    setShowSidebar(false)
    await loadMessages(chatId)
  }

  const handleSend = async () => {
    if (!messageText.trim() || !selectedChat) return
    setSending(true)
    try {
      const res = await fetch(`/api/wa/accounts/${id}/chats/${encodeURIComponent(selectedChat)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText.trim() }),
      })
      if (!res.ok) throw new Error()
      setMessageText("")
      await loadMessages(selectedChat)
      loadChats()
    } catch { toast.error("Failed to send") }
    finally { setSending(false) }
  }

  const handleDisconnect = async () => {
    if (!confirm("Disconnect WhatsApp?")) return
    try {
      await fetch(`/api/wa/accounts/${id}/disconnect`, { method: "POST" })
      toast.success("Disconnected")
      router.push("/dashboard/whatsapp")
    } catch { toast.error("Failed to disconnect") }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedChatData = chats.find((c) => c.id === selectedChat)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading chats...</p>
        </div>
      </div>
    )
  }

  if (!account) return null

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Link href="/dashboard/whatsapp" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{account.name}</p>
            <p className="text-xs text-emerald-500">Connected</p>
          </div>
        </div>
        <button onClick={handleDisconnect} className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Disconnect">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat sidebar */}
        <div className={`${showSidebar ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-border bg-card shrink-0`}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats..."
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No chats found</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedChat === chat.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-medium">
                    {chat.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{chat.name}</p>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {chat.timestamp ? new Date(chat.timestamp * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || "No messages yet"}</p>
                      {chat.unread > 0 && (
                        <span className="text-xs bg-emerald-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center shrink-0">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 flex-col`}>
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
                <button className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all" onClick={() => setShowSidebar(true)}>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-medium">
                  {selectedChatData?.name.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedChatData?.name || "Chat"}</p>
                </div>
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Video className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 bg-[var(--wa-bg)]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.fromMe
                            ? "bg-emerald-500 text-white rounded-br-md"
                            : "bg-card border border-border text-foreground rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${msg.fromMe ? "" : ""}`}>
                          <span className={`text-[10px] ${msg.fromMe ? "text-white/70" : "text-muted-foreground"}`}>
                            {new Date(msg.timestamp * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.fromMe && <CheckCheck className="w-3 h-3 text-white/70" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={msgEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card shrink-0">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 h-10"
                />
                <Button onClick={handleSend} disabled={sending || !messageText.trim()} size="icon" className="h-10 w-10 shrink-0">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-1">WhatsApp Chat</p>
                <p className="text-sm">Select a chat to start messaging</p>
                <button className="md:hidden mt-4 text-sm text-primary underline" onClick={() => setShowSidebar(true)}>
                  Show chats
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
