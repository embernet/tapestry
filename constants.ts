
import { ColorScheme, SystemPromptConfig, ScriptSnippet } from './types';
import { promptStore } from './services/PromptStore';

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
        name: 'Strategic Analysis (SWOT++)',
        description: 'Strategic planning frameworks including SWOT, PESTEL, Porter’s Five Forces, and CAGE to analyze internal/external factors and competitive landscapes.'
    },
    { 
        id: 'explorer', 
        name: 'Graph Explorer', 
        description: 'Visualizes graph structure and data distributions using Treemaps, Tag charts, and Relationship analysis.'
    },
    { 
        id: 'tagcloud', 
        name: 'Tag Cloud', 
        description: 'Visualizes the frequency of tags and node connectivity to highlight dominant themes and key elements in the model.'
    }
];

export const DEFAULT_TOOL_PROMPTS: Record<string, string> = promptStore.getAll();

export const DEFAULT_SYSTEM_PROMPT_CONFIG: SystemPromptConfig = {
  defaultPrompt: promptStore.get('system:default'),
  userPrompt: "",
  userContext: "",
  responseStyle: "",
  enabledTools: AVAILABLE_AI_TOOLS.map(t => t.id),
  toolPrompts: DEFAULT_TOOL_PROMPTS
};

export const TSCRIPT_DOCS = `
TScript Language Reference (Python Syntax Subset):
- Syntax is strictly Python-like using indentation for blocks.
- **DO NOT** use 'LET', 'VAR', or 'CONST'. Use direct assignment (e.g., \`x = 10\`).
- **DO NOT** use 'END', 'ENDIF', 'NEXT'. Blocks are closed by dedenting.
- Comments start with #.
- Supported operators: +, ==, !=, >, <, in.

Variables & Lists:
  x = []
  x.append("item")
  
Logic (Indentation required):
  if x == 10:
      print("Equal")
  else:
      print("Not Equal")
  
Loops (Indentation required):
  for item in list:
      print(item.name)
      sleep(1)

Supported Methods (Standard Library):
1. Lists (Arrays):
   - list.append(item)
   - list.pop()
   - list.remove(item)
   - list.clear()
   - list.length() (returns number)

2. Strings:
   - str.split(separator)
   - str.replace(old, new)
   - str.lower()
   - str.upper()

Available Tools (Libraries):

1. graph
   - get_all_nodes() -> returns list of nodes
   - get_node_by_name(name="...") -> returns node object or null
   - query_nodes(tag="...", [attribute]="...") -> returns list of nodes
   - add_node(name="...", tags="...", notes="...") -> returns new node object
   - delete_node(id="...") -> returns boolean
   - add_edge(source="ID", target="ID", label="...") -> returns edge object
   - get_neighbors(id="...") -> returns list of nodes
   - get_connections(id="...") -> returns list of objects {id, neighbor, label, arrow}
   - set_attribute(id="...", key="...", value="...") -> returns boolean
   - add_tag(id="...", tag="...") -> returns boolean
   - remove_tag(id="...", tag="...") -> returns boolean
   - set_highlight(id="...", color="#hex") -> sets persistent highlight
   - clear_highlight(id="...") -> removes persistent highlight

2. canvas
   - select_node(id="...") -> opens details panel for node
   - pan_to_node(id="...") -> moves camera to node
   - highlight_node(id="...", color="#hex") -> applies transient visual highlight (not saved)
   - clear_highlights() -> clears transient highlights
   - clear_selection() -> deselects all

3. markdown
   - create_doc(title="...", content="...") -> creates new doc, returns ID
   - append_text(doc="ID_OR_TITLE", text="...") -> appends text to doc
   - open_doc(id="...") -> opens document panel

Example Script:
found = []
nodes = graph.query_nodes(tag="Risk")
for n in nodes:
  if "High" in n.tags:
     found.append(n.name)

print("High risks found: " + found.length())
`;

