import React, { useState, useRef } from 'react'
import {
  readImportFile,
  processImportedConcepts,
  applyImportedConcepts,
  type ImportResult,
} from '../utils/export'
import type { ConceptData } from '../utils/graphData'
import styles from './ImportDialog.module.css'

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  allConcepts: ConceptData[]
  onImport: (updatedConcepts: ConceptData[], importResult: ImportResult) => void
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  allConcepts,
  onImport,
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
      setParsedData(null)
    }
  }

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return

    setIsProcessing(true)

    try {
      // Read and parse the file
      const data = await readImportFile(selectedFile)
      setParsedData(data)

      // Analyze the import
      const result = processImportedConcepts(data, allConcepts)
      setImportResult(result)
    } catch (error) {
      setImportResult({
        success: false,
        totalConcepts: 0,
        newConcepts: 0,
        overwrittenConcepts: 0,
        newUniverses: [],
        overwrittenConceptIds: [],
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmImport = () => {
    if (!importResult?.success || !parsedData) return

    try {
      const updatedConcepts = applyImportedConcepts(parsedData, allConcepts)
      onImport(updatedConcepts, importResult)
      handleClose()
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please try again.')
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImportResult(null)
    setParsedData(null)
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Import Concepts</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* File Selection */}
          <div className={styles.fileSelection}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <div className={styles.fileInputArea}>
              <button
                onClick={triggerFileSelect}
                className={styles.selectFileButton}
              >
                📁 Select JSON File
              </button>
              {selectedFile && (
                <div className={styles.selectedFile}>
                  <span>📄 {selectedFile.name}</span>
                  <span className={styles.fileSize}>
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>

            {selectedFile && !importResult && (
              <button
                onClick={handleAnalyzeFile}
                className={styles.analyzeButton}
                disabled={isProcessing}
              >
                {isProcessing ? '⏳ Analyzing...' : '🔍 Analyze File'}
              </button>
            )}
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className={styles.processingStatus}>
              <div className={styles.spinner}></div>
              <p>Reading and analyzing file...</p>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className={styles.results}>
              {importResult.success ? (
                <div className={styles.successResults}>
                  <h3>📊 Import Analysis</h3>

                  <div className={styles.summary}>
                    <div className={styles.stat}>
                      <strong>{importResult.totalConcepts}</strong>
                      <span>Total Concepts</span>
                    </div>
                    <div className={styles.stat}>
                      <strong>{importResult.newConcepts}</strong>
                      <span>New Concepts</span>
                    </div>
                    <div className={styles.stat}>
                      <strong>{importResult.overwrittenConcepts}</strong>
                      <span>Will Overwrite</span>
                    </div>
                  </div>

                  {importResult.newUniverses.length > 0 && (
                    <div className={styles.newUniverses}>
                      <h4>New Universes:</h4>
                      <div className={styles.universeList}>
                        {importResult.newUniverses.map((universe) => (
                          <span key={universe} className={styles.universeBadge}>
                            {universe}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {importResult.overwrittenConceptIds.length > 0 && (
                    <div className={styles.overwrittenConcepts}>
                      <h4>Concepts that will be overwritten:</h4>
                      <div className={styles.overwrittenList}>
                        {importResult.overwrittenConceptIds
                          .slice(0, 10)
                          .map((id) => (
                            <span key={id} className={styles.conceptId}>
                              {id}
                            </span>
                          ))}
                        {importResult.overwrittenConceptIds.length > 10 && (
                          <span className={styles.moreIndicator}>
                            +{importResult.overwrittenConceptIds.length - 10}{' '}
                            more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.errorResults}>
                  <h3>❌ Import Error</h3>
                  <p className={styles.errorMessage}>{importResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={handleClose} className={styles.cancelButton}>
            Cancel
          </button>
          {importResult?.success && (
            <button
              onClick={handleConfirmImport}
              className={styles.importButton}
            >
              ✅ Import {importResult.totalConcepts} Concepts
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportDialog
