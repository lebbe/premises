import type { ConceptData } from './graphData'

export interface ExportData {
  exportDate: string
  totalConcepts: number
  universes: string[]
  concepts: ConceptData[]
}

/**
 * Export concepts data to a downloadable JSON file
 * @param allConcepts - Array of all concepts in memory
 * @param selectedUniverses - Array of universe IDs to include in export
 * @param filename - Optional custom filename (will be timestamped if not provided)
 */
export const exportConceptsData = (
  allConcepts: ConceptData[],
  selectedUniverses: string[],
  filename?: string,
): void => {
  // Filter concepts by selected universes
  const conceptsToExport = allConcepts.filter((concept) =>
    selectedUniverses.includes(concept.universeId),
  )

  // Create export data structure
  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    totalConcepts: conceptsToExport.length,
    universes: selectedUniverses.sort(),
    concepts: conceptsToExport.sort((a, b) => {
      // Sort by universe first, then by ID
      if (a.universeId !== b.universeId) {
        return a.universeId.localeCompare(b.universeId)
      }
      return a.id.localeCompare(b.id)
    }),
  }

  // Convert to JSON
  const jsonData = JSON.stringify(exportData, null, 2)

  // Generate filename if not provided
  const exportFilename = filename || generateExportFilename()

  // Create and trigger download
  downloadJsonFile(jsonData, exportFilename)
}

/**
 * Generate a timestamped filename for export
 */
const generateExportFilename = (): string => {
  const now = new Date()
  const timestamp = now
    .toISOString()
    .slice(0, 16) // YYYY-MM-DDTHH:mm
    .replace('T', '-')
    .replace(':', '-')

  return `premises-export-${timestamp}.json`
}

/**
 * Download a JSON string as a file
 */
const downloadJsonFile = (jsonData: string, filename: string): void => {
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Get unique universes from concepts array
 */
export const getUniversesFromConcepts = (concepts: ConceptData[]): string[] => {
  const universes = new Set(concepts.map((concept) => concept.universeId))
  return Array.from(universes).sort()
}
/**
 * Import result interface for reporting
 */
export interface ImportResult {
  success: boolean
  totalConcepts: number
  newConcepts: number
  overwrittenConcepts: number
  newUniverses: string[]
  overwrittenConceptIds: string[]
  error?: string
}

/**
 * Validate that imported data has the correct structure
 */
const validateImportData = (data: any): data is ConceptData[] => {
  if (!Array.isArray(data)) {
    return false
  }

  return data.every(
    (concept) =>
      typeof concept === 'object' &&
      typeof concept.id === 'string' &&
      typeof concept.universeId === 'string' &&
      typeof concept.type === 'string' &&
      typeof concept.label === 'string' &&
      typeof concept.definition === 'object' &&
      typeof concept.definition.text === 'string' &&
      (concept.definition.genus === null ||
        typeof concept.definition.genus === 'string') &&
      Array.isArray(concept.definition.differentia) &&
      typeof concept.definition.source === 'string' &&
      (concept.perceptualRoots === undefined ||
        Array.isArray(concept.perceptualRoots)),
  )
}

/**
 * Process imported concepts and merge with existing concepts
 */
export const processImportedConcepts = (
  importedData: any,
  existingConcepts: ConceptData[],
): ImportResult => {
  try {
    // Handle both direct array format and export format with metadata
    let conceptsToImport: ConceptData[]

    if (Array.isArray(importedData)) {
      conceptsToImport = importedData
    } else if (importedData.concepts && Array.isArray(importedData.concepts)) {
      conceptsToImport = importedData.concepts
    } else {
      return {
        success: false,
        totalConcepts: 0,
        newConcepts: 0,
        overwrittenConcepts: 0,
        newUniverses: [],
        overwrittenConceptIds: [],
        error:
          'Invalid file format. Expected array of concepts or export format with concepts array.',
      }
    }

    // Validate the structure
    if (!validateImportData(conceptsToImport)) {
      return {
        success: false,
        totalConcepts: 0,
        newConcepts: 0,
        overwrittenConcepts: 0,
        newUniverses: [],
        overwrittenConceptIds: [],
        error:
          'Invalid concept data structure. Please check that all concepts have required fields.',
      }
    }

    // Analyze imports vs existing concepts
    const existingIds = new Set(existingConcepts.map((c) => c.id))
    const existingUniverses = new Set(existingConcepts.map((c) => c.universeId))

    const overwrittenConceptIds: string[] = []
    const newUniverses: string[] = []

    conceptsToImport.forEach((concept) => {
      if (existingIds.has(concept.id)) {
        overwrittenConceptIds.push(concept.id)
      }
      if (!existingUniverses.has(concept.universeId)) {
        newUniverses.push(concept.universeId)
      }
    })

    return {
      success: true,
      totalConcepts: conceptsToImport.length,
      newConcepts: conceptsToImport.length - overwrittenConceptIds.length,
      overwrittenConcepts: overwrittenConceptIds.length,
      newUniverses: Array.from(new Set(newUniverses)).sort(),
      overwrittenConceptIds,
    }
  } catch (error) {
    return {
      success: false,
      totalConcepts: 0,
      newConcepts: 0,
      overwrittenConcepts: 0,
      newUniverses: [],
      overwrittenConceptIds: [],
      error: `Failed to process import: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Read and parse a JSON file
 */
export const readImportFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const data = JSON.parse(text)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file format'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Apply imported concepts to existing concepts array
 */
export const applyImportedConcepts = (
  importedData: any,
  existingConcepts: ConceptData[],
): ConceptData[] => {
  // Extract concepts array
  const conceptsToImport: ConceptData[] = Array.isArray(importedData)
    ? importedData
    : importedData.concepts || []

  // Create a map of existing concepts for efficient lookup
  const existingMap = new Map(existingConcepts.map((c) => [c.id, c]))

  // Add/overwrite concepts
  conceptsToImport.forEach((concept) => {
    existingMap.set(concept.id, concept)
  })

  // Return updated array
  return Array.from(existingMap.values()).sort((a, b) => {
    if (a.universeId !== b.universeId) {
      return a.universeId.localeCompare(b.universeId)
    }
    return a.id.localeCompare(b.id)
  })
}
