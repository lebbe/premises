import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  startTransition,
} from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
  type Node,
} from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useLocation, useNavigate } from 'react-router-dom'

import ConceptNode from '../../components/ConceptNode'
import ConceptInfoPanel from '../../components/ConceptInfoPanel'
import AddConceptDialog from '../../components/AddConceptDialog'
import ExportDialog from '../../components/ExportDialog'
import ImportDialog from '../../components/ImportDialog'
import ControlPanel from './ControlPanel'
import { useEditMode } from '../../contexts/EditModeContext'
import {
  importConceptsData,
  applyDagreLayout,
  applyConceptualHierarchyLayout,
} from '../../utils/graphData'
import type { ConceptData, LayoutOptions } from '../../utils/graphData'
import type { ImportResult } from '../../utils/export'
import {
  loadUserConcepts,
  saveUserConcepts,
  loadImportedUniverses,
  saveImportedUniverses,
  clearAllStorage,
} from '../../utils/localStorage'
import { PREDEFINED_UNIVERSES } from '../../utils/constants'
import styles from './StudyView.module.css'

const nodeTypes = {
  concept: ConceptNode,
}

// Default values for URL encoding
const DEFAULTS = {
  traversalDepth: 2,
  direction: 'LR' as const,
  nodeSpacing: 20,
  rankSpacing: 150,
  showGenusEdges: true,
  showDifferentiaEdges: true,
}

// Helper function to encode state to URL hash
const encodeStateToHash = (
  selectedConceptIds: string[],
  traversalDepth: number,
  direction: string,
  nodeSpacing: number,
  rankSpacing: number,
  showGenusEdges: boolean,
  showDifferentiaEdges: boolean,
  selectedUniverses: string[],
  allUniverses: string[],
) => {
  const params = new URLSearchParams()

  if (selectedConceptIds.length > 0) {
    params.set('concepts', selectedConceptIds.join(','))
  }

  if (traversalDepth !== DEFAULTS.traversalDepth) {
    params.set('depth', traversalDepth.toString())
  }

  if (direction !== DEFAULTS.direction) {
    params.set('dir', direction)
  }

  if (nodeSpacing !== DEFAULTS.nodeSpacing) {
    params.set('nodeSpace', nodeSpacing.toString())
  }

  if (rankSpacing !== DEFAULTS.rankSpacing) {
    params.set('rankSpace', rankSpacing.toString())
  }

  if (showGenusEdges !== DEFAULTS.showGenusEdges) {
    params.set('genus', showGenusEdges.toString())
  }

  if (showDifferentiaEdges !== DEFAULTS.showDifferentiaEdges) {
    params.set('diff', showDifferentiaEdges.toString())
  }

  // Only include universes if not all are selected
  const allUniversesSelected =
    allUniverses.length > 0 &&
    selectedUniverses.length === allUniverses.length &&
    allUniverses.every((u) => selectedUniverses.includes(u))

  if (!allUniversesSelected && selectedUniverses.length > 0) {
    params.set('universes', selectedUniverses.join(','))
  }

  return params.toString()
}

// Helper function to decode state from URL hash
const decodeStateFromHash = (hash: string, allUniverses: string[]) => {
  const params = new URLSearchParams(hash.replace('#', ''))

  // Handle backward compatibility: convert old "concept" param to "concepts"
  let selectedConceptIds: string[] = []
  if (params.has('concepts')) {
    selectedConceptIds = params.get('concepts')!.split(',').filter(Boolean)
  } else if (params.has('concept')) {
    // Backward compatibility: single concept becomes array
    const singleConcept = params.get('concept')
    if (singleConcept) {
      selectedConceptIds = [singleConcept]
    }
  }

  return {
    selectedConceptIds,
    needsRedirect: params.has('concept'), // Flag to indicate we need to redirect to new URL format
    traversalDepth: params.has('depth')
      ? parseInt(params.get('depth')!)
      : DEFAULTS.traversalDepth,
    direction: params.get('dir') || DEFAULTS.direction,
    nodeSpacing: params.has('nodeSpace')
      ? parseInt(params.get('nodeSpace')!)
      : DEFAULTS.nodeSpacing,
    rankSpacing: params.has('rankSpace')
      ? parseInt(params.get('rankSpace')!)
      : DEFAULTS.rankSpacing,
    showGenusEdges: params.has('genus')
      ? params.get('genus') === 'true'
      : DEFAULTS.showGenusEdges,
    showDifferentiaEdges: params.has('diff')
      ? params.get('diff') === 'true'
      : DEFAULTS.showDifferentiaEdges,
    selectedUniverses: params.has('universes')
      ? params.get('universes')!.split(',').filter(Boolean)
      : allUniverses, // Default to all universes
  }
}

