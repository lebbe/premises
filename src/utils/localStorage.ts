import type { ConceptData } from './graphData'

const STORAGE_KEYS = {
  USER_CONCEPTS: 'premises_user_concepts',
  IMPORTED_UNIVERSES: 'premises_imported_universes',
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
    const predefinedUniverses = [
      'Ayn Rand',
      'LLM layer genus 1',
      'LLM layer genus 2',
      'LLM layer differentia 1',
      'LLM layer differentia 2',
    ]

    const userConcepts = allConcepts.filter(
      (concept) => !predefinedUniverses.includes(concept.universeId),
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
 * Load user-defined concepts from localStorage
 */
export const loadUserConcepts = (): ConceptData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_CONCEPTS)
    if (!stored) {
      return []
    }

    const storage: UserConceptsStorage = JSON.parse(stored)

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

    const storage: ImportedUniversesStorage = JSON.parse(stored)

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
