"use client"

import { useState, useEffect } from "react"
import { Bell, Calendar, MessageSquare, AlertCircle, Check, X, Loader2, Zap, PlusCircle } from "lucide-react"
import { Button, Input, Modal } from "./ui-components"

interface AddTriggerColumnModalProps {
  isOpen: boolean
  onClose: () => void
  columns: any[]
  onAdd: (name: string, dateColumnId: string, messageColumnId?: string, staticMessage?: string) => Promise<void>
}

export function AddTriggerColumnModal({ isOpen, onClose, columns, onAdd }: AddTriggerColumnModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [dateColumnId, setDateColumnId] = useState("")
  const [messageType, setMessageType] = useState<"column" | "static">("static")
  const [messageColumnId, setMessageColumnId] = useState("")
  const [staticMessage, setStaticMessage] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  // Force refresh columns when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened - available columns:", columns)
      console.log("Date columns found:", columns.filter(c => c.type === "date" || c.type === "Date"))
    }
  }, [isOpen, columns])

  // Get date columns - multiple type checks
  const dateColumns = columns.filter(c => {
    const colType = c.type?.toLowerCase()
    return colType === "date"
  })

  // Get text columns - multiple type checks  
  const textColumns = columns.filter(c => {
    const colType = c.type?.toLowerCase()
    return colType === "string" || colType === "text"
  })

  const validateStep1 = () => {
    if (!name.trim()) {
      setError("Please enter a trigger name")
      return false
    }
    if (!dateColumnId) {
      setError("Please select a date column")
      return false
    }
    setError("")
    return true
  }

  const validateStep2 = () => {
    if (messageType === "static" && !staticMessage.trim()) {
      setError("Please enter a message")
      return false
    }
    if (messageType === "column" && !messageColumnId) {
      setError("Please select a message column")
      return false
    }
    setError("")
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
    setError("")
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return
    
    const triggerName = name.trim()
    const triggerDateColId = dateColumnId
    const triggerMsgColId = messageType === "column" ? messageColumnId : undefined
    const triggerStaticMsg = messageType === "static" ? staticMessage : undefined

    setName("")
    setDateColumnId("")
    setMessageType("static")
    setMessageColumnId("")
    setStaticMessage("")
    setStep(1)
    onClose()

    await onAdd(triggerName, triggerDateColId, triggerMsgColId, triggerStaticMsg)
  }

  if (!isOpen) return null

  return (
    <Modal onClose={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold">Create Trigger Column</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full transition-all ${step >= 1 ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`flex-1 h-1 rounded-full transition-all ${step >= 2 ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Trigger Settings</span>
            <span>Message Settings</span>
          </div>
        </div>

        <div className="p-5">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Trigger Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Send Reminder"
                  className="w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">
                  When to trigger? <span className="text-red-500">*</span>
                </label>
                
                {dateColumns.length === 0 ? (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                          ⚠️ No Date Column Found!
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                          To create a Trigger column, you must first create a Date column.
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-2 font-medium">
                          Steps:
                        </p>
                        <ol className="text-xs text-red-700 dark:text-red-400 mt-1 list-decimal list-inside space-y-1">
                          <li>Close this modal</li>
                          <li>Go to "Schema" tab</li>
                          <li>Add a new column with type "Date" (e.g., "Event Date")</li>
                          <li>Then come back and add your Trigger column</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={dateColumnId}
                      onChange={(e) => setDateColumnId(e.target.value)}
                      className="w-full h-10 pl-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                    >
                      <option value="">-- Select a date column --</option>
                      {dateColumns.map(col => (
                        <option key={col.id} value={col.id}>
                          📅 {col.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {dateColumns.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {dateColumns.length} date column(s) found
                  </p>
                )}
              </div>

              {dateColumnId && name && dateColumns.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-green-700 mb-1">✓ Ready to continue</p>
                  <p className="text-sm">Your trigger will fire when the date in "{dateColumns.find(c => c.id === dateColumnId)?.name}" is reached.</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium block mb-2">
                  What message to send? <span className="text-red-500">*</span>
                </label>
                
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setMessageType("static")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      messageType === "static"
                        ? "bg-amber-500 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Static Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType("column")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      messageType === "column"
                        ? "bg-amber-500 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    From Column
                  </button>
                </div>

                {messageType === "static" ? (
                  <textarea
                    value={staticMessage}
                    onChange={(e) => setStaticMessage(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={4}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm resize-none"
                    autoFocus
                  />
                ) : (
                  <select
                    value={messageColumnId}
                    onChange={(e) => setMessageColumnId(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
                  >
                    <option value="">-- Select a text column --</option>
                    {textColumns.map(col => (
                      <option key={col.id} value={col.id}>
                        📝 {col.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {dateColumnId && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <p className="text-xs font-semibold text-amber-700 mb-2">📋 Trigger Summary</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Name:</span> {name}</p>
                    <p><span className="text-gray-500">Trigger on:</span> {dateColumns.find(c => c.id === dateColumnId)?.name}</p>
                    <p><span className="text-gray-500">Message:</span> {messageType === "static" ? (staticMessage || "Not set") : (textColumns.find(c => c.id === messageColumnId)?.name || "Not selected")}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-5 flex justify-between">
          {step === 2 ? (
            <>
              <Button variant="outline" onClick={handleBack}>← Back</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={adding || (messageType === "static" ? !staticMessage : !messageColumnId)} 
                className="bg-amber-500 hover:bg-amber-600"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {adding ? "Creating..." : "Create Trigger"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleNext} 
                disabled={!name.trim() || !dateColumnId || dateColumns.length === 0}
              >
                Next →
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}