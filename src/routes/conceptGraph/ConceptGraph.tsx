import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import type { Node, Edge, Connection, NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  getGraphData,
  getAvailableUniverses,
  type LayoutOptions,
} from "../../utils/graphData";
import ConceptNode from "../../components/ConceptNode";
import ControlPanel from "./ControlPanel";
import ConceptInfoPanel from "../../components/ConceptInfoPanel";
import styles from "./ConceptGraph.module.css";

// Define the structure of concept node data
interface ConceptNodeData extends Record<string, unknown> {
  id: string;
  universeId: string;
  label: string;
  definition: string;
  type: string;
  genus: string | null;
  differentia: string[];
  source?: string;
  perceptualRoots?: string[];
}

// Define custom node types
const nodeTypes: NodeTypes = {
  concept: ConceptNode,
};

const ConceptGraph: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] =
    useState<Node<ConceptNodeData> | null>(null);
  const [loading, setLoading] = useState(true);

  // Universe selection
  const [availableUniverses, setAvailableUniverses] = useState<string[]>([]);
  const [selectedUniverses, setSelectedUniverses] = useState<string[]>([]);

  // Edge type controls
  const [showGenusEdges, setShowGenusEdges] = useState(true);
  const [showDifferentiaEdges, setShowDifferentiaEdges] = useState(true);

  // Layout controls
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    direction: "TB",
    nodeSpacing: 50,
    rankSpacing: 100,
    edgeSpacing: 10,
    enableDagre: false,
  });

  // Load available universes on component mount
  useEffect(() => {
    const loadUniverses = async () => {
      try {
        const universes = await getAvailableUniverses();
        setAvailableUniverses(universes);
        if (universes.length > 0 && selectedUniverses.length === 0) {
          setSelectedUniverses([universes[0]]); // Default to first universe
        }
      } catch (error) {
        console.error("Error loading universes:", error);
      }
    };
    loadUniverses();
  }, []);

  // Load data when universe, edge filters, or layout options change
  useEffect(() => {
    if (selectedUniverses.length === 0) return; // Wait for universe selection

    const loadData = async () => {
      try {
        setLoading(true);
        const { nodes: initialNodes, edges: initialEdges } = await getGraphData(
          showGenusEdges,
          showDifferentiaEdges,
          layoutOptions,
          selectedUniverses
        );
        setNodes(initialNodes);
        setEdges(initialEdges);
      } catch (error) {
        console.error("Error loading graph data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    setNodes,
    setEdges,
    showGenusEdges,
    showDifferentiaEdges,
    layoutOptions,
    selectedUniverses,
  ]);

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<ConceptNodeData>);
  }, []);

  // Filter functions for different views
  const [showAxiomatic, setShowAxiomatic] = useState(true);
  const [showConcepts, setShowConcepts] = useState(true);
  const [showVirtual, setShowVirtual] = useState(true);

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const nodeType = node.data.type;
      if (nodeType === "axiomatic concept" && !showAxiomatic) return false;
      if (nodeType === "concept" && !showConcepts) return false;
      if (nodeType === "virtual genus" && (!showVirtual || !showGenusEdges))
        return false;
      if (nodeType === "virtual differentia" && !showDifferentiaEdges)
        return false;
      return true;
    });
  }, [
    nodes,
    showAxiomatic,
    showConcepts,
    showVirtual,
    showGenusEdges,
    showDifferentiaEdges,
  ]);

  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((node) => node.id));
    return edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [edges, filteredNodes]);

  // Show loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>Loading concept graph...</div>
    );
  }

  return (
    <div className={styles.conceptGraphContainer}>
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        {/* Navigation Panel */}
        <Panel position="top-left" className={styles.navigationPanel}>
          <Link to="/study" className={styles.studyLink}>
            📚 Study View
          </Link>
        </Panel>

        <ControlPanel
          nodes={nodes}
          filteredNodes={filteredNodes}
          filteredEdges={filteredEdges}
          showAxiomatic={showAxiomatic}
          setShowAxiomatic={setShowAxiomatic}
          showConcepts={showConcepts}
          setShowConcepts={setShowConcepts}
          showVirtual={showVirtual}
          setShowVirtual={setShowVirtual}
          showGenusEdges={showGenusEdges}
          setShowGenusEdges={setShowGenusEdges}
          showDifferentiaEdges={showDifferentiaEdges}
          setShowDifferentiaEdges={setShowDifferentiaEdges}
          layoutOptions={layoutOptions}
          setLayoutOptions={setLayoutOptions}
          availableUniverses={availableUniverses}
          selectedUniverses={selectedUniverses}
          setSelectedUniverses={setSelectedUniverses}
        />

        {/* Selected Node Info Panel */}
        {selectedNode && (
          <Panel position="top-right" className={styles.infoPanel}>
            <ConceptInfoPanel
              concept={{
                id: selectedNode.data.id,
                universeId: selectedNode.data.universeId,
                label: selectedNode.data.label,
                type: selectedNode.data.type,
                definition: {
                  text: selectedNode.data.definition,
                  genus: selectedNode.data.genus,
                  differentia: selectedNode.data.differentia,
                  source: selectedNode.data.source,
                },
                perceptualRoots: selectedNode.data.perceptualRoots,
              }}
              onClose={() => setSelectedNode(null)}
            />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default ConceptGraph;