export const DEFAULT_SNIPPETS: ScriptSnippet[] = [
    {
        id: 'sys-walk',
        name: 'Walk & Highlight',
        description: 'Walks through all nodes with a specific tag, highlighting them and panning the camera.',
        isSystem: true,
        code: `target_tag = "Risk"
nodes = graph.query_nodes(tag=target_tag)
print("Found " + nodes.length + " nodes.")

for node in nodes:
    canvas.pan_to_node(id=node.id)
    canvas.highlight_node(id=node.id, color="#facc15")
    sleep(0.8)

canvas.clear_highlights()`
    },
    {
        id: 'sys-report',
        name: 'Generate Report Doc',
        description: 'Creates a comprehensive report with separate sections for Goals, Tasks, Risks, etc.',
        isSystem: true,
        code: `report = "# System Analysis Report\\n\\n"
sect_goal = "## Goals\\n"
sect_uh = "## Useful & Harmful\\n"
sect_task = "## Tasks & Actions\\n"
sect_risk = "## Risks & Issues\\n"
sect_other = "## Other Elements\\n"
has_other = False

nodes = graph.get_all_nodes()
print("Analyzing " + nodes.length + " nodes...")

for n in nodes:
    # 1. Build Details
    details = "### " + n.name + "\\n"
    
    if n.tags.length > 0:
        details = details + "- **Tags:** "
        for t in n.tags:
             details = details + t + ", "
        details = details + "\\n"
    
    if n.notes:
        details = details + "- **Notes:** " + n.notes + "\\n"
    
    # Connections
    conns = graph.get_connections(id=n.id)
    if conns.length > 0:
        details = details + "- **Relationships:**\\n"
        for c in conns:
            # Format: - --> TargetName (Label)
            line = "  - " + "\`" + c.arrow + "\`" + " " + c.neighbor.name
            if c.label:
                line = line + " (" + c.label + ")"
            details = details + line + "\\n"
    
    details = details + "\\n"

    # 2. Categorize
    matched = False
    
    if "Goal" in n.tags:
        sect_goal = sect_goal + details
        matched = True
    
    # Useful/Harmful
    is_uh = False
    if "Useful" in n.tags:
        is_uh = True
    if "Harmful" in n.tags:
        is_uh = True
    
    if is_uh:
        sect_uh = sect_uh + details
        matched = True
        
    # Tasks/Actions
    is_ta = False
    if "Task" in n.tags:
        is_ta = True
    if "Action" in n.tags:
        is_ta = True
    
    if is_ta:
        sect_task = sect_task + details
        matched = True

    # Risks/Issues
    is_ri = False
    if "Risk" in n.tags:
        is_ri = True
    if "Issue" in n.tags:
        is_ri = True
    
    if is_ri:
        sect_risk = sect_risk + details
        matched = True
        
    if matched == False:
        sect_other = sect_other + details
        has_other = True

final_content = report + sect_goal + sect_uh + sect_task + sect_risk

if has_other:
    final_content = final_content + sect_other

doc_id = markdown.create_doc(title="Full System Report", content=final_content)
markdown.open_doc(id=doc_id)
print("Report generated.")`
    },
    {
        id: 'sys-goals-tasks',
        name: 'Goals & Tasks Report',
        description: 'Generates a report listing all Goals and their connected Tasks.',
        isSystem: true,
        code: `doc_content = "# Goals and Tasks\\n\\n"

goals = graph.query_nodes(tag="Goal")

if goals.length() == 0:
    doc_content += "No goals found."
else:
    for goal in goals:
        doc_content += "## Goal: " + goal.name + "\\n"
        connections = graph.get_connections(id=goal.id)
        
        has_tasks = False
        for connection in connections:
            neighbor_node = connection.neighbor
            if "Task" in neighbor_node.tags:
                doc_content += "- " + neighbor_node.name + "\\n"
                has_tasks = True
        
        if not has_tasks:
            doc_content += "  No tasks associated.\\n"
        doc_content += "\\n"

new_doc = markdown.create_doc(title="Goals and Tasks Report", content=doc_content)
markdown.open_doc(id=new_doc.id)`
    },
    {
        id: 'sys-reset',
        name: 'Reset View',
        description: 'Clears all selections and highlights.',
        isSystem: true,
        code: `canvas.clear_selection()
canvas.clear_highlights()
print("View reset.")`
    },
    {
        id: 'sys-audit',
        name: 'Attribute Audit',
        description: 'Finds nodes missing a critical attribute and highlights them persistently.',
        isSystem: true,
        code: `required_key = "Owner"
all_nodes = graph.get_all_nodes()
count = 0

print("Clearing previous persistent highlights...")
for n in all_nodes:
    graph.clear_highlight(id=n.id)

print("Checking for missing attribute: " + required_key)

for node in all_nodes:
    # Check if attribute is missing
    if node.attributes.Owner == None:
        # Use graph.set_highlight for persistent highlighting (saved with model)
        graph.set_highlight(id=node.id, color="#ef4444")
        print("Missing: " + node.name)
        count = count + 1

print("Total found: " + count)`
    },
    {
        id: 'sys-tag-neighbors',
        name: 'Tag Neighbors',
        description: 'Finds neighbors of a specific node and adds a tag to them.',
        isSystem: true,
        code: `center_name = "Project X"
center = graph.get_node_by_name(name=center_name)

if center != None:
    neighbors = graph.get_neighbors(id=center.id)
    for n in neighbors:
        graph.add_tag(id=n.id, tag="Related-to-X")
        canvas.highlight_node(id=n.id, color="#4ade80")
    print("Tagged neighbors.")
else:
    print("Center node not found.")`
    },
    {
        id: 'sys-chain',
        name: 'Create Chain',
        description: 'Creates three connected nodes in a sequence.',
        isSystem: true,
        code: `n1 = graph.add_node(name="Step 1", tags="Process")
n2 = graph.add_node(name="Step 2", tags="Process")
n3 = graph.add_node(name="Step 3", tags="Process")

graph.add_edge(source=n1.id, target=n2.id, label="next")
graph.add_edge(source=n2.id, target=n3.id, label="next")

canvas.pan_to_node(id=n2.id)`
    },
    {
        id: 'sys-cleanup',
        name: 'Cleanup Tagged',
        description: 'Deletes all nodes with a specific tag (Use with caution).',
        isSystem: true,
        code: `tag_to_delete = "Temporary"
nodes = graph.query_nodes(tag=tag_to_delete)

for n in nodes:
    graph.delete_node(id=n.id)
    print("Deleted " + n.name)`
    },
    {
        id: 'sys-isolate',
        name: 'Find & Isolate',
        description: 'Selects a node and clears everything else from view (simulated by highlighting only one).',
        isSystem: true,
        code: `target_name = "Core Problem"
node = graph.get_node_by_name(name=target_name)

if node != None:
    canvas.clear_selection()
    canvas.select_node(id=node.id)
    canvas.pan_to_node(id=node.id)
    print("Focused on " + node.name)
else:
    print("Node not found.")`
    }
];

