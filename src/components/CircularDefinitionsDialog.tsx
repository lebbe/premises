import React from 'react'
import type { CircularDefinition } from '../utils/circularDefinitions'
import type { ConceptData } from '../utils/graphData'
import styles from './CircularDefinitionsDialog.module.css'

interface CircularDefinitionsDialogProps {
  isOpen: boolean
  onClose: () => void
  circularDefinitions: CircularDefinition[]
  onEditConcept: (conceptId: string) => void
  allConcepts: ConceptData[]
}

const CircularDefinitionsDialog: React.FC<CircularDefinitionsDialogProps> = ({
  isOpen,
  onClose,
  circularDefinitions,
  onEditConcept,
  allConcepts,
}) => {
  if (!isOpen) return null

  const conceptMap = new Map(allConcepts.map((c) => [c.id, c]))

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            🔄 Circular Definitions ({circularDefinitions.length})
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.description}>
          <p>
            Circular definitions violate the principle of proper conceptual
            hierarchy. A concept should not be defined in terms of itself,
            either directly or indirectly through a chain of other concepts.
          </p>
        </div>

        {circularDefinitions.length === 0 ? (
          <div className={styles.noResults}>
            <p>
              ✅ No circular definitions found! All selected concepts have
              proper hierarchical definitions.
            </p>
          </div>
        ) : (
          <div className={styles.cyclesList}>
            {circularDefinitions.map((circular, index) => (
              <div key={index} className={styles.cycleCard}>
                <div className={styles.cycleHeader}>
                  <h3 className={styles.cycleTitle}>Cycle {index + 1}</h3>
                  <div className={styles.cycleLength}>
                    {circular.cycle.length - 1} concepts involved
                  </div>
                </div>

                <div className={styles.cyclePath}>
                  {circular.labels.map((label, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className={styles.arrow}>→</span>}
                      <span className={styles.conceptInCycle}>{label}</span>
                    </React.Fragment>
                  ))}
                </div>

                <div className={styles.conceptsList}>
                  <h4 className={styles.conceptsListTitle}>
                    Concepts in this cycle:
                  </h4>
                  {/* Remove the duplicate last element from the cycle */}
                  {circular.cycle.slice(0, -1).map((conceptId) => {
                    const concept = conceptMap.get(conceptId)
                    if (!concept) return null

                    return (
                      <div key={conceptId} className={styles.conceptItem}>
                        <div className={styles.conceptInfo}>
                          <div className={styles.conceptLabel}>
                            {concept.label}
                          </div>
                          <div className={styles.conceptId}>
                            ID: {concept.id}
                          </div>
                          {concept.definition?.text && (
                            <div className={styles.conceptDefinition}>
                              {concept.definition.text}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onEditConcept(conceptId)}
                          className={styles.editButton}
                          title="Edit this concept"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.closeFooterButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default CircularDefinitionsDialog
