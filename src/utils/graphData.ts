import type { Node, Edge } from '@xyflow/react'
import dagre from 'dagre'

export interface LayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL'
  nodeSpacing: number
  rankSpacing: number
  edgeSpacing: number
  enableDagre: boolean
}

export interface ConceptData {
  id: string
  universeId: string
  type: string
  label: string
  definition: {
    text: string
    genus: string | null
    differentia: string[]
    source: string
  }
  perceptualRoots?: string[]
}

// Function to apply dagre layout
export const applyDagreLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions,
): { nodes: Node[]; edges: Edge[] } => {
  if (!options.enableDagre) {
    return { nodes, edges }
  }

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: options.direction,
    nodesep: options.nodeSpacing,
    ranksep: options.rankSpacing,
    edgesep: options.edgeSpacing,
  })

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: 150,
      height: 80,
    })
  })

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  // Apply calculated positions to nodes
  const layoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75, // Center the node
        y: nodeWithPosition.y - 40,
      },
    }
  })

  return {
    nodes: layoutedNodes,
    edges,
  }
}

// Function to apply conceptual hierarchy layout (genus above, differentia below)
export const applyConceptualHierarchyLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions,
  centralConceptId: string,
): { nodes: Node[]; edges: Edge[] } => {
  if (!options.enableDagre) {
    return { nodes, edges }
  }

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB', // Force top-bottom for conceptual hierarchy
    nodesep: options.nodeSpacing,
    ranksep: options.rankSpacing,
    edgesep: options.edgeSpacing,
  })

  // Build genus chain and differentia map
  const genusRelations = new Map<string, string>() // child -> parent
  const differentiaRelations = new Map<string, string[]>() // concept -> differentia

  // Parse all relationships
  edges.forEach((edge) => {
    const relation = (edge.data?.relation || edge.label) as string
    if (relation?.includes('genus')) {
      genusRelations.set(edge.source, edge.target)
    } else if (relation?.includes('differentia')) {
      if (!differentiaRelations.has(edge.source)) {
        differentiaRelations.set(edge.source, [])
      }
      differentiaRelations.get(edge.source)!.push(edge.target)
    }
  })

  // Build genus hierarchy starting from central concept
  const nodeRanks = new Map<string, number>()
  const centralRank = 0

  // Step 1: Build genus chain upward from central concept
  let currentConcept = centralConceptId
  let currentRank = centralRank
  nodeRanks.set(currentConcept, currentRank)

  // Go up the genus chain
  while (genusRelations.has(currentConcept)) {
    const genus = genusRelations.get(currentConcept)!
    currentRank -= 1 // Genus goes above (negative rank)
    nodeRanks.set(genus, currentRank)
    currentConcept = genus
  }

  // Step 2: Place differentia below their respective concepts
  differentiaRelations.forEach((differentiaList, conceptId) => {
    const conceptRank = nodeRanks.get(conceptId)
    if (conceptRank !== undefined) {
      differentiaList.forEach((differentia) => {
        // Place differentia below the concept that uses it
        nodeRanks.set(differentia, conceptRank + 1)
      })
    }
  })

  // Step 3: Handle any remaining nodes that aren't in the hierarchy
  nodes.forEach((node) => {
    if (!nodeRanks.has(node.id)) {
      // Place unrelated nodes at the same level as central concept
      nodeRanks.set(node.id, centralRank)
    }
  })

  // Add nodes to dagre graph with calculated ranks
  nodes.forEach((node) => {
    const rank = nodeRanks.get(node.id) ?? centralRank
    dagreGraph.setNode(node.id, {
      width: 150,
      height: 80,
      rank: rank,
    })
  })

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  // Apply calculated positions to nodes
  const layoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75, // Center the node
        y: nodeWithPosition.y - 40,
      },
    }
  })

  return {
    nodes: layoutedNodes,
    edges,
  }
}
const importConceptsData = async (
  universeIds?: string[],
): Promise<ConceptData[]> => {
  // Load all available data sources
  const dataSources = [
    { id: 'Ayn Rand', file: 'ayn_rand_definitions.json' },
    { id: 'LLM layer genus 1', file: 'llm_layer_genus_1.json' },
    { id: 'LLM layer genus 2', file: 'llm_layer_genus_2.json' },
    { id: 'LLM layer differentia 1', file: 'llm_layer_differentia_1.json' },
    { id: 'LLM layer differentia 2', file: 'llm_layer_differentia_2.json' },
  ]

  if (universeIds && universeIds.length > 0) {
    // Load specific universe data
    const allData: ConceptData[] = []
    for (const universeId of universeIds) {
      const source = dataSources.find((s) => s.id === universeId)
      if (source) {
        try {
          const response = await fetch(source.file)
          const data = await response.json()
          allData.push(...data)
        } catch (error) {
          console.warn(`Failed to load ${source.file}:`, error)
        }
      }
    }
    return allData
  }

  // Load and combine all data if no specific universes requested
  const allData: ConceptData[] = []
  for (const source of dataSources) {
    try {
      const response = await fetch(source.file)
      const data = await response.json()
      allData.push(...data)
    } catch (error) {
      console.warn(`Failed to load ${source.file}:`, error)
    }
  }

  return allData
}