export const EXAMPLE_SCRIPTS = [
    {
        id: 'ex-create-walk',
        name: 'Ex: Create & Walk',
        code: `# 1. Create a chain of nodes
start = graph.add_node(name="Start", tags="Step")
mid = graph.add_node(name="Process", tags="Step")
end = graph.add_node(name="End", tags="Step")

graph.add_edge(source=start.id, target=mid.id, label="next")
graph.add_edge(source=mid.id, target=end.id, label="next")

print("Created chain. Starting walk...")

# 2. Query and animate
steps = graph.query_nodes(tag="Step")

for node in steps:
    print("Visiting: " + node.name)
    canvas.pan_to_node(id=node.id)
    canvas.highlight_node(id=node.id, color="#facc15")
    sleep(0.8)

canvas.clear_highlights()
print("Walk complete.")
`
    },
    {
        id: 'ex-attributes',
        name: 'Ex: Attribute Logic',
        code: `# 1. Setup Test Data
city1 = graph.add_node(name="London Office")
graph.set_attribute(id=city1.id, key="location", value="UK")
graph.set_attribute(id=city1.id, key="status", value="active")

city2 = graph.add_node(name="Paris Office")
graph.set_attribute(id=city2.id, key="location", value="France")
graph.set_attribute(id=city2.id, key="status", value="active")

city3 = graph.add_node(name="Tokyo Office")
graph.set_attribute(id=city3.id, key="location", value="Japan")
graph.set_attribute(id=city3.id, key="status", value="planning")

print("Nodes created.")
sleep(0.5)

# 2. Query by attribute (Status: active)
active_nodes = graph.query_nodes(status="active")
print("Found " + active_nodes.length + " active offices.")

for node in active_nodes:
    print("Auditing: " + node.name)
    canvas.select_node(id=node.id)
    
    # Mark as audited
    graph.set_attribute(id=node.id, key="audited", value="true")
    graph.add_tag(id=node.id, tag="Audited")
    
    sleep(0.8)

canvas.clear_selection()
print("Audit complete.")
`
    },
    {
        id: 'ex-report',
        name: 'Ex: Auto-Report',
        code: `# 1. Ensure we have data
n1 = graph.add_node(name="Risk A", tags="Risk", notes="High probability")
n2 = graph.add_node(name="Risk B", tags="Risk", notes="Low impact")

# 2. Query
risk_nodes = graph.query_nodes(tag="Risk")
print("Found " + risk_nodes.length + " risks.")

# 3. Build Markdown
report_text = "# Risk Assessment Report\\n\\n"

for node in risk_nodes:
    line = "- **" + node.name + "**: " + node.notes + "\\n"
    report_text = report_text + line

# 4. Create Document
doc_id = markdown.create_doc(title="Generated Risk Report", content=report_text)
markdown.open_doc(id=doc_id)

print("Document created.")
`
    }
];

