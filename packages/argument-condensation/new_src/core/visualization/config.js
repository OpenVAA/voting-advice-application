/**
 * Configuration constants for the operation tree visualization
 */
export const VISUALIZATION_CONFIG = {
    // Layout settings
    layout: {
        nodeRadius: 25,
        horizontalSpacing: 150,
        verticalSpacing: 100,
        padding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
        }
    },

    // Animation settings
    animation: {
        duration: 300,
        transitionEasing: 'ease-out'
    },

    // Colors
    colors: {
        operations: {
            MAP: { stroke: '#10b981', fill: '#ecfdf5' },
            ITERATE_MAP: { stroke: '#6366f1', fill: '#f0f9ff' },
            REDUCE: { stroke: '#f59e0b', fill: '#fefce8' },
            REFINE: { stroke: '#8b5cf6', fill: '#f3e8ff' },
            GROUND: { stroke: '#ef4444', fill: '#fef2f2' }
        },
        status: {
            success: '#10b981',
            error: '#ef4444'
        },
        notifications: {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        }
    },

    // Icons
    icons: {
        operations: {
            MAP: '🗺️',
            ITERATE_MAP: '🔁',
            REDUCE: '⚡',
            REFINE: '✨',
            GROUND: '🏗️',
            ROOT: '🌳',
            EMPTY: '❓'
        }
    },

    // Notification settings
    notifications: {
        autoRemoveDelay: 5000,
        animationDuration: 300
    }
};

export default VISUALIZATION_CONFIG; 