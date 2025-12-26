import React, { useState } from 'react'
import type { FloatingAbstraction } from '../utils/floatingAbstractions'
import { generateLLMPrompt } from '../utils/floatingAbstractions'
import styles from './FloatingAbstractionsDialog.module.css'

interface FloatingAbstractionsDialogProps {
  isOpen: boolean
  onClose: () => void
  floatingAbstractions: FloatingAbstraction[]
  onDefineAbstraction: (abstraction: FloatingAbstraction) => void
  onDefineAbstractionFromJson?: (
    abstraction: FloatingAbstraction,
    parsedConcept: unknown,
  ) => void
}

const FloatingAbstractionsDialog: React.FC<FloatingAbstractionsDialogProps> = ({
  isOpen,
  onClose,
  floatingAbstractions,
  onDefineAbstraction,
  onDefineAbstractionFromJson,
}) => {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set())
  const [copiedPrompts, setCopiedPrompts] = useState<Set<string>>(new Set())
  const [copyErrors, setCopyErrors] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const togglePrompt = (id: string) => {
    setExpandedPrompts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const copyPromptToClipboard = async (
    abstraction: FloatingAbstraction,
  ): Promise<void> => {
    const prompt = generateLLMPrompt(abstraction)

    // Check if clipboard API is available
    if (!navigator.clipboard) {
      console.error('Clipboard API not available')
      setCopyErrors((prev) => new Set(prev).add(abstraction.id))
      setTimeout(() => {
        setCopyErrors((prev) => {
          const next = new Set(prev)
          next.delete(abstraction.id)
          return next
        })
      }, 3000)
      return
    }

    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompts((prev) => new Set(prev).add(abstraction.id))
      setCopyErrors((prev) => {
        const next = new Set(prev)
        next.delete(abstraction.id)
        return next
      })
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedPrompts((prev) => {
          const next = new Set(prev)
          next.delete(abstraction.id)
          return next
        })
      }, 2000)
    } catch (err) {
      console.error('Failed to copy prompt to clipboard:', err)
      setCopyErrors((prev) => new Set(prev).add(abstraction.id))
      // Reset error state after 3 seconds
      setTimeout(() => {
        setCopyErrors((prev) => {
          const next = new Set(prev)
          next.delete(abstraction.id)
          return next
        })
      }, 3000)
    }
  }

  const handlePasteJson = (abstraction: FloatingAbstraction) => {
    const raw = window.prompt(
      'Paste concept JSON to prefill the Add Concept form:',
      '',
    )

    if (raw === null) return

    try {
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') {
        alert('Please provide a valid JSON object.')
        return
      }
      onDefineAbstractionFromJson?.(abstraction, parsed)
    } catch (err) {
      console.error('Failed to parse pasted JSON:', err)
      alert('Invalid JSON. Please check the format and try again.')
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            🔍 Floating Abstractions ({floatingAbstractions.length})
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.description}>
          <p>
            These are concepts referenced in the genus or differentia of
            selected concepts, but which are either not defined in the dataset
            or lack proper definitions themselves.
          </p>
        </div>

        {floatingAbstractions.length === 0 ? (
          <div className={styles.noResults}>
            <p>
              ✅ No floating abstractions found! All referenced concepts are
              properly defined.
            </p>
          </div>
        ) : (
          <div className={styles.abstractionsList}>
            {floatingAbstractions.map((abstraction) => (
              <div key={abstraction.id} className={styles.abstractionCard}>
                <div className={styles.abstractionHeader}>
                  <div className={styles.abstractionInfo}>
                    <h3 className={styles.abstractionId}>
                      {abstraction.label || abstraction.id}
                    </h3>
                    {abstraction.label &&
                      abstraction.id !== abstraction.label && (
                        <div className={styles.abstractionIdSmall}>
                          ID: {abstraction.id}
                        </div>
                      )}
                    <div className={styles.abstractionReason}>
                      {abstraction.reason === 'undefined'
                        ? '⚠️ Not defined in dataset'
                        : '⚠️ Missing genus or differentia'}
                    </div>
                  </div>
                  <div className={styles.defineActions}>
                    <button
                      onClick={() => onDefineAbstraction(abstraction)}
                      className={styles.defineButton}
                      title="Define this concept manually"
                    >
                      ➕
                    </button>
                    <button
                      onClick={() => handlePasteJson(abstraction)}
                      className={styles.pasteJsonButton}
                      title="Paste concept JSON to prefill"
                    >
                      Paste JSON
                    </button>
                  </div>
                </div>

                {abstraction.referencedBy.length > 0 && (
                  <div className={styles.referencedBy}>
                    <strong>Referenced by:</strong>{' '}
                    {abstraction.referencedBy.join(', ')}
                  </div>
                )}

                <div className={styles.promptSection}>
                  <button
                    onClick={() => togglePrompt(abstraction.id)}
                    className={styles.promptToggle}
                  >
                    {expandedPrompts.has(abstraction.id) ? '▼' : '▶'} LLM Prompt
                  </button>
                  <button
                    onClick={() => copyPromptToClipboard(abstraction)}
                    className={styles.copyButton}
                    title="Copy prompt to clipboard"
                  >
                    {copiedPrompts.has(abstraction.id)
                      ? '✓ Copied'
                      : copyErrors.has(abstraction.id)
                        ? '✗ Failed'
                        : '📋 Copy'}
                  </button>
                </div>

                {expandedPrompts.has(abstraction.id) && (
                  <div className={styles.promptContent}>
                    <pre>{generateLLMPrompt(abstraction)}</pre>
                  </div>
                )}
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

export default FloatingAbstractionsDialog
