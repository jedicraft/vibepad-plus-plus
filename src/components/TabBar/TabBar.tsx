import { useState, useRef, useCallback } from 'react'
import { X, MoreHorizontal, Copy, FileText } from 'lucide-react'
import { useFileStore } from '@/stores/fileStore'

interface TabBarProps {
  paneId: string
}

export function TabBar({ paneId }: TabBarProps) {
  const [contextMenu, setContextMenu] = useState<{
    tabId: string
    x: number
    y: number
  } | null>(null)
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)

  const {
    tabs,
    splitConfig,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    setActiveTab,
    duplicateTab,
    reorderTabs,
    getTabById,
  } = useFileStore()

  const pane = splitConfig.panes.find((p) => p.id === paneId)
  const paneTabs = pane?.tabIds.map((id) => getTabById(id)).filter(Boolean) || []

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId, paneId)
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({ tabId, x: e.clientX, y: e.clientY })
  }

  const closeContextMenu = () => setContextMenu(null)

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedTabId) return

    const draggedIndex = pane?.tabIds.indexOf(draggedTabId)
    if (draggedIndex !== undefined && draggedIndex !== targetIndex) {
      reorderTabs(paneId, draggedIndex, targetIndex)
    }
  }

  const handleDragEnd = () => {
    setDraggedTabId(null)
  }

  if (paneTabs.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex bg-editor-tab border-b border-editor-border overflow-x-auto scrollbar-thin">
        {paneTabs.map((tab, index) => {
          if (!tab) return null
          const isActive = pane?.activeTabId === tab.id

          return (
            <div
              key={tab.id}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-r border-editor-border
                min-w-[100px] max-w-[200px] group transition-colors
                ${isActive ? 'bg-editor-tab-active border-t-2 border-t-editor-accent' : 'hover:bg-editor-hover'}
                ${draggedTabId === tab.id ? 'opacity-50' : ''}
              `}
              onClick={() => handleTabClick(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <FileText size={14} className="text-editor-text-muted flex-shrink-0" />
              <span className="text-sm text-editor-text truncate flex-1">
                {tab.isDirty && <span className="text-editor-accent mr-1">*</span>}
                {tab.name}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 hover:bg-editor-border rounded p-0.5 transition-opacity"
                onClick={(e) => handleCloseTab(e, tab.id)}
              >
                <X size={14} className="text-editor-text-muted" />
              </button>
            </div>
          )
        })}
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className="fixed z-50 bg-editor-sidebar border border-editor-border rounded shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-editor-text hover:bg-editor-hover flex items-center gap-2"
              onClick={() => {
                closeTab(contextMenu.tabId)
                closeContextMenu()
              }}
            >
              <X size={14} />
              Close
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-editor-text hover:bg-editor-hover flex items-center gap-2"
              onClick={() => {
                closeOtherTabs(contextMenu.tabId, paneId)
                closeContextMenu()
              }}
            >
              <MoreHorizontal size={14} />
              Close Others
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-editor-text hover:bg-editor-hover flex items-center gap-2"
              onClick={() => {
                closeAllTabs(paneId)
                closeContextMenu()
              }}
            >
              <X size={14} />
              Close All
            </button>
            <div className="border-t border-editor-border my-1" />
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-editor-text hover:bg-editor-hover flex items-center gap-2"
              onClick={() => {
                duplicateTab(contextMenu.tabId)
                closeContextMenu()
              }}
            >
              <Copy size={14} />
              Duplicate
            </button>
          </div>
        </>
      )}
    </>
  )
}