export const DEFAULT_COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'scheme-general',
    name: 'General',
    tagColors: {
      'Question': '#8b5cf6', // violet-500
      'Idea': '#fdf37a', // yellow-300
      'Assumption': '#94a3b8', // slate-400
      'Hypothesis': '#06b6d4', // cyan-500
      'Process': '#3b82f6', // blue-500
      'Decision': '#f97316', // orange-500
      'Team': '#10b981', // emerald-500
      'Role': '#eab308', // yellow-500
      'Action': '#0ea5e9', // sky-500
      'Task': '#60a5fa', // blue-400
      'Project': '#7c3aed', // violet-600
      'Initiative': '#d946ef', // fuchsia-500
      'Stakeholder': '#f59e0b', // amber-500
      'Person': '#fb923c', // orange-400
      'Technology': '#64748b', // slate-500
      'Organisation': '#6b21a8', // purple-700
      'Goal': '#22c55e', // green-500
      'Objective': '#84cc16', // lime-500
      'Metric': '#06b6d4', // cyan-500
      'Outcome': '#14b8a6', // teal-500
      'Risk': '#ea5d5d', // red-500
      'Issue': '#f43f5e', // rose-500
      'Benefit': '#a3e635', // lime-400
      'Resource': '#fbbf24', // amber-400
      'Constraint': '#78716c', // stone-500
      'Requirement': '#38bdf8', // sky-400
      'Deliverable': '#6366f1', // indigo-500
      'Knowledge': '#a855f7', // purple-500
      'Tool': '#475569', // slate-600
      'Capability': '#2563eb', // blue-600
      'Event': '#ec4899', // pink-500
      'Useful': '#86efac', // green-300
      'Harmful': '#ef4444', // red-300
      'Potential': '#fde047', // yellow-300
      'Insufficient': '#fdba74', // orange-300
      'Excessive': '#f87171', // red-400
      'Efficient': '#34d399', // emerald-400
      'Inefficient': '#d6d3d1', // stone-300
      'Reliable': '#93c5fd', // blue-300
      'Unreliable': '#fda4af', // rose-300
    },
    tagDescriptions: {
      'Question': 'An inquiry or area of uncertainty.',
      'Idea': 'A thought or concept that may lead to action or further development.',
      'Assumption': 'A belief accepted as true without proof.',
      'Hypothesis': 'A proposed explanation to be tested.',
      'Process': 'A series of actions or steps.',
      'Decision': 'A conclusion or resolution reached.',
      'Team': 'A group of people working together.',
      'Role': 'A specific position or function.',
      'Action': 'Something done to achieve an aim.',
      'Task': 'A specific piece of work.',
      'Project': 'A collaborative enterprise.',
      'Initiative': 'A strategy or plan.',
      'Stakeholder': 'A person with an interest in the outcome.',
      'Person': 'An individual human being.',
      'Technology': 'Machinery, equipment, or digital tools.',
      'Organisation': 'An organized body of people.',
      'Goal': 'The desired result.',
      'Objective': 'A specific step towards a goal.',
      'Metric': 'A standard of measurement.',
      'Outcome': 'The consequence of an action.',
      'Risk': 'Potential for loss or failure.',
      'Issue': 'A subject of concern or problem.',
      'Benefit': 'An advantage or profit.',
      'Resource': 'A stock or supply of assets.',
      'Constraint': 'A limitation or restriction.',
      'Requirement': 'A necessary condition.',
      'Deliverable': 'A tangible or intangible good produced.',
      'Knowledge': 'Facts, information, and skills.',
      'Tool': 'A device used to carry out a function.',
      'Capability': 'The power or ability to do something.',
      'Event': 'A thing that happens.',
      'Useful': 'Able to be used for a practical purpose.',
      'Harmful': 'Causing or likely to cause harm.',
      'Potential': 'Having or showing the capacity to develop.',
      'Insufficient': 'Not enough; inadequate.',
      'Excessive': 'More than is necessary.',
      'Efficient': 'Achieving maximum productivity.',
      'Inefficient': 'Wasting time or resources.',
      'Reliable': 'Consistently good in quality.',
      'Unreliable': 'Not able to be relied upon.',
    },
    relationshipDefinitions: [
      { label: 'Increases', description: 'Makes greater in size or amount.' },
      { label: 'Decreases', description: 'Makes smaller in size or amount.' },
      { label: 'Improves', description: 'Makes or becomes better.' },
      { label: 'Worsens', description: 'Makes or becomes worse.' },
      { label: 'Influences', description: 'Has an effect on character or behavior.' },
      { label: 'Enables', description: 'Gives authority or means to do something.' },
      { label: 'Disables', description: 'Limits or prohibits function.' },
      { label: 'Causes', description: 'Makes something happen.' },
      { label: 'Leads to', description: 'Results in a specific outcome.' },
      { label: 'Prevents', description: 'Keeps something from happening.' },
      { label: 'Mitigates', description: 'Makes less severe or painful.' },
      { label: 'Requires', description: 'Needs for a particular purpose.' },
      { label: 'Triggers', description: 'Causes an event or situation to happen.' },
      { label: 'Part of', description: 'Is a piece or segment of a whole.' },
      { label: 'Contains', description: 'Have or hold within.' },
      { label: 'Associated with', description: 'Connected with something else.' },
      { label: 'Owned by', description: 'Possessed by an entity.' },
      { label: 'Assigned to', description: 'Allocated to a specific person/team.' },
      { label: 'Accountable for', description: 'Responsible for the outcome.' },
      { label: 'Consulted by', description: 'Sought for advice or information.' },
      { label: 'Informs', description: 'Gives facts or information.' },
      { label: 'Depends on', description: 'Determined or controlled by something else.' },
      { label: 'Conflicts with', description: 'Be incompatible or at variance.' },
      { label: 'Relates to', description: 'Make or show a connection between.' },
    ],
    defaultRelationshipLabel: 'Relates to'
  },
  {
    id: 'scheme-useful-harmful',
    name: 'Useful Harmful',
    tagColors: {
      'Context': '#e2e8f0', // slate-200
      'Useful': '#86efac', // green-300
      'Harmful': '#ef4444', // red-300
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