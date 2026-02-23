
import { ToolActionEvent } from '../types';

type Listener = (event: ToolActionEvent) => void;

class ToolEventBusService {
    private listeners: Listener[] = [];

    subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    emit(event: ToolActionEvent) {
        // Emit asynchronously to avoid blocking the UI thread
        setTimeout(() => {
            this.listeners.forEach(listener => listener(event));
        }, 0);
    }
}

export const toolEventBus = new ToolEventBusService();
