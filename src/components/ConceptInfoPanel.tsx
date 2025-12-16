import React from 'react'
import type { ConceptData } from '../utils/graphData'
import styles from './ConceptInfoPanel.module.css'

interface ConceptInfoPanelProps {
  concept: ConceptData
  onClose: () => void
  onFocus?: (concept: ConceptData) => void // Optional focus handler
  isSelected?: boolean // Whether this concept is currently selected
  conceptUrl?: string // URL for this specific concept
  className?: string
}

const ConceptInfoPanel: React.FC<ConceptInfoPanelProps> = ({
  concept,
  onClose,
  onFocus,
  isSelected = false,
  conceptUrl,
  className = '',
}) => {
  return (
    <div className={`${styles.infoPanelContent} ${className}`}>
      <div className={styles.infoPanelHeader}>
        <h3 className={styles.infoPanelTitle}>{concept.label}</h3>
        <button onClick={onClose} className={styles.infoPanelClose}>
          ×
        </button>
      </div>

      <div className={styles.infoPanelUniverse}>{concept.universeId}</div>

      <div className={styles.infoPanelField}>
        <strong>ID:</strong> {concept.id}
      </div>

      <div className={styles.infoPanelField}>
        <strong>Type:</strong> {concept.type}
      </div>

      {concept.definition?.genus && (
        <div className={styles.infoPanelField}>
          <strong>Genus:</strong> {concept.definition.genus.id}
          {concept.definition.genus.label &&
            ` (${concept.definition.genus.label})`}
        </div>
      )}

      {concept.definition?.differentia &&
        concept.definition.differentia.length > 0 && (
          <div className={styles.infoPanelField}>
            <strong>Differentia:</strong>{' '}
            {concept.definition.differentia.map((diff, index) => (
              <span key={index}>
                {index > 0 && ', '}
                {diff.id}
                {diff.label && ` (${diff.label})`}
              </span>
            ))}
          </div>
        )}

      {concept.perceptualRoots && concept.perceptualRoots.length > 0 && (
        <div className={styles.infoPanelField}>
          <strong>Perceptual Roots:</strong>{' '}
          {concept.perceptualRoots.join(', ')}
        </div>
      )}

      <div className={styles.infoPanelDefinition}>
        <strong>Definition:</strong>
        <div className={styles.infoPanelDefinitionText}>
          {concept.definition?.text || 'No definition available'}
        </div>
      </div>

      {onFocus && !isSelected && conceptUrl && (
        <div className={styles.infoPanelActions}>
          <a
            href={conceptUrl}
            className={styles.focusButton}
            title="Focus on this concept (rebuild graph around it)"
          >
            🎯 Focus on this concept
          </a>
        </div>
      )}

      {concept.definition?.source && (
        <div className={styles.infoPanelSource}>
          Source: {concept.definition.source}
        </div>
      )}
    </div>
  )
}

export default ConceptInfoPanel
