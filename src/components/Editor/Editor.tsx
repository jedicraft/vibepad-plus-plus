import { useRef, useCallback } from 'react'
import MonacoEditor, { OnMount, OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useFileStore } from '@/stores/fileStore'
import { useSettingsStore } from '@/stores/settingsStore'

interface EditorProps {
  tabId: string
  paneId: string
}

export function Editor({ tabId, paneId }: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const tab = useFileStore((state) => state.tabs.find((t) => t.id === tabId))
  const updateTabContent = useFileStore((state) => state.updateTabContent)
  const setActivePane = useFileStore((state) => state.setActivePane)
  const settings = useSettingsStore((state) => state.settings)

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
    editor.focus()
  }, [])

  const handleEditorChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        updateTabContent(tabId, value)
      }
    },
    [tabId, updateTabContent]
  )

  const handleFocus = useCallback(() => {
    setActivePane(paneId)
  }, [paneId, setActivePane])

  if (!tab) {
    return (
      <div className="flex-1 flex items-center justify-center text-editor-text-muted">
        No file selected
      </div>
    )
  }

  return (
    <div className="flex-1 h-full" onFocus={handleFocus}>
      <MonacoEditor
        height="100%"
        language={tab.language}
        value={tab.content}
        theme={settings.theme}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        options={{
          fontSize: settings.fontSize,
          tabSize: settings.tabSize,
          wordWrap: settings.wordWrap,
          minimap: { enabled: settings.minimap },
          lineNumbers: settings.lineNumbers,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 8 },
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
        }}
      />
    </div>
  )
}
