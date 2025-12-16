/**
 * Migration script to transform JSON files from old format to new ConceptEdge format
 *
 * Old format:
 * {
 *   "genus": "string" | null,
 *   "differentia": ["string", "string"]
 * }
 *
 * New format:
 * {
 *   "genus": { "id": "string", "label"?: "string" } | null,
 *   "differentia": [{ "id": "string", "label"?: "string" }]
 * }
 */

const fs = require('fs')
const path = require('path')

// List of JSON files to migrate
const jsonFiles = [
  'ayn_rand_definitions.json',
  'llm_layer_differentia_1.json',
  'llm_layer_differentia_2.json',
  'llm_layer_genus_1.json',
  'llm_layer_genus_2.json',
]

const publicDir = path.join(__dirname, 'public')

function migrateConceptData(conceptData) {
  return conceptData.map((concept) => {
    const newConcept = { ...concept }

    // Migrate genus from string to ConceptEdge
    if (
      newConcept.definition.genus &&
      typeof newConcept.definition.genus === 'string'
    ) {
      newConcept.definition.genus = {
        id: newConcept.definition.genus,
        // label is optional and undefined by default
      }
    } else if (newConcept.definition.genus === null) {
      // Keep null as null
      newConcept.definition.genus = null
    }

    // Migrate differentia from string[] to ConceptEdge[]
    if (Array.isArray(newConcept.definition.differentia)) {
      newConcept.definition.differentia = newConcept.definition.differentia.map(
        (diff) => {
          if (typeof diff === 'string') {
            return {
              id: diff,
              // label is optional and undefined by default
            }
          }
          // If it's already an object, keep it as is
          return diff
        },
      )
    }

    return newConcept
  })
}

function migrateFile(filename) {
  const filePath = path.join(publicDir, filename)

  try {
    // Read the file
    console.log(`Migrating ${filename}...`)
    const data = fs.readFileSync(filePath, 'utf8')
    const conceptData = JSON.parse(data)

    // Create backup
    const backupPath = filePath + '.backup'
    fs.writeFileSync(backupPath, data, 'utf8')
    console.log(`  Created backup: ${filename}.backup`)

    // Migrate the data
    const migratedData = migrateConceptData(conceptData)

    // Write the migrated data back
    fs.writeFileSync(filePath, JSON.stringify(migratedData, null, 2), 'utf8')
    console.log(`  Migrated ${conceptData.length} concepts`)
  } catch (error) {
    console.error(`Error migrating ${filename}:`, error.message)
  }
}

function main() {
  console.log('Starting migration to ConceptEdge format...\n')

  // Check if public directory exists
  if (!fs.existsSync(publicDir)) {
    console.error('Public directory not found!')
    return
  }

  // Migrate each file
  jsonFiles.forEach((filename) => {
    const filePath = path.join(publicDir, filename)
    if (fs.existsSync(filePath)) {
      migrateFile(filename)
    } else {
      console.log(`File not found, skipping: ${filename}`)
    }
    console.log() // Empty line
  })

  console.log('Migration completed!')
  console.log(
    '\nNote: Original files have been backed up with .backup extension',
  )
  console.log('You can restore them if needed by removing .backup extension')
}

// Run the migration
main()
