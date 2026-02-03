import type { editor } from 'monaco-editor'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  language?: string
  children?: FileNode[]
  parentId: string | null
  isExpanded?: boolean
  createdAt: number
  updatedAt: number
}

export interface Tab {
  id: string
  fileId: string
  name: string
  language: string
  content: string
  isDirty: boolean
  cursorPosition?: { lineNumber: number; column: number }
  scrollPosition?: { scrollTop: number; scrollLeft: number }
}

export interface EditorPane {
  id: string
  tabIds: string[]
  activeTabId: string | null
}

export interface SplitConfig {
  direction: 'horizontal' | 'vertical'
  panes: EditorPane[]
}

export interface FindOptions {
  searchText: string
  replaceText: string
  matchCase: boolean
  matchWholeWord: boolean
  useRegex: boolean
  searchInAllFiles: boolean
}

export interface FindMatch {
  fileId: string
  fileName: string
  lineNumber: number
  column: number
  lineContent: string
  matchLength: number
}

export interface EditorSettings {
  theme: 'vs-dark' | 'vs' | 'hc-black'
  fontSize: number
  tabSize: number
  wordWrap: 'on' | 'off' | 'wordWrapColumn'
  minimap: boolean
  lineNumbers: 'on' | 'off' | 'relative'
  autoSave: boolean
  autoSaveInterval: number
  syncScrolling: boolean
}

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
}

export interface GoogleDriveState {
  isAuthenticated: boolean
  user: {
    name: string
    email: string
    picture?: string
  } | null
  syncEnabled: boolean
  lastSyncTime: number | null
  syncInterval: number
}

export type MonacoEditor = editor.IStandaloneCodeEditor

export interface WorkspaceExport {
  version: number
  files: FileNode[]
  tabs: Tab[]
  settings: EditorSettings
  exportedAt: number
}
