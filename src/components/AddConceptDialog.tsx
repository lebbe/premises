import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { ConceptData } from '../utils/graphData'
import styles from './AddConceptDialog.module.css'

interface AddConceptDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (concept: ConceptData) => void
  existingConcepts: ConceptData[]
  existingUniverses: string[]
  editingConcept?: ConceptData | null // New prop for editing mode
  prefilledData?: { id: string; label: string } | null // New prop for prefilled data
}

const commonTypes = ['concept', 'axiomatic concept']
const commonSenses = ['vision', 'hearing', 'touch', 'smell', 'taste']

const AddConceptDialog: React.FC<AddConceptDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  existingConcepts,
  existingUniverses,
  editingConcept = null,
  prefilledData = null,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    label: '',
    universeId: '',
    type: '',
    definitionText: '',
    genus: { id: '', label: '' },
    differentia: [{ id: '', label: '' }],
    source: '',
    perceptualRoots: [''],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [shouldFocusDifferentia, setShouldFocusDifferentia] = useState<
    number | null
  >(null)
  const differentiaRefs = useRef<(HTMLInputElement | null)[]>([])
  const [shouldFocusPerceptualRoot, setShouldFocusPerceptualRoot] = useState<
    number | null
  >(null)
  const perceptualRootRefs = useRef<(HTMLInputElement | null)[]>([])

  const customUniverses = [
    ...new Set(existingUniverses.filter((u) => u.startsWith('custom-'))),
  ]

  // Helper to get initial form data
  const getInitialFormData = () => ({
    id: '',
    label: '',
    universeId: '',
    type: '',
    definitionText: '',
    genus: { id: '', label: '' },
    differentia: [{ id: '', label: '' }],
    source: '',
    perceptualRoots: [''],
  })

  // Helper to populate form from concept
  const populateFormFromConcept = (concept: ConceptData) => {
    setFormData({
      id: concept.id,
      label: concept.label,
      universeId: concept.universeId,
      type: concept.type,
      definitionText: concept.definition.text,
      genus: concept.definition.genus
        ? {
            id: concept.definition.genus.id,
            label: concept.definition.genus.label || '',
          }
        : { id: '', label: '' },
      differentia:
        concept.definition.differentia.length > 0
          ? concept.definition.differentia.map((diff) => ({
              id: diff.id,
              label: diff.label || '',
            }))
          : [{ id: '', label: '' }],
      source: concept.definition.source || '',
      perceptualRoots: concept.perceptualRoots?.length
        ? concept.perceptualRoots
        : [''],
    })
  }

  // Initialize form when dialog opens or editingConcept changes
  useEffect(() => {
    if (isOpen) {
      if (editingConcept) {
        populateFormFromConcept(editingConcept)
      } else if (prefilledData) {
        // Pre-fill from virtual node data
        setFormData({
          ...getInitialFormData(),
          id: prefilledData.id,
          label: prefilledData.label,
        })
      } else {
        setFormData(getInitialFormData())
      }
      setErrors({})
    }
  }, [isOpen, editingConcept, prefilledData])

  // Effect to focus the newly added differentia input
  useEffect(() => {
    if (
      shouldFocusDifferentia !== null &&
      differentiaRefs.current[shouldFocusDifferentia]
    ) {
      differentiaRefs.current[shouldFocusDifferentia]?.focus()
      setShouldFocusDifferentia(null)
    }
  }, [shouldFocusDifferentia, formData.differentia.length])

  // Effect to focus the newly added perceptual root input
  useEffect(() => {
    if (
      shouldFocusPerceptualRoot !== null &&
      perceptualRootRefs.current[shouldFocusPerceptualRoot]
    ) {
      perceptualRootRefs.current[shouldFocusPerceptualRoot]?.focus()
      setShouldFocusPerceptualRoot(null)
    }
  }, [shouldFocusPerceptualRoot, formData.perceptualRoots.length])

  const handleDifferentiaKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === ',' || e.key === 'Comma') {
      e.preventDefault()
      // Add new input and focus it
      setFormData((prev) => {
        const newLength = prev.differentia.length
        setShouldFocusDifferentia(newLength) // Focus the newly created input at this index
        return {
          ...prev,
          differentia: [...prev.differentia, { id: '', label: '' }],
        }
      })
    }
  }

  const handleDifferentiaPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    const pastedText = e.clipboardData.getData('text')
    if (pastedText.includes(',')) {
      e.preventDefault()
      const items = pastedText
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item)
      if (items.length > 1) {
        setFormData((prev) => {
          const newDifferentia = [...prev.differentia]
          newDifferentia[index] = { id: items[0], label: '' }
          // Add remaining items as new inputs
          newDifferentia.push(
            ...items.slice(1).map((item) => ({ id: item, label: '' })),
          )
          return {
            ...prev,
            differentia: newDifferentia,
          }
        })
      } else if (items.length === 1) {
        updateDifferentia(index, 'id', items[0])
      }
    }
  }

  const handlePerceptualRootKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === ',' || e.key === 'Comma') {
      e.preventDefault()
      // Add new input and focus it
      setFormData((prev) => {
        const newLength = prev.perceptualRoots.length
        setShouldFocusPerceptualRoot(newLength) // Focus the newly created input at this index
        return {
          ...prev,
          perceptualRoots: [...prev.perceptualRoots, ''],
        }
      })
    }
  }

  const handlePerceptualRootPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    const pastedText = e.clipboardData.getData('text')
    if (pastedText.includes(',')) {
      e.preventDefault()
      const items = pastedText
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item)
      if (items.length > 1) {
        setFormData((prev) => {
          const newPerceptualRoots = [...prev.perceptualRoots]
          newPerceptualRoots[index] = items[0]
          // Add remaining items as new inputs
          newPerceptualRoots.push(...items.slice(1))
          return {
            ...prev,
            perceptualRoots: newPerceptualRoots,
          }
        })
      } else if (items.length === 1) {
        updatePerceptualRoot(index, items[0])
      }
    }
  }

  const handleUniverseChange = (value: string) => {
    // Always ensure the value starts with "custom-" if user enters something
    let universeValue = value
    if (universeValue && !universeValue.startsWith('custom-')) {
      universeValue = 'custom-' + universeValue
    }
    setFormData((prev) => ({ ...prev, universeId: universeValue }))
  }

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.id.trim()) {
      newErrors.id = 'ID is required'
    } else if (editingConcept) {
      // In edit mode, allow keeping the same ID but check for conflicts with others
      const conflictingConcept = existingConcepts.find(
        (c) => c.id === formData.id.trim() && c.id !== editingConcept.id,
      )
      if (conflictingConcept) {
        newErrors.id = 'ID already exists'
      }
    } else {
      // In add mode, check against all existing concepts
      if (existingConcepts.some((c) => c.id === formData.id.trim())) {
        newErrors.id = 'ID already exists'
      }
    }

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required'
    }

    if (!formData.universeId.trim()) {
      newErrors.universeId = 'Universe is required'
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Type is required'
    }

    if (!formData.definitionText.trim()) {
      newErrors.definitionText = 'Definition text is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, existingConcepts])

  const handleSave = () => {
    if (!validateForm()) {
      return
    }

    const newConcept: ConceptData = {
      id: formData.id.trim(),
      universeId: formData.universeId.trim(),
      type: formData.type.trim(),
      label: formData.label.trim(),
      definition: {
        text: formData.definitionText.trim(),
        genus: formData.genus.id.trim()
          ? {
              id: formData.genus.id.trim(),
              label: formData.genus.label.trim() || undefined,
            }
          : null,
        differentia: formData.differentia
          .filter((d) => d.id.trim())
          .map((d) => ({
            id: d.id.trim(),
            label: d.label.trim() || undefined,
          })),
        source: formData.source.trim() || 'User created',
      },
      perceptualRoots: formData.perceptualRoots
        .filter((p) => p.trim())
        .map((p) => p.trim()),
    }

    onSave(newConcept)

    // Reset form
    setFormData(getInitialFormData())
    setErrors({})
  }

  const handleCancel = () => {
    setFormData(getInitialFormData())
    setErrors({})
    onClose()
  }

  const addDifferentia = () => {
    setFormData((prev) => {
      const newIndex = prev.differentia.length
      setShouldFocusDifferentia(newIndex)
      return {
        ...prev,
        differentia: [...prev.differentia, { id: '', label: '' }],
      }
    })
  }

  const removeDifferentia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      differentia: prev.differentia.filter((_, i) => i !== index),
    }))
  }

  const updateDifferentia = (
    index: number,
    field: 'id' | 'label',
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      differentia: prev.differentia.map((d, i) =>
        i === index ? { ...d, [field]: value } : d,
      ),
    }))
  }

  const addPerceptualRoot = () => {
    setFormData((prev) => {
      const newIndex = prev.perceptualRoots.length
      setShouldFocusPerceptualRoot(newIndex)
      return {
        ...prev,
        perceptualRoots: [...prev.perceptualRoots, ''],
      }
    })
  }

  const removePerceptualRoot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      perceptualRoots: prev.perceptualRoots.filter((_, i) => i !== index),
    }))
  }

  const updatePerceptualRoot = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      perceptualRoots: prev.perceptualRoots.map((p, i) =>
        i === index ? value : p,
      ),
    }))
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>{editingConcept ? 'Edit Concept' : 'Add New Concept'}</h2>
          <button onClick={handleCancel} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label htmlFor="concept-id">ID *</label>
            <input
              id="concept-id"
              type="text"
              value={formData.id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, id: e.target.value }))
              }
              className={errors.id ? styles.inputError : ''}
              placeholder="unique-concept-id"
            />
            {errors.id && <span className={styles.error}>{errors.id}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="concept-label">Label *</label>
            <input
              id="concept-label"
              type="text"
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, label: e.target.value }))
              }
              className={errors.label ? styles.inputError : ''}
              placeholder="Concept Name"
            />
            {errors.label && (
              <span className={styles.error}>{errors.label}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="concept-universe">Universe *</label>
            <input
              id="concept-universe"
              type="text"
              value={formData.universeId}
              onChange={(e) => handleUniverseChange(e.target.value)}
              className={errors.universeId ? styles.inputError : ''}
              placeholder="my-universe (custom- will be added automatically)"
              list="custom-universes"
            />
            <datalist id="custom-universes">
              {customUniverses.map((universe, index) => (
                <option key={`universe-${index}`} value={universe} />
              ))}
            </datalist>
            {errors.universeId && (
              <span className={styles.error}>{errors.universeId}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="concept-type">Type *</label>
            <input
              id="concept-type"
              type="text"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              className={errors.type ? styles.inputError : ''}
              list="common-types"
            />
            <datalist id="common-types">
              {[...new Set(commonTypes)].map((type, index) => (
                <option key={`type-${index}`} value={type} />
              ))}
            </datalist>
            {errors.type && <span className={styles.error}>{errors.type}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="concept-definition">Definition Text *</label>
            <textarea
              id="concept-definition"
              value={formData.definitionText}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  definitionText: e.target.value,
                }))
              }
              className={errors.definitionText ? styles.inputError : ''}
              placeholder="Enter the definition of this concept..."
              rows={3}
            />
            {errors.definitionText && (
              <span className={styles.error}>{errors.definitionText}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="concept-genus">Genus</label>
            <div className={styles.conceptEdgeInputs}>
              <input
                id="concept-genus"
                type="text"
                value={formData.genus.id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    genus: { ...prev.genus, id: e.target.value },
                  }))
                }
                placeholder="Parent concept ID"
                list="existing-concepts"
              />
              <input
                type="text"
                value={formData.genus.label}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    genus: { ...prev.genus, label: e.target.value },
                  }))
                }
                placeholder="Edge label (optional)"
              />
            </div>
            <datalist id="existing-concepts">
              {[...new Set(existingConcepts.map((concept) => concept.id))].map(
                (conceptId) => (
                  <option key={conceptId} value={conceptId} />
                ),
              )}
            </datalist>
          </div>

          <div className={styles.formGroup}>
            <label>Differentia</label>
            <div className={styles.dynamicList}>
              {formData.differentia.map((diff, index) => (
                <div key={index} className={styles.listItem}>
                  <div className={styles.conceptEdgeInputs}>
                    <input
                      ref={(el) => {
                        differentiaRefs.current[index] = el
                      }}
                      type="text"
                      value={diff.id}
                      onChange={(e) =>
                        updateDifferentia(index, 'id', e.target.value)
                      }
                      onKeyDown={(e) => handleDifferentiaKeyDown(e)}
                      onPaste={(e) => handleDifferentiaPaste(e, index)}
                      placeholder="Differentia concept ID"
                      list="existing-concepts"
                    />
                    <input
                      type="text"
                      value={diff.label}
                      onChange={(e) =>
                        updateDifferentia(index, 'label', e.target.value)
                      }
                      placeholder="Edge label (optional)"
                    />
                  </div>
                  {formData.differentia.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDifferentia(index)}
                      className={styles.removeButton}
                      aria-label="Remove differentia"
                    >
                      🚮
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDifferentia}
                className={styles.addButton}
              >
                + Add Differentia
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="concept-source">Source</label>
            <input
              id="concept-source"
              type="text"
              value={formData.source}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, source: e.target.value }))
              }
              placeholder="User created"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Perceptual Roots</label>
            <div className={styles.dynamicList}>
              {formData.perceptualRoots.map((root, index) => (
                <div key={index} className={styles.listItem}>
                  <input
                    ref={(el) => {
                      perceptualRootRefs.current[index] = el
                    }}
                    type="text"
                    value={root}
                    onChange={(e) =>
                      updatePerceptualRoot(index, e.target.value)
                    }
                    onKeyDown={(e) => handlePerceptualRootKeyDown(e)}
                    onPaste={(e) => handlePerceptualRootPaste(e, index)}
                    placeholder="Sense or perceptual faculty"
                    list="common-senses"
                  />
                  {formData.perceptualRoots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerceptualRoot(index)}
                      className={styles.removeButton}
                      aria-label="Remove perceptual root"
                    >
                      🚮
                    </button>
                  )}
                </div>
              ))}
              <datalist id="common-senses">
                {[...new Set(commonSenses)].map((sense, index) => (
                  <option key={`sense-${index}`} value={sense} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={addPerceptualRoot}
                className={styles.addButton}
              >
                + Add Perceptual Root
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveButton}>
            {editingConcept ? 'Update Concept' : 'Save Concept'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddConceptDialog
