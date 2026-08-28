'use client'

import { useEffect, ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-2xl bg-[#09110d]/90 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl shadow-black/80 p-4 sm:p-6 glow-emerald-sm overflow-hidden">
        {/* Subtle emerald accent top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent flex-shrink-0" />
        
        <div className="flex items-center justify-between mb-3.5 sm:mb-5 flex-shrink-0">
          <h2 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
