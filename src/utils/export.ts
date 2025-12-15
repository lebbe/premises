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
  filename?: string
): void => {
  // Filter concepts by selected universes
  const conceptsToExport = allConcepts.filter(concept => 
    selectedUniverses.includes(concept.universeId)
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
    })
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
  const timestamp = now.toISOString()
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
  const universes = new Set(concepts.map(concept => concept.universeId))
  return Array.from(universes).sort()
}