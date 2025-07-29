import { VISUALIZATION_CONFIG } from './config.js';
import { TreeVisualizer } from './treeVisualizer.js';

// Main application class
class OperationTreeApp {
  constructor() {
    this.visualizer = new TreeVisualizer('tree-container');
    this.currentTreeData = null;

    // Cache DOM elements to avoid repeated lookups
    this.elements = {
      fileInput: document.getElementById('tree-file'),
      fitBtn: document.getElementById('fit-btn'),
      toggleDetails: document.getElementById('toggle-details'),
      exportSvg: document.getElementById('export-svg')
    };

    this.initializeEventListeners();
  }

  /**
   * Initialize all event listeners
   */
  initializeEventListeners() {
    // File input handler
    this.elements.fileInput.addEventListener('change', (event) => this.handleFileLoad(event));

    // Control buttons
    this.elements.fitBtn.addEventListener('click', () => {
      this.visualizer.fitToScreen();
    });

    this.elements.toggleDetails.addEventListener('click', () => {
      this.visualizer.toggleDetails();
      this.updateToggleButton();
    });

    this.elements.exportSvg.addEventListener('click', () => {
      this.visualizer.exportSVG();
    });

    // Window resize handler
    window.addEventListener('resize', () => {
      if (this.currentTreeData) {
        // Just fit to screen, don't reload the entire tree
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.visualizer.fitToScreen();
        }, VISUALIZATION_CONFIG.timing.resizeDebounce);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => this.handleKeyboardShortcuts(event));
  }

  /**
   * Handle file loading
   */
  async handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await this.readFileAsText(file);
      const treeData = JSON.parse(text);

      // Validate tree data structure
      if (!this.validateTreeData(treeData)) {
        throw new Error('Invalid tree data structure');
      }

      this.currentTreeData = treeData;
      this.visualizer.loadTree(treeData);
      this.showSuccessMessage(`Loaded tree: ${treeData.runId}`);
    } catch (error) {
      this.showErrorMessage(`Failed to load tree: ${error.message}`);
      console.error('Tree loading error:', error);
    }
  }

  /**
   * Read file as text
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Validate tree data structure
   */
  validateTreeData(data) {
    // Check required fields
    const requiredFields = ['runId', 'nodes', 'roots', 'metadata'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Check nodes structure
    if (typeof data.nodes !== 'object') {
      console.error('nodes should be an object');
      return false;
    }

    // Check roots structure
    if (!Array.isArray(data.roots)) {
      console.error('roots should be an array');
      return false;
    }

    // Validate node structure
    for (const [nodeId, node] of Object.entries(data.nodes)) {
      if (!this.validateNodeStructure(node)) {
        console.error(`Invalid node structure for node: ${nodeId}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate individual node structure
   */
  validateNodeStructure(node) {
    const requiredFields = ['operation', 'input', 'output', 'metadata', 'children'];
    for (const field of requiredFields) {
      if (!(field in node)) {
        console.error(`Node missing required field: ${field}`);
        return false;
      }
    }

    // Check children is array
    if (!Array.isArray(node.children)) {
      console.error('Node children should be an array');
      return false;
    }

    // Check metadata has required fields
    const metadataFields = ['success', 'duration', 'llmCalls'];
    for (const field of metadataFields) {
      if (!(field in node.metadata)) {
        console.error(`Node metadata missing field: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    // Only handle if no input is focused
    if (document.activeElement.tagName === 'INPUT') return;

    switch (event.key) {
      case 'f':
      case 'F':
        event.preventDefault();
        this.visualizer.fitToScreen();
        break;
      case 'd':
      case 'D':
        event.preventDefault();
        this.visualizer.toggleDetails();
        this.updateToggleButton();
        break;
      case 'e':
      case 'E':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.visualizer.exportSVG();
        }
        break;
      case 'o':
      case 'O':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.elements.fileInput.click();
        }
        break;
    }
  }

  /**
   * Update toggle button text
   */
  updateToggleButton() {
    this.elements.toggleDetails.textContent = this.visualizer.showDetails ? '📊 Hide Details' : '📊 Show Details';
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach((n) => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after configured delay
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), VISUALIZATION_CONFIG.timing.notificationAnimation);
      }
    }, VISUALIZATION_CONFIG.timing.notificationAutoRemove);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new OperationTreeApp();

  console.info('🌳 Operation Tree Visualizer initialized');
  console.info('Keyboard shortcuts:');
  console.info('  F - Fit to screen');
  console.info('  D - Toggle details');
  console.info('  Ctrl/Cmd + E - Export SVG');
  console.info('  Ctrl/Cmd + O - Open file');
});
