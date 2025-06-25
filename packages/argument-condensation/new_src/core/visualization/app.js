import { TreeVisualizer } from './treeVisualizer.js';

// Main application class
class OperationTreeApp {
    constructor() {
        this.visualizer = new TreeVisualizer('tree-container');
        this.currentTreeData = null;
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // File input handler
        const fileInput = document.getElementById('tree-file');
        fileInput.addEventListener('change', (event) => this.handleFileLoad(event));

        // Control buttons
        document.getElementById('fit-btn').addEventListener('click', () => {
            this.visualizer.fitToScreen();
        });

        document.getElementById('toggle-details').addEventListener('click', () => {
            this.visualizer.toggleDetails();
            this.updateToggleButton();
        });

        document.getElementById('export-svg').addEventListener('click', () => {
            this.visualizer.exportSVG();
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            if (this.currentTreeData) {
                // Just fit to screen, don't reload the entire tree
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.visualizer.fitToScreen();
                }, 250);
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
            reader.onerror = (e) => reject(new Error('Failed to read file'));
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
                    document.getElementById('tree-file').click();
                }
                break;
        }
    }

    /**
     * Update toggle button text
     */
    updateToggleButton() {
        const button = document.getElementById('toggle-details');
        button.textContent = this.visualizer.showDetails ? '📊 Hide Details' : '📊 Show Details';
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
        existing.forEach(n => n.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            minWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideInRight 0.3s ease-out'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Style close button
        const closeBtn = notification.querySelector('.notification-close');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
        });

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Generate sample tree data for testing
     */
    generateSampleTree() {
        const sampleTree = {
            runId: `sample-${Date.now()}`,
            roots: ['node-1'],
            nodes: {
                'node-1': {
                    operation: 'MAP',
                    stepIndex: 0,
                    batchIndex: 0,
                    input: {
                        comments: [
                            { id: '1', text: 'Sample comment 1' },
                            { id: '2', text: 'Sample comment 2' },
                            { id: '3', text: 'Sample comment 3' }
                        ]
                    },
                    output: {
                        arguments: [
                            { text: 'Mapped argument 1' },
                            { text: 'Mapped argument 2' }
                        ]
                    },
                    metadata: {
                        success: true,
                        duration: 1500,
                        llmCalls: 1,
                        startTime: Date.now() - 2000,
                        endTime: Date.now() - 500
                    },
                    children: ['node-2']
                },
                'node-2': {
                    operation: 'REDUCE',
                    stepIndex: 1,
                    input: {
                        argumentLists: [
                            [{ text: 'Mapped argument 1' }, { text: 'Mapped argument 2' }]
                        ]
                    },
                    output: {
                        arguments: [
                            { text: 'Reduced argument 1' }
                        ]
                    },
                    metadata: {
                        success: true,
                        duration: 800,
                        llmCalls: 1,
                        startTime: Date.now() - 1000,
                        endTime: Date.now() - 200
                    },
                    children: ['node-3']
                },
                'node-3': {
                    operation: 'GROUND',
                    stepIndex: 2,
                    input: {
                        arguments: [{ text: 'Reduced argument 1' }],
                        comments: [
                            { id: '1', text: 'Sample comment 1' },
                            { id: '2', text: 'Sample comment 2' }
                        ]
                    },
                    output: {
                        arguments: [
                            { text: 'Final grounded argument' }
                        ]
                    },
                    metadata: {
                        success: true,
                        duration: 1200,
                        llmCalls: 1,
                        startTime: Date.now() - 500,
                        endTime: Date.now()
                    },
                    children: []
                }
            },
            metadata: {
                totalOperations: 3,
                maxDepth: 3,
                totalDuration: 3500,
                totalLlmCalls: 3,
                startTime: Date.now() - 2000,
                endTime: Date.now()
            },
            finalArguments: [
                { text: 'Final grounded argument' }
            ]
        };

        return sampleTree;
    }

    /**
     * Load sample tree for demonstration
     */
    loadSampleTree() {
        const sampleTree = this.generateSampleTree();
        this.currentTreeData = sampleTree;
        this.visualizer.loadTree(sampleTree);
        this.showSuccessMessage('Loaded sample tree for demonstration');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OperationTreeApp();
    
    // Add sample tree button for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const controls = document.querySelector('.view-controls');
        const sampleBtn = document.createElement('button');
        sampleBtn.className = 'btn btn-secondary';
        sampleBtn.textContent = '🧪 Load Sample';
        sampleBtn.addEventListener('click', () => window.app.loadSampleTree());
        controls.appendChild(sampleBtn);
    }
    
    console.log('🌳 Operation Tree Visualizer initialized');
    console.log('Keyboard shortcuts:');
    console.log('  F - Fit to screen');
    console.log('  D - Toggle details');
    console.log('  Ctrl/Cmd + E - Export SVG');
    console.log('  Ctrl/Cmd + O - Open file');
}); 