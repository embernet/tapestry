
import { ColorScheme, SystemPromptConfig } from './types';

export const NODE_MAX_WIDTH = 160;
export const NODE_PADDING = 10;
export const LINK_DISTANCE = 250;
export const DEFAULT_NODE_COLOR = '#e2e8f0'; // slate-200

export const AVAILABLE_AI_TOOLS = [
    { 
        id: 'triz', 
        name: 'TRIZ (Problem Solving)', 
        description: 'Theory of Inventive Problem Solving. Uses algorithmic methods (40 Principles, Contradiction Matrix) to overcome technical and physical contradictions without compromise.'
    },
    { 
        id: 'lss', 
        name: 'Lean Six Sigma (Process)', 
        description: 'Focuses on improving performance by removing waste (Lean) and reducing variation (Six Sigma). Includes DMAIC, 5 Whys, and Fishbone diagrams.'
    },
    { 
        id: 'toc', 
        name: 'Theory of Constraints', 
        description: 'Identifies the single most important limiting factor (bottleneck) that stands in the way of achieving a goal and systematically improves it.'
    },
    { 
        id: 'ssm', 
        name: 'Soft Systems Methodology', 
        description: 'An approach for tackling complex, messy, and ill-defined problem situations (like human systems) using Rich Pictures and Root Definitions (CATWOE).'
    },
    { 
        id: 'scamper', 
        name: 'SCAMPER (Ideation)', 
        description: 'A lateral thinking technique that challenges the status quo by suggesting specific changes: Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse.'
    },
    {
        id: 'swot',
        name: 'SWOT Analysis (Strategy)',
        description: 'Strategic planning technique used to identify Strengths, Weaknesses, Opportunities, and Threats related to business competition or project planning.'
    },
    { 
        id: 'mining', 
        name: 'Data Mining', 
        description: 'Analyzes the graph structure to extract statistics, clusters, and patterns, visualizing data distributions (e.g., Treemaps) to find insights.'
    },
    { 
        id: 'tagcloud', 
        name: 'Tag Cloud', 
        description: 'Visualizes the frequency of tags and node connectivity to highlight dominant themes and key elements in the model.'
    }
];

export const DEFAULT_TOOL_PROMPTS: Record<string, string> = {
    scamper: `You are an expert in the SCAMPER ideation technique. Help the user generate creative ideas by modifying existing concepts.
Generate distinct, creative ideas that emerge from applying the specific operator.`,
    triz: `You are an expert TRIZ Master. Analyze the provided graph model. Use the specific TRIZ tool requested (Contradiction Matrix, 40 Principles, ARIZ, etc.) to solve the problem.

OUTPUT FORMAT:
Return a JSON object with two fields:
1. "analysis": A detailed MARKDOWN string explaining your findings. Structure it with headers.
2. "actions": An array of suggested graph modifications. Each action must be a function call object: { name: "addElement" | "addRelationship" | "deleteElement" | "setElementAttribute", args: { ... } }.`,
    lss: `You are an expert Master Black Belt in Lean Six Sigma. Analyze the provided graph model using data-driven quality strategies.

OUTPUT FORMAT:
Return a JSON object with two fields:
1. "analysis": A detailed MARKDOWN string explaining your findings using LSS terminology (Sigma level, Variance, Waste/Muda, Root Cause, RPN).
2. "actions": An array of suggested graph modifications. Each action must be a function call object: { name: "addElement" | "addRelationship" | "deleteElement" | "setElementAttribute", args: { ... } }.`,
    toc: `You are an expert in the Theory of Constraints (TOC). Analyze the provided graph model to identify bottlenecks and constraints.

OUTPUT FORMAT:
Return a JSON object with two fields:
1. "analysis": A detailed MARKDOWN string explaining your findings using TOC terminology (UDEs, Constraints, Injections, etc.).
2. "actions": An array of suggested graph modifications. Each action must be a function call object: { name: "addElement" | "addRelationship" | "deleteElement" | "setElementAttribute", args: { ... } }.`,
    ssm: `You are an expert in Soft Systems Methodology (SSM). Analyze the provided graph model to explore complex, unstructured problems.

OUTPUT FORMAT:
Return a JSON object with two fields:
1. "analysis": A detailed MARKDOWN string explaining your findings using SSM terminology.
2. "actions": An array of suggested graph modifications. Each action must be a function call object: { name: "addElement" | "addRelationship" | "deleteElement" | "setElementAttribute", args: { ... } }.`,
    swot: `You are a Strategic Analyst specializing in SWOT Analysis. Analyze the provided graph model to identify Strengths, Weaknesses, Opportunities, and Threats.

OUTPUT FORMAT:
Return a JSON object with two fields:
1. "analysis": A detailed MARKDOWN string explaining your findings, organized by Strength, Weakness, Opportunity, Threat.
2. "actions": An array of suggested graph modifications. Each action must be a function call object: { name: "addElement" | "addRelationship" | "deleteElement" | "setElementAttribute", args: { ... } }.`
};

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
  userPrompt: "",
  userContext: "",
  responseStyle: "",
  enabledTools: AVAILABLE_AI_TOOLS.map(t => t.id),
  toolPrompts: DEFAULT_TOOL_PROMPTS
};

