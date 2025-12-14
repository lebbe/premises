import React from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { ConceptData } from "../utils/graphData";
import styles from "./ConceptNode.module.css";

interface ConceptNodeData {
  label?: string;
  definition?: string;
  type?: string;
  genus?: string | null;
  differentia?: string[];
  concept?: ConceptData;
  isVirtual?: boolean;
  isCentralNode?: boolean;
}

const ConceptNode: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as unknown as ConceptNodeData;

  // Handle both old and new data structures
  const concept = nodeData.concept;
  const label = concept?.label || nodeData.label || "Unknown";
  const type = concept?.type || nodeData.type || "concept";
  const isVirtual = nodeData.isVirtual || false;
  const isCentralNode = nodeData.isCentralNode || false;

  const getNodeClasses = (
    type: string,
    isVirtual: boolean,
    isCentralNode: boolean
  ): string => {
    const baseClass = styles.conceptNode;
    let typeClass = "";

    if (isVirtual) {
      typeClass =
        type === "virtual genus"
          ? styles.virtualGenus
          : styles.virtualDifferentia;
    } else {
      switch (type) {
        case "axiomatic concept":
          typeClass = styles.axiomatic;
          break;
        case "concept":
          typeClass = styles.regular;
          break;
        default:
          typeClass = styles.regular;
      }
    }

    const centralClass = isCentralNode ? styles.centralNode : "";
    return `${baseClass} ${typeClass} ${centralClass}`.trim();
  };

  const getTypeClasses = (type: string): string => {
    const baseClass = styles.conceptNodeType;
    switch (type) {
      case "axiomatic concept":
        return `${baseClass} ${styles.axiomaticType}`;
      case "concept":
        return `${baseClass} ${styles.regularType}`;
      default:
        return baseClass;
    }
  };

  return (
    <div className={getNodeClasses(type, isVirtual, isCentralNode)}>
      {/* Top handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{ background: "#555" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{ background: "#555" }}
      />

      {/* Left handles */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{ background: "#555" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{ background: "#555" }}
      />

      {/* Right handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ background: "#555" }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{ background: "#555" }}
      />

      <div className={styles.conceptNodeLabel}>{label}</div>

      {!isVirtual && <div className={getTypeClasses(type)}>{type}</div>}

      {/* Bottom handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{ background: "#555" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{ background: "#555" }}
      />
    </div>
  );
};

export default ConceptNode;
