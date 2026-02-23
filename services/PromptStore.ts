
import { defaultPrompts } from '../prompts';

class PromptStore {
    private prompts: Record<string, string>;

    constructor() {
        this.prompts = { ...defaultPrompts };
    }

    /**
     * Retrieve a prompt by its key.
     * @param key The key of the prompt in prompts.ts
     * @param params Optional object of key-value pairs to replace placeholders (e.g. {{key}}) in the prompt.
     */
    get(key: string, params?: Record<string, string>): string {
        let prompt = this.prompts[key] || "";
        
        if (params) {
            Object.entries(params).forEach(([placeholder, value]) => {
                // Replace all occurrences of {{placeholder}}
                const regex = new RegExp(`{{${placeholder}}}`, 'g');
                prompt = prompt.replace(regex, value);
            });
        }
        
        return prompt;
    }

    /**
     * Get all available prompts as a Record.
     * Useful for initializing editor states.
     */
    getAll(): Record<string, string> {
        return { ...this.prompts };
    }
}

export const promptStore = new PromptStore();