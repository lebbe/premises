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
          <h2 className={styles.sectionTitle}>What is Premises?</h2>
          <p className={styles.description}>
            Premises is a concept visualization and study tool based on
            Aristotelian/Objectivist principles of concept formation and
            definition. It provides an interactive environment for exploring
            conceptual relationships, focusing on the hierarchical structure of
            knowledge through genus-differentia definitions.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Understanding Genus-Differentia Definitions
          </h2>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>Genus</div>
            <div className={styles.definitionText}>
              The genus is the broader category or parent concept that a concept
              belongs to. It represents what the concept has in common with
              other related concepts. For example, "animal" is the genus of
              "dog".
            </div>
          </div>

          <div className={styles.definitionBox}>
            <div className={styles.definitionTitle}>Differentia</div>
            <div className={styles.definitionText}>
              The differentia are the distinguishing characteristics that
              separate a concept from others in its genus. These are the
              specific features that make the concept unique within its
              category. For example, "domesticated mammal with four legs that
              barks" differentiates "dog" from other animals.
            </div>
          </div>

          <p className={styles.description}>
            Together, the genus and differentia form a complete definition that
            integrates a concept into the hierarchical structure of knowledge,
            showing both its connections to broader categories and its unique
            identifying features.
          </p>
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
      </div>
    </div>
  )
}

export default SplashScreen
