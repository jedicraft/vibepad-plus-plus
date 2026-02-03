import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { X } from 'lucide-react'
import { useFileStore } from '@/stores/fileStore'
import { TabBar } from '@/components/TabBar'
import { Editor } from '@/components/Editor'

export function SplitPane() {
  const { splitConfig, activePaneId, setActivePane, closeSplit } = useFileStore()

  const handlePaneClick = (paneId: string) => {
    setActivePane(paneId)
  }

  if (splitConfig.panes.length === 1) {
    const pane = splitConfig.panes[0]
    return (
      <div className="flex-1 flex flex-col h-full">
        <TabBar paneId={pane.id} />
        <div className="flex-1 relative">
          {pane.activeTabId ? (
            <Editor tabId={pane.activeTabId} paneId={pane.id} />
          ) : (
            <EmptyPane />
          )}
        </div>
      </div>
    )
  }

  return (
    <PanelGroup
      direction={splitConfig.direction}
      className="flex-1 h-full"
    >
      {splitConfig.panes.map((pane, index) => (
        <Panel key={pane.id} defaultSize={50} minSize={20}>
          <div
            className={`h-full flex flex-col ${activePaneId === pane.id ? 'ring-1 ring-editor-accent ring-inset' : ''}`}
            onClick={() => handlePaneClick(pane.id)}
          >
            <div className="flex items-center">
              <div className="flex-1">
                <TabBar paneId={pane.id} />
              </div>
              {splitConfig.panes.length > 1 && (
                <button
                  className="p-1 hover:bg-editor-hover"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeSplit(pane.id)
                  }}
                  title="Close Split"
                >
                  <X size={14} className="text-editor-text-muted" />
                </button>
              )}
            </div>
            <div className="flex-1 relative">
              {pane.activeTabId ? (
                <Editor tabId={pane.activeTabId} paneId={pane.id} />
              ) : (
                <EmptyPane />
              )}
            </div>
          </div>
          {index < splitConfig.panes.length - 1 && (
            <PanelResizeHandle
              className={`
                ${splitConfig.direction === 'horizontal' ? 'h-1 cursor-row-resize' : 'w-1 cursor-col-resize'}
                bg-editor-border hover:bg-editor-accent transition-colors
              `}
            />
          )}
        </Panel>
      ))}
    </PanelGroup>
  )
}

function EmptyPane() {
  return (
    <div className="flex-1 h-full flex items-center justify-center bg-editor-bg">
      <div className="text-center text-editor-text-muted">
        <p className="text-lg mb-2">No file open</p>
        <p className="text-sm">
          Open a file from the sidebar or press{' '}
          <kbd className="px-2 py-1 bg-editor-sidebar rounded text-xs">Ctrl+N</kbd>{' '}
          to create a new file
        </p>
      </div>
    </div>
  )
}
