import type { ConceptData } from './graphData'

export interface FloatingAbstraction {
  id: string
  label?: string
  referencedBy: string[] // IDs of concepts that reference this abstraction
  reason: 'undefined' | 'incomplete' // undefined: not in dataset, incomplete: no genus/differentia
}

/**
 * Find floating abstractions from a set of selected concepts.
 * A floating abstraction is either:
 * 1. A concept referenced in genus/differentia but not defined in the dataset
 * 2. A concept with type "concept" that has no genus or differentia
 */
export const findFloatingAbstractions = (
  selectedConcepts: ConceptData[],
  allConcepts: ConceptData[],
): FloatingAbstraction[] => {
  const conceptMap = new Map(allConcepts.map((c) => [c.id, c]))
  const visited = new Set<string>()
  const floatingAbstractions = new Map<string, FloatingAbstraction>()

  // Helper function to traverse a concept's genus and differentia
  const traverse = (conceptId: string) => {
    if (visited.has(conceptId)) {
      return
    }
    visited.add(conceptId)

    const concept = conceptMap.get(conceptId)
    if (!concept) {
      return
    }

    // Check if this concept itself is a floating abstraction (incomplete definition)
    // Note: We only check concepts with type "concept" because axiomatic concepts
    // are foundational and don't require genus/differentia by definition
    if (
      concept.type === 'concept' &&
      !concept.definition.genus &&
      (!concept.definition.differentia ||
        concept.definition.differentia.length === 0)
    ) {
      if (!floatingAbstractions.has(conceptId)) {
        floatingAbstractions.set(conceptId, {
          id: conceptId,
          label: concept.label,
          referencedBy: [], // Empty because this concept exists but is incomplete
          reason: 'incomplete',
        })
      }
    }

    // Check genus
    if (concept.definition?.genus) {
      const genusId = concept.definition.genus.id
      const genusConcept = conceptMap.get(genusId)

      if (!genusConcept) {
        // Genus is not defined in the dataset
        if (!floatingAbstractions.has(genusId)) {
          floatingAbstractions.set(genusId, {
            id: genusId,
            label: concept.definition.genus.label,
            referencedBy: [conceptId],
            reason: 'undefined',
          })
        } else {
          const existing = floatingAbstractions.get(genusId)!
          if (!existing.referencedBy.includes(conceptId)) {
            existing.referencedBy.push(conceptId)
          }
        }
      } else {
        // Recursively traverse the genus
        traverse(genusId)
      }
    }

    // Check differentia
    if (concept.definition?.differentia) {
      concept.definition.differentia.forEach((diff) => {
        const diffId = diff.id
        const diffConcept = conceptMap.get(diffId)

        if (!diffConcept) {
          // Differentia is not defined in the dataset
          if (!floatingAbstractions.has(diffId)) {
            floatingAbstractions.set(diffId, {
              id: diffId,
              label: diff.label,
              referencedBy: [conceptId],
              reason: 'undefined',
            })
          } else {
            const existing = floatingAbstractions.get(diffId)!
            if (!existing.referencedBy.includes(conceptId)) {
              existing.referencedBy.push(conceptId)
            }
          }
        } else {
          // Recursively traverse the differentia
          traverse(diffId)
        }
      })
    }
  }

  // Start traversal from all selected concepts
  selectedConcepts.forEach((concept) => {
    traverse(concept.id)
  })

  return Array.from(floatingAbstractions.values())
}

/**
 * Generate an LLM prompt for defining a floating abstraction.
 * The prompt includes static instructions on how to define a concept using
 * genus and differentia, the three rules of defining concepts, and an example JSON format.
 */
export const generateLLMPrompt = (
  floatingAbstraction: FloatingAbstraction,
): string => {
  return `Please provide a definition for the concept "${floatingAbstraction.id}" using the Aristotelian genus-differentia method.

Role: You are an expert in Objectivist epistemology and Aristotelian logic. Your sole task is to generate precise definitions for provided concepts.

Core Method: Define every concept using the Genus-Differentia method:

    Genus: The immediate broader category.

    Differentia: The specific characteristic distinguishing this concept from others in the genus.

Strict Rules for Validity:

    Fundamentality (Essentiality): You must select the fundamental characteristic for the differentia. This is the single trait that causes or explains the greatest number of other characteristics.

    Parsimony (Mental Economy): The definition must use the fewest concepts possible. It acts as an identification code, not a catalog. Eliminate all non-essential descriptors.

    Exclusivity: The definition must distinguish the concept from all other members of the genus.

    Non-Circularity: Never use the concept or its root words in the definition.

    Positivity: State what the concept is, not what it is not (avoid negative definitions).

Output Format: Return only the raw JSON below.

\`\`\`json
{
  "id": "${floatingAbstraction.id}",
  "universeId": "custom-[your-universe-name]",
  "type": "concept",
  "label": "${floatingAbstraction.label || floatingAbstraction.id.charAt(0).toUpperCase() + floatingAbstraction.id.slice(1)}",
  "definition": {
    "text": "A [complete definition sentence goes here].",
    "genus": {
      "id": "genus-concept-id"
    },
    "differentia": [
      {
        "id": "first-differentiating-characteristic",
        "label": "concise label of the distinguishing trait"
      },
      {
        "id": "second-differentiating-characteristic",
        "label": "concise label of the distinguishing trait"
      }
    ],
    "source": "Generated by LLM"
  }
}
\`\`\`

Please provide a complete definition for "${floatingAbstraction.id}" following this format.`
}
