import { useState, useRef } from 'react'
import {
  Menu,
  FilePlus,
  FolderPlus,
  Save,
  Download,
  Upload,
  Settings,
  Search,
  Columns,
  Rows,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { useFileStore } from '@/stores/fileStore'
import { useSettingsStore } from '@/stores/settingsStore'
import {
  saveFiles,
  saveTabs,
  saveSplitConfig,
  exportWorkspace,
  downloadWorkspaceAsJson,
  importWorkspaceFromJson,
} from '@/services/localStorage'
import {
  initializeGoogleDrive,
  signIn,
  signOut,
  saveToGoogleDrive,
  loadFromGoogleDrive,
} from '@/services/googleDrive'

export function Toolbar() {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    files,
    tabs,
    splitConfig,
    addFile,
    openFile,
    saveTab,
    splitPane,
    setFiles,
    setTabs,
    setSplitConfig,
  } = useFileStore()

  const {
    settings,
    updateSettings,
    googleDrive,
    setGoogleDriveState,
    signOutGoogleDrive,
    toggleFindReplace,
    toggleSidebar,
  } = useSettingsStore()

  const getActiveTab = () => {
    const activePane = splitConfig.panes.find((p) => p.id === useFileStore.getState().activePaneId)
    return tabs.find((t) => t.id === activePane?.activeTabId)
  }

  const handleNewFile = () => {
    const newFile = addFile(null, `untitled-${Date.now()}.txt`, 'file')
    openFile(newFile.id)
  }

  const handleNewFolder = () => {
    addFile(null, `folder-${Date.now()}`, 'folder')
  }

  const handleSave = () => {
    const tab = getActiveTab()
    if (tab) saveTab(tab.id)
  }

  const handleSaveAll = async () => {
    // Save all dirty tabs
    tabs.filter((t) => t.isDirty).forEach((t) => saveTab(t.id))
    // Persist to IndexedDB
    await saveFiles(files)
    await saveTabs(tabs)
    await saveSplitConfig(splitConfig)
  }

  const handleExport = () => {
    const workspace = exportWorkspace(files, tabs, settings)
    downloadWorkspaceAsJson(workspace)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const workspace = await importWorkspaceFromJson(file)
    if (workspace) {
      setFiles(workspace.files)
      setTabs(workspace.tabs)
      if (workspace.settings) {
        updateSettings(workspace.settings)
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const initialized = await initializeGoogleDrive()
      if (!initialized) {
        alert('Google Drive API not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY.')
        return
      }

      const user = await signIn()
      setGoogleDriveState({
        isAuthenticated: true,
        user,
      })
    } catch (error) {
      console.error('Google sign in failed:', error)
      alert('Sign in failed. Please try again.')
    }
  }

  const handleGoogleSignOut = () => {
    signOut()
    signOutGoogleDrive()
  }

  const handleSaveToCloud = async () => {
    if (!googleDrive.isAuthenticated) {
      await handleGoogleSignIn()
      if (!useSettingsStore.getState().googleDrive.isAuthenticated) return
    }

    setIsSyncing(true)
    try {
      const workspace = exportWorkspace(files, tabs, settings)
      await saveToGoogleDrive(workspace)
      setGoogleDriveState({ lastSyncTime: Date.now() })
      alert('Saved to Google Drive!')
    } catch (error) {
      console.error('Failed to save to Google Drive:', error)
      alert('Failed to save to Google Drive. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleLoadFromCloud = async () => {
    if (!googleDrive.isAuthenticated) {
      await handleGoogleSignIn()
      if (!useSettingsStore.getState().googleDrive.isAuthenticated) return
    }

    setIsSyncing(true)
    try {
      const workspace = await loadFromGoogleDrive()
      if (workspace) {
        setFiles(workspace.files)
        setTabs(workspace.tabs)
        if (workspace.settings) {
          updateSettings(workspace.settings)
        }
        setGoogleDriveState({ lastSyncTime: Date.now() })
        alert('Loaded from Google Drive!')
      } else {
        alert('No workspace found in Google Drive.')
      }
    } catch (error) {
      console.error('Failed to load from Google Drive:', error)
      alert('Failed to load from Google Drive. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-2 py-1 bg-editor-sidebar border-b border-editor-border">
      <div className="flex items-center gap-1">
        <button
          className="p-2 hover:bg-editor-hover rounded"
          onClick={toggleSidebar}
          title="Toggle Sidebar (Ctrl+B)"
        >
          <Menu size={18} className="text-editor-text" />
        </button>

        <div className="w-px h-5 bg-editor-border mx-1" />

        <button
          className="p-2 hover:bg-editor-hover rounded"
          onClick={handleNewFile}
          title="New File (Ctrl+N)"
        >
          <FilePlus size={18} className="text-editor-text" />
        </button>

        <button
          className="p-2 hover:bg-editor-hover rounded"
          onClick={handleNewFolder}
          title="New Folder"
        >
          <FolderPlus size={18} className="text-editor-text" />
        </button>

        <button
          className="p-2 hover:bg-editor-hover rounded"
          onClick={handleSave}
          title="Save (Ctrl+S)"
        >
          <Save size={18} className="text-editor-text" />
        </button>

        <div className="w-px h-5 bg-editor-border mx-1" />

        <button
          className="p-2 hover:bg-editor-hover rounded"
          onClick={toggleFindReplace}
          title="Find & Replace (Ctrl+F)"
        >
          <Search size={18} className="text-editor-text" />
        </button>

        <div className="w-px h-5 bg-editor-border mx-1" />

        <button
          className="p-2 hover:bg-editor-hover rounded"
          onClick={() => splitPane('vertical')}
          title="Split Vertically (Ctrl+\)"
        >
          <Columns size={18} className="text-editor-text" />
        </button>

        <button
          className="p-2 hover:bg-editor-hover rounded"
          onClick={() => splitPane('horizontal')}
          title="Split Horizontally"
        >
          <Rows size={18} className="text-editor-text" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {/* Google Drive */}
        <div className="flex items-center gap-1">
          {googleDrive.isAuthenticated ? (
            <>
              <button
                className="p-2 hover:bg-editor-hover rounded"
                onClick={handleSaveToCloud}
                disabled={isSyncing}
                title="Save to Google Drive"
              >
                {isSyncing ? (
                  <RefreshCw size={18} className="text-editor-text animate-spin" />
                ) : (
                  <Cloud size={18} className="text-editor-accent" />
                )}
              </button>
              <button
                className="p-2 hover:bg-editor-hover rounded"
                onClick={handleLoadFromCloud}
                disabled={isSyncing}
                title="Load from Google Drive"
              >
                <Download size={18} className="text-editor-text" />
              </button>
              <button
                className="p-2 hover:bg-editor-hover rounded"
                onClick={handleGoogleSignOut}
                title={`Sign out (${googleDrive.user?.email})`}
              >
                <LogOut size={18} className="text-editor-text" />
              </button>
            </>
          ) : (
            <button
              className="p-2 hover:bg-editor-hover rounded"
              onClick={handleGoogleSignIn}
              title="Sign in with Google"
            >
              <LogIn size={18} className="text-editor-text" />
            </button>
          )}
        </div>

        <div className="w-px h-5 bg-editor-border mx-1" />

        {/* Import/Export */}
        <button
          className="p-2 hover:bg-editor-hover rounded"
          onClick={handleExport}
          title="Export Workspace"
        >
          <Download size={18} className="text-editor-text" />
        </button>

        <label className="p-2 hover:bg-editor-hover rounded cursor-pointer" title="Import Workspace">
          <Upload size={18} className="text-editor-text" />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </label>

        <div className="w-px h-5 bg-editor-border mx-1" />

        {/* Settings */}
        <div className="relative">
          <button
            className="p-2 hover:bg-editor-hover rounded"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            title="Settings"
          >
            <Settings size={18} className="text-editor-text" />
          </button>

          {showSettingsMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSettingsMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 bg-editor-sidebar border border-editor-border rounded shadow-lg py-2 min-w-[200px]">
                <div className="px-3 py-1 text-xs text-editor-text-muted uppercase">
                  Theme
                </div>
                {(['vs-dark', 'vs', 'hc-black'] as const).map((theme) => (
                  <button
                    key={theme}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-editor-hover ${settings.theme === theme ? 'text-editor-accent' : 'text-editor-text'}`}
                    onClick={() => updateSettings({ theme })}
                  >
                    {theme === 'vs-dark' ? 'Dark' : theme === 'vs' ? 'Light' : 'High Contrast'}
                  </button>
                ))}

                <div className="border-t border-editor-border my-2" />

                <div className="px-3 py-1 text-xs text-editor-text-muted uppercase">
                  Font Size
                </div>
                <div className="px-3 py-1.5 flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={settings.fontSize}
                    onChange={(e) =>
                      updateSettings({ fontSize: parseInt(e.target.value) })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-editor-text w-8">
                    {settings.fontSize}
                  </span>
                </div>

                <div className="border-t border-editor-border my-2" />

                <label className="flex items-center justify-between px-3 py-1.5 hover:bg-editor-hover cursor-pointer">
                  <span className="text-sm text-editor-text">Minimap</span>
                  <input
                    type="checkbox"
                    checked={settings.minimap}
                    onChange={(e) => updateSettings({ minimap: e.target.checked })}
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between px-3 py-1.5 hover:bg-editor-hover cursor-pointer">
                  <span className="text-sm text-editor-text">Word Wrap</span>
                  <input
                    type="checkbox"
                    checked={settings.wordWrap === 'on'}
                    onChange={(e) =>
                      updateSettings({ wordWrap: e.target.checked ? 'on' : 'off' })
                    }
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between px-3 py-1.5 hover:bg-editor-hover cursor-pointer">
                  <span className="text-sm text-editor-text">Auto Save</span>
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                    className="rounded"
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
