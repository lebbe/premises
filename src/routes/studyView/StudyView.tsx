import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  startTransition,
} from "react";
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
} from "@xyflow/react";
import type { Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLocation, useNavigate } from "react-router-dom";

import ConceptNode from "../../components/ConceptNode";
import ConceptInfoPanel from "../../components/ConceptInfoPanel";
import ControlPanel from "./ControlPanel";
import {
  importConceptsData,
  applyDagreLayout,
  applyConceptualHierarchyLayout,
} from "../../utils/graphData";
import type { ConceptData, LayoutOptions } from "../../utils/graphData";
import styles from "./StudyView.module.css";

const nodeTypes = {
  concept: ConceptNode,
};

// Default values for URL encoding
const DEFAULTS = {
  traversalDepth: 2,
  direction: "LR" as const,
  nodeSpacing: 20,
  rankSpacing: 150,
  showGenusEdges: true,
  showDifferentiaEdges: true,
};

// Helper function to encode state to URL hash
const encodeStateToHash = (
  selectedConceptId: string | null,
  traversalDepth: number,
  direction: string,
  nodeSpacing: number,
  rankSpacing: number,
  showGenusEdges: boolean,
  showDifferentiaEdges: boolean,
  selectedUniverses: string[],
  allUniverses: string[]
) => {
  const params = new URLSearchParams();

  if (selectedConceptId) {
    params.set("concept", selectedConceptId);
  }

  if (traversalDepth !== DEFAULTS.traversalDepth) {
    params.set("depth", traversalDepth.toString());
  }

  if (direction !== DEFAULTS.direction) {
    params.set("dir", direction);
  }

  if (nodeSpacing !== DEFAULTS.nodeSpacing) {
    params.set("nodeSpace", nodeSpacing.toString());
  }

  if (rankSpacing !== DEFAULTS.rankSpacing) {
    params.set("rankSpace", rankSpacing.toString());
  }

  if (showGenusEdges !== DEFAULTS.showGenusEdges) {
    params.set("genus", showGenusEdges.toString());
  }

  if (showDifferentiaEdges !== DEFAULTS.showDifferentiaEdges) {
    params.set("diff", showDifferentiaEdges.toString());
  }

  // Only include universes if not all are selected
  const allUniversesSelected =
    allUniverses.length > 0 &&
    selectedUniverses.length === allUniverses.length &&
    allUniverses.every((u) => selectedUniverses.includes(u));

  if (!allUniversesSelected && selectedUniverses.length > 0) {
    params.set("universes", selectedUniverses.join(","));
  }

  return params.toString();
};

// Helper function to decode state from URL hash
const decodeStateFromHash = (hash: string, allUniverses: string[]) => {
  const params = new URLSearchParams(hash.replace("#", ""));

  return {
    selectedConceptId: params.get("concept"),
    traversalDepth: params.has("depth")
      ? parseInt(params.get("depth")!)
      : DEFAULTS.traversalDepth,
    direction: params.get("dir") || DEFAULTS.direction,
    nodeSpacing: params.has("nodeSpace")
      ? parseInt(params.get("nodeSpace")!)
      : DEFAULTS.nodeSpacing,
    rankSpacing: params.has("rankSpace")
      ? parseInt(params.get("rankSpace")!)
      : DEFAULTS.rankSpacing,
    showGenusEdges: params.has("genus")
      ? params.get("genus") === "true"
      : DEFAULTS.showGenusEdges,
    showDifferentiaEdges: params.has("diff")
      ? params.get("diff") === "true"
      : DEFAULTS.showDifferentiaEdges,
    selectedUniverses: params.has("universes")
      ? params.get("universes")!.split(",").filter(Boolean)
      : allUniverses, // Default to all universes
  };
};

