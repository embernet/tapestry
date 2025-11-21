
import { ColorScheme, SystemPromptConfig } from './types';

export const NODE_MAX_WIDTH = 160;
export const NODE_PADDING = 10;
export const LINK_DISTANCE = 250;
export const DEFAULT_NODE_COLOR = '#6b7280'; // gray-500

export const DEFAULT_SYSTEM_PROMPT_CONFIG: SystemPromptConfig = {
  defaultPrompt: `You are an expert analyst inside a visual knowledge graph innovation system (Tapestry). The user is always asking questions in the context of the currently loaded knowledge graph (or a selected subgraph). This graph represents a full causal, logical, and systemic model — never treat the user’s question as an isolated general-knowledge query.

CRITICAL RULES:
1. Before answering ANY question, you WILL receive the relevant portion of the knowledge graph (as nodes, edges, properties, and text) in the conversation history or as a separate context block. You MUST read and fully internalise this graph context first.
2. Always interpret the user’s question through the specific causal chains, assumptions, constraints, and relationships that exist in the provided graph. Never fall back to generic world knowledge if it contradicts or ignores the graph’s structure.
3. When giving examples, evidence, counter-examples, or implications, they MUST be consistent with the causal pathways and scope defined in the graph. For instance:
   - If the graph shows biodiversity loss → caused by pollution → caused by vehicle emissions, then examples of biodiversity loss must be ones that can plausibly be linked to pollution or vehicle emissions in the real world (e.g., ocean dead zones, bee colony collapse from exhaust particulates, freshwater fish die-offs from runoff). Extinctions caused by hunting, island colonisation, or habitat destruction unrelated to pollution (like the Dodo) are INAPPROPRIATE and must not be used.
4. If the graph narrows the scope (time period, geography, industry, technology, etc.), rigidly respect those boundaries.
5. When the graph contains assumptions, confidence scores, contradictions, or Wardley Map evolution stages, explicitly reference and reasoning within those constraints.
6. If something is uncertain or ambiguous in the graph, say so and ask for clarification instead of inventing external examples.
7. Never hallucinate nodes or relationships that do not exist in the provided context.

Response style: precise, context-aware, and deeply faithful to the graph. Cite element titles when relevant (e.g., “As shown in elements ‘Agricultural Runoff → Eutrophication’…”). Think step-by-step in your internal reasoning about how the graph structure shapes the answer, then give the final user-facing response.`,
  userPrompt: ""
};

export const DEFAULT_COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'scheme-useful-harmful',
    name: 'Useful Harmful',
    tagColors: {
      'Context': '#6b7280',
      'Useful': '#22c55e',
      'Harmful': '#ef4444',
      'Emotion': '#f97316',
      'Action': '#3b82f6',
      'Trend': '#14b8a6', // teal-500
      'Idea': '#efef10', 
      'Knowledge': '#a855f7', // purple-500
      'Topic': '#a855f7', // purple-500
    },
    relationshipDefinitions: [
      { label: 'Enables', description: 'allows another function to occur.' },
      { label: 'Enhances', description: 'improves efficiency, performance, or quality.' },
      { label: 'Amplifies', description: 'increases magnitude or speed.' },
      { label: 'Stabilises', description: 'reduces variability or drift.' },
      { label: 'Constrains', description: 'limits capability or range.' },
      { label: 'Degrades', description: 'reduces efficiency or performance.' },
      { label: 'Inhibits', description: 'slows or blocks a function.' },
      { label: 'Destabilises', description: 'increases variability, noise, or unpredictability.' },
      { label: 'Produces', description: 'creates a new effect, output, or state.' },
      { label: 'Consumes', description: 'uses up a resource or capacity.' },
      { label: 'Transforms', description: 'changes the form/structure of something.' },
      { label: 'Transfers', description: 'moves energy, information, or material.' },
      { label: 'Compromises', description: 'improves some aspects but harms others.' },
      { label: 'Competes with', description: 'multiple processes draw from the same resource.' },
      { label: 'Counteracts', description: 'opposes or reduces the effect of.' },
      { label: 'Initiates', description: 'triggers downstream effects.' },
      { label: 'Propagates', description: 'spreads an effect through the system.' },
      { label: 'Buffers', description: 'absorbs or dampens shocks or variability.' },
      { label: 'Exposes', description: 'introduces a vulnerability or makes a risk visible.' }
    ]
  },
  {
    id: 'scheme-networking',
    name: 'Networking',
    tagColors: {
      'Organisation': '#111827', // gray-900
      'Person': '#f97316',
      'Action': '#3b82f6',
      'Product': '#22c55e',
      'Idea': '#efef10',
      'Topic': '#a855f7', // purple-500
      'Question': '#ec4899', // pink-500
      'Challenge': '#ef4444', // red-500
      'Trend': '#14b8a6', // teal-500
    },
    relationshipDefinitions: [
      { label: 'related to', description: 'A generic connection between two elements.' },
      { label: 'is a', description: 'Indicates the element is a subtype or instance of the target.' },
      { label: 'knows', description: 'Indicates a social or professional acquaintance.' },
      { label: 'works for', description: 'Indicates employment or reporting hierarchy.' },
      { label: 'works with', description: 'Indicates a peer or cooperative working relationship.' },
      { label: 'author of', description: 'Indicates creation of a document, policy, or creative work.' },
      { label: 'member of', description: 'Indicates belonging to a group or organization.' },
      { label: 'interested in', description: 'Indicates curiosity or desire for a topic or outcome.' },
      { label: 'collaborates with', description: 'Indicates active joint work on a shared goal.' },
      { label: 'manages', description: 'Indicates responsibility for directing a person or resource.' },
      { label: 'created', description: 'Indicates the act of bringing something into existence.' },
      { label: 'located in', description: 'Indicates physical or logical containment.' },
      { label: 'influences', description: 'Indicates the ability to affect the character or behavior of.' },
      { label: 'depends-on', description: 'Indicates a requirement for the other element to function.' },
      { label: 'accountable for', description: 'Indicates ultimate answerability for an outcome.' },
      { label: 'responsible for', description: 'Indicates the duty to perform a task or function.' }
    ]
  }
];