export const DEFAULT_COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'scheme-useful-harmful',
    name: 'Useful Harmful',
    tagColors: {
      'Context': '#e2e8f0', // slate-200
      'Useful': '#86efac', // green-300
      'Harmful': '#fca5a5', // red-300
      'Emotion': '#fda4af', // rose-300
      'Action': '#93c5fd', // blue-300
      'Trend': '#5eead4', // teal-300
      'Idea': '#fcd34d', // amber-300
      'Knowledge': '#c4b5fd', // violet-300
      'Topic': '#d8b4fe', // purple-300
    },
    tagDescriptions: {
      'Context': 'Background information, environment, or setting that frames the situation.',
      'Useful': 'A positive element, resource, or factor that adds value or solves a problem.',
      'Harmful': 'A negative element, risk, problem, or obstacle that reduces value.',
      'Emotion': 'A subjective human feeling or reaction to the situation.',
      'Action': 'A concrete step or task that is done or needs to be done.',
      'Trend': 'A direction in which something is developing or changing over time.',
      'Idea': 'A proposed thought, suggestion, or possible course of action.',
      'Knowledge': 'Facts, information, and skills acquired through experience or education.',
      'Topic': 'A specific subject matter or area of discussion.'
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
      'Context': '#e2e8f0', // slate-200
      'Organisation': '#d8b4fe', // purple-300
      'Person': '#fdba74', // orange-300
      'Action': '#93c5fd', // blue-300
      'Product': '#86efac', // green-300
      'Idea': '#fcd34d', // amber-300
      'Topic': '#c4b5fd', // violet-300
      'Question': '#f9a8d4', // pink-300
      'Challenge': '#fca5a5', // red-300
      'Trend': '#5eead4', // teal-300
    },
    tagDescriptions: {
      'Context': 'Background information, environment, or setting that frames the situation.',
      'Organisation': 'A company, institution, NGO, or government body.',
      'Person': 'An individual stakeholder, employee, or contact.',
      'Action': 'A specific activity, project, or initiative being undertaken.',
      'Product': 'A tangible item, software, or service produced for sale or use.',
      'Idea': 'A strategic concept, innovation, or plan for the future.',
      'Topic': 'A theme, industry sector, or subject of shared interest.',
      'Question': 'An uncertainty or inquiry that drives research or discussion.',
      'Challenge': 'A difficulty, competitor, or obstacle impeding progress.',
      'Trend': 'A market shift or behavioral pattern influencing the network.'
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
  },
  {
    id: 'scheme-project-management',
    name: 'Project & Stakeholders',
    tagColors: {
      'Context': '#e2e8f0',    // slate-200
      'Project': '#7dd3fc',    // sky-300
      'Stakeholder': '#fdba74', // orange-300
      'Goal': '#86efac',       // green-300
      'Risk': '#fca5a5',       // red-300
      'Milestone': '#fcd34d',  // amber-300
      'Task': '#93c5fd',       // blue-300
      'Resource': '#bef264',   // lime-300
      'Constraint': '#cbd5e1', // slate-300
      'Deliverable': '#a5b4fc', // indigo-300
      'Organisation': '#d8b4fe', // purple-300
      'Topic': '#c4b5fd', // violet-300
      'Knowledge': '#c4b5fd', // violet-300
      'Action': '#93c5fd'      // blue-300
    },
    tagDescriptions: {
      'Context': 'Background information, environment, or setting that frames the situation.',
      'Project': 'The overall initiative or undertaking being modeled.',
      'Stakeholder': 'Individuals, groups, or organizations with an interest or influence in the project.',
      'Goal': 'The desired outcome or primary objective of the project.',
      'Risk': 'A potential event or condition that could have a negative impact.',
      'Milestone': 'A significant point or event in the project timeline.',
      'Task': 'A specific unit of work to be performed.',
      'Resource': 'Assets, budget, tools, or personnel required to complete tasks.',
      'Constraint': 'A limitation or restriction (budget, time, scope, regulation).',
      'Deliverable': 'A tangible or intangible output produced as a result of the project.',
      'Organisation': 'A formal group or entity involved in the project.',
      'Topic': 'A subject or area of interest relevant to the project.',
      'Knowledge': 'Information or expertise required or generated.',
      'Action': 'A step or operation to be carried out.'
    },
    relationshipDefinitions: [
      { label: 'manages', description: 'Stakeholder has oversight or control over a task or resource.' },
      { label: 'responsible for', description: 'Stakeholder has the duty to perform the task.' },
      { label: 'accountable for', description: 'Stakeholder is answerable for the correct completion.' },
      { label: 'consulted', description: 'Stakeholder provides input before a decision or action.' },
      { label: 'informed', description: 'Stakeholder needs to be kept up-to-date on progress.' },
      { label: 'requires', description: 'Dependency: Task A cannot proceed without Resource B or Task C.' },
      { label: 'blocks', description: 'Task A prevents Task B from starting.' },
      { label: 'mitigates', description: 'Action or control reduces the impact or likelihood of a risk.' },
      { label: 'achieves', description: 'Completion of a task or milestone leads to a goal.' },
      { label: 'delivers', description: 'Task produces a specific deliverable.' },
      { label: 'impacts', description: 'Risk or change affects a goal, timeline, or resource.' },
      { label: 'enables', description: 'Makes a subsequent task or outcome possible.' },
      { label: 'stakeholder for', description: 'Identifies the project or area a stakeholder cares about.' },
      { label: 'interested in', description: 'Stakeholder has a specific interest in a topic or outcome.' },
      { label: 'supports', description: 'Provides resources, backing, or endorsement.' },
      { label: 'includes', description: 'Indicates a container or grouping relationship (e.g. Project includes Task).' }
    ],
    defaultRelationshipLabel: 'requires'
  },
  {
    id: 'scheme-systems-thinking',
    name: 'Systems Thinking',
    tagColors: {
      'Context': '#e2e8f0',  // slate-200
      'Variable': '#93c5fd', // blue-300
      'Stock': '#86efac',    // green-300
      'Flow': '#5eead4',     // teal-300
      'Delay': '#e2e8f0',    // slate-200
      'Goal': '#86efac',     // green-300
      'Feedback Loop': '#fdba74', // orange-300
      'External Factor': '#fca5a5' // red-300
    },
    tagDescriptions: {
      'Context': 'Background information, environment, or setting that frames the situation.',
      'Variable': 'A factor that can change or be changed within the system.',
      'Stock': 'An accumulation of material or information that has built up over time.',
      'Flow': 'Movement of material or information into or out of a stock.',
      'Delay': 'A time lag between a cause and its effect.',
      'Goal': 'The desired state or purpose of the system.',
      'Feedback Loop': 'A closed chain of causal connections (Reinforcing or Balancing).',
      'External Factor': 'An influence from outside the system boundary.'
    },
    relationshipDefinitions: [
      { label: 'increases', description: 'Causes the target variable to go up.' },
      { label: 'decreases', description: 'Causes the target variable to go down.' },
      { label: 'reinforces', description: 'Creating a positive feedback loop (compounding).' },
      { label: 'balances', description: 'Creating a negative feedback loop (stabilizing).' },
      { label: 'delays', description: 'Slows down the transmission of an effect.' },
      { label: 'regulates', description: 'Controls the rate of flow.' }
    ],
    defaultRelationshipLabel: 'increases'
  },
  {
    id: 'scheme-design-thinking',
    name: 'Design Thinking',
    tagColors: {
      'Context': '#e2e8f0',  // slate-200
      'Persona': '#fdba74',  // orange-300
      'Need': '#fca5a5',     // red-300
      'Insight': '#c4b5fd',  // violet-300
      'Idea': '#fcd34d',     // amber-300
      'Prototype': '#86efac',// green-300
      'Test': '#7dd3fc',     // sky-300
      'Constraint': '#cbd5e1' // slate-300
    },
    tagDescriptions: {
      'Context': 'Background information, environment, or setting that frames the situation.',
      'Persona': 'A fictional character representing a user type.',
      'Need': 'A user requirement or desire (explicit or latent).',
      'Insight': 'A deep understanding of a user or problem, often counter-intuitive.',
      'Idea': 'A potential solution generated during brainstorming.',
      'Prototype': 'A preliminary model of an idea used for testing.',
      'Test': 'An experiment to validate or invalidate an idea.',
      'Constraint': 'A limitation or restriction (budget, time, tech).'
    },
    relationshipDefinitions: [
      { label: 'has need', description: 'Links a persona to a requirement.' },
      { label: 'inspires', description: 'An insight or need triggers an idea.' },
      { label: 'solves', description: 'An idea addresses a need.' },
      { label: 'validates', description: 'A test proves an idea works.' },
      { label: 'invalidates', description: 'A test proves an idea fails.' },
      { label: 'evolves into', description: 'A prototype changes into a refined version.' }
    ],
    defaultRelationshipLabel: 'inspires'
  },
  {
    id: 'scheme-theory-of-change',
    name: 'Theory of Change',
    tagColors: {
      'Context': '#e2e8f0',  // slate-200
      'Input': '#e2e8f0',    // slate-200
      'Activity': '#93c5fd', // blue-300
      'Output': '#5eead4',   // teal-300
      'Outcome': '#86efac',  // green-300
      'Impact': '#fcd34d',   // amber-300
      'Assumption': '#f9a8d4', // pink-300
      'Risk': '#fca5a5'      // red-300
    },
    tagDescriptions: {
      'Context': 'Background information, environment, or setting that frames the situation.',
      'Input': 'Resources invested (money, time, staff).',
      'Activity': 'What the program does with the inputs.',
      'Output': 'Direct, tangible products of the activities.',
      'Outcome': 'Changes in participants (knowledge, skills, behavior).',
      'Impact': 'Long-term societal or systemic change.',
      'Assumption': 'Underlying belief necessary for the logic to hold.',
      'Risk': 'Potential factor that could derail the process.'
    },
    relationshipDefinitions: [
      { label: 'leads to', description: 'Direct causal link to the next stage.' },
      { label: 'enables', description: 'Makes the next step possible.' },
      { label: 'contributes to', description: 'Partial cause of an outcome.' },
      { label: 'requires', description: 'Dependency on an input or condition.' },
      { label: 'assumes', description: 'Link to an underlying assumption.' }
    ],
    defaultRelationshipLabel: 'leads to'
  },
  {
    id: 'scheme-business-model',
    name: 'Business Model',
    tagColors: {
      'Context': '#e2e8f0',        // slate-200
      'Value Prop': '#fcd34d',     // amber-300
      'Customer': '#fdba74',       // orange-300
      'Channel': '#7dd3fc',        // sky-300
      'Relationship': '#f9a8d4',   // pink-300
      'Revenue': '#86efac',        // green-300
      'Key Resource': '#bef264',   // lime-300
      'Key Activity': '#93c5fd',   // blue-300
      'Key Partner': '#d8b4fe',    // purple-300
      'Cost': '#fca5a5'            // red-300
    },
    tagDescriptions: {
      'Context': 'Background information, environment, or setting that frames the situation.',
      'Value Prop': 'The bundle of products and services that create value for a specific customer segment.',
      'Customer': 'The different groups of people or organizations an enterprise aims to reach and serve.',
      'Channel': 'How a company communicates with and reaches its customer segments.',
      'Relationship': 'The types of relationships a company establishes with specific customer segments.',
      'Revenue': 'The cash a company generates from each customer segment.',
      'Key Resource': 'The most important assets required to make a business model work.',
      'Key Activity': 'The most important things a company must do to make its business model work.',
      'Key Partner': 'The network of suppliers and partners that make the business model work.',
      'Cost': 'All costs incurred to operate a business model.'
    },
    relationshipDefinitions: [
      { label: 'provides', description: 'Delivers value to a customer.' },
      { label: 'reaches', description: 'Connects via a channel.' },
      { label: 'generates', description: 'Creates revenue.' },
      { label: 'requires', description: 'Needs a resource or activity.' },
      { label: 'helps', description: 'A partner assists with an activity.' },
      { label: 'pays', description: 'Customer exchanges money for value.' },
      { label: 'incurs', description: 'Activity creates a cost.' }
    ],
    defaultRelationshipLabel: 'provides'
  },
  {
    id: 'scheme-root-cause',
    name: 'Root Cause Analysis',
    tagColors: {
      'Context': '#e2e8f0',    // slate-200
      'Problem': '#fca5a5',    // red-300
      'Symptom': '#fda4af',    // rose-300
      'Cause': '#c4b5fd',      // violet-300
      'Root Cause': '#cbd5e1', // slate-300
      'Solution': '#86efac',   // green-300
      'Evidence': '#7dd3fc'    // sky-300
    },
    tagDescriptions: {
      'Context': 'Background information, environment, or setting that frames the situation.',
      'Problem': 'The main issue being investigated.',
      'Symptom': 'A visible sign or indication of the problem.',
      'Cause': 'A reason contributing to the problem.',
      'Root Cause': 'The fundamental underlying reason for the problem.',
      'Solution': 'A proposed fix for a cause.',
      'Evidence': 'Data or observation proving a cause exists.'
    },
    relationshipDefinitions: [
      { label: 'caused by', description: 'Direct causal link backwards.' },
      { label: 'results in', description: 'Direct causal link forwards.' },
      { label: 'evidenced by', description: 'Proof of a link.' },
      { label: 'solves', description: 'Eliminates a cause.' },
      { label: 'mitigates', description: 'Reduces the impact of a symptom.' }
    ],
    defaultRelationshipLabel: 'caused by'
  },
  {
    id: 'scheme-user-journey',
    name: 'User Journey Map',
    tagColors: {
      'Context': '#e2e8f0',    // slate-200
      'User': '#fdba74',       // orange-300
      'Step': '#e2e8f0',       // slate-200
      'Touchpoint': '#5eead4', // teal-300
      'Emotion': '#fda4af',    // rose-300
      'Pain Point': '#fca5a5', // red-300
      'Opportunity': '#fcd34d' // amber-300
    },
    tagDescriptions: {
      'Context': 'Background information, environment, or setting that frames the situation.',
      'User': 'The person experiencing the journey.',
      'Step': 'A distinct action or phase in the timeline.',
      'Touchpoint': 'A point of interaction between the user and the product/service.',
      'Emotion': 'How the user feels at a specific step.',
      'Pain Point': 'A problem or frustration encountered.',
      'Opportunity': 'A chance to improve the experience.'
    },
    relationshipDefinitions: [
      { label: 'takes step', description: 'User moves to the next action.' },
      { label: 'feels', description: 'User experiences an emotion.' },
      { label: 'interacts with', description: 'User engages with a touchpoint.' },
      { label: 'encounters', description: 'User finds a pain point.' },
      { label: 'suggests', description: 'Pain point reveals an opportunity.' }
    ],
    defaultRelationshipLabel: 'takes step'
  }
];

export const TAGLINES = [
    "Visual Knowledge Weaver",
    "Complex Problem Solver",
    "Emerging Trend Explorer",
    "Creative Solution Mapper",
    "Strategic Insight Generator",
    "Dynamic Connection Builder",
    "Structured Chaos Organizer",
    "Future Scenario Planner"
];
