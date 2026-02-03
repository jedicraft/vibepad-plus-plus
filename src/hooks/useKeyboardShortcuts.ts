import { useEffect, useCallback } from 'react'
import { useFileStore } from '@/stores/fileStore'
import { useSettingsStore } from '@/stores/settingsStore'

interface ShortcutHandler {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts() {
  const {
    tabs,
    splitConfig,
    activePaneId,
    saveTab,
    closeTab,
    addFile,
    openFile,
    splitPane,
  } = useFileStore()

  const { toggleFindReplace, toggleSidebar } = useSettingsStore()

  const getActiveTab = useCallback(() => {
    const activePane = splitConfig.panes.find((p) => p.id === activePaneId)
    if (!activePane?.activeTabId) return null
    return tabs.find((t) => t.id === activePane.activeTabId)
  }, [splitConfig, activePaneId, tabs])

  const shortcuts: ShortcutHandler[] = [
    {
      key: 's',
      ctrl: true,
      action: () => {
        const tab = getActiveTab()
        if (tab) saveTab(tab.id)
      },
      description: 'Save current file',
    },
    {
      key: 'n',
      ctrl: true,
      action: () => {
        const newFile = addFile(null, `untitled-${Date.now()}.txt`, 'file')
        openFile(newFile.id)
      },
      description: 'Create new file',
    },
    {
      key: 'w',
      ctrl: true,
      action: () => {
        const tab = getActiveTab()
        if (tab) closeTab(tab.id)
      },
      description: 'Close current tab',
    },
    {
      key: 'f',
      ctrl: true,
      action: toggleFindReplace,
      description: 'Find and replace',
    },
    {
      key: 'h',
      ctrl: true,
      action: toggleFindReplace,
      description: 'Find and replace (alternate)',
    },
    {
      key: 'b',
      ctrl: true,
      action: toggleSidebar,
      description: 'Toggle sidebar',
    },
    {
      key: '\\',
      ctrl: true,
      action: () => splitPane('vertical'),
      description: 'Split editor vertically',
    },
    {
      key: '-',
      ctrl: true,
      shift: true,
      action: () => splitPane('horizontal'),
      description: 'Split editor horizontally',
    },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // Allow Escape to close dialogs
        if (e.key !== 'Escape') return
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.alt ? e.altKey : !e.altKey
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault()
          shortcut.action()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])

  return { shortcuts }
}

export function getShortcutLabel(shortcut: {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
}): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const parts: string[] = []

  if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl')
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift')
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt')
  parts.push(shortcut.key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}
