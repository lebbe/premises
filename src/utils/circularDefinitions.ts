import type { ConceptData } from './graphData'

export interface CircularDefinition {
  cycle: string[] // Array of concept IDs forming a cycle
  labels: string[] // Array of concept labels for display
}

/**
 * Find all circular definitions in a set of concepts using depth-first search.
 * A circular definition occurs when a concept's definition chain eventually
 * references itself through genus or differentia relationships.
 *
 * For example:
 * - A is defined using B (genus or differentia)
 * - B is defined using C
 * - C is defined using A
 * This creates a cycle: A -> B -> C -> A
 */
export const findCircularDefinitions = (
  selectedConcepts: ConceptData[],
  allConcepts: ConceptData[],
): CircularDefinition[] => {
  const conceptMap = new Map(allConcepts.map((c) => [c.id, c]))
  const cycles: CircularDefinition[] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const currentPath: string[] = []

  // Helper function to perform DFS and detect cycles
  const detectCycle = (conceptId: string): boolean => {
    // If we've already fully explored this concept, skip it
    if (visited.has(conceptId)) {
      return false
    }

    // If this concept is in our current recursion stack, we found a cycle
    if (recursionStack.has(conceptId)) {
      // Extract the cycle from currentPath
      const cycleStartIndex = currentPath.indexOf(conceptId)
      if (cycleStartIndex !== -1) {
        const cycle = currentPath.slice(cycleStartIndex)
        cycle.push(conceptId) // Complete the cycle

        // Get labels for the cycle
        const labels = cycle.map((id) => {
          const concept = conceptMap.get(id)
          return concept?.label || id
        })

        // Check if this cycle is already recorded (in any rotation)
        const cycleKey = cycle.slice(0, -1).sort().join(',') // Remove duplicate last element
        const isDuplicate = cycles.some((existing) => {
          const existingKey = existing.cycle.slice(0, -1).sort().join(',')
          return existingKey === cycleKey
        })

        if (!isDuplicate) {
          cycles.push({ cycle, labels })
        }
      }
      return true
    }

    const concept = conceptMap.get(conceptId)
    if (!concept) {
      return false
    }

    // Mark as visiting
    recursionStack.add(conceptId)
    currentPath.push(conceptId)

    let foundCycle = false

    // Check genus
    if (concept.definition?.genus) {
      const genusId = concept.definition.genus.id
      if (detectCycle(genusId)) {
        foundCycle = true
      }
    }

    // Check differentia
    if (concept.definition?.differentia) {
      for (const diff of concept.definition.differentia) {
        if (detectCycle(diff.id)) {
          foundCycle = true
        }
      }
    }

    // Mark as fully explored
    currentPath.pop()
    recursionStack.delete(conceptId)
    visited.add(conceptId)

    return foundCycle
  }

  // Start DFS from each selected concept
  selectedConcepts.forEach((concept) => {
    // Don't clear visited - maintain it across all DFS traversals to avoid duplicate work
    // Only clear recursionStack and currentPath for each new starting point
    recursionStack.clear()
    currentPath.length = 0
    detectCycle(concept.id)
  })

  return cycles
}
