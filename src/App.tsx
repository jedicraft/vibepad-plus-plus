import { useEffect, useState, useCallback } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useFileStore } from '@/stores/fileStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import {
  loadFiles,
  loadTabs,
  loadSettings,
  loadSplitConfig,
  saveFiles,
  saveTabs,
  saveSplitConfig,
  autoSaveManager,
} from '@/services/localStorage'
import { Toolbar } from '@/components/Toolbar'
import { FileTree } from '@/components/FileTree'
import { SplitPane } from '@/components/SplitPane'
import { FindReplace } from '@/components/FindReplace'
import { SplashScreen } from '@/components/SplashScreen'

function App() {
  const [licenseAccepted, setLicenseAccepted] = useState(() => {
    return localStorage.getItem('vibepad-license-accepted') === 'true'
  })

  const handleLicenseAccept = useCallback(() => {
    setLicenseAccepted(true)
  }, [])

  const { files, tabs, setFiles, setTabs, setSplitConfig } = useFileStore()
  const { settings, updateSettings, isSidebarOpen, isAboutOpen, closeAbout } = useSettingsStore()

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      const [savedFiles, savedTabs, savedSettings, savedSplitConfig] = await Promise.all([
        loadFiles(),
        loadTabs(),
        loadSettings(),
        loadSplitConfig(),
      ])

      if (savedFiles.length > 0) {
        setFiles(savedFiles)
      }
      if (savedTabs.length > 0) {
        setTabs(savedTabs)
      }
      if (savedSettings) {
        updateSettings(savedSettings)
      }
      if (savedSplitConfig) {
        setSplitConfig(savedSplitConfig)
      }
    }

    loadSavedData()
  }, [setFiles, setTabs, setSplitConfig, updateSettings])

  // Set up auto-save
  useEffect(() => {
    if (settings.autoSave) {
      autoSaveManager.start(async () => {
        const currentState = useFileStore.getState()
        await saveFiles(currentState.files)
        await saveTabs(currentState.tabs)
        await saveSplitConfig(currentState.splitConfig)
      }, settings.autoSaveInterval)
    } else {
      autoSaveManager.stop()
    }

    return () => autoSaveManager.stop()
  }, [settings.autoSave, settings.autoSaveInterval])

  // Save on unload
  useEffect(() => {
    const handleUnload = () => {
      const currentState = useFileStore.getState()
      // Use localStorage for sync save on unload
      localStorage.setItem(
        'vibepad-emergency-save',
        JSON.stringify({
          files: currentState.files,
          tabs: currentState.tabs,
          splitConfig: currentState.splitConfig,
        })
      )
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  if (!licenseAccepted) {
    return <SplashScreen onAccept={handleLicenseAccept} />
  }

  return (
    <div className="h-screen flex flex-col bg-editor-bg overflow-hidden">
      <Toolbar />

      <div className="flex-1 flex overflow-hidden relative">
        <PanelGroup direction="horizontal">
          {isSidebarOpen && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={40}>
                <FileTree />
              </Panel>
              <PanelResizeHandle className="w-1 bg-editor-border hover:bg-editor-accent transition-colors cursor-col-resize" />
            </>
          )}
          <Panel>
            <SplitPane />
          </Panel>
        </PanelGroup>

        <FindReplace />

        {isAboutOpen && (
          <SplashScreen
            mode="about"
            onAccept={() => {}}
            onClose={closeAbout}
          />
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-1 bg-editor-sidebar border-t border-editor-border text-xs text-editor-text-muted">
        <div className="flex items-center gap-4">
          <span>Vibepad++</span>
          <span>
            {tabs.filter((t) => t.isDirty).length > 0
              ? `${tabs.filter((t) => t.isDirty).length} unsaved`
              : 'All saved'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{files.length} files</span>
          <span>{tabs.length} tabs</span>
        </div>
      </div>
    </div>
  )
}

export default App
