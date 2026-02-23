
import { ToolClient } from '../types';

class ToolRegistryService {
    private tools: Map<string, ToolClient> = new Map();

    registerTool(tool: ToolClient) {
        this.tools.set(tool.id, tool);
        console.debug(`[ToolRegistry] Registered tool: ${tool.id}`);
    }

    getTool(id: string): ToolClient | undefined {
        return this.tools.get(id);
    }

    listTools(): ToolClient[] {
        return Array.from(this.tools.values());
    }

    // Unregister helper (useful for cleanup if components unmount, though mostly tools are static)
    unregisterTool(id: string) {
        this.tools.delete(id);
    }
}

export const toolRegistry = new ToolRegistryService();
