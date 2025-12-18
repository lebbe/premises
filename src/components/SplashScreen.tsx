import React, { useState } from 'react'
import { PREDEFINED_UNIVERSES } from '../utils/constants'
import styles from './SplashScreen.module.css'

interface SplashScreenProps {
  onLoadUniverses: (universes: string[]) => void
  onStartBlank: () => void
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  onLoadUniverses,
  onStartBlank,
}) => {
  const [selectedUniverses, setSelectedUniverses] = useState<string[]>([
    ...PREDEFINED_UNIVERSES,
  ])

  const handleUniverseToggle = (universe: string) => {
    setSelectedUniverses((prev) =>
      prev.includes(universe)
        ? prev.filter((u) => u !== universe)
        : [...prev, universe],
    )
  }

  const handleSelectAll = () => {
    if (selectedUniverses.length === PREDEFINED_UNIVERSES.length) {
      setSelectedUniverses([])
    } else {
      setSelectedUniverses([...PREDEFINED_UNIVERSES])
    }
  }

  const handleLoadUniverses = () => {
    if (selectedUniverses.length === 0) {
      alert('Please select at least one universe to load')
      return
    }
    onLoadUniverses(selectedUniverses)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h1 className={styles.title}>Welcome to Premises</h1>
        <p className={styles.subtitle}>Check Your Premises</p>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Premises: Concept Visualization & Study Tool
          </h2>
          <p className={styles.description}>
            Premises is a study tool based on Aristotelian and Objectivist
            principles of concept formation. It maps the hierarchical structure
            of knowledge using proper definitions.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>The Genus-Differentia Method</h2>
          <p className={styles.description}>
            This method is the standard for creating objective definitions. It
            locates a concept within a hierarchy and isolates its essential
            nature.
          </p>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>Genus</div>
            <div className={styles.definitionText}>
              The broader category or "parent" concept. It represents the
              essential commonality with other related concepts. To define
              efficiently, you must use the proximate (nearest) genus. For
              example, "canine" is the genus of "dog".
            </div>
          </div>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>Differentia</div>
            <div className={styles.definitionText}>
              The distinguishing characteristic that separates the concept from
              all others within that genus, but which also explains as many
              characteristics as possible. For example, "domesticated"
              differentiates "dog" from other canines.
            </div>
          </div>

          <div className={styles.section}>
            Together, the genus and differentia form a complete definition that
            integrates a concept into the hierarchical structure of knowledge,
            showing both its connections to broader categories and its unique
            identifying features.
          </div>
        </div>

        <div className={styles.section} style={{ display: 'none' }}>
          <h2 className={styles.sectionTitle}>The File Folder Allegory</h2>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>The Folder (Concept)</div>
            <div className={styles.definitionText}>
              The container holding specific items (referents) from reality.
            </div>
          </div>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>The Label (Word)</div>
            <div className={styles.definitionText}>
              The symbol used to identify and retrieve the folder.
            </div>
          </div>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>
              The Description (Definition)
            </div>
            <div className={styles.definitionText}>
              The text written on the folder that identifies exactly what
              belongs inside.
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Rules for Valid Definitions</h2>
          <p className={styles.description}>
            A correct definition must meet three criteria:
          </p>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>Unique to the concept</div>
            <div className={styles.definitionText}>
              It must distinguish the concept from all others.
            </div>
          </div>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>As Short as Possible</div>
            <div className={styles.definitionText}>
              It serves as a tool for mental economy. It is an identification
              code, not a catalog listing everything we know about the concept.
            </div>
          </div>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>As General as Possible</div>
            <div className={styles.definitionText}>
              The differentia should state the Fundamental Characteristic of
              this member of the genus. This is the single trait that causes or
              explains the greatest number of other characteristics for the
              items in this concept.
            </div>
          </div>

          <div className={styles.section}>
            Bear in mind that there is often several ways to define a concept
            correctly. For instance, a human can be defined as a "rational
            animal" or as a "rational mammal". Both definitions are valid as
            they meet all the criteria. But we tend to go with "rational animal"
            because that's how Aristotle originally defined it.
          </div>
        </div>

        <div className={styles.optionsSection}>
          <h2 className={styles.optionsTitle}>How would you like to begin?</h2>

          <div className={styles.optionsContainer}>
            <div className={styles.optionCard}>
              <div className={styles.optionIcon}>📚</div>
              <h3 className={styles.optionTitle}>Load Concept Datasets</h3>
              <p className={styles.optionDescription}>
                Start with predefined concepts from philosophical and scientific
                domains. Select which universes to explore.
              </p>

              <div className={styles.universesCheckboxes}>
                {PREDEFINED_UNIVERSES.map((universe) => (
                  <div key={universe} className={styles.universeCheckbox}>
                    <input
                      type="checkbox"
                      id={`universe-${universe}`}
                      checked={selectedUniverses.includes(universe)}
                      onChange={() => handleUniverseToggle(universe)}
                    />
                    <label htmlFor={`universe-${universe}`}>{universe}</label>
                  </div>
                ))}
                <button
                  onClick={handleSelectAll}
                  className={styles.selectAllButton}
                >
                  {selectedUniverses.length === PREDEFINED_UNIVERSES.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              <button
                onClick={handleLoadUniverses}
                className={styles.optionButton}
              >
                Load {selectedUniverses.length} Universe
                {selectedUniverses.length !== 1 ? 's' : ''}
              </button>
            </div>

            <div className={styles.optionCard}>
              <div className={styles.optionIcon}>📄</div>
              <h3 className={styles.optionTitle}>Start with Blank Slate</h3>
              <p className={styles.optionDescription}>
                Begin with a clean workspace. You can create your own concepts
                from scratch or import your own datasets later.
              </p>
              <button
                onClick={onStartBlank}
                className={`${styles.optionButton} ${styles.blankButton}`}
              >
                Start Blank
              </button>
            </div>
          </div>
        </div>

        <div className={styles.githubContributionSection}>
          <h2 className={styles.sectionTitle}>Help Us Develop Premises</h2>
          <p className={styles.description}>
            Premises is an open-source project that benefits from community
            contributions. Whether you're a developer, philosopher, or educator,
            your input can help improve this tool.
          </p>
          <div className={styles.githubSection}>
            <a
              href="https://github.com/lebbe/premises"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              🚀 View on GitHub & Contribute
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
