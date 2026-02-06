import { useState, useEffect } from 'react'
import { FileCode2, X } from 'lucide-react'

interface SplashScreenProps {
  onAccept: () => void
  onClose?: () => void
  mode?: 'license' | 'about'
}

const LICENSE_TEXT = `
VIBEPAD++ END USER LICENSE AGREEMENT

By clicking "I Accept" below, you agree to the following terms:

1. LICENSE GRANT
   This software is provided for personal and commercial use. You may use,
   modify, and distribute this software freely.

2. DISCLAIMER OF WARRANTIES
   This software is provided "AS IS" without warranty of any kind, express
   or implied. The authors are not liable for any damages arising from the
   use of this software.

3. DATA STORAGE
   Vibepad++ stores your files locally in your browser's IndexedDB storage.
   Your data remains on your device unless you choose to sync with Google Drive.

4. PRIVACY
   We do not collect, store, or transmit any personal data. All files and
   settings remain local to your browser.

5. OPEN SOURCE
   This software is open source. You are free to view, modify, and contribute
   to the source code.

Copyright (c) 2024 Vibepad++ Contributors
`.trim()

export function SplashScreen({ onAccept, onClose, mode = 'license' }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(mode === 'about')

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10
    if (isAtBottom) {
      setHasScrolledToBottom(true)
    }
  }

  const handleAccept = () => {
    localStorage.setItem('vibepad-license-accepted', 'true')
    setIsVisible(false)
    onAccept()
  }

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  useEffect(() => {
    if (mode === 'license') {
      const accepted = localStorage.getItem('vibepad-license-accepted')
      if (accepted === 'true') {
        setIsVisible(false)
        onAccept()
      }
    }
  }, [onAccept, mode])

  if (!isVisible) return null

  const isAboutMode = mode === 'about'

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
      <div className="bg-editor-sidebar border border-editor-border rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-editor-accent to-blue-600 p-6 text-center relative">
          {isAboutMode && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          )}
          <div className="flex items-center justify-center gap-3 mb-2">
            <FileCode2 size={48} className="text-white" />
            <h1 className="text-4xl font-bold text-white">Vibepad++</h1>
          </div>
          <p className="text-blue-100 text-lg">A Modern Code Editor for the Web</p>
          <p className="text-blue-200 text-sm mt-1">Version 1.0.2</p>
        </div>

        {/* License Content */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-editor-text mb-3">
            {isAboutMode ? 'About & License' : 'License Agreement'}
          </h2>
          <div
            className="bg-editor-bg border border-editor-border rounded p-4 h-64 overflow-y-auto text-sm text-editor-text-muted font-mono whitespace-pre-wrap"
            onScroll={handleScroll}
          >
            {LICENSE_TEXT}
          </div>
          {!isAboutMode && !hasScrolledToBottom && (
            <p className="text-xs text-editor-text-muted mt-2 text-center">
              Please scroll to read the entire license agreement
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-editor-border p-4 flex justify-end gap-3">
          {isAboutMode ? (
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded font-medium transition-colors bg-editor-accent text-white hover:bg-blue-600"
            >
              Close
            </button>
          ) : (
            <button
              onClick={handleAccept}
              disabled={!hasScrolledToBottom}
              className={`
                px-6 py-2 rounded font-medium transition-colors
                ${hasScrolledToBottom
                  ? 'bg-editor-accent text-white hover:bg-blue-600'
                  : 'bg-editor-border text-editor-text-muted cursor-not-allowed'
                }
              `}
            >
              I Accept
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
