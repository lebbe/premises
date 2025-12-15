import React, { useState, useEffect } from 'react'
import { exportConceptsData, getUniversesFromConcepts } from '../utils/export'
import type { ConceptData } from '../utils/graphData'
import styles from './ExportDialog.module.css'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  allConcepts: ConceptData[]
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  allConcepts,
}) => {
  const [availableUniverses, setAvailableUniverses] = useState<string[]>([])
  const [selectedUniverses, setSelectedUniverses] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // Initialize available universes when dialog opens
  useEffect(() => {
    if (isOpen) {
      const universes = getUniversesFromConcepts(allConcepts)
      setAvailableUniverses(universes)

      // Pre-select custom universes by default
      const customUniverses = universes.filter((u) => u.startsWith('custom-'))
      setSelectedUniverses(customUniverses)
    }
  }, [isOpen, allConcepts])

  const handleUniverseToggle = (universeId: string) => {
    setSelectedUniverses((prev) =>
      prev.includes(universeId)
        ? prev.filter((id) => id !== universeId)
        : [...prev, universeId],
    )
  }

  const handleSelectAll = () => {
    setSelectedUniverses(availableUniverses)
  }

  const handleSelectNone = () => {
    setSelectedUniverses([])
  }

  const handleSelectCustomOnly = () => {
    const customUniverses = availableUniverses.filter((u) =>
      u.startsWith('custom-'),
    )
    setSelectedUniverses(customUniverses)
  }

  const handleExport = async () => {
    if (selectedUniverses.length === 0) {
      alert('Please select at least one universe to export.')
      return
    }

    setIsExporting(true)

    try {
      exportConceptsData(allConcepts, selectedUniverses)

      // Brief delay to show export state, then close
      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
      setIsExporting(false)
    }
  }

  const selectedConceptCount = allConcepts.filter((c) =>
    selectedUniverses.includes(c.universeId),
  ).length

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Export Concepts</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.summary}>
            <p>
              <strong>{selectedConceptCount} concepts</strong> from{' '}
              <strong>{selectedUniverses.length} universes</strong> will be
              exported.
            </p>
          </div>

          <div className={styles.universeSelection}>
            <h3>Select Universes to Export</h3>

            <div className={styles.selectionButtons}>
              <button
                onClick={handleSelectAll}
                className={styles.selectionButton}
              >
                Select All
              </button>
              <button
                onClick={handleSelectCustomOnly}
                className={styles.selectionButton}
              >
                Custom Only
              </button>
              <button
                onClick={handleSelectNone}
                className={styles.selectionButton}
              >
                Select None
              </button>
            </div>

            <div className={styles.universeList}>
              {availableUniverses.map((universe) => {
                const conceptCount = allConcepts.filter(
                  (c) => c.universeId === universe,
                ).length
                const isCustom = universe.startsWith('custom-')

                return (
                  <label key={universe} className={styles.universeItem}>
                    <input
                      type="checkbox"
                      checked={selectedUniverses.includes(universe)}
                      onChange={() => handleUniverseToggle(universe)}
                    />
                    <span className={styles.universeName}>
                      {universe}
                      {isCustom && (
                        <span className={styles.customBadge}>Custom</span>
                      )}
                    </span>
                    <span className={styles.conceptCount}>
                      ({conceptCount} concepts)
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleExport}
            className={styles.exportButton}
            disabled={isExporting || selectedUniverses.length === 0}
          >
            {isExporting ? '⏳ Exporting...' : '💾 Export to JSON'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportDialog
