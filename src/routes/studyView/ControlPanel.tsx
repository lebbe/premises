import React, { useState, useEffect } from 'react'
import { Panel, useReactFlow } from '@xyflow/react'
import type { LayoutOptions } from '../../utils/graphData'
import styles from './ControlPanel.module.css'

interface ControlPanelProps {
  traversalDepth: number
  setTraversalDepth: (depth: number) => void
  layoutOptions: LayoutOptions
  setLayoutOptions: (options: LayoutOptions) => void
  useConceptualHierarchy: boolean
  setUseConceptualHierarchy: (use: boolean) => void
  showGenusEdges: boolean
  setShowGenusEdges: (show: boolean) => void
  showDifferentiaEdges: boolean
  setShowDifferentiaEdges: (show: boolean) => void
  availableUniverses: string[]
  selectedUniverses: string[]
  handleUniverseToggle: (universeId: string) => void
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  traversalDepth,
  setTraversalDepth,
  layoutOptions,
  setLayoutOptions,
  useConceptualHierarchy,
  setUseConceptualHierarchy,
  showGenusEdges,
  setShowGenusEdges,
  showDifferentiaEdges,
  setShowDifferentiaEdges,
  availableUniverses,
  selectedUniverses,
  handleUniverseToggle,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      // Collapse by default on mobile only on initial load
      if (mobile && !localStorage.getItem('panelStateChecked')) {
        setIsExpanded(false)
        localStorage.setItem('panelStateChecked', 'true')
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Panel position="top-left" className={styles.controlPanel}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse panel' : 'Expand panel'}
      >
        {isExpanded ? '◀' : '▶'} Settings
      </button>

      {isExpanded && (
        <>
          {isMobile && (
            <div
              className={styles.backdrop}
              onClick={() => setIsExpanded(false)}
            />
          )}
          <div
            className={`${styles.controlPanelContent} ${isMobile ? styles.mobileModal : ''}`}
          >
            {isMobile && (
              <button
                className={styles.closeButton}
                onClick={() => setIsExpanded(false)}
                title="Close"
              >
                ✕
              </button>
            )}

            {/* Zoom Controls Section - Mobile Only */}
            {isMobile && (
              <div className={styles.zoomControls}>
                <h4>View Controls</h4>
                <div className={styles.zoomButtonGroup}>
                  <button
                    onClick={() => zoomIn()}
                    className={styles.zoomButton}
                    title="Zoom In"
                  >
                    🔍+
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className={styles.zoomButton}
                    title="Zoom Out"
                  >
                    🔍−
                  </button>
                  <button
                    onClick={() => fitView({ padding: 0.1 })}
                    className={styles.zoomButton}
                    title="Fit View"
                  >
                    ⛶
                  </button>
                </div>
              </div>
            )}

            <div className={styles.depthControl}>
              <label>Traversal Depth: </label>
              <input
                type="number"
                min="1"
                max="5"
                value={traversalDepth}
                onChange={(e) => setTraversalDepth(parseInt(e.target.value))}
                className={styles.depthInput}
              />
            </div>

            <div className={styles.layoutControls}>
              <h4>Layout Options</h4>
              <label className={styles.layoutLabel}>
                <input
                  type="checkbox"
                  checked={layoutOptions.enableDagre}
                  onChange={(e) =>
                    setLayoutOptions({
                      ...layoutOptions,
                      enableDagre: e.target.checked,
                    })
                  }
                />
                Enable Auto Layout
              </label>

              <label className={styles.layoutLabel}>
                <input
                  type="checkbox"
                  checked={useConceptualHierarchy}
                  onChange={(e) => setUseConceptualHierarchy(e.target.checked)}
                />
                Conceptual Hierarchy (Genus Above, Differentia Below)
              </label>

              {layoutOptions.enableDagre && (
                <>
                  <label className={styles.layoutLabel}>
                    Direction:
                    <select
                      value={
                        useConceptualHierarchy ? 'TB' : layoutOptions.direction
                      }
                      onChange={(e) =>
                        setLayoutOptions({
                          ...layoutOptions,
                          direction: e.target.value as
                            | 'TB'
                            | 'BT'
                            | 'LR'
                            | 'RL',
                        })
                      }
                      className={styles.layoutSelect}
                      disabled={useConceptualHierarchy}
                    >
                      <option value="TB">Top → Bottom</option>
                      <option value="BT">Bottom → Top</option>
                      <option value="LR">Left → Right</option>
                      <option value="RL">Right → Left</option>
                    </select>
                    {useConceptualHierarchy && (
                      <small style={{ display: 'block', color: '#888' }}>
                        Direction locked to Top → Bottom for conceptual
                        hierarchy
                      </small>
                    )}
                  </label>

                  <label className={styles.layoutLabel}>
                    Node Spacing:
                    <input
                      type="range"
                      min="20"
                      max="150"
                      value={layoutOptions.nodeSpacing}
                      onChange={(e) =>
                        setLayoutOptions({
                          ...layoutOptions,
                          nodeSpacing: parseInt(e.target.value),
                        })
                      }
                      className={styles.layoutRange}
                    />
                    <span className={styles.rangeValue}>
                      {layoutOptions.nodeSpacing}px
                    </span>
                  </label>

                  <label className={styles.layoutLabel}>
                    Rank Spacing:
                    <input
                      type="range"
                      min="50"
                      max="300"
                      value={layoutOptions.rankSpacing}
                      onChange={(e) =>
                        setLayoutOptions({
                          ...layoutOptions,
                          rankSpacing: parseInt(e.target.value),
                        })
                      }
                      className={styles.layoutRange}
                    />
                    <span className={styles.rangeValue}>
                      {layoutOptions.rankSpacing}px
                    </span>
                  </label>
                </>
              )}
            </div>

            <div className={styles.edgeControls}>
              <h4>Edge Types</h4>
              <label className={styles.layoutLabel}>
                <input
                  type="checkbox"
                  checked={showGenusEdges}
                  onChange={(e) => setShowGenusEdges(e.target.checked)}
                />
                Show Genus Edges
              </label>
              <label className={styles.layoutLabel}>
                <input
                  type="checkbox"
                  checked={showDifferentiaEdges}
                  onChange={(e) => setShowDifferentiaEdges(e.target.checked)}
                />
                Show Differentia Edges
              </label>
            </div>

            <div className={styles.universeControls}>
              <h4>Universes:</h4>
              {availableUniverses.map((universe) => (
                <label key={universe} className={styles.universeLabel}>
                  <input
                    type="checkbox"
                    checked={selectedUniverses.includes(universe)}
                    onChange={() => handleUniverseToggle(universe)}
                  />
                  {universe}
                </label>
              ))}
            </div>

            <div className={styles.edgeLegend}>
              <h4>Edge Legend:</h4>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <div
                    className={styles.legendArrow}
                    style={{
                      borderColor:
                        'transparent transparent transparent #2563eb',
                      borderWidth: '6px 0 6px 12px',
                    }}
                  ></div>
                  <span>Genus</span>
                </div>
                <div className={styles.legendItem}>
                  <div
                    className={styles.legendArrow}
                    style={{
                      borderColor:
                        'transparent transparent transparent #dc2626',
                      borderWidth: '6px 0 6px 12px',
                    }}
                  ></div>
                  <span>Differentia</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Panel>
  )
}

export default ControlPanel