// Function to get available universe IDs
export const getAvailableUniverses = async (): Promise<string[]> => {
  const allData = await importConceptsData()
  const universes = [...new Set(allData.map((concept) => concept.universeId))]
  return universes.sort()
}

// Function to create nodes from the concepts data
export const createNodes = (conceptsData: ConceptData[]): Node[] => {
  return conceptsData.map((concept: ConceptData, index) => {
    // Create a more organized layout
    const row = Math.floor(index / 5)
    const col = index % 5
    const x = col * 200 + Math.random() * 50
    const y = row * 150 + Math.random() * 50

    return {
      id: concept.id,
      type: 'concept',
      data: {
        id: concept.id,
        universeId: concept.universeId,
        label: concept.label,
        definition: concept.definition.text,
        type: concept.type,
        genus: concept.definition.genus,
        differentia: concept.definition.differentia,
        source: concept.definition.source,
        perceptualRoots: concept.perceptualRoots,
      },
      position: { x, y },
    }
  })
}

// Function to create edges based on genus relationships
export const createGenusEdges = (conceptsData: ConceptData[]): Edge[] => {
  const edges: Edge[] = []
  const conceptMap = new Map(conceptsData.map((c) => [c.id, c]))

  conceptsData.forEach((concept) => {
    if (concept.definition.genus) {
      // Try to find a concept that matches the genus by ID
      const targetConcept = conceptMap.get(concept.definition.genus)
      if (targetConcept) {
        edges.push({
          id: `${concept.id}-${targetConcept.id}`,
          source: concept.id,
          target: targetConcept.id,
          type: 'default',
          style: { stroke: '#666', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#666' },
          label: 'genus',
          data: { edgeType: 'genus' },
        })
      } else {
        // Create a virtual node for the genus if it doesn't exist in our concepts
        const genusNodeId = `genus-${concept.definition.genus
          .toLowerCase()
          .replace(/\s+/g, '-')}`
        edges.push({
          id: `${concept.id}-${genusNodeId}`,
          source: concept.id,
          target: genusNodeId,
          type: 'default',
          style: { stroke: '#999', strokeWidth: 1, strokeDasharray: '5,5' },
          markerEnd: { type: 'arrowclosed', color: '#999' },
          label: 'genus',
          data: { edgeType: 'genus' },
        })
      }
    }
  })

  return edges
}

// Function to create edges based on differentia relationships
export const createDifferentiaEdges = (conceptsData: ConceptData[]): Edge[] => {
  const edges: Edge[] = []
  const conceptMap = new Map(conceptsData.map((c) => [c.id, c]))

  conceptsData.forEach((concept) => {
    concept.definition.differentia.forEach((diff) => {
      // Try to find a concept that matches the differentia by ID
      const targetConcept = conceptMap.get(diff)
      if (targetConcept && targetConcept.id !== concept.id) {
        edges.push({
          id: `diff-${concept.id}-${targetConcept.id}`,
          source: concept.id,
          target: targetConcept.id,
          type: 'default',
          style: { stroke: '#e74c3c', strokeWidth: 2, strokeDasharray: '3,3' },
          markerEnd: { type: 'arrowclosed', color: '#e74c3c' },
          label: 'differentia',
          data: { edgeType: 'differentia' },
        })
      } else {
        // Create a virtual node for the differentia if it doesn't exist in our concepts
        const differentiaNodeId = `diff-${diff
          .toLowerCase()
          .replace(/\s+/g, '-')}`
        edges.push({
          id: `diff-${concept.id}-${differentiaNodeId}`,
          source: concept.id,
          target: differentiaNodeId,
          type: 'default',
          style: { stroke: '#c39bd3', strokeWidth: 1, strokeDasharray: '3,3' },
          markerEnd: { type: 'arrowclosed', color: '#c39bd3' },
          label: 'differentia',
          data: { edgeType: 'differentia' },
        })
      }
    })
  })

  return edges
}

// Function to create virtual nodes for differentia concepts that don't exist in our data
export const createVirtualDifferentiaNodes = (
  conceptsData: ConceptData[],
): Node[] => {
  const existingConcepts = new Set(conceptsData.map((c) => c.id))
  const differentiaValues = new Set<string>()

  conceptsData.forEach((concept) => {
    concept.definition.differentia.forEach((diff) => {
      if (!existingConcepts.has(diff)) {
        differentiaValues.add(diff)
      }
    })
  })

  return Array.from(differentiaValues).map((differentia, index) => {
    const row = Math.floor((conceptsData.length + index + 50) / 5) // Offset to avoid overlap with genus nodes
    const col = (conceptsData.length + index + 50) % 5
    const x = col * 200 + Math.random() * 50
    const y = row * 150 + Math.random() * 50

    return {
      id: `diff-${differentia.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'concept',
      data: {
        label: differentia,
        definition: 'Virtual node for differentia relationship',
        type: 'virtual differentia',
        genus: null,
        differentia: [],
      },
      position: { x, y },
    }
  })
}

// Function to create virtual nodes for genus concepts that don't exist in our data
export const createVirtualGenusNodes = (
  conceptsData: ConceptData[],
): Node[] => {
  const existingConcepts = new Set(conceptsData.map((c) => c.id))
  const genusValues = new Set(
    conceptsData
      .map((c) => c.definition.genus)
      .filter(
        (genus): genus is string =>
          genus !== null && !existingConcepts.has(genus),
      ),
  )

  return Array.from(genusValues).map((genus, index) => {
    const row = Math.floor((conceptsData.length + index) / 5)
    const col = (conceptsData.length + index) % 5
    const x = col * 200 + Math.random() * 50
    const y = row * 150 + Math.random() * 50

    return {
      id: `genus-${genus.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'concept',
      data: {
        label: genus,
        definition: 'Virtual node for genus relationship',
        type: 'virtual genus',
        genus: null,
        differentia: [],
      },
      position: { x, y },
    }
  })
}

// Function to get complete graph data with optional edge type filtering and layout
export const getGraphData = async (
  includeGenus = true,
  includeDifferentia = true,
  layoutOptions: LayoutOptions = {
    direction: 'TB',
    nodeSpacing: 50,
    rankSpacing: 100,
    edgeSpacing: 10,
    enableDagre: false,
  },
  universeIds?: string[],
) => {
  const conceptsData = await importConceptsData(universeIds)
  const conceptNodes = createNodes(conceptsData)
  const virtualGenusNodes = createVirtualGenusNodes(conceptsData)
  const virtualDifferentiaNodes = createVirtualDifferentiaNodes(conceptsData)

  let edges: Edge[] = []
  if (includeGenus) {
    edges = edges.concat(createGenusEdges(conceptsData))
  }
  if (includeDifferentia) {
    edges = edges.concat(createDifferentiaEdges(conceptsData))
  }

  const allNodes = [
    ...conceptNodes,
    ...virtualGenusNodes,
    ...virtualDifferentiaNodes,
  ]

  // Apply dagre layout if enabled
  const { nodes: layoutedNodes, edges: layoutedEdges } = applyDagreLayout(
    allNodes,
    edges,
    layoutOptions,
  )

  return {
    nodes: layoutedNodes,
    edges: layoutedEdges,
  }
}

// Export the importConceptsData function for use in other components
export { importConceptsData }
