/**
 * Knowledge Graph Engine
 * 
 * Handles entity extraction, relationships, and graph queries
 */

import { GraphResult, GraphQuery, GraphStats, NodeType, EdgeType, KnowledgeNode, KnowledgeEdge } from './types';
import { supabaseServer } from '@/lib/supabase/server';

export class KnowledgeGraphEngine {
  /**
   * Build knowledge graph from content
   */
  async buildGraphFromContent(contentId: string, content: {
    contentType: string;
    title: string;
    description: string;
    author?: string;
    organization?: string;
    tags?: string[];
    categories?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    // Create content node
    const contentNodeId = await this.createOrUpdateNode({
      nodeType: this.mapContentTypeToNodeType(content.contentType),
      nodeName: content.title,
      nodeData: {
        description: content.description,
        contentType: content.contentType,
        ...content.metadata,
      },
      sourceContentId: contentId,
      sourceContentType: content.contentType,
    });

    // Create author node and relationship
    if (content.author) {
      const authorNodeId = await this.createOrUpdateNode({
        nodeType: 'person',
        nodeName: content.author,
        nodeData: {},
        sourceContentId: contentId,
        sourceContentType: content.contentType,
      });

      await this.createOrUpdateEdge({
        sourceNodeId: contentNodeId,
        targetNodeId: authorNodeId,
        edgeType: 'authored_by',
        edgeWeight: 1.0,
        edgeData: {},
      });
    }

    // Create organization node and relationship
    if (content.organization) {
      const orgNodeId = await this.createOrUpdateNode({
        nodeType: 'organization',
        nodeName: content.organization,
        nodeData: {},
        sourceContentId: contentId,
        sourceContentType: content.contentType,
      });

      await this.createOrUpdateEdge({
        sourceNodeId: contentNodeId,
        targetNodeId: orgNodeId,
        edgeType: 'organized_by',
        edgeWeight: 1.0,
        edgeData: {},
      });
    }

    // Create technology nodes and relationships
    if (content.tags && content.tags.length > 0) {
      for (const tag of content.tags) {
        const techNodeId = await this.createOrUpdateNode({
          nodeType: 'technology',
          nodeName: tag,
          nodeData: {},
          sourceContentId: contentId,
          sourceContentType: content.contentType,
        });

        await this.createOrUpdateEdge({
          sourceNodeId: contentNodeId,
          targetNodeId: techNodeId,
          edgeType: 'uses',
          edgeWeight: 0.8,
          edgeData: {},
        });
      }
    }

    // Create category nodes and relationships
    if (content.categories && content.categories.length > 0) {
      for (const category of content.categories) {
        const categoryNodeId = await this.createOrUpdateNode({
          nodeType: 'topic',
          nodeName: category,
          nodeData: {},
          sourceContentId: contentId,
          sourceContentType: content.contentType,
        });

        await this.createOrUpdateEdge({
          sourceNodeId: contentNodeId,
          targetNodeId: categoryNodeId,
          edgeType: 'belongs_to',
          edgeWeight: 0.9,
          edgeData: {},
        });
      }
    }

    // Find similar content and create relationships
    await this.createSimilarityRelationships(contentNodeId, content);
  }

  /**
   * Map content type to node type
   */
  private mapContentTypeToNodeType(contentType: string): NodeType {
    const mapping: Record<string, NodeType> = {
      'project': 'project',
      'research_paper': 'research_paper',
      'dataset': 'dataset',
      'learning_resource': 'project',
      'hackathon': 'project',
      'repository': 'project',
    };

    return mapping[contentType] || 'project';
  }

  /**
   * Create or update a node
   */
  private async createOrUpdateNode(node: {
    nodeType: NodeType;
    nodeName: string;
    nodeData: Record<string, unknown>;
    sourceContentId: string | null;
    sourceContentType: string | null;
  }): Promise<string> {
    // Check if node already exists
    const { data: existingNode } = await supabaseServer
      .from('knowledge_nodes')
      .select('id')
      .eq('node_type', node.nodeType)
      .eq('node_name', node.nodeName)
      .single();

    if (existingNode) {
      // Update existing node
      await supabaseServer
        .from('knowledge_nodes')
        .update({
          node_data: node.nodeData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingNode.id);

      return existingNode.id;
    }

    // Create new node
    const { data, error } = await supabaseServer
      .from('knowledge_nodes')
      .insert({
        node_type: node.nodeType,
        node_name: node.nodeName,
        node_data: node.nodeData,
        source_content_id: node.sourceContentId,
        source_content_type: node.sourceContentType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create node: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Create or update an edge
   */
  private async createOrUpdateEdge(edge: {
    sourceNodeId: string;
    targetNodeId: string;
    edgeType: EdgeType;
    edgeWeight: number;
    edgeData: Record<string, unknown>;
  }): Promise<void> {
    // Check if edge already exists
    const { data: existingEdge } = await supabaseServer
      .from('knowledge_edges')
      .select('*')
      .eq('source_node_id', edge.sourceNodeId)
      .eq('target_node_id', edge.targetNodeId)
      .eq('edge_type', edge.edgeType)
      .single();

    if (existingEdge) {
      // Update existing edge
      await supabaseServer
        .from('knowledge_edges')
        .update({
          edge_weight: Math.max(edge.edgeWeight, (existingEdge as any).edge_weight),
          edge_data: edge.edgeData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEdge.id);

      return;
    }

    // Create new edge
    const { error } = await supabaseServer
      .from('knowledge_edges')
      .insert({
        source_node_id: edge.sourceNodeId,
        target_node_id: edge.targetNodeId,
        edge_type: edge.edgeType,
        edge_weight: edge.edgeWeight,
        edge_data: edge.edgeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to create edge: ${error.message}`);
    }
  }

  /**
   * Create similarity relationships
   */
  private async createSimilarityRelationships(contentNodeId: string, content: {
    title: string;
    description: string;
    tags?: string[];
  }): Promise<void> {
    // Find similar nodes based on tags
    if (content.tags && content.tags.length > 0) {
      for (const tag of content.tags.slice(0, 3)) { // Limit to top 3 tags
        const { data: similarNodes } = await supabaseServer
          .from('knowledge_nodes')
          .select('id, node_name')
          .eq('node_type', 'technology')
          .eq('node_name', tag)
          .limit(5);

        if (similarNodes && similarNodes.length > 0) {
          for (const node of similarNodes) {
            // Find content nodes that use this technology
            const { data: contentNodes } = await supabaseServer
              .from('knowledge_edges')
              .select('source_node_id')
              .eq('target_node_id', node.id)
              .eq('edge_type', 'uses')
              .limit(3);

            if (contentNodes && contentNodes.length > 0) {
              for (const edge of contentNodes) {
                if (edge.source_node_id !== contentNodeId) {
                  await this.createOrUpdateEdge({
                    sourceNodeId: contentNodeId,
                    targetNodeId: edge.source_node_id,
                    edgeType: 'similar_to',
                    edgeWeight: 0.6,
                    edgeData: { reason: 'shared_technology', technology: tag },
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Query the knowledge graph
   */
  async queryGraph(query: GraphQuery): Promise<GraphResult> {
    const startTime = Date.now();
    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];

    // Query nodes
    if (query.nodes) {
      let nodeQuery = supabaseServer.from('knowledge_nodes').select('*');

      if (query.nodes.types && query.nodes.types.length > 0) {
        nodeQuery = nodeQuery.in('node_type', query.nodes.types);
      }

      if (query.nodes.ids && query.nodes.ids.length > 0) {
        nodeQuery = nodeQuery.in('id', query.nodes.ids);
      }

      const { data: nodeData, error: nodeError } = await nodeQuery.limit(query.limit || 100);

      if (!nodeError && nodeData) {
        nodes.push(...nodeData as KnowledgeNode[]);
      }
    }

    // Query edges
    if (query.edges && nodes.length > 0) {
      const nodeIds = nodes.map(n => n.id);
      
      let edgeQuery = supabaseServer
        .from('knowledge_edges')
        .select('*')
        .or(`source_node_id.in.(${nodeIds.join(',')}),target_node_id.in.(${nodeIds.join(',')})`);

      if (query.edges.types && query.edges.types.length > 0) {
        edgeQuery = edgeQuery.in('edge_type', query.edges.types);
      }

      if (query.edges.minWeight !== undefined) {
        edgeQuery = edgeQuery.gte('edge_weight', query.edges.minWeight);
      }

      const { data: edgeData, error: edgeError } = await edgeQuery.limit(query.limit || 100);

      if (!edgeError && edgeData) {
        edges.push(...edgeData as KnowledgeEdge[]);
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        queryTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Get graph statistics
   */
  async getGraphStats(): Promise<GraphStats> {
    const { data: nodes } = await supabaseServer
      .from('knowledge_nodes')
      .select('node_type');

    const { data: edges } = await supabaseServer
      .from('knowledge_edges')
      .select('edge_type');

    const nodesByType: Record<NodeType, number> = {
      project: 0,
      research_paper: 0,
      dataset: 0,
      person: 0,
      organization: 0,
      technology: 0,
      concept: 0,
      topic: 0,
    };

    const edgesByType: Record<EdgeType, number> = {
      depends_on: 0,
      implements: 0,
      cites: 0,
      uses: 0,
      similar_to: 0,
      related_to: 0,
      authored_by: 0,
      organized_by: 0,
      belongs_to: 0,
      extends: 0,
    };

    for (const node of nodes || []) {
      nodesByType[node.node_type as NodeType] = (nodesByType[node.node_type as NodeType] || 0) + 1;
    }

    for (const edge of edges || []) {
      edgesByType[edge.edge_type as EdgeType] = (edgesByType[edge.edge_type as EdgeType] || 0) + 1;
    }

    const totalNodes = nodes?.length || 0;
    const totalEdges = edges?.length || 0;
    const averageDegree = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0;

    return {
      totalNodes,
      totalEdges,
      nodesByType,
      edgesByType,
      averageDegree,
      connectedComponents: 0, // Would require graph traversal to calculate
    };
  }

  /**
   * Find related content
   */
  async findRelatedContent(contentId: string, maxResults: number = 10): Promise<KnowledgeNode[]> {
    // Get the content node
    const { data: contentNode } = await supabaseServer
      .from('knowledge_nodes')
      .select('*')
      .eq('source_content_id', contentId)
      .single();

    if (!contentNode) {
      return [];
    }

    // Get connected nodes
    const { data: edges } = await supabaseServer
      .from('knowledge_edges')
      .select('*')
      .or(`source_node_id.eq.${contentNode.id},target_node_id.eq.${contentNode.id}`)
      .gte('edge_weight', 0.5)
      .limit(maxResults * 2);

    if (!edges) {
      return [];
    }

    // Get the connected nodes
    const connectedNodeIds = edges
      .map(e => e.source_node_id === contentNode.id ? e.target_node_id : e.source_node_id)
      .filter(id => id !== contentNode.id);

    const { data: connectedNodes } = await supabaseServer
      .from('knowledge_nodes')
      .select('*')
      .in('id', connectedNodeIds)
      .limit(maxResults);

    return (connectedNodes || []) as KnowledgeNode[];
  }

  /**
   * Process knowledge graph for a queue item
   */
  async processKnowledgeGraph(queueItemId: string): Promise<void> {
    // Load queue item
    const { data: item, error: itemError } = await supabaseServer
      .from('content_acquisition_queue')
      .select('*')
      .eq('id', queueItemId)
      .single();

    if (itemError || !item) {
      throw new Error(`Failed to load queue item: ${itemError?.message}`);
    }

    // Build knowledge graph from content
    await this.buildGraphFromContent(queueItemId, {
      contentType: item.content_type,
      title: item.title,
      description: item.description,
      author: item.author || undefined,
      organization: item.organization || undefined,
      tags: item.tags || undefined,
      categories: item.categories || undefined,
      metadata: item.metadata as Record<string, unknown> | undefined,
    });
  }
}

// Singleton instance
let knowledgeGraphEngineInstance: KnowledgeGraphEngine | null = null;

export function getKnowledgeGraphEngine(): KnowledgeGraphEngine {
  if (!knowledgeGraphEngineInstance) {
    knowledgeGraphEngineInstance = new KnowledgeGraphEngine();
  }
  return knowledgeGraphEngineInstance;
}
