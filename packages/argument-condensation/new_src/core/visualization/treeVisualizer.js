import { VISUALIZATION_CONFIG } from './config.js';

/**
 * Tree visualization class using D3.js
 */
class TreeVisualizer {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = d3.select(`#${containerId}`);
    this.svg = null;
    this.g = null;
    this.currentTree = null;
    this.selectedNode = null;
    this.showDetails = false;

    // Create reusable tooltip to prevent memory leaks
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none');

    // Initialize D3 zoom behavior
    this.zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        if (this.g) {
          this.g.attr('transform', event.transform);
        }
      });

    // Use configuration values
    this.nodeRadius = VISUALIZATION_CONFIG.layout.nodeRadius;
    this.horizontalSpacing = VISUALIZATION_CONFIG.layout.horizontalSpacing;
    this.verticalSpacing = VISUALIZATION_CONFIG.layout.verticalSpacing;

    // Setup resize observer
    this.setupResizeObserver();

    // Initial SVG setup
    this.setupSVG();
  }

  /**
   * Setup resize observer to handle container size changes
   */
  setupResizeObserver() {
    const containerNode = this.container.node();
    if (!containerNode || !window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      // Throttle resize events to improve performance
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        if (this.svg) {
          // Update SVG dimensions
          const width = containerNode.clientWidth || 800;
          const height = containerNode.clientHeight || 600;

          this.svg.attr('width', width).attr('height', height);

          // Re-fit to screen if we have tree data
          if (this.currentTree) {
            this.fitToScreen();
          }
        }
      }, VISUALIZATION_CONFIG.timing.resizeDebounce);
    });

    this.resizeObserver.observe(containerNode);
  }

  /**
   * Load tree data and render the visualization
   * @param {Object} treeData - The operation tree data to visualize
   */
  loadTree(treeData) {
    this.currentTree = treeData;
    this.treeData = treeData; // Keep both for compatibility

    // Hide empty state
    this.hideEmptyState();

    this.renderTree();
  }

  /**
   * Clear the current visualization
   */
  clearVisualization() {
    // Remove any existing SVG completely
    this.container.selectAll('svg').remove();
    this.svg = null;
    this.g = null;
    this.selectedNode = null;
  }

  /**
   * Show the empty state
   */
  showEmptyState() {
    const emptyState = this.container.select('.empty-state');
    if (!emptyState.empty()) {
      emptyState.style('display', 'flex');
    }
  }

  /**
   * Hide the empty state
   */
  hideEmptyState() {
    const emptyState = this.container.select('.empty-state');
    if (!emptyState.empty()) {
      emptyState.style('display', 'none');
    }
  }

  /**
   * Setup SVG container and zoom behavior
   */
  setupSVG() {
    // Only setup if we don't have an SVG yet
    if (this.svg) return;

    const containerNode = this.container.node();
    if (!containerNode) {
      console.error('Container not found');
      return;
    }

    const width = containerNode.clientWidth || 800;
    const height = containerNode.clientHeight || 600;

    this.svg = this.container
      .append('svg')
      .attr('class', 'tree-svg')
      .attr('width', width)
      .attr('height', height)
      .call(this.zoom);

    this.g = this.svg.append('g');

    // Add definitions for arrowheads
    const defs = this.svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', VISUALIZATION_CONFIG.colors.ui.arrowhead);
  }

  /**
   * Convert operation tree to network format for DAG visualization
   */
  convertToNetwork(operationTree) {
    try {
      const nodes = operationTree.nodes;
      const nodeList = [];
      const linkList = [];

      // Validate input
      if (!nodes || typeof nodes !== 'object') {
        throw new Error('Invalid nodes data structure');
      }

      // Create nodes
      Object.keys(nodes).forEach((nodeId) => {
        const nodeData = nodes[nodeId];
        if (!nodeData) {
          console.warn(`Skipping invalid node: ${nodeId}`);
          return;
        }

        nodeList.push({
          id: nodeId,
          data: nodeData,
          // Calculate level based on step index for better positioning
          level: nodeData.stepIndex >= 0 ? nodeData.stepIndex : 0
        });
      });

      // Create links based on parent-child relationships
      Object.keys(nodes).forEach((nodeId) => {
        const node = nodes[nodeId];
        if (!node) return;

        // Use the parents array - fallback to legacy parent field for compatibility
        const parents = node.parents && node.parents.length > 0 ? node.parents : node.parent ? [node.parent] : [];

        parents.forEach((parentId) => {
          // Validate that parent exists
          if (nodes[parentId]) {
            linkList.push({
              source: parentId,
              target: nodeId
            });
          } else {
            console.warn(`Parent node ${parentId} not found for node ${nodeId}`);
          }
        });
      });

      return {
        nodes: nodeList,
        links: linkList
      };
    } catch (error) {
      console.error('Error converting tree to network format:', error);
      return { nodes: [], links: [] };
    }
  }

  /**
   * Render tree using network layout for DAG visualization
   */
  renderTree() {
    try {
      if (!this.currentTree) {
        console.warn('No tree data to render');
        return;
      }

      // Clear and setup SVG
      this.clearVisualization();
      this.setupSVG();

      if (!this.svg || !this.g) {
        console.error('Failed to setup SVG');
        return;
      }

      const networkData = this.convertToNetwork(this.currentTree);

      if (networkData.nodes.length === 0) {
        console.warn('No nodes to render');
        return;
      }

      // Use a simple layered layout based on step index
      this.renderDAG(networkData);

      this.updateTreeStats();

      // Fit to screen after a short delay to ensure rendering is complete
      setTimeout(() => this.fitToScreen(), VISUALIZATION_CONFIG.timing.renderDelay);
    } catch (error) {
      console.error('Error rendering tree:', error);
      this.showEmptyState();
    }
  }

  /**
   * Render DAG using layered layout
   */
  renderDAG(networkData) {
    const { nodes, links } = networkData;

    // Group nodes by level (step index)
    const nodesByLevel = {};
    nodes.forEach((node) => {
      const level = node.level;
      if (!nodesByLevel[level]) {
        nodesByLevel[level] = [];
      }
      nodesByLevel[level].push(node);
    });

    // Get SVG dimensions for proper centering
    const svgWidth = parseFloat(this.svg.attr('width')) || 800;

    // Use configuration values for layout
    const { levelHeight, nodeSpacing, marginY } = VISUALIZATION_CONFIG.layout;
    const levels = Object.keys(nodesByLevel).sort((a, b) => parseInt(a) - parseInt(b));

    levels.forEach((level, levelIndex) => {
      const levelNodes = nodesByLevel[level];

      // Center the level horizontally within the SVG
      const totalLevelWidth = (levelNodes.length - 1) * nodeSpacing;
      const startX = (svgWidth - totalLevelWidth) / 2;

      levelNodes.forEach((node, nodeIndex) => {
        node.x = startX + nodeIndex * nodeSpacing;
        node.y = marginY + levelIndex * levelHeight;
      });
    });

    // Create node data for D3
    const nodeData = nodes;

    const linkData = links
      .map((link) => {
        const source = nodes.find((n) => n.id === link.source);
        const target = nodes.find((n) => n.id === link.target);
        if (!source || !target) {
          console.warn('Missing source or target for link:', link);
          return null;
        }
        return {
          source: { x: source.x, y: source.y },
          target: { x: target.x, y: target.y }
        };
      })
      .filter(Boolean);

    // Render links first (so they appear behind nodes)
    this.renderLinks(linkData);

    // Render nodes
    this.renderNodes(nodeData);
  }

  /**
   * Render tree links
   */
  renderLinks(links) {
    const linkGenerator = d3
      .linkVertical()
      .x((d) => d.x)
      .y((d) => d.y);

    this.g
      .selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkGenerator)
      .attr('marker-end', 'url(#arrowhead)');
  }

  /**
   * Render tree nodes
   */
  renderNodes(nodes) {
    const nodeGroups = this.g
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .on('click', (event, d) => this.selectNode(d))
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());

    // Add circles
    nodeGroups
      .append('circle')
      .attr('class', (d) => `node-circle ${d.data.operation.toLowerCase()}`)
      .attr('r', this.nodeRadius)
      .style('opacity', (d) => (d.data.virtual ? 0.3 : 1));

    // Add operation icons
    nodeGroups
      .append('text')
      .attr('class', 'node-icon')
      .attr('dy', '0.35em')
      .text((d) => this.getOperationIcon(d.data.operation));

    // Add operation labels
    nodeGroups
      .append('text')
      .attr('class', 'node-text')
      .attr('dy', this.nodeRadius + 15)
      .text((d) => {
        if (d.data.virtual) return '';
        const op = d.data.operation;
        const batch = d.data.batchIndex !== undefined ? ` [${d.data.batchIndex}]` : '';
        return `${op}${batch}`;
      });

    // Add batch info if details are enabled
    if (this.showDetails) {
      nodeGroups
        .append('text')
        .attr('class', 'node-batch-info')
        .attr('dy', this.nodeRadius + 28)
        .text((d) => {
          if (d.data.virtual) return '';
          const node = d.data;
          const inputCount = this.getInputCount(node);
          const outputCount = this.getOutputCount(node);
          return `${inputCount}→${outputCount}`;
        });
    }

    // Add success/error indicators
    nodeGroups
      .append('circle')
      .attr('class', 'status-indicator')
      .attr('r', 6)
      .attr('cx', this.nodeRadius - 8)
      .attr('cy', -this.nodeRadius + 8)
      .style('fill', (d) =>
        d.data.metadata?.success ? VISUALIZATION_CONFIG.colors.status.success : VISUALIZATION_CONFIG.colors.status.error
      )
      .style('opacity', (d) => (d.data.virtual ? 0 : 1));
  }

  /**
   * Get operation icon emoji
   */
  getOperationIcon(operation) {
    return VISUALIZATION_CONFIG.icons.operations[operation] || VISUALIZATION_CONFIG.icons.operations.EMPTY;
  }

  /**
   * Get input count for a node
   */
  getInputCount(node) {
    const input = node.input;
    return input.comments?.length || input.arguments?.length || input.argumentLists?.length || 0;
  }

  /**
   * Get output count for a node
   */
  getOutputCount(node) {
    const output = node.output;
    return output.arguments?.length || output.argumentLists?.length || 0;
  }

  /**
   * Select a node and show its details
   */
  selectNode(d) {
    // Remove previous selection
    this.g.selectAll('.node').classed('selected', false);

    // Add selection to current node
    d3.select(event.currentTarget).classed('selected', true);

    this.selectedNode = d.data;
    this.updateNodeDetails();
  }

  /**
   * Show tooltip on hover
   */
  showTooltip(event, d) {
    if (d.data.virtual) return;

    const node = d.data;
    const content = `
            <strong>${node.operation}</strong><br/>
            Duration: ${node.metadata.duration}ms<br/>
            LLM Calls: ${node.metadata.llmCalls}<br/>
            Status: ${node.metadata.success ? 'Success' : 'Failed'}
        `;

    this.tooltip
      .html(content)
      .style('left', event.pageX + 10 + 'px')
      .style('top', event.pageY - 10 + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    this.tooltip.style('opacity', 0);
  }

  /**
   * Update tree statistics in sidebar
   */
  updateTreeStats() {
    if (!this.currentTree) return;

    const stats = this.currentTree.metadata || {};
    const statsHtml = `
            <div class="tree-stats">
                <h3>Tree Statistics</h3>
                <div class="stat-item">
                    <span class="stat-label">Run ID:</span>
                    <span class="stat-value">${this.currentTree.runId || 'N/A'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Operations:</span>
                    <span class="stat-value">${stats.totalOperations || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Max Depth:</span>
                    <span class="stat-value">${stats.maxDepth || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Duration:</span>
                    <span class="stat-value">${stats.totalDuration || 0}ms</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">LLM Calls:</span>
                    <span class="stat-value">${stats.totalLlmCalls || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Final Arguments:</span>
                    <span class="stat-value">${this.currentTree.finalArguments?.length || 0}</span>
                </div>
            </div>
        `;

    // Update sidebar with stats
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const existingStats = sidebar.querySelector('.tree-stats');
      if (existingStats) {
        existingStats.remove();
      }
      sidebar.insertAdjacentHTML('afterbegin', statsHtml);
    }
  }

  /**
   * Update node details in sidebar
   */
  updateNodeDetails() {
    const nodeInfo = d3.select('#node-info');

    if (!this.selectedNode || this.selectedNode.virtual) {
      nodeInfo.html('<p>Click on a node to see details</p>');
      return;
    }

    const node = this.selectedNode;
    nodeInfo.html('');

    // Basic info
    const basicInfo = [
      { label: 'Operation', value: node.operation },
      { label: 'Step Index', value: node.stepIndex },
      { label: 'Batch Index', value: node.batchIndex ?? 'N/A' },
      { label: 'Duration', value: `${node.metadata.duration}ms` },
      { label: 'LLM Calls', value: node.metadata.llmCalls },
      { label: 'Status', value: node.metadata.success ? 'Success' : 'Failed' }
    ];

    basicInfo.forEach((info) => {
      const detail = nodeInfo.append('div').attr('class', 'node-detail');
      detail.append('div').attr('class', 'node-detail-label').text(info.label);
      detail.append('div').attr('class', 'node-detail-value').text(info.value);
    });

    // Input/Output counts
    const inputCount = this.getInputCount(node);
    const outputCount = this.getOutputCount(node);

    const ioDetail = nodeInfo.append('div').attr('class', 'node-detail');
    ioDetail.append('div').attr('class', 'node-detail-label').text('Input → Output');
    ioDetail.append('div').attr('class', 'node-detail-value').text(`${inputCount} → ${outputCount}`);

    // Error message if failed
    if (!node.metadata.success && node.metadata.error) {
      const errorDetail = nodeInfo.append('div').attr('class', 'node-detail');
      errorDetail.append('div').attr('class', 'node-detail-label').text('Error');
      errorDetail.append('div').attr('class', 'node-detail-value error-text').text(node.metadata.error);
    }

    // Add separator
    nodeInfo.append('hr').attr('class', 'detail-separator');

    // Input Data Section
    this.renderInputData(nodeInfo, node);

    // Output Data Section
    this.renderOutputData(nodeInfo, node);
  }

  /**
   * Render input data section
   */
  renderInputData(container, node) {
    const inputSection = container.append('div').attr('class', 'data-section');
    const inputHeader = inputSection.append('div').attr('class', 'data-section-header');

    inputHeader.append('h4').attr('class', 'section-title').text('📥 Input Data');

    const inputContent = inputSection.append('div').attr('class', 'data-content');

    // Handle different input types
    const input = node.input;

    if (input.comments && input.comments.length > 0) {
      this.renderComments(inputContent, input.comments, 'Input Comments');
    }

    if (input.arguments && input.arguments.length > 0) {
      this.renderArguments(inputContent, input.arguments, 'Input Arguments');
    }

    if (input.argumentLists && input.argumentLists.length > 0) {
      this.renderArgumentLists(inputContent, input.argumentLists, 'Input Argument Lists');
    }

    if (!input.comments && !input.arguments && !input.argumentLists) {
      inputContent.append('p').attr('class', 'no-data-message').text('No input data available');
    }
  }

  /**
   * Render output data section
   */
  renderOutputData(container, node) {
    const outputSection = container.append('div').attr('class', 'data-section');
    const outputHeader = outputSection.append('div').attr('class', 'data-section-header');

    outputHeader.append('h4').attr('class', 'section-title').text('📤 Output Data');

    const outputContent = outputSection.append('div').attr('class', 'data-content');

    // Handle different output types
    const output = node.output;

    if (output.arguments && output.arguments.length > 0) {
      this.renderArguments(outputContent, output.arguments, 'Output Arguments');
    }

    if (output.argumentLists && output.argumentLists.length > 0) {
      this.renderArgumentLists(outputContent, output.argumentLists, 'Output Argument Lists');
    }

    if (!output.arguments && !output.argumentLists) {
      outputContent.append('p').attr('class', 'no-data-message').text('No output data available');
    }
  }

  /**
   * Render comments list
   */
  renderComments(container, comments, title) {
    const section = container.append('div').attr('class', 'data-subsection');

    section.append('h5').attr('class', 'subsection-title').text(`${title} (${comments.length})`);

    const commentsList = section.append('div').attr('class', 'comments-list');

    comments.forEach((comment, index) => {
      const commentItem = commentsList.append('div').attr('class', 'comment-item');

      // Comment header with ID
      commentItem
        .append('div')
        .attr('class', 'item-header')
        .text(`Comment ${index + 1} (${comment.id})`);

      // Comment text
      commentItem.append('div').attr('class', 'item-content').text(comment.text);

      // Candidate info if available
      if (comment.candidateID) {
        commentItem.append('div').attr('class', 'item-meta').text(`Candidate: ${comment.candidateID}`);
      }
    });
  }

  /**
   * Render arguments list
   */
  renderArguments(container, argumentList, title) {
    const section = container.append('div').attr('class', 'data-subsection');

    section.append('h5').attr('class', 'subsection-title').text(`${title} (${argumentList.length})`);

    const argumentsList = section.append('div').attr('class', 'arguments-list');

    argumentList.forEach((argument, index) => {
      const argumentItem = argumentsList.append('div').attr('class', 'argument-item');

      // Argument header with ID
      argumentItem
        .append('div')
        .attr('class', 'item-header')
        .text(`Argument ${index + 1} (${argument.id || 'No ID'})`);

      // Argument text
      argumentItem.append('div').attr('class', 'item-content').text(argument.text);
    });
  }

  /**
   * Render argument lists (for REDUCE operations)
   */
  renderArgumentLists(container, argumentLists, title) {
    const section = container.append('div').attr('class', 'data-subsection');

    section.append('h5').attr('class', 'subsection-title').text(`${title} (${argumentLists.length} lists)`);

    const listsContainer = section.append('div').attr('class', 'argument-lists');

    argumentLists.forEach((argumentList, listIndex) => {
      const listSection = listsContainer.append('div').attr('class', 'argument-list');

      listSection
        .append('h6')
        .attr('class', 'list-title')
        .text(`List ${listIndex + 1} (${argumentList.length} arguments)`);

      argumentList.forEach((argument, argIndex) => {
        const argumentItem = listSection.append('div').attr('class', 'argument-item nested');

        argumentItem
          .append('div')
          .attr('class', 'item-content')
          .text(`${argIndex + 1}. ${argument.text}`);
      });
    });
  }

  /**
   * Fit tree to screen with appropriate zoom and centering
   */
  fitToScreen() {
    if (!this.g || !this.svg) return;

    const bounds = this.g.node().getBBox();
    const fullWidth = this.svg.node().clientWidth;
    const fullHeight = this.svg.node().clientHeight;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    if (width === 0 || height === 0) return;

    const scale = Math.min(fullWidth / width, fullHeight / height) * 0.8;
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    this.svg
      .transition()
      .duration(VISUALIZATION_CONFIG.timing.fitToScreenDelay)
      .call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  }

  /**
   * Toggle display of detailed node information (input/output counts)
   */
  toggleDetails() {
    this.showDetails = !this.showDetails;
    if (this.currentTree) {
      this.renderTree();
    }
  }

  /**
   * Export the current tree visualization as an SVG file
   */
  exportSVG() {
    if (!this.svg) return;

    const svgNode = this.svg.node();
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgNode);

    const blob = new Blob([source], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `operation-tree-${this.currentTree?.runId || 'export'}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  }
}

// Export the TreeVisualizer class
export { TreeVisualizer };
