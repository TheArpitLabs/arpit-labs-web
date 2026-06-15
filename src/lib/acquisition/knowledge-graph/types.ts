/**
 * Knowledge Graph Types
 * 
 * Defines the interfaces and types for the knowledge graph system
 */

export type NodeType = 'project' | 'research_paper' | 'dataset' | 'person' | 'organization' | 'technology' | 'concept' | 'topic';

export type EdgeType = 'depends_on' | 'implements' | 'cites' | 'uses' | 'similar_to' | 'related_to' | 'authored_by' | 'organized_by' | 'belongs_to' | 'extends';

export interface KnowledgeNode {
  id: string;
  nodeType: NodeType;
  nodeName: string;
  nodeData: Record<string, unknown>;
  sourceContentId: string | null;
  sourceContentType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: EdgeType;
  edgeWeight: number;
  edgeData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphQuery {
  nodes?: {
    types?: NodeType[];
    ids?: string[];
    filters?: Record<string, unknown>;
  };
  edges?: {
    types?: EdgeType[];
    minWeight?: number;
  };
  depth?: number;
  limit?: number;
}

export interface GraphResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    queryTime: number;
  };
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<NodeType, number>;
  edgesByType: Record<EdgeType, number>;
  averageDegree: number;
  connectedComponents: number;
}
