import { Argument } from './argument';
import { CondensationOperation } from './condensation/operation';
import { VAAComment } from './condensationInput';
/**
 * Represents a single operation node in the condensation tree.
 * 
 * @param id - Unique identifier for this operation instance
 * @param operation - Type of operation performed
 * @param stepIndex - Step index in the overall plan
 * @param batchIndex - Batch index within the step (for parallel operations)
 * @param input - Input data for this operation
 * @param output - Output data from this operation
 * @param children - References to child operations (operations that use this output as input)
 * @param parents - References to parent operations (operations that produced this input) - can have multiple parents for REDUCE operations
 * @param parent - Use parents array instead. Kept for backward compatibility
 * @param metadata - Metadata about the operation execution
 */
export interface OperationNode {
  id: string;
  operation: CondensationOperation;
  stepIndex: number;
  batchIndex?: number;
  input: {
    comments?: Array<VAAComment>;
    arguments?: Array<Argument>;
    argumentLists?: Array<Array<Argument>>;
  };
  output: {
    arguments?: Array<Argument>;
    argumentLists?: Array<Array<Argument>>;
  };
  children: Array<string>;
  parents?: Array<string>;
  parent?: string;
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
    llmCalls: number;
    success: boolean;
    error?: string;
  };
}

/**
 * Complete tree structure for a condensation run.
 * 
 * @param createdAt - Date and time as a string (e.g. 1746_28_6_2025)
 * @param runId - Run identifier
 * @param roots - Root operation nodes (operations that start with comments)
 * @param nodes - All operation nodes indexed by their ID
 * @param finalArguments - Final output arguments
 * @param metadata - Overall tree metadata
 */
export interface OperationTree {
  createdAt: string;
  runId: string;
  roots: Array<string>;
  nodes: Record<string, OperationNode>;
  finalArguments: Array<Argument>;
  metadata: {
    totalOperations: number;
    maxDepth: number;
    totalDuration: number;
    totalLlmCalls: number;
  };
}

/**
 * Utility functions for working with operation trees.
 */
export class OperationTreeUtils {
  /**
   * Get all leaf nodes (operations with no children).
   */
  static getLeafNodes(tree: OperationTree): Array<OperationNode> {
    return Object.values(tree.nodes).filter((node) => node.children.length === 0);
  }
  
  /**
   * Get the depth of a specific node.
   */
  static getNodeDepth(tree: OperationTree, nodeId: string): number {
    const node = tree.nodes[nodeId];
    if (!node || !node.parents || node.parents.length === 0) return 0;
    // For nodes with multiple parents, use the maximum depth
    return 1 + Math.max(...node.parents.map((parentId) => this.getNodeDepth(tree, parentId)));
  }

  /**
   * Get all nodes at a specific depth level.
   */
  static getNodesAtDepth(tree: OperationTree, depth: number): Array<OperationNode> {
    return Object.values(tree.nodes).filter((node) => this.getNodeDepth(tree, node.id) === depth);
  }
  
  /**
   * Get the path from root to a specific node (uses first parent for nodes with multiple parents).
   */
  static getPathToNode(tree: OperationTree, nodeId: string): Array<OperationNode> {
    const path: Array<OperationNode> = [];
    let currentId: string | undefined = nodeId;
    
    while (currentId) {
      const node = tree.nodes[currentId];
      if (!node) break;
      path.unshift(node);
      // Use first parent for backward compatibility, or legacy parent field
      currentId = node.parents?.[0] || node.parent;
    }
    
    return path;
  }
  
  /**
   * Get all paths from roots to a specific node (for nodes with multiple parents).
   */
  static getAllPathsToNode(tree: OperationTree, nodeId: string): Array<Array<OperationNode>> {
    const paths: Array<Array<OperationNode>> = [];

    function buildPaths(currentId: string, currentPath: Array<OperationNode>): void {
      const node = tree.nodes[currentId];
      if (!node) return;

      const newPath = [node, ...currentPath];

      if (!node.parents || node.parents.length === 0) {
        // This is a root node, add the complete path
        paths.push(newPath);
      } else {
        // Recursively build paths for each parent
        for (const parentId of node.parents) {
          buildPaths(parentId, newPath);
        }
      }
    }

    buildPaths(nodeId, []);
    return paths;
  }
} 