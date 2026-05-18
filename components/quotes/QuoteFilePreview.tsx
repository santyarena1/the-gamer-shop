"use client"

import { useEffect } from "react"

export function isPdfFile(mimeType?: string | null, fileName?: string | null) {
  if (mimeType === "application/pdf") return true
  return !!fileName?.toLowerCase().endsWith(".pdf")
}

export function isImageFile(mimeType?: string | null, fileName?: string | null) {
  if (mimeType?.startsWith("image/")) return true
  const ext = fileName?.split(".").pop()?.toLowerCase()
  return ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp" || ext === "gif"
}

type PreviewTarget = {
  url: string
  fileName: string
  mimeType?: string | null
}

function shortName(name: string, max = 14) {
  if (name.length <= max) return name
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : ""
  const base = name.slice(0, name.length - ext.length)
  return `${base.slice(0, max - ext.length - 1)}…${ext}`
}

function PdfMiniPreview({ url }: { url: string }) {
  return (
    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md border border-white/15 bg-white">
      <iframe
        src={`${url}#toolbar=0&navpanes=0`}
        title="Vista previa PDF"
        className="absolute top-0 left-0 h-[140px] w-[112px] origin-top-left scale-[0.57] border-0 pointer-events-none"
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent py-0.5">
        <span className="text-[8px] font-bold text-red-600 bg-white/95 px-1 rounded">PDF</span>
      </div>
    </div>
  )
}

function GenericFileMini({ fileName }: { fileName: string }) {
  return (
    <div className="h-20 w-16 shrink-0 flex flex-col items-center justify-center gap-1 rounded-md border border-white/15 bg-[#141414] p-1">
      <span className="text-xl leading-none">📄</span>
      <span className="text-[8px] text-white/50 text-center leading-tight line-clamp-2 w-full">
        {shortName(fileName, 12)}
      </span>
    </div>
  )
}

export function QuoteFileThumb({
  url,
  fileName,
  mimeType,
  onOpen,
  className = "",
}: {
  url: string
  fileName: string
  mimeType?: string | null
  onOpen: () => void
  className?: string
}) {
  const pdf = isPdfFile(mimeType, fileName)
  const image = isImageFile(mimeType, fileName)

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`Ver ${fileName}`}
      className={`group rounded-lg overflow-hidden border border-white/10 bg-[#0f0f0f] hover:border-green-500/40 transition-colors ${className}`}
    >
      {image ? (
        <img src={url} alt={fileName} className="h-20 w-20 object-cover" />
      ) : pdf ? (
        <PdfMiniPreview url={url} />
      ) : (
        <GenericFileMini fileName={fileName} />
      )}
      <span className="block max-w-[80px] truncate px-1 py-0.5 text-[9px] text-white/40 group-hover:text-white/60">
        {shortName(fileName)}
      </span>
    </button>
  )
}

export function QuoteFilePreviewModal({
  file,
  onClose,
}: {
  file: PreviewTarget | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!file) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [file, onClose])

  if (!file) return null

  const pdf = isPdfFile(file.mimeType, file.fileName)
  const image = isImageFile(file.mimeType, file.fileName)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={file.fileName}
    >
      <div
        className="flex w-full max-w-4xl max-h-[92vh] flex-col rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 className="truncate text-sm font-semibold">{file.fileName}</h2>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={file.url}
              download={file.fileName}
              className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-green-400"
            >
              Descargar
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xl text-white/40 hover:text-white"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {pdf && (
            <iframe
              src={file.url}
              title={file.fileName}
              className="h-[min(70vh,720px)] w-full rounded-lg border border-white/10 bg-white"
            />
          )}
          {image && (
            <img
              src={file.url}
              alt={file.fileName}
              className="mx-auto max-h-[min(70vh,720px)] max-w-full rounded-lg border border-white/10"
            />
          )}
          {!pdf && !image && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <span className="text-4xl">📎</span>
              <p className="text-sm text-white/50">Vista previa no disponible para este tipo de archivo.</p>
              <a
                href={file.url}
                download={file.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-400"
              >
                Descargar archivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
