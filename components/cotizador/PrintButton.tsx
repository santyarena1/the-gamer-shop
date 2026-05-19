"use client"

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden fixed bottom-6 right-6 px-4 py-2 bg-black text-white rounded-lg text-sm shadow-lg md:hidden"
    >
      Imprimir
    </button>
  )
}
