import * as fs from 'fs';
import * as path from 'path';
import {
  CondensationOperations
} from '../../types';
import type {
  Argument,
  CondensationOperation,
  OperationNode,
  OperationTree,
  VAAComment
} from '../../types';

/**
 * Builds and manages the operation tree during condensation execution
 */
export class OperationTreeBuilder {
  private tree: OperationTree;
  private nodeCounter = 0;

  constructor(runId: string) {
    this.tree = {
      createdAt: new Date().toISOString(),
      runId,
      metadata: {
        totalOperations: 0,
        maxDepth: 0,
        totalDuration: 0,
        totalLlmCalls: 0
      },
      roots: [],
      nodes: {},
      finalArguments: []
    };
  }

  /**
   * Create a new operation node
   */
  createNode(operation: CondensationOperation, stepIndex: number, batchIndex?: number): string {
    const nodeId = `${operation}_${stepIndex}_${batchIndex ?? 0}_${this.nodeCounter++}`;

    const startTime = new Date();
    const node: OperationNode = {
      id: nodeId,
      operation,
      stepIndex,
      batchIndex,
      input: {},
      output: {},
      children: [],
      parents: [],
      metadata: {
        startTime,
        endTime: startTime, // Will be updated in completeNode
        duration: 0,
        llmCalls: 0,
        success: false
      }
    };

    this.tree.nodes[nodeId] = node;
    this.tree.metadata.totalOperations++;

    return nodeId;
  }

  /**
   * Set input data for a node
   */
  setNodeInput(
    nodeId: string,
    input: {
      comments?: Array<VAAComment>;
      arguments?: Array<Argument>;
      argumentLists?: Array<Array<Argument>>;
    }
  ): void {
    const node = this.tree.nodes[nodeId];
    if (!node) throw new Error(`Node ${nodeId} not found`);

    node.input = input;

    // If this is a root node (starts with comments), add to roots
    if (input.comments && (!node.parents || node.parents.length === 0)) {
      this.tree.roots.push(nodeId);
    }
  }

  /**
   * Set output data for a node
   */
  setNodeOutput(
    nodeId: string,
    output: {
      arguments?: Array<Argument>;
      argumentLists?: Array<Array<Argument>>;
    }
  ): void {
    const node = this.tree.nodes[nodeId];
    if (!node) throw new Error(`Node ${nodeId} not found`);

    node.output = output;
  }

  /**
   * Link a parent node to a child node
   */
  linkNodes(parentId: string, childId: string): void {
    const parent = this.tree.nodes[parentId];
    const child = this.tree.nodes[childId];

    if (!parent || !child) {
      throw new Error(`Cannot link nodes: parent=${!!parent}, child=${!!child}`);
    }

    // Add child to parent's children list (avoid duplicates)
    if (!parent.children.includes(childId)) {
      parent.children.push(childId);
    }

    // Add parent to child's parents list (avoid duplicates)
    if (!child.parents) {
      child.parents = [];
    }
    if (!child.parents.includes(parentId)) {
      child.parents.push(parentId);
    }
  }

  /**
   * Mark a node as started
   */
  startNode(nodeId: string): void {
    const node = this.tree.nodes[nodeId];
    if (!node) throw new Error(`Node ${nodeId} not found`);

    node.metadata.startTime = new Date();
  }

  /**
   * Mark a node as completed
   */
  completeNode(nodeId: string, llmCalls: number, success: boolean = true, error?: string): void {
    const node = this.tree.nodes[nodeId];
    if (!node) throw new Error(`Node ${nodeId} not found`);

    node.metadata.endTime = new Date();
    node.metadata.duration = node.metadata.endTime.getTime() - node.metadata.startTime.getTime();
    node.metadata.llmCalls = llmCalls;
    node.metadata.success = success;
    if (error) node.metadata.error = error;

    // Update tree metadata
    this.tree.metadata.totalDuration += node.metadata.duration;
    this.tree.metadata.totalLlmCalls += llmCalls;
  }

  /**
   * Set the final arguments for the tree
   */
  setFinalArguments(args: Array<Argument>): void {
    this.tree.finalArguments = args;

    // Calculate max depth
    this.tree.metadata.maxDepth = Math.max(...Object.keys(this.tree.nodes).map((nodeId) => this.getNodeDepth(nodeId)));
  }

  /**
   * Get the current tree
   */
  getTree(): OperationTree {
    return { ...this.tree };
  }

  /**
   * Save the tree to a JSON file
   */
  async saveTree(outputPath: string): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save tree with pretty formatting
    const treeJson = JSON.stringify(this.tree, null, 2);
    fs.writeFileSync(outputPath, treeJson);
  }

  /**
   * Create a simplified tree view for console logging
   */
  getTreeSummary(): string {
    const lines: Array<string> = [];
    lines.push(`🌳 Operation Tree for ${this.tree.runId}`);
    lines.push(`🕐 Created at: ${this.tree.createdAt}`);
    lines.push(`📊 ${this.tree.metadata.totalOperations} operations, ${this.tree.metadata.maxDepth} max depth`);
    lines.push(`⏱️  ${this.tree.metadata.totalDuration}ms total, ${this.tree.metadata.totalLlmCalls} LLM calls`);
    return lines.join('\n');
  }

  /**
   * Helper to add a node and its children to the summary
   */
  private addNodeToSummary(
    lines: Array<string>,
    nodeId: string,
    depth: number,
    visited: Set<string> = new Set()
  ): void {
    const node = this.tree.nodes[nodeId];
    if (!node || visited.has(nodeId)) return;

    visited.add(nodeId);

    const indent = '  '.repeat(depth);
    const icon = this.getOperationIcon(node.operation);
    const status = node.metadata.success ? '✅' : '❌';
    const batchInfo = node.batchIndex !== undefined ? ` [batch ${node.batchIndex}]` : '';

    // Input/output summary
    const inputCount =
      node.input.comments?.length ?? node.input.arguments?.length ?? node.input.argumentLists?.length ?? 0;
    const outputCount = node.output.arguments?.length ?? node.output.argumentLists?.length ?? 0;

    // Show parent info for nodes with multiple parents
    const parentInfo = node.parents && node.parents.length > 1 ? ` (parents: ${node.parents.length})` : '';

    lines.push(`${indent}${icon} ${node.operation}${batchInfo}${parentInfo} ${status}`);
    lines.push(
      `${indent}   📥 ${inputCount} inputs → 📤 ${outputCount} outputs (${node.metadata.duration}ms, ${node.metadata.llmCalls} calls)`
    );

    // Add children (only if not already visited)
    for (const childId of node.children) {
      if (!visited.has(childId)) {
        this.addNodeToSummary(lines, childId, depth + 1, visited);
      }
    }
  }

  /**
   * Get an emoji icon for each operation type
   */
  private getOperationIcon(operation: CondensationOperation): string {
    switch (operation) {
      case CondensationOperations.MAP:
        return '🗺️';
      case CondensationOperations.ITERATE_MAP:
        return '🔁';
      case CondensationOperations.REDUCE:
        return '⚡';
      case CondensationOperations.REFINE:
        return '✨';
      case CondensationOperations.GROUND:
        return '🏗️';
      default:
        return '❓';
    }
  }

  /**
   * Get the depth of a node
   */
  private getNodeDepth(nodeId: string): number {
    const node = this.tree.nodes[nodeId];
    if (!node || !node.parents || node.parents.length === 0) return 0;
    // For nodes with multiple parents, use the maximum depth
    return 1 + Math.max(...node.parents.map((parentId) => this.getNodeDepth(parentId)));
  }
}
