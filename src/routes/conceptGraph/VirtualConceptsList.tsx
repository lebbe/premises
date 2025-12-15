import React, { useState } from 'react'
import type { Node } from '@xyflow/react'
import styles from './VirtualConceptsList.module.css'

interface VirtualConceptsListProps {
  nodes: Node[]
}

const VirtualConceptsList: React.FC<VirtualConceptsListProps> = ({ nodes }) => {
  const [showGenusDialog, setShowGenusDialog] = useState(false)
  const [showDifferentiaDialog, setShowDifferentiaDialog] = useState(false)

  const virtualGenusNodes = nodes.filter(
    (node) => node.data.type === 'virtual genus',
  )
  const virtualDifferentiaNodes = nodes.filter(
    (node) => node.data.type === 'virtual differentia',
  )

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowGenusDialog(false)
      setShowDifferentiaDialog(false)
    }
  }

  return (
    <>
      <div className={styles.buttonContainer}>
        <button
          className={styles.listButton}
          onClick={() => setShowGenusDialog(true)}
          disabled={virtualGenusNodes.length === 0}
        >
          List Undefined Genus ({virtualGenusNodes.length})
        </button>
        <button
          className={styles.listButton}
          onClick={() => setShowDifferentiaDialog(true)}
          disabled={virtualDifferentiaNodes.length === 0}
        >
          List Undefined Differentia ({virtualDifferentiaNodes.length})
        </button>
      </div>

      {/* Virtual Genus Dialog */}
      {showGenusDialog && (
        <div className={styles.dialogOverlay} onClick={handleOverlayClick}>
          <div className={styles.dialog}>
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle}>
                Undefined Genus Concepts ({virtualGenusNodes.length})
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowGenusDialog(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.dialogContent}>
              {virtualGenusNodes.length === 0 ? (
                <p className={styles.emptyMessage}>
                  No undefined genus concepts found
                </p>
              ) : (
                <div className={styles.conceptList}>
                  {virtualGenusNodes.map((node) => (
                    <div key={node.id} className={styles.conceptItem}>
                      {(node.data as any).label || node.id}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Virtual Differentia Dialog */}
      {showDifferentiaDialog && (
        <div className={styles.dialogOverlay} onClick={handleOverlayClick}>
          <div className={styles.dialog}>
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle}>
                Undefined Differentia Concepts ({virtualDifferentiaNodes.length}
                )
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowDifferentiaDialog(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.dialogContent}>
              {virtualDifferentiaNodes.length === 0 ? (
                <p className={styles.emptyMessage}>
                  No undefined differentia concepts found
                </p>
              ) : (
                <div className={styles.conceptList}>
                  {virtualDifferentiaNodes.map((node) => (
                    <div key={node.id} className={styles.conceptItem}>
                      {(node.data as any).label || node.id}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default VirtualConceptsList