const StudyView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [allEdges, setAllEdges] = useState<Edge[]>([]); // Store all edges before filtering
  const [allConcepts, setAllConcepts] = useState<ConceptData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<ConceptData | null>(
    null
  );
  const [selectedGraphConcept, setSelectedGraphConcept] =
    useState<ConceptData | null>(null);
  const [traversalDepth, setTraversalDepth] = useState(2);
  const [selectedUniverses, setSelectedUniverses] = useState<string[]>([]);
  const [availableUniverses, setAvailableUniverses] = useState<string[]>([]);
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    direction: "LR",
    nodeSpacing: 20,
    rankSpacing: 150,
    edgeSpacing: 10,
    enableDagre: true,
  });
  const [useConceptualHierarchy, setUseConceptualHierarchy] = useState(false);
  const [showGenusEdges, setShowGenusEdges] = useState(true);
  const [showDifferentiaEdges, setShowDifferentiaEdges] = useState(true);

  // Helper function to generate URL for a specific concept
  const generateConceptUrl = useCallback(
    (conceptId: string) => {
      const hash = encodeStateToHash(
        conceptId,
        traversalDepth,
        layoutOptions.direction,
        layoutOptions.nodeSpacing,
        layoutOptions.rankSpacing,
        showGenusEdges,
        showDifferentiaEdges,
        selectedUniverses,
        availableUniverses
      );
      return hash ? `#${hash}` : "#";
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
    ]
  );

  // Function to calculate dynamic handles for edges based on node positions
  const calculateDynamicHandles = (
    currentNodes: Node[],
    currentEdges: Edge[]
  ) => {
    return currentEdges.map((edge) => {
      const sourceNode = currentNodes.find((n) => n.id === edge.source);
      const targetNode = currentNodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;

        let sourceHandle = "bottom-source";
        let targetHandle = "top-target";

        // Determine connection points based on relative positions
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal connection is dominant
          if (dx > 0) {
            // Target is to the right of source
            sourceHandle = "right-source";
            targetHandle = "left-target";
          } else {
            // Target is to the left of source
            sourceHandle = "left-source";
            targetHandle = "right-target";
          }
        } else {
          // Vertical connection is dominant
          if (dy > 0) {
            // Target is below source
            sourceHandle = "bottom-source";
            targetHandle = "top-target";
          } else {
            // Target is above source
            sourceHandle = "top-source";
            targetHandle = "bottom-target";
          }
        }

        return {
          ...edge,
          sourceHandle,
          targetHandle,
        };
      }

      return edge;
    });
  };

  // Custom onNodesChange handler that recalculates edge attachment points
  const handleNodesChange = (changes: Parameters<typeof onNodesChange>[0]) => {
    // Apply the node changes first
    onNodesChange(changes);

    // Check if any nodes were moved (position changed)
    const hasPositionChanges = changes.some(
      (change) => change.type === "position" && change.dragging === false
    );

    if (hasPositionChanges) {
      // Recalculate edge handles after a slight delay to ensure nodes state is updated
      setTimeout(() => {
        setEdges((currentEdges) => {
          setNodes((currentNodes) => {
            const updatedEdges = calculateDynamicHandles(
              currentNodes,
              currentEdges
            );
            setEdges(updatedEdges);
            return currentNodes;
          });
          return currentEdges;
        });
      }, 0);
    }
  };

  // Load concepts data
  useEffect(() => {
    const loadData = async () => {
      try {
        const conceptsData = await importConceptsData([
          "Ayn Rand",
          "LLM layer genus 1",
          "LLM layer genus 2",
          "LLM layer differentia 1",
          "LLM layer differentia 2",
        ]);
        setAllConcepts(conceptsData);

        // Extract unique universes
        const universes = Array.from(
          new Set(conceptsData.map((c: ConceptData) => c.universeId))
        );
        setAvailableUniverses(universes);
        setSelectedUniverses(universes); // Select all by default
      } catch (error) {
        console.error("Failed to load concepts:", error);
      }
    };
    loadData();
  }, []);

  // Parse URL hash on mount and when data is loaded
  useEffect(() => {
    if (availableUniverses.length === 0 || allConcepts.length === 0) return;

    const hash = location.hash;

    // Use startTransition to batch state updates and avoid cascading render warnings
    startTransition(() => {
      // If no hash, clear selected concept and reset to defaults
      if (!hash || hash === "#") {
        setSelectedConcept(null);
        setSelectedGraphConcept(null);
        setTraversalDepth(DEFAULTS.traversalDepth);
        setLayoutOptions((prev) => ({
          ...prev,
          direction: DEFAULTS.direction,
          nodeSpacing: DEFAULTS.nodeSpacing,
          rankSpacing: DEFAULTS.rankSpacing,
        }));
        setShowGenusEdges(DEFAULTS.showGenusEdges);
        setShowDifferentiaEdges(DEFAULTS.showDifferentiaEdges);
        setSelectedUniverses(availableUniverses); // Select all by default
        return;
      }

      const decoded = decodeStateFromHash(hash, availableUniverses);

      // Apply decoded state
      setTraversalDepth(decoded.traversalDepth);
      setLayoutOptions((prev) => ({
        ...prev,
        direction: decoded.direction as "TB" | "BT" | "LR" | "RL",
        nodeSpacing: decoded.nodeSpacing,
        rankSpacing: decoded.rankSpacing,
      }));
      setShowGenusEdges(decoded.showGenusEdges);
      setShowDifferentiaEdges(decoded.showDifferentiaEdges);
      setSelectedUniverses(decoded.selectedUniverses);

      // Set selected concept if specified in URL
      if (decoded.selectedConceptId) {
        const concept = allConcepts.find(
          (c) => c.id === decoded.selectedConceptId
        );
        if (concept) {
          setSelectedConcept(concept);
        }
      } else {
        setSelectedConcept(null);
      }
    });
  }, [location.hash, availableUniverses, allConcepts]);

  // Filter concepts based on selected universes
  const filteredConcepts = useMemo(() => {
    return allConcepts.filter((concept) =>
      selectedUniverses.includes(concept.universeId)
    );
  }, [allConcepts, selectedUniverses]);

  // Search functionality with focus support and universe weighting
  const searchResults = useMemo(() => {
    // Show suggestions when focused, even without search term
    const shouldShowResults = isSearchFocused && (searchTerm.trim() || true);
    if (!shouldShowResults) return [];

    const term = searchTerm.toLowerCase();

    // Get all matching concepts or top concepts if no search term
    const matchingConcepts = searchTerm.trim()
      ? filteredConcepts.filter(
          (concept) =>
            concept.id.toLowerCase().includes(term) ||
            concept.label.toLowerCase().includes(term)
        )
      : filteredConcepts; // Show all when focused but no search term

    // Sort with Ayn Rand universe concepts first, then by relevance
    const sortedConcepts = matchingConcepts.sort((a, b) => {
      // First priority: Ayn Rand universe
      const aIsAynRand = a.universeId === "Ayn Rand";
      const bIsAynRand = b.universeId === "Ayn Rand";

      if (aIsAynRand && !bIsAynRand) return -1;
      if (!aIsAynRand && bIsAynRand) return 1;

      // Second priority: exact label match
      if (searchTerm.trim()) {
        const aLabelExact = a.label.toLowerCase() === term;
        const bLabelExact = b.label.toLowerCase() === term;

        if (aLabelExact && !bLabelExact) return -1;
        if (!aLabelExact && bLabelExact) return 1;

        // Third priority: label starts with term
        const aLabelStarts = a.label.toLowerCase().startsWith(term);
        const bLabelStarts = b.label.toLowerCase().startsWith(term);

        if (aLabelStarts && !bLabelStarts) return -1;
        if (!aLabelStarts && bLabelStarts) return 1;
      }

      // Finally: alphabetical by label
      return a.label.localeCompare(b.label);
    });

    return sortedConcepts.slice(0, 15); // Show more results when focused
  }, [filteredConcepts, searchTerm, isSearchFocused]);

  // Create focused graph when concept is selected
  useEffect(() => {
    if (!selectedConcept) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const createFocusedGraph = () => {
      const visitedNodes = new Set<string>();
      const resultNodes: Node[] = [];
      const resultEdges: Edge[] = [];

      // BFS to find nodes within traversal depth
      const queue: Array<{
        concept: ConceptData;
        depth: number;
        position?: { x: number; y: number };
      }> = [{ concept: selectedConcept, depth: 0, position: { x: 0, y: 0 } }];

      while (queue.length > 0) {
        const { concept, depth, position } = queue.shift()!;

        if (visitedNodes.has(concept.id) || depth > traversalDepth) {
          continue;
        }

        visitedNodes.add(concept.id);

        // Add node
        resultNodes.push({
          id: concept.id,
          type: "concept",
          position: position || {
            x: Math.random() * 400,
            y: Math.random() * 400,
          },
          data: {
            concept,
            isVirtual: false,
            isCentralNode: depth === 0,
            url: generateConceptUrl(concept.id), // Add URL for right-click functionality
          },
        });

        if (depth < traversalDepth) {
          // Only find the direct genus and differentia of this concept
          // Do NOT find concepts that use this concept as their genus/differentia
          const relatedConcepts: Array<{
            concept: ConceptData;
            relation: string;
          }> = [];

          // Add this concept's genus if it exists
          if (concept.definition?.genus) {
            const genusNode = filteredConcepts.find(
              (c) => c.id === concept.definition?.genus
            );
            if (genusNode) {
              relatedConcepts.push({
                concept: genusNode,
                relation: "parent-genus",
              });
            }
          }

          // Add this concept's differentia if they exist
          if (concept.definition?.differentia) {
            concept.definition.differentia.forEach((diff) => {
              const diffNode = filteredConcepts.find((c) => c.id === diff);
              if (diffNode) {
                relatedConcepts.push({
                  concept: diffNode,
                  relation: "parent-differentia",
                });
              }
            });
          }

          // Add related concepts to queue and create edges
          relatedConcepts.forEach(
            ({ concept: relatedConcept, relation }, index) => {
              if (!visitedNodes.has(relatedConcept.id)) {
                // Calculate position in a circle around the current node
                const angle = (index / relatedConcepts.length) * 2 * Math.PI;
                const radius = 200;
                const newPosition = {
                  x: (position?.x || 0) + Math.cos(angle) * radius,
                  y: (position?.y || 0) + Math.sin(angle) * radius,
                };

                queue.push({
                  concept: relatedConcept,
                  depth: depth + 1,
                  position: newPosition,
                });
              }

              // Create edge (without filtering - we'll filter separately)
              const edgeId = `${concept.id}-${relatedConcept.id}-${relation}`;
              if (!resultEdges.find((e) => e.id === edgeId)) {
                let sourceId, targetId;

                switch (relation) {
                  case "parent-genus":
                    sourceId = concept.id;
                    targetId = relatedConcept.id;
                    break;
                  case "parent-differentia":
                    sourceId = concept.id;
                    targetId = relatedConcept.id;
                    break;
                  default:
                    sourceId = concept.id;
                    targetId = relatedConcept.id;
                }

                resultEdges.push({
                  id: edgeId,
                  source: sourceId,
                  target: targetId,
                  label: "", // Remove visual labels
                  type: "straight",
                  data: { relation }, // Store relation for filtering
                  style: {
                    stroke: relation.includes("genus") ? "#2563eb" : "#dc2626",
                    strokeWidth: 2,
                  },
                  markerEnd: {
                    type: "arrowclosed",
                    color: relation.includes("genus") ? "#2563eb" : "#dc2626",
                    width: 20,
                    height: 20,
                  },
                });
              }
            }
          );
        }
      }

      // Apply layout (conceptual hierarchy or standard dagre)
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        useConceptualHierarchy
          ? applyConceptualHierarchyLayout(
              resultNodes,
              resultEdges,
              layoutOptions,
              selectedConcept.id
            )
          : applyDagreLayout(resultNodes, resultEdges, layoutOptions);

      // Calculate dynamic connection points based on final node positions
      const finalEdges = layoutedEdges.map((edge) => {
        const sourceNode = layoutedNodes.find((n) => n.id === edge.source);
        const targetNode = layoutedNodes.find((n) => n.id === edge.target);

        if (sourceNode && targetNode) {
          const dx = targetNode.position.x - sourceNode.position.x;
          const dy = targetNode.position.y - sourceNode.position.y;

          let sourceHandle = "bottom-source";
          let targetHandle = "top-target";

          // Determine connection points based on relative positions
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection is dominant
            if (dx > 0) {
              // Target is to the right of source
              sourceHandle = "right-source";
              targetHandle = "left-target";
            } else {
              // Target is to the left of source
              sourceHandle = "left-source";
              targetHandle = "right-target";
            }
          } else {
            // Vertical connection is dominant
            if (dy > 0) {
              // Target is below source
              sourceHandle = "bottom-source";
              targetHandle = "top-target";
            } else {
              // Target is above source
              sourceHandle = "top-source";
              targetHandle = "bottom-target";
            }
          }

          return {
            ...edge,
            sourceHandle,
            targetHandle,
          };
        }

        return edge;
      });

      setNodes(layoutedNodes);
      setAllEdges(finalEdges); // Store all edges

      // Apply current edge filtering
      const filteredEdges = finalEdges.filter((edge) => {
        const relation = (edge.data?.relation || edge.label) as string;
        if (relation?.includes("genus")) {
          return showGenusEdges;
        }
        if (relation?.includes("differentia")) {
          return showDifferentiaEdges;
        }
        return true;
      });

      setEdges(filteredEdges);
    };

    createFocusedGraph();
  }, [
    selectedConcept,
    traversalDepth,
    filteredConcepts,
    layoutOptions,
    useConceptualHierarchy,
    showGenusEdges,
    showDifferentiaEdges,
    setNodes,
    setEdges,
    generateConceptUrl,
  ]);

  // Filter edges based on edge type toggles (preserves node positions)
  useEffect(() => {
    const filteredEdges = allEdges.filter((edge) => {
      const relation = (edge.data?.relation || edge.label) as string;
      if (relation?.includes("genus")) {
        return showGenusEdges;
      }
      if (relation?.includes("differentia")) {
        return showDifferentiaEdges;
      }
      return true;
    });
    setEdges(filteredEdges);
  }, [showGenusEdges, showDifferentiaEdges, allEdges, setEdges]);

  // Update document title when selected concept changes
  useEffect(() => {
    if (selectedConcept) {
      document.title = `${selectedConcept.label} - Concept Study`;
    } else {
      document.title = "Concept Study View";
    }
  }, [selectedConcept]);

  const handleUniverseToggle = (universeId: string) => {
    setSelectedUniverses((prev) =>
      prev.includes(universeId)
        ? prev.filter((id) => id !== universeId)
        : [...prev, universeId]
    );
  };

  const handleConceptSelect = (concept: ConceptData) => {
    setSelectedConcept(concept);
    setSearchTerm("");
    // Navigate directly to the new concept URL
    const newUrl = generateConceptUrl(concept.id);
    navigate(newUrl, { replace: false });
  };

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    // Find the full concept data from our loaded concepts
    const fullConcept = filteredConcepts.find((c) => c.id === node.id);
    if (fullConcept) {
      setSelectedGraphConcept(fullConcept);
      // Don't set as selected concept - that should be done via the info panel button
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Concept Study View</h1>
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
                setTimeout(() => setIsSearchFocused(false), 200);
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

          {selectedConcept && (
            <div className={styles.selectedConcept}>
              <h3>Selected: {selectedConcept.label}</h3>
              <p>{selectedConcept.definition?.text}</p>
              <button
                onClick={() => {
                  setSelectedConcept(null);
                  // Navigate to URL without selected concept
                  const hash = encodeStateToHash(
                    null,
                    traversalDepth,
                    layoutOptions.direction,
                    layoutOptions.nodeSpacing,
                    layoutOptions.rankSpacing,
                    showGenusEdges,
                    showDifferentiaEdges,
                    selectedUniverses,
                    availableUniverses
                  );
                  const newUrl = hash ? `#${hash}` : "#";
                  navigate(newUrl, { replace: false });
                }}
                className={styles.clearButton}
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>{" "}
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
                isSelected={selectedConcept?.id === selectedGraphConcept.id}
                conceptUrl={generateConceptUrl(selectedGraphConcept.id)}
              />
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

export default StudyView;
