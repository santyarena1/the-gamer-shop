"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { QuoteFilePreviewModal, QuoteFileThumb } from "@/components/quotes/QuoteFilePreview"

type Props = {
  textareaName?: string
  rows?: number
  placeholder?: string
  showFilePicker?: boolean
  fileInputId?: string
}

function formHasSubmittableContent(form: HTMLFormElement, extraFiles: File[]): boolean {
  if (extraFiles.length > 0) return true

  const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
  )

  for (const el of fields) {
    if (el instanceof HTMLInputElement && el.type === "file") {
      if (el.files && el.files.length > 0) return true
      continue
    }
    if (el.value.trim()) return true
  }
  return false
}

function fileFromClipboardItem(item: DataTransferItem, index: number) {
  const blob = item.getAsFile()
  if (!blob) return null
  const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png"
  const name = blob.name || `imagen-pegada-${Date.now()}-${index}.${ext}`
  return new File([blob], name, { type: blob.type })
}

export default function QuoteComposer({
  textareaName = "body",
  rows = 2,
  placeholder = "Escribí un mensaje... Podés pegar imágenes con Ctrl+V.",
  showFilePicker = true,
  fileInputId = "quote-file-input",
}: Props) {
  const [attachments, setAttachments] = useState<File[]>([])
  const [preview, setPreview] = useState<{ url: string; fileName: string; mimeType: string } | null>(null)
  const objectUrlsRef = useRef<Map<File, string>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  function getObjectUrl(file: File) {
    let url = objectUrlsRef.current.get(file)
    if (!url) {
      url = URL.createObjectURL(file)
      objectUrlsRef.current.set(file, url)
    }
    return url
  }

  useEffect(() => {
    const urls = objectUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => f.size > 0)
    if (valid.length === 0) return
    setAttachments((prev) => [...prev, ...valid])
  }, [])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items
      if (!items) return

      const pasted: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = fileFromClipboardItem(item, i)
          if (file) pasted.push(file)
        }
      }

      if (pasted.length > 0) {
        e.preventDefault()
        addFiles(pasted)
      }
    },
    [addFiles],
  )

  useEffect(() => {
    const form = containerRef.current?.closest("form")
    if (!form) return

    const onSubmit = () => {
      const existing = form.querySelectorAll('input[name="files"]')
      existing.forEach((el) => el.remove())

      attachments.forEach((file) => {
        const input = document.createElement("input")
        input.type = "file"
        input.name = "files"
        input.hidden = true
        const dt = new DataTransfer()
        dt.items.add(file)
        input.files = dt.files
        form.appendChild(input)
      })
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return

      const target = e.target
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return

      if (target instanceof HTMLInputElement) {
        const type = target.type.toLowerCase()
        if (["hidden", "submit", "button", "file", "checkbox", "radio"].includes(type)) return
        if (!["text", "tel", "email", "search", "url", "number", "password", ""].includes(type)) return
      }

      if (!formHasSubmittableContent(form, attachments)) return

      if (target instanceof HTMLTextAreaElement) e.preventDefault()
      else if (target instanceof HTMLInputElement) e.preventDefault()

      form.requestSubmit()
    }

    form.addEventListener("submit", onSubmit)
    form.addEventListener("keydown", onKeyDown)
    return () => {
      form.removeEventListener("submit", onSubmit)
      form.removeEventListener("keydown", onKeyDown)
    }
  }, [attachments])

  function removeAt(index: number) {
    setAttachments((prev) => {
      const removed = prev[index]
      if (removed) {
        const url = objectUrlsRef.current.get(removed)
        if (url) {
          URL.revokeObjectURL(url)
          objectUrlsRef.current.delete(removed)
        }
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <textarea
        name={textareaName}
        rows={rows}
        placeholder={placeholder}
        onPaste={handlePaste}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
      />
      <p className="text-[10px] text-white/35">
        Enter para enviar · Shift+Enter nueva línea · Ctrl+V para pegar imágenes
      </p>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, i) => (
            <div key={`${file.name}-${i}-${file.size}`} className="relative">
              <QuoteFileThumb
                url={getObjectUrl(file)}
                fileName={file.name}
                mimeType={file.type}
                onOpen={() =>
                  setPreview({
                    url: getObjectUrl(file),
                    fileName: file.name,
                    mimeType: file.type,
                  })
                }
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-0.5 right-0.5 z-10 w-5 h-5 rounded bg-black/70 text-white text-xs leading-none opacity-90 hover:bg-red-500/80"
                title="Quitar"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <QuoteFilePreviewModal file={preview} onClose={() => setPreview(null)} />

      {showFilePicker && (
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <input
            id={fileInputId}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,image/*"
            className="text-xs text-white/50 file:mr-2 file:py-1 file:px-2 file:rounded file:bg-white/10 file:text-white/70 max-w-[240px]"
            onChange={(e) => {
              const list = e.target.files
              if (list?.length) {
                addFiles(Array.from(list))
                e.target.value = ""
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