const StudyView: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [allEdges, setAllEdges] = useState<Edge[]>([]) // Store all edges before filtering
  const [allConcepts, setAllConcepts] = useState<ConceptData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedConcepts, setSelectedConcepts] = useState<ConceptData[]>([])
  const [selectedGraphConcept, setSelectedGraphConcept] =
    useState<ConceptData | null>(null)
  const [traversalDepth, setTraversalDepth] = useState(2)
  const [selectedUniverses, setSelectedUniverses] = useState<string[]>([])
  const [availableUniverses, setAvailableUniverses] = useState<string[]>([])
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    direction: 'LR',
    nodeSpacing: 20,
    rankSpacing: 150,
    edgeSpacing: 10,
    enableDagre: true,
  })
  const [useConceptualHierarchy, setUseConceptualHierarchy] = useState(false)
  const [showGenusEdges, setShowGenusEdges] = useState(true)
  const [showDifferentiaEdges, setShowDifferentiaEdges] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false)
  const [editingConcept, setEditingConcept] = useState<ConceptData | null>(null)
  const [prefilledConceptData, setPrefilledConceptData] = useState<{
    id: string
    label: string
  } | null>(null)
  const { isEditMode, setIsEditMode } = useEditMode()

  // Helper function to generate URL for specific concepts
  const generateConceptUrl = useCallback(
    (conceptIds: string[]) => {
      const hash = encodeStateToHash(
        conceptIds,
        traversalDepth,
        layoutOptions.direction,
        layoutOptions.nodeSpacing,
        layoutOptions.rankSpacing,
        showGenusEdges,
        showDifferentiaEdges,
        selectedUniverses,
        availableUniverses,
      )
      return hash ? `#${hash}` : '#'
    },
    [
      traversalDepth,
      layoutOptions.direction,
      layoutOptions.nodeSpacing,
      layoutOptions.rankSpacing,
      showGenusEdges,
      showDifferentiaEdges,
      selectedUniverses,
      availableUniverses,
    ],
  )

  // Function to calculate dynamic handles for edges based on node positions
  const calculateDynamicHandles = (
    currentNodes: Node[],
    currentEdges: Edge[],
  ) => {
    return currentEdges.map((edge) => {
      const sourceNode = currentNodes.find((n) => n.id === edge.source)
      const targetNode = currentNodes.find((n) => n.id === edge.target)

      if (sourceNode && targetNode) {
        const dx = targetNode.position.x - sourceNode.position.x
        const dy = targetNode.position.y - sourceNode.position.y

        let sourceHandle = 'bottom-source'
        let targetHandle = 'top-target'

        // Determine connection points based on relative positions
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal connection is dominant
          if (dx > 0) {
            // Target is to the right of source
            sourceHandle = 'right-source'
            targetHandle = 'left-target'
          } else {
            // Target is to the left of source
            sourceHandle = 'left-source'
            targetHandle = 'right-target'
          }
        } else {
          // Vertical connection is dominant
          if (dy > 0) {
            // Target is below source
            sourceHandle = 'bottom-source'
            targetHandle = 'top-target'
          } else {
            // Target is above source
            sourceHandle = 'top-source'
            targetHandle = 'bottom-target'
          }
        }

        return {
          ...edge,
          sourceHandle,
          targetHandle,
        }
      }

      return edge
    })
  }

  // Custom onNodesChange handler that recalculates edge attachment points
  const handleNodesChange = (changes: Parameters<typeof onNodesChange>[0]) => {
    // Apply the node changes first
    onNodesChange(changes)

    // Check if any nodes were moved (position changed)
    const hasPositionChanges = changes.some(
      (change) => change.type === 'position' && change.dragging === false,
    )

    if (hasPositionChanges) {
      // Recalculate edge handles after a slight delay to ensure nodes state is updated
      setTimeout(() => {
        setEdges((currentEdges) => {
          setNodes((currentNodes) => {
            const updatedEdges = calculateDynamicHandles(
              currentNodes,
              currentEdges,
            )
            setEdges(updatedEdges)
            return currentNodes
          })
          return currentEdges
        })
      }, 0)
    }
  }

  // Load concepts data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load predefined datasets
        const conceptsData = await importConceptsData(
          PREDEFINED_UNIVERSES as unknown as string[],
        )

        // Load user-defined concepts from localStorage
        const userConcepts = loadUserConcepts()

        // Merge concepts, with user concepts taking precedence
        const conceptMap = new Map(conceptsData.map((c) => [c.id, c]))
        userConcepts.forEach((concept) => {
          conceptMap.set(concept.id, concept) // User concepts override predefined ones
        })

        const allConceptsData = Array.from(conceptMap.values())
        setAllConcepts(allConceptsData)

        // Extract unique universes
        const universes = Array.from(
          new Set(allConceptsData.map((c: ConceptData) => c.universeId)),
        )
        setAvailableUniverses(universes)

        // Load previously imported universes or select all by default
        const importedUniverses = loadImportedUniverses()
        if (importedUniverses.length > 0) {
          // Use previously imported/selected universes
          setSelectedUniverses(importedUniverses)
        } else {
          // First time - select all by default
          setSelectedUniverses(universes)
          saveImportedUniverses(universes)
        }
      } catch (error) {
        console.error('Failed to load concepts:', error)
      }
    }
    loadData()
  }, [])

  // Parse URL hash on mount and when data is loaded
  useEffect(() => {
    if (availableUniverses.length === 0 || allConcepts.length === 0) return

    const hash = location.hash

    // Use startTransition to batch state updates and avoid cascading render warnings
    startTransition(() => {
      // If no hash, clear selected concept and reset to defaults
      if (!hash || hash === '#') {
        setSelectedConcepts([])
        setSelectedGraphConcept(null)
        setTraversalDepth(DEFAULTS.traversalDepth)
        setLayoutOptions((prev) => ({
          ...prev,
          direction: DEFAULTS.direction,
          nodeSpacing: DEFAULTS.nodeSpacing,
          rankSpacing: DEFAULTS.rankSpacing,
        }))
        setShowGenusEdges(DEFAULTS.showGenusEdges)
        setShowDifferentiaEdges(DEFAULTS.showDifferentiaEdges)
        setSelectedUniverses(availableUniverses) // Select all by default
        return
      }

      const decoded = decodeStateFromHash(hash, availableUniverses)

      // Apply decoded state
      setTraversalDepth(decoded.traversalDepth)
      setLayoutOptions((prev) => ({
        ...prev,
        direction: decoded.direction as 'TB' | 'BT' | 'LR' | 'RL',
        nodeSpacing: decoded.nodeSpacing,
        rankSpacing: decoded.rankSpacing,
      }))
      setShowGenusEdges(decoded.showGenusEdges)
      setShowDifferentiaEdges(decoded.showDifferentiaEdges)
      setSelectedUniverses(decoded.selectedUniverses)

      // Set selected concepts if specified in URL
      if (decoded.selectedConceptIds.length > 0) {
        const concepts = allConcepts.filter((c) =>
          decoded.selectedConceptIds.includes(c.id),
        )
        setSelectedConcepts(concepts)
      } else {
        setSelectedConcepts([])
      }

      // Handle backward compatibility redirect
      if (decoded.needsRedirect) {
        // Redirect from old #concept=id format to new #concepts=id format
        const newHash = encodeStateToHash(
          decoded.selectedConceptIds,
          decoded.traversalDepth,
          decoded.direction,
          decoded.nodeSpacing,
          decoded.rankSpacing,
          decoded.showGenusEdges,
          decoded.showDifferentiaEdges,
          decoded.selectedUniverses,
          availableUniverses,
        )
        const newUrl = newHash ? `#${newHash}` : '#'
        navigate(newUrl, { replace: true }) // Use replace to avoid adding to history
      }
    })
  }, [location.hash, availableUniverses, allConcepts])

  // Update URL when traversal depth or layout options change
  useEffect(() => {
    if (availableUniverses.length === 0 || selectedConcepts.length === 0) return

    const newUrl = generateConceptUrl(selectedConcepts.map((c) => c.id))
    if (newUrl !== location.hash) {
      navigate(newUrl, { replace: true })
    }
  }, [
    traversalDepth,
    layoutOptions.direction,
    layoutOptions.nodeSpacing,
    layoutOptions.rankSpacing,
    showGenusEdges,
    showDifferentiaEdges,
    selectedUniverses,
    selectedConcepts,
    availableUniverses,
    generateConceptUrl,
    navigate,
    location.hash,
  ])

  // Filter concepts based on selected universes
  const filteredConcepts = useMemo(() => {
    return allConcepts.filter((concept) =>
      selectedUniverses.includes(concept.universeId),
    )
  }, [allConcepts, selectedUniverses])

  // Search functionality with focus support and universe weighting
  const searchResults = useMemo(() => {
    // Show suggestions when focused, even without search term
    const shouldShowResults = isSearchFocused && (searchTerm.trim() || true)
    if (!shouldShowResults) return []

    const term = searchTerm.toLowerCase()

    // Get all matching concepts or top concepts if no search term
    const matchingConcepts = searchTerm.trim()
      ? filteredConcepts.filter(
          (concept) =>
            concept.id.toLowerCase().includes(term) ||
            concept.label.toLowerCase().includes(term),
        )
      : filteredConcepts // Show all when focused but no search term

    // Sort with Ayn Rand universe concepts first, then by relevance
    const sortedConcepts = matchingConcepts.sort((a, b) => {
      // First priority: Ayn Rand universe
      const aIsAynRand = a.universeId === 'Ayn Rand'
      const bIsAynRand = b.universeId === 'Ayn Rand'

      if (aIsAynRand && !bIsAynRand) return -1
      if (!aIsAynRand && bIsAynRand) return 1

      // Second priority: exact label match
      if (searchTerm.trim()) {
        const aLabelExact = a.label.toLowerCase() === term
        const bLabelExact = b.label.toLowerCase() === term

        if (aLabelExact && !bLabelExact) return -1
        if (!aLabelExact && bLabelExact) return 1

        // Third priority: label starts with term
        const aLabelStarts = a.label.toLowerCase().startsWith(term)
        const bLabelStarts = b.label.toLowerCase().startsWith(term)

        if (aLabelStarts && !bLabelStarts) return -1
        if (!aLabelStarts && bLabelStarts) return 1
      }

      // Finally: alphabetical by label
      return a.label.localeCompare(b.label)
    })

    return sortedConcepts.slice(0, 15) // Show more results when focused
  }, [filteredConcepts, searchTerm, isSearchFocused])

  // Create focused graph when concepts are selected
  useEffect(() => {
    if (selectedConcepts.length === 0) {
      setNodes([])
      setEdges([])
      return
    }

    const createFocusedGraph = () => {
      const visitedNodes = new Set<string>()
      const resultNodes: Node[] = []
      const resultEdges: Edge[] = []
      const virtualNodesMap = new Map<
        string,
        { label: string; type: string; position: { x: number; y: number } }
      >()

      // Start with all selected concepts
      const queue: Array<{
        concept: ConceptData
        depth: number
        position?: { x: number; y: number }
      }> = selectedConcepts.map((concept, index) => ({
        concept,
        depth: 0,
        position: { x: index * 300, y: 0 }, // Arrange selected concepts horizontally
      }))

      while (queue.length > 0) {
        const { concept, depth, position } = queue.shift()!

        if (visitedNodes.has(concept.id) || depth > traversalDepth) {
          continue
        }

        visitedNodes.add(concept.id)

        // Add node
        resultNodes.push({
          id: concept.id,
          type: 'concept',
          position: position || {
            x: Math.random() * 400,
            y: Math.random() * 400,
          },
          data: {
            concept,
            isVirtual: false,
            isCentralNode: depth === 0,
            url: generateConceptUrl([concept.id]), // Add URL for right-click functionality
          },
        })

        if (depth < traversalDepth) {
          // Only find the direct genus and differentia of this concept
          // Do NOT find concepts that use this concept as their genus/differentia
          const relatedConcepts: Array<{
            concept: ConceptData
            relation: string
          }> = []

          // Add this concept's genus if it exists
          if (concept.definition?.genus) {
            const genus = concept.definition.genus
            const genusNode = filteredConcepts.find((c) => c.id === genus.id)
            if (genusNode) {
              relatedConcepts.push({
                concept: genusNode,
                relation: 'parent-genus',
              })
            } else {
              // Create virtual node for missing genus
              const virtualId = `genus-${genus.id.toLowerCase().replace(/\s+/g, '-')}`
              if (!virtualNodesMap.has(virtualId)) {
                const angle = (relatedConcepts.length / 5) * 2 * Math.PI
                const radius = 200
                virtualNodesMap.set(virtualId, {
                  label: genus.id,
                  type: 'virtual genus',
                  position: {
                    x: (position?.x || 0) + Math.cos(angle) * radius,
                    y: (position?.y || 0) + Math.sin(angle) * radius,
                  },
                })
              }
            }
          }

          // Add this concept's differentia if they exist
          if (concept.definition?.differentia) {
            concept.definition.differentia.forEach((diff) => {
              const diffNode = filteredConcepts.find((c) => c.id === diff.id)
              if (diffNode) {
                relatedConcepts.push({
                  concept: diffNode,
                  relation: 'parent-differentia',
                })
              } else {
                // Create virtual node for missing differentia
                const virtualId = `diff-${diff.id.toLowerCase().replace(/\s+/g, '-')}`
                if (!virtualNodesMap.has(virtualId)) {
                  const angle =
                    ((relatedConcepts.length + virtualNodesMap.size) / 5) *
                    2 *
                    Math.PI
                  const radius = 200
                  virtualNodesMap.set(virtualId, {
                    label: diff.id,
                    type: 'virtual differentia',
                    position: {
                      x: (position?.x || 0) + Math.cos(angle) * radius,
                      y: (position?.y || 0) + Math.sin(angle) * radius,
                    },
                  })
                }
              }
            })
          }

          // Add related concepts to queue and create edges
          relatedConcepts.forEach(
            ({ concept: relatedConcept, relation }, index) => {
              if (!visitedNodes.has(relatedConcept.id)) {
                // Calculate position in a circle around the current node
                const angle = (index / relatedConcepts.length) * 2 * Math.PI
                const radius = 200
                const newPosition = {
                  x: (position?.x || 0) + Math.cos(angle) * radius,
                  y: (position?.y || 0) + Math.sin(angle) * radius,
                }

                queue.push({
                  concept: relatedConcept,
                  depth: depth + 1,
                  position: newPosition,
                })
              }

              // Create edge (without filtering - we'll filter separately)
              const edgeId = `${concept.id}-${relatedConcept.id}-${relation}`
              if (!resultEdges.find((e) => e.id === edgeId)) {
                let sourceId, targetId, edgeLabel

                switch (relation) {
                  case 'parent-genus':
                    sourceId = concept.id
                    targetId = relatedConcept.id
                    edgeLabel = concept.definition.genus?.label || undefined
                    break
                  case 'parent-differentia':
                    sourceId = concept.id
                    targetId = relatedConcept.id
                    const diffEdge = concept.definition.differentia.find(
                      (d) => d.id === relatedConcept.id,
                    )
                    edgeLabel = diffEdge?.label || undefined
                    break
                  default:
                    sourceId = concept.id
                    targetId = relatedConcept.id
                    edgeLabel = undefined
                }

                resultEdges.push({
                  id: edgeId,
                  source: sourceId,
                  target: targetId,
                  label: edgeLabel,
                  type: 'straight',
                  data: { relation }, // Store relation for filtering
                  style: {
                    stroke: relation.includes('genus') ? '#2563eb' : '#dc2626',
                    strokeWidth: 2,
                  },
                  markerEnd: {
                    type: 'arrowclosed',
                    color: relation.includes('genus') ? '#2563eb' : '#dc2626',
                    width: 20,
                    height: 20,
                  },
                })
              }
            },
          )
        }
      }

      // Add virtual nodes and their edges
      virtualNodesMap.forEach((nodeInfo, virtualId) => {
        resultNodes.push({
          id: virtualId,
          type: 'concept',
          position: nodeInfo.position,
          data: {
            label: nodeInfo.label,
            definition: `Virtual node for ${nodeInfo.type}`,
            type: nodeInfo.type,
            genus: null,
            differentia: [],
            isVirtual: true,
            virtualConceptId: nodeInfo.label, // Store the original concept ID
          },
        })

        // Create edges from concepts to virtual nodes
        // Find the concepts that reference this virtual node
        resultNodes.forEach((node) => {
          if (node.data.isVirtual) return
          const concept = node.data.concept as ConceptData

          if (nodeInfo.type === 'virtual genus') {
            if (concept.definition?.genus?.id === nodeInfo.label) {
              const edgeId = `${node.id}-${virtualId}-parent-genus`
              if (!resultEdges.find((e) => e.id === edgeId)) {
                resultEdges.push({
                  id: edgeId,
                  source: node.id,
                  target: virtualId,
                  label: concept.definition.genus.label || undefined,
                  type: 'straight',
                  data: { relation: 'parent-genus' },
                  style: {
                    stroke: '#2563eb',
                    strokeWidth: 2,
                  },
                  markerEnd: {
                    type: 'arrowclosed',
                    color: '#2563eb',
                    width: 20,
                    height: 20,
                  },
                })
              }
            }
          } else if (nodeInfo.type === 'virtual differentia') {
            if (
              concept.definition?.differentia?.some(
                (diff) => diff.id === nodeInfo.label,
              )
            ) {
              const differentia = concept.definition.differentia.find(
                (diff) => diff.id === nodeInfo.label,
              )
              const edgeId = `${node.id}-${virtualId}-parent-differentia`
              if (!resultEdges.find((e) => e.id === edgeId)) {
                resultEdges.push({
                  id: edgeId,
                  source: node.id,
                  target: virtualId,
                  label: differentia?.label || undefined,
                  type: 'straight',
                  data: { relation: 'parent-differentia' },
                  style: {
                    stroke: '#dc2626',
                    strokeWidth: 2,
                  },
                  markerEnd: {
                    type: 'arrowclosed',
                    color: '#dc2626',
                    width: 20,
                    height: 20,
                  },
                })
              }
            }
          }
        })
      })

      // Apply layout (conceptual hierarchy or standard dagre)
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        useConceptualHierarchy
          ? applyConceptualHierarchyLayout(
              resultNodes,
              resultEdges,
              layoutOptions,
              selectedConcepts[0]?.id || '',
            )
          : applyDagreLayout(resultNodes, resultEdges, layoutOptions)

      // Calculate dynamic connection points based on final node positions
      const finalEdges = layoutedEdges.map((edge) => {
        const sourceNode = layoutedNodes.find((n) => n.id === edge.source)
        const targetNode = layoutedNodes.find((n) => n.id === edge.target)

        if (sourceNode && targetNode) {
          const dx = targetNode.position.x - sourceNode.position.x
          const dy = targetNode.position.y - sourceNode.position.y

          let sourceHandle = 'bottom-source'
          let targetHandle = 'top-target'

          // Determine connection points based on relative positions
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection is dominant
            if (dx > 0) {
              // Target is to the right of source
              sourceHandle = 'right-source'
              targetHandle = 'left-target'
            } else {
              // Target is to the left of source
              sourceHandle = 'left-source'
              targetHandle = 'right-target'
            }
          } else {
            // Vertical connection is dominant
            if (dy > 0) {
              // Target is below source
              sourceHandle = 'bottom-source'
              targetHandle = 'top-target'
            } else {
              // Target is above source
              sourceHandle = 'top-source'
              targetHandle = 'bottom-target'
            }
          }

          return {
            ...edge,
            sourceHandle,
            targetHandle,
          }
        }

        return edge
      })

      setNodes(layoutedNodes)
      setAllEdges(finalEdges) // Store all edges

      // Apply current edge filtering
      const filteredEdges = finalEdges.filter((edge) => {
        const relation = (edge.data?.relation || edge.label) as string
        if (relation?.includes('genus')) {
          return showGenusEdges
        }
        if (relation?.includes('differentia')) {
          return showDifferentiaEdges
        }
        return true
      })

      setEdges(filteredEdges)
    }

    createFocusedGraph()
  }, [
    selectedConcepts,
    traversalDepth,
    filteredConcepts,
    layoutOptions,
    useConceptualHierarchy,
    showGenusEdges,
    showDifferentiaEdges,
    setNodes,
    setEdges,
    generateConceptUrl,
  ])

  // Filter edges based on edge type toggles (preserves node positions)
  useEffect(() => {
    const filteredEdges = allEdges.filter((edge) => {
      const relation = (edge.data?.relation || edge.label) as string
      if (relation?.includes('genus')) {
        return showGenusEdges
      }
      if (relation?.includes('differentia')) {
        return showDifferentiaEdges
      }
      return true
    })
    setEdges(filteredEdges)
  }, [showGenusEdges, showDifferentiaEdges, allEdges, setEdges])

  // Update document title when selected concepts change
  useEffect(() => {
    if (selectedConcepts.length > 0) {
      const title =
        selectedConcepts.length === 1
          ? `${selectedConcepts[0].label} - Concept Study`
          : `${selectedConcepts.length} Concepts - Concept Study`
      document.title = title
    } else {
      document.title = 'Concept Study View'
    }
  }, [selectedConcepts])

  const handleUniverseToggle = (universeId: string) => {
    setSelectedUniverses((prev) => {
      const updated = prev.includes(universeId)
        ? prev.filter((id) => id !== universeId)
        : [...prev, universeId]

      // Save updated selection to localStorage
      saveImportedUniverses(updated)

      return updated
    })
  }

  const handleAddConcept = (newConcept: ConceptData) => {
    // Add to allConcepts array
    setAllConcepts((prev) => {
      const updated = [...prev, newConcept]
      // Save to localStorage whenever a new concept is added
      saveUserConcepts(updated)
      return updated
    })

    // Add universe to available list if it's new
    if (!availableUniverses.includes(newConcept.universeId)) {
      setAvailableUniverses((prev) => [...prev, newConcept.universeId])
      setSelectedUniverses((prev) => {
        const updated = [...prev, newConcept.universeId]
        saveImportedUniverses(updated)
        return updated
      })
    }

    // Close dialog
    setShowAddDialog(false)

    // Auto-select the new concept and update URL
    setSelectedConcepts((prev) => {
      const newConcepts = [...prev, newConcept]
      const newUrl = generateConceptUrl(newConcepts.map((c) => c.id))
      navigate(newUrl, { replace: false })
      return newConcepts
    })
  }

  const handleUpdateConcept = (updatedConcept: ConceptData) => {
    // Find the original concept to check if ID changed
    const originalConcept = allConcepts.find((c) => c.id === editingConcept?.id)
    const originalId = originalConcept?.id
    const newId = updatedConcept.id

    // Update all concepts - handle ID changes by updating references
    setAllConcepts((prev) => {
      const updatedConcepts = prev.map((concept) => {
        if (concept.id === originalId) {
          // This is the concept being edited - replace it entirely
          return updatedConcept
        } else if (originalId && originalId !== newId) {
          // Check if this concept references the old ID and update references
          const needsUpdate =
            concept.definition.genus?.id === originalId ||
            concept.definition.differentia.some(
              (diff) => diff.id === originalId,
            )

          if (needsUpdate) {
            return {
              ...concept,
              definition: {
                ...concept.definition,
                genus:
                  concept.definition.genus?.id === originalId
                    ? { ...concept.definition.genus, id: newId }
                    : concept.definition.genus,
                differentia: concept.definition.differentia.map((diff) =>
                  diff.id === originalId ? { ...diff, id: newId } : diff,
                ),
              },
            }
          }
        }
        // Always return the concept (unchanged if no updates needed)
        return concept
      })

      // Save to localStorage whenever a concept is edited
      saveUserConcepts(updatedConcepts)

      return updatedConcepts
    })

    // Update selected concepts if the edited concept was selected
    setSelectedConcepts((prev) =>
      prev.map((c) => (c.id === originalId ? updatedConcept : c)),
    )

    // Close dialog and clear selected graph concept
    setEditingConcept(null)
    setSelectedGraphConcept(null)
  }

  const handleImportConcepts = (
    updatedConcepts: ConceptData[],
    importResult: ImportResult,
  ) => {
    // Update concepts
    setAllConcepts(updatedConcepts)

    // Save to localStorage after importing
    saveUserConcepts(updatedConcepts)

    // Update universes if new ones were added
    if (importResult.newUniverses.length > 0) {
      setAvailableUniverses((prev) => {
        const newUniverses = [...prev, ...importResult.newUniverses]
        return Array.from(new Set(newUniverses)).sort()
      })

      // Auto-select new universes
      setSelectedUniverses((prev) => {
        const updated = [...prev, ...importResult.newUniverses]
        const uniqueUpdated = Array.from(new Set(updated))
        saveImportedUniverses(uniqueUpdated)
        return uniqueUpdated
      })
    }

    // Show success message
    const overwriteMsg =
      importResult.overwrittenConcepts > 0
        ? ` (${importResult.overwrittenConcepts} concepts were overwritten)`
        : ''

    alert(
      `Successfully imported ${importResult.totalConcepts} concepts${overwriteMsg}`,
    )

    // Close dialog
    setShowImportDialog(false)
  }

  const handleClearAll = () => {
    // Reset all state to empty - this will immediately update the UI
    setAllConcepts([])
    setAvailableUniverses([])
    setSelectedUniverses([])
    setSelectedConcepts([])

    // Clear localStorage
    clearAllStorage()

    // Clear the URL hash to reset to default state
    window.location.hash = ''
  }

  const handleConceptSelect = (concept: ConceptData) => {
    // Add to selected concepts if not already selected
    setSelectedConcepts((prev) => {
      if (prev.some((c) => c.id === concept.id)) {
        return prev // Already selected
      }
      return [...prev, concept]
    })
    setSearchTerm('')
    // Navigate to URL with updated concepts
    setSelectedConcepts((prev) => {
      const newConcepts = prev.some((c) => c.id === concept.id)
        ? prev
        : [...prev, concept]
      const newUrl = generateConceptUrl(newConcepts.map((c) => c.id))
      navigate(newUrl, { replace: false })
      return newConcepts
    })
  }

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    // Check if this is a virtual node
    const isVirtual = node.data.isVirtual === true

    if (isVirtual && isEditMode) {
      // In edit mode, clicking a virtual node opens the add dialog with pre-filled data
      const virtualConceptId = node.data.virtualConceptId as string
      const label =
        virtualConceptId.charAt(0).toUpperCase() + virtualConceptId.slice(1)
      setPrefilledConceptData({
        id: virtualConceptId,
        label: label,
      })
      setShowAddDialog(true)
    } else if (!isVirtual) {
      // Find the full concept data from our loaded concepts
      const fullConcept = filteredConcepts.find((c) => c.id === node.id)
      if (fullConcept) {
        if (isEditMode) {
          // In edit mode, open the edit dialog
          setEditingConcept(fullConcept)
        } else {
          // In normal mode, show the info panel
          setSelectedGraphConcept(fullConcept)
          // Don't set as selected concept - that should be done via the info panel button
        }
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Concept Study View</h1>
        <div className={styles.headerToolbar}>
          <label className={styles.editModeToggle}>
            <input
              type="checkbox"
              checked={isEditMode}
              onChange={(e) => setIsEditMode(e.target.checked)}
            />
            Enable Edit Mode
          </label>
          <button
            onClick={() => setShowImportDialog(true)}
            className={styles.importButton}
          >
            📁 Import
          </button>
          <button
            onClick={() => setShowExportDialog(true)}
            className={styles.exportButton}
          >
            📤 Export
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className={styles.addConceptButton}
          >
            ➕ Add Concept
          </button>
          <button
            onClick={() => setShowClearConfirmDialog(true)}
            className={styles.clearAllButton}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search concepts by ID or label..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Delay hiding to allow clicks on search results
                setTimeout(() => setIsSearchFocused(false), 200)
              }}
              className={styles.searchInput}
            />

            {isSearchFocused && searchResults.length > 0 && (
              <div className={styles.searchResults}>
                {searchResults.length > 0 ? (
                  searchResults.map((concept) => (
                    <div
                      key={concept.id}
                      className={styles.searchResult}
                      onClick={() => handleConceptSelect(concept)}
                    >
                      <div className={styles.conceptLabel}>{concept.label}</div>
                      <div className={styles.conceptId}>ID: {concept.id}</div>
                      <div className={styles.conceptUniverse}>
                        Universe: {concept.universeId}
                      </div>
                    </div>
                  ))
                ) : searchTerm.trim() ? (
                  <div className={styles.noResults}>
                    No concepts found for "{searchTerm}"
                  </div>
                ) : (
                  <div className={styles.searchHint}>
                    Start typing to search, or browse all concepts below
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedConcepts.length > 0 && (
            <div className={styles.selectedConceptsContainer}>
              <div className={styles.selectedConceptsScroll}>
                {selectedConcepts.map((concept) => (
                  <div key={concept.id} className={styles.selectedConceptCard}>
                    <button
                      onClick={() => {
                        // Remove this concept from selection
                        setSelectedConcepts((prev) => {
                          const newConcepts = prev.filter(
                            (c) => c.id !== concept.id,
                          )
                          const newUrl = generateConceptUrl(
                            newConcepts.map((c) => c.id),
                          )
                          navigate(newUrl, { replace: false })
                          return newConcepts
                        })
                      }}
                      className={styles.removeConceptButton}
                      aria-label={`Remove ${concept.label}`}
                    >
                      ×
                    </button>
                    <h4>{concept.label}</h4>
                    <p>{concept.definition?.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>{' '}
      <div className={styles.graphContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          connectionLineType={ConnectionLineType.Straight}
          fitView
          fitViewOptions={{ padding: 0.1 }}
        >
          <Background />
          <Controls />
          <MiniMap />

          {/* Control Panel */}
          <ControlPanel
            traversalDepth={traversalDepth}
            setTraversalDepth={setTraversalDepth}
            layoutOptions={layoutOptions}
            setLayoutOptions={setLayoutOptions}
            useConceptualHierarchy={useConceptualHierarchy}
            setUseConceptualHierarchy={setUseConceptualHierarchy}
            showGenusEdges={showGenusEdges}
            setShowGenusEdges={setShowGenusEdges}
            showDifferentiaEdges={showDifferentiaEdges}
            setShowDifferentiaEdges={setShowDifferentiaEdges}
            availableUniverses={availableUniverses}
            selectedUniverses={selectedUniverses}
            handleUniverseToggle={handleUniverseToggle}
          />

          {/* Selected Graph Node Info Panel */}
          {selectedGraphConcept && (
            <Panel position="top-right" className={styles.infoPanel}>
              <ConceptInfoPanel
                concept={selectedGraphConcept}
                onClose={() => setSelectedGraphConcept(null)}
                onFocus={() => {}} // Empty function since we use href navigation
                isSelected={selectedConcepts.some(
                  (c) => c.id === selectedGraphConcept.id,
                )}
                conceptUrl={generateConceptUrl([selectedGraphConcept.id])}
              />
            </Panel>
          )}
        </ReactFlow>
      </div>
      <AddConceptDialog
        isOpen={showAddDialog || editingConcept !== null}
        onClose={() => {
          setShowAddDialog(false)
          setEditingConcept(null)
          setPrefilledConceptData(null)
        }}
        onSave={editingConcept ? handleUpdateConcept : handleAddConcept}
        existingConcepts={allConcepts}
        existingUniverses={availableUniverses}
        editingConcept={editingConcept}
        prefilledData={prefilledConceptData}
      />
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        allConcepts={allConcepts}
      />
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        allConcepts={allConcepts}
        onImport={handleImportConcepts}
      />
      {/* Clear All Confirmation Dialog */}
      {showClearConfirmDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Clear All Concepts</h3>
            <p>
              This will remove all concepts and reset the application to a blank
              state. Are you sure?
            </p>
            <p className={styles.warningText}>
              ⚠️ This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowClearConfirmDialog(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleClearAll()
                  setShowClearConfirmDialog(false)
                }}
                className={styles.confirmClearButton}
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudyView
