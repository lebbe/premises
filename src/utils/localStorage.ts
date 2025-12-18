import type { ConceptData } from './graphData'
import { PREDEFINED_UNIVERSES } from './constants'

const STORAGE_KEYS = {
  USER_CONCEPTS: 'premises_user_concepts',
  IMPORTED_UNIVERSES: 'premises_imported_universes',
  HAS_VISITED: 'premises_has_visited',
} as const

/**
 * Storage format for user-defined concepts
 */
interface UserConceptsStorage {
  version: number
  lastModified: string
  concepts: ConceptData[]
}

/**
 * Storage format for tracking imported universes
 */
interface ImportedUniversesStorage {
  version: number
  universes: string[]
}

const STORAGE_VERSION = 1

/**
 * Save user-defined concepts to localStorage
 * Only stores concepts that are not from pre-defined datasets
 */
export const saveUserConcepts = (allConcepts: ConceptData[]): void => {
  try {
    // Filter out pre-defined universes - only save custom/user-created concepts
    const userConcepts = allConcepts.filter(
      (concept) => !PREDEFINED_UNIVERSES.includes(concept.universeId),
    )

    const storage: UserConceptsStorage = {
      version: STORAGE_VERSION,
      lastModified: new Date().toISOString(),
      concepts: userConcepts,
    }

    localStorage.setItem(STORAGE_KEYS.USER_CONCEPTS, JSON.stringify(storage))
  } catch (error) {
    console.error('Failed to save user concepts to localStorage:', error)
  }
}

/**
 * Validate UserConceptsStorage structure
 */
const isValidUserConceptsStorage = (data: any): data is UserConceptsStorage => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.version === 'number' &&
    typeof data.lastModified === 'string' &&
    Array.isArray(data.concepts)
  )
}

/**
 * Validate ImportedUniversesStorage structure
 */
const isValidImportedUniversesStorage = (
  data: any,
): data is ImportedUniversesStorage => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.version === 'number' &&
    Array.isArray(data.universes)
  )
}

/**
 * Load user-defined concepts from localStorage
 */
export const loadUserConcepts = (): ConceptData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_CONCEPTS)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    // Validate structure before using
    if (!isValidUserConceptsStorage(parsed)) {
      console.error('Invalid user concepts storage structure')
      return []
    }

    const storage: UserConceptsStorage = parsed

    // Version check for future migrations
    if (storage.version !== STORAGE_VERSION) {
      console.warn(
        'User concepts storage version mismatch. Migration may be needed.',
      )
    }

    return storage.concepts || []
  } catch (error) {
    console.error('Failed to load user concepts from localStorage:', error)
    return []
  }
}

/**
 * Save the list of imported universes to localStorage
 */
export const saveImportedUniverses = (universes: string[]): void => {
  try {
    const storage: ImportedUniversesStorage = {
      version: STORAGE_VERSION,
      universes,
    }

    localStorage.setItem(
      STORAGE_KEYS.IMPORTED_UNIVERSES,
      JSON.stringify(storage),
    )
  } catch (error) {
    console.error('Failed to save imported universes to localStorage:', error)
  }
}

/**
 * Load the list of imported universes from localStorage
 */
export const loadImportedUniverses = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.IMPORTED_UNIVERSES)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    // Validate structure before using
    if (!isValidImportedUniversesStorage(parsed)) {
      console.error('Invalid imported universes storage structure')
      return []
    }

    const storage: ImportedUniversesStorage = parsed

    // Version check for future migrations
    if (storage.version !== STORAGE_VERSION) {
      console.warn(
        'Imported universes storage version mismatch. Migration may be needed.',
      )
    }

    return storage.universes || []
  } catch (error) {
    console.error('Failed to load imported universes from localStorage:', error)
    return []
  }
}

/**
 * Clear all localStorage data for the application
 */
export const clearAllStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_CONCEPTS)
    localStorage.removeItem(STORAGE_KEYS.IMPORTED_UNIVERSES)
    localStorage.removeItem(STORAGE_KEYS.HAS_VISITED)
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Check if the user has visited the application before
 * Returns true if there's any data in localStorage (concepts or universes selected)
 */
export const hasUserVisitedBefore = (): boolean => {
  try {
    const hasVisitedFlag = localStorage.getItem(STORAGE_KEYS.HAS_VISITED)
    if (hasVisitedFlag) {
      return true
    }

    // Also check if there are any user concepts or universe selections
    const hasConcepts = localStorage.getItem(STORAGE_KEYS.USER_CONCEPTS)
    const hasUniverses = localStorage.getItem(STORAGE_KEYS.IMPORTED_UNIVERSES)

    return !!(hasConcepts || hasUniverses)
  } catch {
    return false
  }
}

/**
 * Mark that the user has visited and interacted with the application
 */
export const markUserVisited = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HAS_VISITED, 'true')
  } catch (error) {
    console.error('Failed to mark user as visited:', error)
  }
}
