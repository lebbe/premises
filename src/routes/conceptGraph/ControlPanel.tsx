import React from 'react'
import { Panel } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import { type LayoutOptions } from '../../utils/graphData'
import VirtualConceptsList from './VirtualConceptsList'
import styles from './ControlPanel.module.css'

interface ControlPanelProps {
  nodes: Node[]
  filteredNodes: Node[]
  filteredEdges: Edge[]
  showAxiomatic: boolean
  setShowAxiomatic: (value: boolean) => void
  showConcepts: boolean
  setShowConcepts: (value: boolean) => void
  showVirtual: boolean
  setShowVirtual: (value: boolean) => void
  showGenusEdges: boolean
  setShowGenusEdges: (value: boolean) => void
  showDifferentiaEdges: boolean
  setShowDifferentiaEdges: (value: boolean) => void
  layoutOptions: LayoutOptions
  setLayoutOptions: (options: LayoutOptions) => void
  availableUniverses: string[]
  selectedUniverses: string[]
  setSelectedUniverses: (universes: string[]) => void
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  nodes,
  filteredNodes,
  filteredEdges,
  showAxiomatic,
  setShowAxiomatic,
  showConcepts,
  setShowConcepts,
  showVirtual,
  setShowVirtual,
  showGenusEdges,
  setShowGenusEdges,
  showDifferentiaEdges,
  setShowDifferentiaEdges,
  layoutOptions,
  setLayoutOptions,
  availableUniverses,
  selectedUniverses,
  setSelectedUniverses,
}) => {
  return (
    <Panel position="top-left" className={styles.controlPanel}>
      <div className={styles.controlPanelContent}>
        <h3 className={styles.controlPanelHeader}>Data Sources</h3>
        {availableUniverses.map((universe) => (
          <label key={universe} className={styles.controlPanelLabel}>
            <input
              type="checkbox"
              checked={selectedUniverses.includes(universe)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedUniverses([...selectedUniverses, universe])
                } else {
                  setSelectedUniverses(
                    selectedUniverses.filter((u) => u !== universe),
                  )
                }
              }}
              className={styles.controlPanelCheckbox}
            />
            {universe}
          </label>
        ))}

        <h3 className={styles.controlPanelSectionHeader}>Concept Types</h3>
        <label className={styles.controlPanelLabel}>
          <input
            type="checkbox"
            checked={showAxiomatic}
            onChange={(e) => setShowAxiomatic(e.target.checked)}
            className={styles.controlPanelCheckbox}
          />
          Axiomatic Concepts (
          {nodes.filter((n) => n.data.type === 'axiomatic concept').length})
        </label>
        <label className={styles.controlPanelLabel}>
          <input
            type="checkbox"
            checked={showConcepts}
            onChange={(e) => setShowConcepts(e.target.checked)}
            className={styles.controlPanelCheckbox}
          />
          Regular Concepts (
          {nodes.filter((n) => n.data.type === 'concept').length})
        </label>
        <label className={styles.controlPanelLabel}>
          <input
            type="checkbox"
            checked={showVirtual}
            onChange={(e) => setShowVirtual(e.target.checked)}
            className={styles.controlPanelCheckbox}
          />
          Undefined Nodes (
          {nodes.filter((n) => n.data.type === 'virtual genus').length} genus,{' '}
          {nodes.filter((n) => n.data.type === 'virtual differentia').length}{' '}
          differentia)
        </label>

        <h3 className={styles.controlPanelSectionHeader}>Edge Types</h3>
        <label className={styles.controlPanelLabel}>
          <input
            type="checkbox"
            checked={showGenusEdges}
            onChange={(e) => setShowGenusEdges(e.target.checked)}
            className={styles.controlPanelCheckbox}
          />
          Genus Edges (solid lines)
        </label>
        <label className={styles.controlPanelLabel}>
          <input
            type="checkbox"
            checked={showDifferentiaEdges}
            onChange={(e) => setShowDifferentiaEdges(e.target.checked)}
            className={styles.controlPanelCheckbox}
          />
          Differentia Edges (dashed red)
        </label>

        <h3 className={styles.controlPanelSectionHeader}>Layout Options</h3>
        <label className={styles.controlPanelLabel}>
          <input
            type="checkbox"
            checked={layoutOptions.enableDagre}
            onChange={(e) =>
              setLayoutOptions({
                ...layoutOptions,
                enableDagre: e.target.checked,
              })
            }
            className={styles.controlPanelCheckbox}
          />
          Enable Auto Layout
        </label>

        {layoutOptions.enableDagre && (
          <>
            <label className={styles.controlPanelLabel}>
              Edge Spacing:
              <select
                value={layoutOptions.direction}
                onChange={(e) =>
                  setLayoutOptions({
                    ...layoutOptions,
                    direction: e.target.value as 'TB' | 'BT' | 'LR' | 'RL',
                  })
                }
                className={styles.controlPanelSelect}
              >
                <option value="TB">Top → Bottom</option>
                <option value="BT">Bottom → Top</option>
                <option value="LR">Left → Right</option>
                <option value="RL">Right → Left</option>
              </select>
            </label>

            <label className={styles.controlPanelLabel}>
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
                className={styles.controlPanelRange}
              />
              <span className={styles.controlPanelRangeValue}>
                {layoutOptions.nodeSpacing}px
              </span>
            </label>

            <label className={styles.controlPanelLabel}>
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
                className={styles.controlPanelRange}
              />
              <span className={styles.controlPanelRangeValue}>
                {layoutOptions.rankSpacing}px
              </span>
            </label>

            <label className={styles.controlPanelLabel}>
              Node Spacing:
              <input
                type="range"
                min="5"
                max="50"
                value={layoutOptions.edgeSpacing}
                onChange={(e) =>
                  setLayoutOptions({
                    ...layoutOptions,
                    edgeSpacing: parseInt(e.target.value),
                  })
                }
                className={styles.controlPanelRange}
              />
              <span className={styles.controlPanelRangeValue}>
                {layoutOptions.edgeSpacing}px
              </span>
            </label>
          </>
        )}

        <div className={styles.controlPanelTotal}>
          Total: {filteredNodes.length} nodes, {filteredEdges.length} edges
        </div>

        <VirtualConceptsList nodes={nodes} />
      </div>
    </Panel>
  )
}

export default ControlPanel
