
import React, { useState, useMemo, useEffect } from 'react';
import { Element, Relationship, TrizToolType, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentEditorPanel } from './DocumentPanel';

interface TrizModalProps {
  isOpen: boolean;
  activeTool: TrizToolType;
  elements: Element[];
  relationships: Relationship[];
  modelActions: ModelActions;
  onClose: () => void;
  onLogHistory?: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
  onOpenHistory?: () => void;
  onAnalyze?: (context: string) => void;
  initialParams?: any;
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  onUpdateDocument: (docId: string, updates: Partial<TapestryDocument>) => void;
}

// --- Constants ---

const PERSPECTIVES = [
    { key: 'engineering', label: 'Engineering' },
    { key: 'business', label: 'Business' },
    { key: 'software', label: 'Software' },
    { key: 'physics', label: 'Physics' },
    { key: 'social', label: 'Social Systems' },
    { key: 'psychology', label: 'Psychology & Behaviour' },
    { key: 'environment', label: 'Ecology / Environment' },
    { key: 'economics', label: 'Economics & Incentives' },
    { key: 'policy', label: 'Policy / Governance' },
    { key: 'ethics', label: 'Ethics / Philosophy' },
    { key: 'health', label: 'Health / Medicine' },
    { key: 'logistics', label: 'Logistics / Supply Chains' },
    { key: 'urban', label: 'Urban Systems' },
    { key: 'design', label: 'Design / Human-Centred' }
] as const;

const TRIZ_PRINCIPLES_DATA = [
    { 
        id: 1, 
        name: "1. Segmentation", 
        engineering: "Divide an object into independent parts. Make an object easy to disassemble. Increase the degree of fragmentation.", 
        business: "Segment market audiences into niches. Franchise business operations. Create independent business units.", 
        software: "Microservices architecture. Containerization. Modular code design.", 
        physics: "Particle nature of matter. Pulse-width modulation.",
        social: "Decentralize communities into smaller, self-governing units. Foster niche interest groups.",
        psychology: "Compartmentalize tasks to reduce cognitive load. Break goals into micro-habits.",
        environment: "Create habitat patches or corridors. Manage discrete ecological zones separately.",
        economics: "Micro-transactions. Unbundling of services. Tokenization of assets.",
        policy: "Federalism (devolving power). Local governance zones. Specific by-laws for specific areas.",
        ethics: "Situational ethics (case-by-case analysis). Separating the act from the intention.",
        health: "Quarantine/Isolation of infectious cases. Organ-specific treatments. Surgery.",
        logistics: "Palletization. Break-bulk shipping. Last-mile delivery segmentation.",
        urban: "Zoning (residential vs commercial). Mixed-use developments (micro-zones).",
        design: "Chunking information. Modular UI components. Atomic design systems."
    },
    { 
        id: 2, 
        name: "2. Taking Out", 
        engineering: "Separate an interfering part or property from an object, or single out the only necessary part.", 
        business: "Outsourcing non-core functions. Selling off bad assets. Extracting key insights from data.", 
        software: "Abstract classes. Interface segregation. Removing dead code.", 
        physics: "Filtration. Distillation. Extraction.",
        social: "Ostracism or exile of disruptive members. Creating safe spaces by excluding harm.",
        psychology: "Repression of trauma (defense mechanism). Letting go of negative thoughts. Mindfulness (detachment).",
        environment: "Removal of invasive species. Carbon capture and sequestration.",
        economics: "Divestiture. Spin-offs. Taxing negative externalities (bad bads).",
        policy: "Deregulation (removing red tape). Repealing obsolete laws.",
        ethics: "Recusal due to conflict of interest. Separating church and state.",
        health: "Surgical excision of tumors. Detoxification. Dialysis.",
        logistics: "Cross-docking (removing storage step). Direct-to-consumer (removing middlemen).",
        urban: "Pedestrian zones (taking out cars). Congestion charging.",
        design: "Minimalism. Removing clutter. Negative space."
    },
    { 
        id: 3, 
        name: "3. Local Quality", 
        engineering: "Change an object's structure from uniform to non-uniform. Make each part function in optimal conditions.", 
        business: "Regional pricing. Personalized marketing. Specialized teams for specific tasks.", 
        software: "Edge computing. Local caching. Context-aware applications.", 
        physics: "Gradient materials. Doping in semiconductors.",
        social: "Community-specific programs. Grassroots movements tailored to local needs.",
        psychology: "Flow state (matching challenge to skill). Personalized coping mechanisms.",
        environment: "Micro-climates. Permaculture zones. Localized irrigation.",
        economics: "Price discrimination. Local currencies. Special Economic Zones.",
        policy: "By-laws tailored to specific districts. Means-tested benefits.",
        ethics: "Cultural relativism. Contextual justice.",
        health: "Targeted drug delivery. Precision medicine. Treating symptoms locally.",
        logistics: "Local sourcing. Hub-and-spoke distribution centers.",
        urban: "Place-making. Neighborhood character preservation. Pocket parks.",
        design: "Adaptive interfaces. Personalization settings. Ergonomic grips."
    },
    { 
        id: 4, 
        name: "4. Asymmetry", 
        engineering: "Change the shape of an object from symmetrical to asymmetrical. Increase the degree of asymmetry.", 
        business: "Niche marketing strategies. Asymmetric warfare in competition. Unique value propositions.", 
        software: "Asymmetric encryption. Master-slave architecture. Load balancing with weighted nodes.", 
        physics: "Chirality. Asymmetric potential wells.",
        social: "Affirmative action (correcting imbalance). Minority rights protection.",
        psychology: "Embracing quirks/flaws (Wabi-sabi). Cognitive dissonance reduction.",
        environment: "Protecting biodiversity hotspots (uneven value). Asymmetric resource distribution.",
        economics: "Long-tail markets. Progressive taxation. Asymmetric information leverage.",
        policy: "Weighted voting rights. Asymmetric federalism (different powers for regions).",
        ethics: "Prioritarianism (helping the worst off). Equity vs Equality.",
        health: "Prioritizing triage. Focusing treatment on the weaker side/organ.",
        logistics: "Backhaul logistics (filling empty return trucks). Asymmetric trade routes.",
        urban: "Organic street patterns (non-grid). Focal points in architecture.",
        design: "Asymmetrical balance in layout. Rule of thirds. Unexpected focus."
    },
    { 
        id: 5, 
        name: "5. Merging", 
        engineering: "Bring closer together (or merge) identical or similar objects. Make operations contiguous or parallel.", 
        business: "Mergers and acquisitions. Shared services. Co-working spaces.", 
        software: "Object composition. Thread pooling. Database sharding/merging.", 
        physics: "Fusion. Coalescence of droplets.",
        social: "Coalitions. Community centers. Social mixing/integration.",
        psychology: "Integrating shadow self. Group therapy. Associative thinking.",
        environment: "Wildlife corridors (connecting habitats). Symbiosis.",
        economics: "Cartels (illegal merging). Cooperatives. Bundling products.",
        policy: "Unions (EU, UK). Harmonizing standards. Joint task forces.",
        ethics: "Utilitarianism (aggregating happiness). Common good.",
        health: "Holistic medicine. Combining drug therapies (cocktails).",
        logistics: "Consolidated shipping. Shared warehousing. Intermodal transport.",
        urban: "Mixed-use buildings. Transit hubs. Megalopolises.",
        design: "Synthesis. Mashups. Multifunctional spaces."
    },
    { 
        id: 6, 
        name: "6. Universality", 
        engineering: "Make a part or object perform multiple functions; eliminate the need for other parts.", 
        business: "Cross-training employees. Multi-purpose products (Swiss Army Knife).", 
        software: "Polymorphism. Generic types. Full-stack development.", 
        physics: "Universal constants. Unified field theory.",
        social: "Generalists/Polymaths. Universal Basic Income. Universal suffrage.",
        psychology: "Resilience (adapting to many stressors). Growth mindset.",
        environment: "Generalist species (raccoons). Permaculture elements having multiple outputs.",
        economics: "Global currency. Standardized contracts. Conglomerates.",
        policy: "Universal Human Rights. International Law.",
        ethics: "Categorical Imperative (universal laws). Golden Rule.",
        health: "Broad-spectrum antibiotics. Stem cells (potential to be anything).",
        logistics: "Standardized shipping containers (TEU). Universal pallets.",
        urban: "Public squares (agora). Flexible street usage.",
        design: "Universal Design (accessibility for all). Responsive design."
    },
    { 
        id: 7, 
        name: "7. Nested Doll", 
        engineering: "Place one object inside another; place each object, in turn, inside the other.", 
        business: "Holding companies. Sub-departments. Embedded insurance.", 
        software: "Recursion. Nested loops. Decorator pattern.", 
        physics: "Russian dolls. Atomic structure (shells).",
        social: "Matryoshka identities (Individual -> Family -> Community -> Nation).",
        psychology: "Internal Family Systems (sub-personalities). Layered trauma.",
        environment: "Ecosystems within ecosystems (microbiomes).",
        economics: "Subsidiaries. Special Purpose Vehicles (SPVs). Ponzi schemes.",
        policy: "Subsidiarity principle. Nested jurisdictions (City, State, Federal).",
        ethics: "Circles of moral concern. Virtue within duty.",
        health: "Implants. Endoscopy. Pregnancy.",
        logistics: "Packaging within packaging. Containerization.",
        urban: "City within a city. Underground infrastructure tunnels.",
        design: "Accordion menus. Modals. Information hierarchy."
    },
    { 
        id: 8, 
        name: "8. Anti-Weight", 
        engineering: "Compensate for the weight of an object by merging it with other objects that provide lift.", 
        business: "Leveraging partnerships. Debt financing (leverage). Cloud computing (reducing infra weight).", 
        software: "Pointer references (vs copying data). Compression. Thin clients.", 
        physics: "Buoyancy. Magnetic levitation.",
        social: "Social safety nets (uplifting the poor). Support groups.",
        psychology: "Humor (levity). Uplifting affirmations. Sublimation.",
        environment: "Updrafts for bird flight. Aquatic plants.",
        economics: "Subsidies. Tax breaks. Bailouts.",
        policy: "Affirmative action (counter-weighting privilege). Grants.",
        ethics: "Forgiveness (lifting the burden of guilt). Restorative justice.",
        health: "Exoskeletons. Water therapy (reducing gravity). Prosthetics.",
        logistics: "Air freight. Helium balloons/Drones. lighter-than-air craft.",
        urban: "Suspension bridges. Skyscrapers (fighting gravity). Skyways.",
        design: "White space (visual lightness). Lightweight fonts. Gradients."
    },
    { 
        id: 9, 
        name: "9. Preliminary Anti-Action", 
        engineering: "If it will be necessary to do an action with both harmful and useful effects, replace with anti-actions to control harmful effects.", 
        business: "Hedging bets. Pre-nuptial agreements. Non-disclosure agreements.", 
        software: "Test-Driven Development (TDD). Error handling blocks. Pre-fetching.", 
        physics: "Pre-stressed concrete. Noise cancellation.",
        social: "Pre-bunking misinformation. Conflict resolution training before conflict.",
        psychology: "Inoculation theory (exposing to weak arguments). Managing expectations.",
        environment: "Controlled burns (to prevent wildfires). Erosion control mats.",
        economics: "Short selling. Insurance premiums. Putting aside savings.",
        policy: "Veto power. Checks and balances. Sunset clauses.",
        ethics: "Pre-commitment to principles (Ulysses pact).",
        health: "Vaccination. Prophylaxis. Pre-medication.",
        logistics: "Reverse logistics planning. Safety stock.",
        urban: "Anti-seismic dampeners. Flood barriers.",
        design: "Confirmation dialogs (preventing accidental clicks). Undo functionality."
    },
    { 
        id: 10, 
        name: "10. Preliminary Action", 
        engineering: "Perform, before it is needed, the required change of an object (either fully or partially).", 
        business: "Pre-sales. Market seeding. Preparing supply chains.", 
        software: "Pre-compilation. Initialization. Caching.", 
        physics: "Potential energy. Activation energy.",
        social: "Education/Schooling. Grooming successors. Networking.",
        psychology: "Priming. Visualization/Mental rehearsal. Pre-commitment.",
        environment: "Planting trees for future harvest. Soil preparation.",
        economics: "Seed funding. Futures contracts. R&D investment.",
        policy: "Drafting legislation. Disaster preparedness drills.",
        ethics: "Moral education. Establishing a code of conduct.",
        health: "Prenatal care. Healthy lifestyle choices (prevention).",
        logistics: "Pre-positioning stock. Kitting.",
        urban: "Land banking. Infrastructure provisioning before housing.",
        design: "Onboarding flows. Skeleton screens (loading states)."
    },
    { 
        id: 11, 
        name: "11. Cushion in Advance", 
        engineering: "Prepare emergency means beforehand to compensate for the relatively low reliability of an object.", 
        business: "Insurance. Emergency funds. Backup suppliers.", 
        software: "Redundancy. Failover systems. Exception handling.", 
        physics: "Safety valves. Crumple zones.",
        social: "Social security. Emergency contacts. Community resilience funds.",
        psychology: "Coping strategies. Support networks. Comfort objects.",
        environment: "Seed banks. Conservation areas (buffer zones).",
        economics: "Gold reserves. Hedging. Diversification.",
        policy: "Constitutional safeguards. Bill of Rights.",
        ethics: "Safety factors in engineering ethics. Precautionary principle.",
        health: "First aid kits. Defibrillators in public spaces.",
        logistics: "Safety stock. Alternative routes.",
        urban: "Emergency shelters. Fire hydrants.",
        design: "Error messages. Graceful degradation. Auto-save."
    },
    { 
        id: 12, 
        name: "12. Equipotentiality", 
        engineering: "In a potential field, limit position changes (e.g. change conditions to eliminate need to raise/lower objects).", 
        business: "Flat organizational hierarchy. Equal opportunity employment. Standardized work.", 
        software: "Stateless architecture. Idempotency. RESTful interfaces.", 
        physics: "Equipotential lines. Conservative forces.",
        social: "Egalitarianism. Removing class barriers. Horizontal networking.",
        psychology: "Acceptance (stopping the struggle against reality). Equanimity.",
        environment: "Contour ploughing. Horizontal gene transfer.",
        economics: "Level playing field regulations. Flat tax.",
        policy: "Universal suffrage. Rule of law (applies to all).",
        ethics: "Impartiality. Justice as fairness (Rawls).",
        health: "Ergonomics (keeping work at elbow height). Universal healthcare access.",
        logistics: "Cross-docking on one level. Roll-on/Roll-off ferries.",
        urban: "Accessibility ramps. Skywalks connecting buildings at height.",
        design: "Consistent navigation. Fitts's Law optimization."
    },
    { 
        id: 13, 
        name: "13. The Other Way Round", 
        engineering: "Invert the action(s) used to solve the problem. Make movable parts fixed, and fixed parts movable.", 
        business: "Reverse logistics. Short selling. Customer-driven innovation.", 
        software: "Inversion of Control (IoC). Reverse engineering. Callback functions.", 
        physics: "Antimatter. Time reversal symmetry.",
        social: "Counter-culture. Civil disobedience. Role reversal exercises.",
        psychology: "Paradoxical intention. Reverse psychology. Reframing.",
        environment: "Rewilding (undoing domestication). De-extinction.",
        economics: "Shorting the market. Negative interest rates.",
        policy: "Decriminalization. Privatization (or Nationalization).",
        ethics: "Turning the other cheek. Devil's advocate.",
        health: "Biofeedback. Placebo effect (mind over body).",
        logistics: "Reverse logistics (returns). Vendor Managed Inventory.",
        urban: "Reclaiming streets for people (Ciclovía). Daylighting rivers.",
        design: "Dark mode. Mobile-first (vs Desktop-first)."
    },
    { 
        id: 14, 
        name: "14. Spheroidality", 
        engineering: "Replace linear parts with curved parts, flat surfaces with curved surfaces. Use rollers, balls, spirals.", 
        business: "Circular economy. 360-degree feedback. Hub and spoke model.", 
        software: "Circular buffers. Iterative development (cycles vs waterfall).", 
        physics: "Planetary orbits. Surface tension (spheres).",
        social: "Circle sentencing. Round tables (equality). Community circles.",
        psychology: "Cyclical thinking. Mandalas. Spirals of growth.",
        environment: "Nutrient cycles. permaculture spirals.",
        economics: "Business cycles. Circular flow of income.",
        policy: "Diplomatic rounds. Feedback loops in policy.",
        ethics: "Karma (what goes around comes around). Virtuous circles.",
        health: "Ball bearings in joints. Centrifuges. Yoga balls.",
        logistics: "Rotary conveyors. Roundabouts.",
        urban: "Cul-de-sacs. Roundabouts. Ring roads.",
        design: "Rounded corners. Organic shapes. Radial menus."
    },
    { 
        id: 15, 
        name: "15. Dynamics", 
        engineering: "Allow characteristics of an object to change to be optimal. Divide an object into parts capable of movement relative to each other.", 
        business: "Agile methodology. Flexible working hours. Dynamic pricing.", 
        software: "Dynamic typing. Runtime binding. Adaptive UI.", 
        physics: "Phase changes. Kinetic theory of gases.",
        social: "Social mobility. Liquid modernity. Flexible relationships.",
        psychology: "Neuroplasticity. Growth mindset. Emotional regulation.",
        environment: "Seasonal adaptation. Migration patterns.",
        economics: "Gig economy. Floating exchange rates. Dynamic markets.",
        policy: "Living constitution. Adaptive management. Sunset laws.",
        ethics: "Situational ethics. Evolving moral standards.",
        health: "Dynamic stretching. Heart rate variability. Bio-rhythms.",
        logistics: "Dynamic routing. On-demand delivery.",
        urban: "Pop-up shops. Multi-use stadiums. Smart traffic lights.",
        design: "Responsive design. Animations/Transitions. Interactive elements."
    },
    { 
        id: 16, 
        name: "16. Partial or Excessive Actions", 
        engineering: "If 100 percent is hard to achieve, use 'slightly less' or 'slightly more' to make it easier.", 
        business: "MVP (Minimum Viable Product). Oversubscribing. Freemium models.", 
        software: "Fuzzy logic. Approximate computing. Over-provisioning.", 
        physics: "Doping. Saturation.",
        social: "Nudging. Satire (exaggeration). Compromise.",
        psychology: "Desensitization (gradual exposure). Flooding (excessive exposure).",
        environment: "Buffer zones. Overshooting planetary boundaries.",
        economics: "Quantitative Easing (excess money). Scarcity marketing.",
        policy: "Incrementalism. Over-regulation (precautionary).",
        ethics: "Supererogation (doing more than duty). Good enough (satisficing).",
        health: "Herd immunity (partial vaccination sufficient). Megadosing.",
        logistics: "Overstocking safety inventory. Cross-filling.",
        urban: "Sprawl (excessive growth). Infill development (partial).",
        design: "Caricature. Skeuomorphism. White space."
    },
    { 
        id: 17, 
        name: "17. Another Dimension", 
        engineering: "Move an object in two- or three-dimensional space. Use a multi-story arrangement. Tilt or re-orient.", 
        business: "Vertical integration. Cross-selling. Expanding to new markets.", 
        software: "3D arrays. Layers/Tiers in architecture. Augmented Reality.", 
        physics: "String theory dimensions. Phase space.",
        social: "Intersectionality. Social climbing. Parallel societies.",
        psychology: "Perspective taking. Lateral thinking. Reframing.",
        environment: "Vertical farming. Canopy layers in forests.",
        economics: "Multilateral trade. Shadow economy.",
        policy: "Multi-level governance. International relations.",
        ethics: "Moral depth. Considering future generations (time dimension).",
        health: "3D scanning (MRI/CT). Holistic health (mind-body-spirit).",
        logistics: "Stacking. Air rights. Drones (3D delivery).",
        urban: "Skyscrapers. Underground cities. Mixed-use verticality.",
        design: "Parallax scrolling. Drop shadows (depth). VR/AR."
    },
    { 
        id: 18, 
        name: "18. Mechanical Vibration", 
        engineering: "Cause an object to oscillate or vibrate. Increase its frequency. Use resonant frequency.", 
        business: "Marketing pulses. Hype cycles. Regular team cadences.", 
        software: "Clock cycles. Polling. Event loops.", 
        physics: "Resonance. Sound waves. Quantum harmonic oscillator.",
        social: "Social movements (waves). Viral trends. Collective effervescence.",
        psychology: "Biorhythms. Mood swings. Flow states.",
        environment: "Tidal energy. Earthquakes. Seasonal cycles.",
        economics: "Business cycles. Volatility. High-frequency trading.",
        policy: "Political pendulum. Election cycles.",
        ethics: "Moral oscillation. Resonance with values.",
        health: "Ultrasound therapy. Tremors. Heartbeat.",
        logistics: "Just-in-Time (rhythm). Pulsed delivery.",
        urban: "Rush hour patterns. City 'vibes'. Nightlife.",
        design: "Haptic feedback. Rhythm in typography. Animation curves."
    },
    { 
        id: 19, 
        name: "19. Periodic Action", 
        engineering: "Instead of continuous action, use periodic or pulsed actions. Change magnitude or frequency.", 
        business: "Subscription models. Seasonal sales. Paychecks.", 
        software: "Cron jobs. Heartbeat signals. Garbage collection intervals.", 
        physics: "AC current. Pulsars. Circadian rhythms.",
        social: "Holidays/Festivals. Rituals. Weekly gatherings.",
        psychology: "Habit loops. Intermittent reinforcement. Pomodoro technique.",
        environment: "Seasons. Monsoons. Animal migration.",
        economics: "Quarterly reports. Pay cycles. Interest payments.",
        policy: "Parliamentary sessions. Censuses. Five-year plans.",
        ethics: "Sabbath/Rest days. Periodic reflection.",
        health: "Intermittent fasting. Sleep cycles. Menstrual cycles.",
        logistics: "Milk runs. Scheduled maintenance.",
        urban: "Traffic light cycles. Garbage collection days.",
        design: "Blinking cursors. Loading spinners. Carousels."
    },
    { 
        id: 20, 
        name: "20. Continuity of Useful Action", 
        engineering: "Carry on work continuously; make all parts work at full load. Eliminate idle actions.", 
        business: "24/7 support. Continuous Integration/Deployment (CI/CD). Automation.", 
        software: "Streaming data. Persistent connections. Pipelines.", 
        physics: "Superconductivity. Perpetual motion (theoretical).",
        social: "Lifelong learning. Career continuity. Legacy.",
        psychology: "Flow state. Persistence/Grit. Stream of consciousness.",
        environment: "Perennial plants. Renewable energy (constant sources like hydro).",
        economics: "Compound interest. Perpetual bonds. Circular economy.",
        policy: "Standing committees. Permanent residency. Constitution.",
        ethics: "Integrity (consistency). Constant vigilance.",
        health: "Homeostasis. Continuous glucose monitoring. Pacemakers.",
        logistics: "Conveyor belts. Pipelines. Continuous replenishment.",
        urban: "24-hour cities. Infrastructure availability.",
        design: "Infinite scroll. Continuous playback. Seamless transitions."
    },
    { 
        id: 21, 
        name: "21. Skipping", 
        engineering: "Conduct a process, or certain stages (e.g. hazardous operations) at high speed.", 
        business: "Fast-tracking projects. Rapid prototyping. Skip-level meetings.", 
        software: "JIT compilation. Skipping frames. Fast-forwarding.", 
        physics: "Tunneling effect. Supersonic speed.",
        social: "Jumping the queue. Social climbing. skipping generations.",
        psychology: "Skimming text. Cognitive heuristics (mental shortcuts).",
        environment: "Flash floods. Rapid evolution (punctuated equilibrium).",
        economics: "Leapfrogging development. High-frequency trading.",
        policy: "Fast-track legislation. Executive orders. Amnesties.",
        ethics: "White lies (skipping truth for comfort). Lesser of two evils.",
        health: "High-Intensity Interval Training (HIIT). Defibrillation.",
        logistics: "Expedited shipping. Bypass routes.",
        urban: "Express trains. Flyovers.",
        design: "Skip navigation links. Wizards. Onboarding skip buttons."
    },
    { 
        id: 22, 
        name: "22. Blessing in Disguise", 
        engineering: "Use harmful factors to achieve a positive effect. Eliminate primary harmful action by adding it to another.", 
        business: "Turning complaints into feedback. Tax write-offs. Crisis as opportunity.", 
        software: "Chaos engineering. Honeypots. Exploiting bugs for features.", 
        physics: "Vaccines. Friction (for walking).",
        social: "Reclaiming slurs. Post-traumatic growth. Protest as catalyst.",
        psychology: "Sublimation. Shadow work. Learning from failure.",
        environment: "Forest fires. Composting (rot -> soil).",
        economics: "Creative destruction. Contrarian investing.",
        policy: "Sin taxes (revenue from vice). Turning evidence state's witness.",
        ethics: "Utilitarian sacrifices. Necessary evils.",
        health: "Fever (fighting infection). Hormesis (benefit from low dose toxin).",
        logistics: "Backhaul (using empty return trips). Waste-to-energy.",
        urban: "Gentrification (controversial benefit). Adaptive reuse of ruins.",
        design: "Glitch art. Wabi-sabi (beauty in imperfection)."
    },
    { 
        id: 23, 
        name: "23. Feedback", 
        engineering: "Introduce feedback to improve a process or action. Change its magnitude or influence.", 
        business: "Customer reviews. Performance appraisals. KPIs.", 
        software: "Control loops. Error reporting. Analytics.", 
        physics: "Homeostasis. Cybernetics. Newton's third law.",
        social: "Gossip/Reputation. Democracy (voting). Social media likes.",
        psychology: "Self-reflection. Biofeedback. Validation.",
        environment: "Climate feedback loops. Predator-prey cycles.",
        economics: "Market signals (prices). Consumer confidence.",
        policy: "Public consultations. Referendums. Polls.",
        ethics: "Conscience. Accountability. Reciprocity.",
        health: "Pain signals. Hormonal feedback loops.",
        logistics: "Tracking numbers. Inventory audits.",
        urban: "Smart city sensors. Traffic reports.",
        design: "Hover states. Form validation. Haptics."
    },
    { 
        id: 24, 
        name: "24. Intermediary", 
        engineering: "Use an intermediary carrier article or intermediary process. Merge one object temporarily with another.", 
        business: "Brokers. Middlemen. Platforms (Uber, Airbnb).", 
        software: "Middleware. Proxy pattern. Adapters.", 
        physics: "Catalysts. Carrier waves.",
        social: "Mediators. Translators. Diplomats.",
        psychology: "Transitional objects (teddy bears). Defense mechanisms.",
        environment: "Vectors (mosquitoes). Keystone species.",
        economics: "Currency (medium of exchange). Banks.",
        policy: "Lobbyists. Ambassadors. Civil service.",
        ethics: "Priests/Confessors. Ethical committees.",
        health: "Vectors for gene therapy. Prosthetics.",
        logistics: "Distributors. Pallets. Freight forwarders.",
        urban: "Plazas (intermediary spaces). Public transit.",
        design: "Modals. Wizards. Loading screens."
    },
    { 
        id: 25, 
        name: "25. Self-service", 
        engineering: "Make an object serve itself by performing auxiliary helpful functions. Use waste resources.", 
        business: "Self-checkout. FAQ pages. Crowdsourcing.", 
        software: "Self-healing systems. Autonomic computing. Recursive functions.", 
        physics: "Regenerative braking. Self-assembly.",
        social: "DIY culture. Self-help groups. Citizen journalism.",
        psychology: "Self-soothing. Introspection. Autonomy.",
        environment: "Self-sustaining ecosystems. Nitrogen-fixing plants.",
        economics: "Prosumers. Bootstrap funding.",
        policy: "Self-regulation. Anarchy (theoretical).",
        ethics: "Self-discipline. Personal responsibility.",
        health: "Immune system. Autophagy. Self-medication.",
        logistics: "Vending machines. Autonomous vehicles.",
        urban: "Community gardens. Solar powered streetlights.",
        design: "User-generated content. Customization."
    },
    { 
        id: 26, 
        name: "26. Copying", 
        engineering: "Instead of an unavailable, expensive, fragile object, use simpler and inexpensive copies.", 
        business: "Franchising. Digital twins. Simulation training.", 
        software: "Deep copy vs Shallow copy. Virtualization. Mock objects.", 
        physics: "Holography. Replication.",
        social: "Memes. Mimicry. Fashion trends.",
        psychology: "Role modeling. Mirror neurons. Imitation learning.",
        environment: "Biomimicry. Camouflage.",
        economics: "Generic drugs. Knock-off brands. Paper money (value copy).",
        policy: "Model legislation. Precedent (law).",
        ethics: "Exemplarism. following 'What would Jesus do?'.",
        health: "Generic pharmaceuticals. Prosthetics.",
        logistics: "3D printing on site. Digital inventory.",
        urban: "Theme parks (copies of places). Facadism.",
        design: "Templates. Style guides. Component libraries."
    },
    { 
        id: 27, 
        name: "27. Cheap Short-Living Objects", 
        engineering: "Replace an expensive object with a multiple of inexpensive objects.", 
        business: "Disposable products. Gig economy workers. Pop-up stores.", 
        software: "Ephemeral containers (Lambda). Temporary caches. disposable tokens.", 
        physics: "Virtual particles. Radioactive decay.",
        social: "Fast fashion. One-night stands. Viral trends.",
        psychology: "Short-term gratification. Coping mechanisms.",
        environment: "r-selected species (many offspring, short life). Annual plants.",
        economics: "Fiat currency. High-frequency trading.",
        policy: "Temporary measures. Executive orders.",
        ethics: "Utilitarian calculus (expendable for greater good).",
        health: "Disposable syringes. Band-aids.",
        logistics: "Cardboard packaging. Single-use pallets.",
        urban: "Tactical urbanism. Festival structures.",
        design: "Stories (Snapchat/Insta). Prototypes. Sketches."
    },
    { 
        id: 28, 
        name: "28. Mechanics Substitution", 
        engineering: "Replace a mechanical means with a sensory (optical, acoustic, taste or smell) means.", 
        business: "Digital transformation. Voice recognition. Electronic signatures.", 
        software: "Software-defined networking. Virtual keyboards. Haptic feedback.", 
        physics: "Electromagnetism replacing mechanics. Optoelectronics.",
        social: "Influence (vs force). Nudging. Soft power.",
        psychology: "Talk therapy (vs lobotomy). Mindfulness (vs medication).",
        environment: "Biological pest control (vs mechanical/chemical).",
        economics: "Cryptocurrency (digital vs physical). Fintech.",
        policy: "Diplomacy (vs war). Sanctions.",
        ethics: "Moral suasion. Shaming.",
        health: "Laser surgery (vs scalpel). Telemedicine.",
        logistics: "3D printing (sending bits not atoms). Teleportation (theoretical).",
        urban: "Smart traffic control (vs roundabouts). Telecommuting.",
        design: "Voice UI. Gesture control. Eye tracking."
    },
    { 
        id: 29, 
        name: "29. Pneumatics and Hydraulics", 
        engineering: "Use gas and liquid parts of an object instead of solid parts.", 
        business: "Fluid organizational structures. Cash flow (liquidity). Floating assets.", 
        software: "Fluid layouts. Data streams. Liquid democracy.", 
        physics: "Fluid dynamics. Aerodynamics.",
        social: "Fluidity in identity. Social lubrication (alcohol/humor).",
        psychology: "Flow states. Emotional release (crying).",
        environment: "Wetlands. Aquifers. Atmospheric rivers.",
        economics: "Liquidity injections. Floating currencies.",
        policy: "Soft law. Flexible regulations.",
        ethics: "Situational ethics (fluid). Moral flexibility.",
        health: "Blood transfusion. Hydration. Oxygen therapy.",
        logistics: "Pipelines. Pneumatic tubes. Air freight.",
        urban: "Waterways. Fountains. Pneumatic waste collection.",
        design: "Gradients. Liquid animations. Organic shapes."
    },
    { 
        id: 30, 
        name: "30. Flexible Shells and Thin Films", 
        engineering: "Use flexible shells and thin films instead of three-dimensional structures.", 
        business: "Flat organizational structures. Agile teams. Soft power.", 
        software: "Wrappers. Facades. Thin clients.", 
        physics: "Surface tension. Membranes.",
        social: "Social masks. Thin-slicing (judgments). Boundaries.",
        psychology: "Resilience (flexibility). Personas.",
        environment: "Biofilms. Leaf surfaces. Ozone layer.",
        economics: "Shell companies. Derivatives. Insurance wrappers.",
        policy: "Framework legislation. Soft borders.",
        ethics: "Veil of ignorance. Contextual sensitivity.",
        health: "Skin grafts. Contact lenses. Transdermal patches.",
        logistics: "Shrink wrap. Blister packs.",
        urban: "Tent cities. Tensile structures. Facades.",
        design: "Overlays. Tooltips. Glassmorphism."
    },
    { 
        id: 31, 
        name: "31. Porous Materials", 
        engineering: "Make an object porous or add porous elements. Use pores to introduce a useful substance.", 
        business: "Open innovation. Transparency. Market penetration.", 
        software: "APIs (porous interfaces). Plug-in architectures. Open source.", 
        physics: "Diffusion. Osmosis.",
        social: "Open borders. Social mobility. Filters bubbles.",
        psychology: "Open-mindedness. Vulnerability. Information absorption.",
        environment: "Soil aeration. Sponges. Coral reefs.",
        economics: "Tax loopholes. Leakage. Trickle-down economics.",
        policy: "Loopholes. Transparency laws. Open data.",
        ethics: "Transparency. Accountability.",
        health: "Skin pores. Lung alveoli. Dialysis membranes.",
        logistics: "Hubs (porous nodes). Cross-docking.",
        urban: "Permeable paving. Porous borders/fences.",
        design: "Negative space. Transparency effects. Layering."
    },
    { 
        id: 32, 
        name: "32. Color Changes", 
        engineering: "Change the color of an object or its external environment. Change transparency.", 
        business: "Rebranding. Traffic light systems (RAG status). Mood lighting.", 
        software: "Syntax highlighting. Dark mode. UI themes.", 
        physics: "Doppler effect (redshift). Photochromism.",
        social: "Code switching. Fashion/Status symbols. Signaling.",
        psychology: "Mood regulation. Color psychology. Masking emotions.",
        environment: "Camouflage. Aposematism (warning colors). Seasonal changes.",
        economics: "Green economy. Blue ocean strategy. Black markets.",
        policy: "Red tape. Green papers. White papers.",
        ethics: "White lies. Grey areas. Transparency.",
        health: "Jaundice. Bruising. Medical imaging contrasts.",
        logistics: "Color-coded tagging. Barcodes.",
        urban: "Street art. Traffic lights. Wayfinding.",
        design: "Color theory. Contrast. Branding palettes."
    },
    { 
        id: 33, 
        name: "33. Homogeneity", 
        engineering: "Make objects interacting with a given object of the same material.", 
        business: "Cultural alignment. Standardization. Uniforms.", 
        software: "Homogeneous arrays. Consistent coding style. Single language stack.", 
        physics: "Isotropy. Uniform fields.",
        social: "Assimilation. Conformity. Echo chambers.",
        psychology: "Cognitive consistence. Confirmation bias.",
        environment: "Monocultures. Climax communities.",
        economics: "Single market. Monetary union. Standardization.",
        policy: "Harmonization of laws. Equal treatment.",
        ethics: "Universalism. Fairness as equality.",
        health: "Biocompatibility. Blood type matching.",
        logistics: "Standard pallets. Uniform packaging.",
        urban: "Suburban sprawl. Gentrification (homogenization).",
        design: "Consistency. Design systems. Patterns."
    },
    { 
        id: 34, 
        name: "34. Discarding and Recovering", 
        engineering: "Make portions of an object that have fulfilled their functions go away or restore consumable parts.", 
        business: "Recycling. Subscription renewals. Employee retention programs.", 
        software: "Garbage collection. Cache invalidation. Object pooling.", 
        physics: "Regeneration. Conservation of mass/energy.",
        social: "Forgiveness. Rehabilitation. Rites of passage (leaving old self).",
        psychology: "Letting go. Recovery. Sleep (restoration).",
        environment: "Shedding leaves. Molting. Nutrient cycling.",
        economics: "Circular economy. Write-offs. Recovery funds.",
        policy: "Sunset clauses. Amnesties. Rehabilitation of offenders.",
        ethics: "Redemption. Restorative justice.",
        health: "Exfoliation. Healing. Stem cell regeneration.",
        logistics: "Reverse logistics. Returnable packaging.",
        urban: "Urban renewal. Brownfield regeneration.",
        design: "Undo/Redo. Temporary states. Dismissible alerts."
    },
    { 
        id: 35, 
        name: "35. Parameter Changes", 
        engineering: "Change an object's physical state, concentration, flexibility, or temperature.", 
        business: "Pivot. Reorganization. Changing terms of service.", 
        software: "Configuration changes. Parameterization. Scaling.", 
        physics: "Phase transitions. Variable resistance.",
        social: "Social mobility. Changing norms. shifting windows of discourse.",
        psychology: "Mood regulation. Changing perspective. Flexibility.",
        environment: "Climate change. Adaptation. Evolution.",
        economics: "Interest rate adjustments. Inflation. Repricing.",
        policy: "Amendments. Policy shifts. Reframing.",
        ethics: "Moral progress. Evolving standards.",
        health: "Fever (temp change). Blood pressure regulation.",
        logistics: "Route optimization. Variable pricing.",
        urban: "Gentrification. Rezoning.",
        design: "Responsive breakpoints. Variable fonts. Dark/Light mode."
    },
    { 
        id: 36, 
        name: "36. Phase Transitions", 
        engineering: "Use phenomena occurring during phase transitions (volume changes, heat loss/absorption).", 
        business: "Market shifts. Paradigm shifts. Mergers (corporate phase change).", 
        software: "State transitions. compilation to runtime. Deployment phases.", 
        physics: "Superconductivity. Latent heat.",
        social: "Revolutions. Tipping points. Coming of age.",
        psychology: "Epiphanies. Breakthroughs. Mid-life crisis.",
        environment: "Metamorphosis. Ecological collapse/recovery.",
        economics: "Boom and bust cycles. Market corrections.",
        policy: "Regime change. Constitutional crises.",
        ethics: "Moral conversions. Paradigm shifts in values.",
        health: "Birth/Death. Puberty. Menopause.",
        logistics: "Freezing/Thawing goods. Liquefaction of gas.",
        urban: "Urbanization. Decay/Renewal.",
        design: "State changes (hover, active, disabled). Transitions."
    },
    { 
        id: 37, 
        name: "37. Thermal Expansion", 
        engineering: "Use thermal expansion (or contraction) of materials.", 
        business: "Market expansion. Inflation adjustment. Growing pains.", 
        software: "Scalability (expanding resources). Bloatware.", 
        physics: "Bimetallic strips. Expansion joints.",
        social: "Social movements spreading. Sprawl. Crowding.",
        psychology: "Emotional swelling (anger/pride). Blowing off steam.",
        environment: "Global warming. Habitat expansion.",
        economics: "Inflation. Economic bubbles. Monetary expansion.",
        policy: "Mission creep. Bureaucratic expansion.",
        ethics: "Moral circle expansion. Slippery slope.",
        health: "Inflammation. Vasodilation. Fever.",
        logistics: "Thermal packaging. Cold chain.",
        urban: "Urban sprawl. Heat island effect.",
        design: "Hover effects (growing). Zoom. Fullscreen."
    },
    { 
        id: 38, 
        name: "38. Strong Oxidants", 
        engineering: "Replace common air with oxygen-enriched air. Expose to ionizing radiation.", 
        business: "High-performance teams. Aggressive growth strategies. Catalyst investment.", 
        software: "Accelerators. Optimizers. Overclocking.", 
        physics: "Oxidation. Combustion.",
        social: "Radicalization. Intense scrutiny. Viral content.",
        psychology: "Passion. Burnout. Catharsis.",
        environment: "Forest fires. Rapid decomposition. Algal blooms.",
        economics: "Hyperinflation. Stimulus packages. Hostile takeovers.",
        policy: "Revolutionary decrees. Martial law.",
        ethics: "Radical honesty. Whistleblowing.",
        health: "Hyperbaric oxygen. Chemotherapy. Radiation.",
        logistics: "Express delivery. Rush orders.",
        urban: "Rapid transit. High-density development.",
        design: "High contrast. Bold typography. Vibrant colors."
    },
    { 
        id: 39, 
        name: "39. Inert Atmosphere", 
        engineering: "Replace a normal environment with an inert one. Add neutral parts.", 
        business: "Safe spaces. Neutral arbitration. Risk mitigation.", 
        software: "Sandboxing. Immutable data. Pure functions.", 
        physics: "Noble gases. Vacuum chambers.",
        social: "Neutral zones. Switzerland. Safe spaces.",
        psychology: "Detachment. Stoicism. Gray rocking.",
        environment: "Seed banks (frozen). Anaerobic conditions.",
        economics: "Stablecoins. Hedges. Safe haven assets.",
        policy: "Neutrality. Non-interventionism. Amnesty.",
        ethics: "Impartiality. Tolerance.",
        health: "Sterile environments. Anesthesia. Placebos.",
        logistics: "Vacuum packing. Nitrogen atmosphere for food.",
        urban: "Green belts. Quiet zones.",
        design: "Whitespace. Minimalist UI. Disabled states."
    },
    { 
        id: 40, 
        name: "40. Composite Materials", 
        engineering: "Change from uniform to composite (multiple) materials.", 
        business: "Diversified portfolio. Cross-functional teams. Hybrid work models.", 
        software: "Composite pattern. Mixins. Polyglot persistence.", 
        physics: "Alloys. Reinforced concrete.",
        social: "Multiculturalism. Intersectionality. Coalitions.",
        psychology: "Complex identity. Resilience (diverse coping skills).",
        environment: "Biodiversity. Mixed forests. Permaculture.",
        economics: "Bundled products. ETFs. Conglomerates.",
        policy: "Mixed economy. Public-Private Partnerships.",
        ethics: "Pluralism. Balancing conflicting duties.",
        health: "Multivitamins. Combination therapy. Cyborgs.",
        logistics: "Intermodal containers. Composite packaging.",
        urban: "Mixed-use development. Smart cities.",
        design: "Mixed media. Collages. Component libraries."
    }
];

// --- Sub Components ---

const ContradictionPanel: React.FC<{ elements: Element[], onGenerate: (p1: string, p2: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [improvingId, setImprovingId] = useState('');
    const [worseningId, setWorseningId] = useState('');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                A Technical Contradiction occurs when improving one parameter of a system causes another parameter to deteriorate.
                Select two nodes from your graph that represent this conflict.
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 p-3 rounded border border-gray-600">
                    <label className="block text-xs font-bold text-green-400 uppercase mb-2">Improving Feature</label>
                    <select 
                        className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-green-500 outline-none"
                        value={improvingId}
                        onChange={e => setImprovingId(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
                <div className="bg-gray-700 p-3 rounded border border-gray-600">
                    <label className="block text-xs font-bold text-red-400 uppercase mb-2">Worsening Feature</label>
                    <select 
                        className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-red-500 outline-none"
                        value={worseningId}
                        onChange={e => setWorseningId(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
            </div>
            <button 
                disabled={!improvingId || !worseningId || isLoading}
                onClick={() => onGenerate(improvingId, worseningId)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {isLoading ? 'Analyzing...' : 'Identify Contradiction & Suggest Principles'}
            </button>
        </div>
    );
};

const PrinciplesPanel: React.FC<{ elements: Element[], onGenerate: (principleData: string, target: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [selectedPrincipleId, setSelectedPrincipleId] = useState<number>(1);
    const [targetNode, setTargetNode] = useState('');
    const [selectedPerspective, setSelectedPerspective] = useState<string>('engineering');
    
    // Custom Perspective State
    const [customName, setCustomName] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [isAutoFilling, setIsAutoFilling] = useState(false);

    const currentPrinciple = useMemo(() => TRIZ_PRINCIPLES_DATA.find(p => p.id === selectedPrincipleId) || TRIZ_PRINCIPLES_DATA[0], [selectedPrincipleId]);

    const handleAutoFillCustom = async () => {
        if (!customName.trim()) {
            alert("Please enter a name for your custom perspective (e.g. 'Culinary', 'Education').");
            return;
        }
        setIsAutoFilling(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Explain TRIZ Principle "${currentPrinciple.name}" (${currentPrinciple.engineering}) from the perspective of "${customName}". Provide a concise 2-3 sentence description/analogy.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            
            if (response.text) {
                setCustomDesc(response.text);
                setSelectedPerspective('custom');
            }
        } catch (e) {
            console.error("Auto-fill failed", e);
            alert("Failed to generate description.");
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleGenerateClick = () => {
        if (!targetNode) return;
        
        let description = "";
        let perspectiveName = "";

        if (selectedPerspective === 'custom') {
            description = customDesc;
            perspectiveName = customName || "Custom";
        } else {
            // @ts-ignore
            description = currentPrinciple[selectedPerspective];
            // @ts-ignore
            perspectiveName = PERSPECTIVES.find(p => p.key === selectedPerspective)?.label || selectedPerspective;
        }

        const payload = JSON.stringify({
            name: currentPrinciple.name,
            perspective: perspectiveName,
            description: description
        });

        onGenerate(payload, targetNode);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Principle</label>
                <select 
                    className="w-full bg-gray-800 text-white text-lg font-bold rounded p-3 border border-gray-600 focus:border-violet-500 outline-none"
                    value={selectedPrincipleId}
                    onChange={e => setSelectedPrincipleId(Number(e.target.value))}
                >
                    {TRIZ_PRINCIPLES_DATA.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="text-[10px] text-gray-500 font-bold tracking-wide mt-2 text-center">SELECT PERSPECTIVE OR DESCRIBE YOUR OWN BELOW</div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-grow overflow-y-auto pr-2">
                {PERSPECTIVES.map(p => (
                    <div 
                        key={p.key}
                        onClick={() => setSelectedPerspective(p.key)}
                        className={`p-4 rounded border cursor-pointer transition-all flex flex-col gap-2 h-full ${selectedPerspective === p.key ? 'bg-violet-900/30 border-violet-500 ring-1 ring-violet-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-500'}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{p.label}</span>
                            {selectedPerspective === p.key && <span className="text-violet-400">●</span>}
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed">
                            {/* @ts-ignore */}
                            {currentPrinciple[p.key] || "Description not available."}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-gray-800 p-4 rounded border border-gray-700 flex-shrink-0">
                <div 
                    onClick={() => setSelectedPerspective('custom')}
                    className={`cursor-pointer transition-colors mb-3 flex justify-between items-center ${selectedPerspective === 'custom' ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-gray-300'}`}
                >
                    <span className="text-xs font-bold uppercase tracking-wider">Custom Perspective</span>
                    {selectedPerspective === 'custom' && <span>●</span>}
                </div>
                
                <div className="flex gap-3 mb-2">
                    <input 
                        type="text" 
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        onClick={() => setSelectedPerspective('custom')}
                        placeholder="e.g. Culinary, Education, Military..."
                        className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 flex-grow"
                    />
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleAutoFillCustom(); }}
                        disabled={isAutoFilling || !customName.trim()}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-3 py-2 rounded border border-gray-600 disabled:opacity-50 whitespace-nowrap"
                    >
                        {isAutoFilling ? 'Generating...' : 'Auto-Fill'}
                    </button>
                </div>
                <textarea 
                    value={customDesc}
                    onChange={e => setCustomDesc(e.target.value)}
                    onClick={() => setSelectedPerspective('custom')}
                    placeholder="Enter description or use Auto-Fill..."
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 h-16 resize-none"
                />
            </div>

            <div className="pt-4 border-t border-gray-700 flex-shrink-0">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Apply to Target Node</label>
                <div className="flex gap-3">
                    <select 
                        className="flex-grow bg-gray-800 text-white text-sm rounded p-3 border border-gray-600 focus:border-violet-500 outline-none"
                        value={targetNode}
                        onChange={e => setTargetNode(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                    <button 
                        disabled={!targetNode || isLoading}
                        onClick={handleGenerateClick}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-8 rounded transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ArizPanel: React.FC<{ onGenerate: (problem: string) => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    const [problem, setProblem] = useState('');
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                ARIZ (Algorithm for Inventive Problem Solving) is a step-by-step method for complex problems.
                Describe the problem situation to start the algorithm.
            </p>
            <textarea
                value={problem}
                onChange={e => setProblem(e.target.value)}
                placeholder="Describe the complex problem..."
                className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-pink-500 outline-none h-24"
            />
            <button 
                disabled={!problem.trim() || isLoading}
                onClick={() => onGenerate(problem)}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Processing...' : 'Run ARIZ'}
            </button>
        </div>
    );
};

const SufieldPanel: React.FC<{ onGenerate: (desc: string) => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    const [desc, setDesc] = useState('');
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Su-Field (Substance-Field) Analysis models systems as two substances and a field.
                Describe the interaction you want to model.
            </p>
            <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="e.g., The knife (S1) cuts the bread (S2) using mechanical force (F)..."
                className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-rose-500 outline-none h-24"
            />
            <button 
                disabled={!desc.trim() || isLoading}
                onClick={() => onGenerate(desc)}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Modeling...' : 'Analyze Su-Field'}
            </button>
        </div>
    );
};

const TrendsPanel: React.FC<{ elements: Element[], onGenerate: (node: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [node, setNode] = useState('');
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Laws of Technical Systems Evolution predict how systems develop over time.
                Select a system (node) to analyze its evolutionary stage and next steps.
            </p>
            <select 
                className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-teal-500 outline-none"
                value={node}
                onChange={e => setNode(e.target.value)}
            >
                <option value="">-- Select System/Node --</option>
                {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
            <button 
                disabled={!node || isLoading}
                onClick={() => onGenerate(node)}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Forecasting...' : 'Predict Evolution'}
            </button>
        </div>
    );
};

// --- Main Modal ---

const TrizModal: React.FC<TrizModalProps> = ({ isOpen, activeTool, elements, relationships, modelActions, onClose, onLogHistory, onOpenHistory, onAnalyze, initialParams, documents, folders, onUpdateDocument }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);

  useEffect(() => {
      if (!isOpen) {
          setSuggestions([]);
          setAnalysisText('');
          setGeneratedDocId(null);
      } else if (initialParams) {
          // Handle restoration logic if needed (simplified for now)
      }
  }, [isOpen, initialParams]);

  const toolInfo = useMemo(() => {
      switch(activeTool) {
          case 'contradiction': return { title: 'Contradiction Matrix', color: 'text-indigo-400', border: 'border-indigo-500' };
          case 'principles': return { title: '40 Principles', color: 'text-violet-400', border: 'border-violet-500' };
          case 'ariz': return { title: 'ARIZ', color: 'text-pink-400', border: 'border-pink-500' };
          case 'sufield': return { title: 'Su-Field Analysis', color: 'text-rose-400', border: 'border-rose-500' };
          case 'trends': return { title: 'Evolution Trends', color: 'text-teal-400', border: 'border-teal-500' };
          default: return { title: 'TRIZ Tool', color: 'text-gray-400', border: 'border-gray-500' };
      }
  }, [activeTool]);

  const generatedDoc = useMemo(() => documents.find(d => d.id === generatedDocId), [documents, generatedDocId]);

  if (!isOpen) return null;

  const handleGenerate = async (arg1: string, arg2?: string) => {
      setIsLoading(true);
      setSuggestions([]);
      setAnalysisText('');
      setGeneratedDocId(null);

      try {
          const graphMarkdown = generateMarkdownFromGraph(elements, relationships);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          let systemInstruction = `You are an expert TRIZ Master. Analyze the provided graph model.
          GRAPH CONTEXT:
          ${graphMarkdown}
          
          OUTPUT FORMAT:
          Return a JSON object with two fields:
          1. "analysis": A detailed MARKDOWN string explaining your findings. Structure it with headers.
          2. "actions": An array of suggested graph modifications. Each action must be a function call object: { name: "addElement" | "addRelationship" | "deleteElement" | "setElementAttribute", args: { ... } }.
          `;

          let userPrompt = "";
          let subjectName = "General";

          if (activeTool === 'contradiction') {
              subjectName = `${arg1} vs ${arg2}`;
              userPrompt = `Identify the technical contradiction between improving "${arg1}" and worsening "${arg2}".
              1. Map these to standard TRIZ parameters.
              2. Consult the Matrix to find inventive principles.
              3. Suggest specific "Idea" nodes based on these principles to resolve the conflict.
              4. Output the analysis in MARKDOWN format.`;
          } else if (activeTool === 'principles') {
              // Arg1 contains the principle context JSON
              const principleData = JSON.parse(arg1);
              const target = arg2;
              subjectName = target || "Unknown";
              
              userPrompt = `Apply TRIZ Principle: "${principleData.name}" to the node "${target}".
              
              FOCUS PERSPECTIVE: ${principleData.perspective}
              DESCRIPTION TO APPLY: "${principleData.description}"
              
              Instructions:
              1. Analyze the node "${target}" specifically through the lens of the provided description.
              2. Provide your analysis in a STRUCTURED MARKDOWN format.
              3. The Markdown MUST start with a header: "# TRIZ Analysis: ${principleData.name} applied to ${target}"
              4. Immediately after the header, include a section "## Summary of Improvements" with a bulleted list of the key ideas.
              5. Include a subsection "**Perspective:** ${principleData.perspective}"
              6. Suggest specific modifications to the graph (adding sub-nodes, changing attributes, adding relationships) that implement this principle.
              7. In your analysis text, explain HOW this specific perspective applies.`;
          } else if (activeTool === 'ariz') {
              subjectName = arg1.substring(0, 20);
              userPrompt = `Apply a simplified ARIZ process to the problem: "${arg1}".
              1. Formulate the Mini-Problem.
              2. Analyze the conflict zone.
              3. Define the Ideal Final Result (IFR).
              4. Suggest graph changes to move towards the IFR.
              5. Output the analysis in MARKDOWN format.`;
          } else if (activeTool === 'sufield') {
              subjectName = arg1.substring(0, 20);
              userPrompt = `Perform Su-Field Analysis on: "${arg1}".
              1. Model the S1-S2-F interaction.
              2. Identify if the model is incomplete, ineffective, or harmful.
              3. Apply 76 Standard Solutions (e.g., add a substance S3, change the field).
              4. Suggest nodes to represent the solution.
              5. Output the analysis in MARKDOWN format.`;
          } else if (activeTool === 'trends') {
              subjectName = arg1;
              userPrompt = `Analyze the evolution state of "${arg1}".
              1. Identify its position on the S-Curve.
              2. Check trends like "Transition to Super-system", "Increasing Dynamization", "Uneven Development".
              3. Suggest future state nodes.
              4. Output the analysis in MARKDOWN format.`;
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: userPrompt,
              config: {
                  systemInstruction,
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          analysis: { type: Type.STRING },
                          actions: {
                              type: Type.ARRAY,
                              items: {
                                  type: Type.OBJECT,
                                  properties: {
                                      name: { type: Type.STRING },
                                      args: { 
                                          type: Type.OBJECT,
                                          properties: {
                                              name: { type: Type.STRING },
                                              sourceName: { type: Type.STRING },
                                              targetName: { type: Type.STRING },
                                              label: { type: Type.STRING },
                                              direction: { type: Type.STRING },
                                              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                              notes: { type: Type.STRING },
                                              elementName: { type: Type.STRING },
                                              key: { type: Type.STRING },
                                              value: { type: Type.STRING }
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          });

          const result = JSON.parse(response.text || "{}");
          setAnalysisText(result.analysis);
          
          const actions = (result.actions || []).map((a: any, i: number) => ({ ...a, id: i, status: 'pending' }));
          setSuggestions(actions);

          // Document Creation Logic
          const toolFolderName = "TRIZ";
          const subToolName = toolInfo.title;
          
          // 1. Ensure folders exist
          let toolsFolder = folders.find(f => f.name === "Tools" && !f.parentId);
          if (!toolsFolder) {
              const id = modelActions.createFolder("Tools", null);
              toolsFolder = { id, name: "Tools", parentId: null, createdAt: "" };
          }
          
          let specificFolder = folders.find(f => f.name === toolFolderName && f.parentId === toolsFolder?.id);
          if (!specificFolder && toolsFolder) {
              const id = modelActions.createFolder(toolFolderName, toolsFolder.id);
              specificFolder = { id, name: toolFolderName, parentId: toolsFolder.id, createdAt: "" };
          }

          if (specificFolder) {
              const baseTitle = `${subToolName} - ${subjectName}`;
              let title = baseTitle;
              let counter = 1;
              while (documents.some(d => d.folderId === specificFolder!.id && d.title === title)) {
                  title = `${baseTitle} ${counter}`;
                  counter++;
              }

              const newDocId = modelActions.createDocument(title, result.analysis);
              modelActions.moveDocument(newDocId, specificFolder.id);
              setGeneratedDocId(newDocId);
          }

          if (onLogHistory) {
              const actionSummary = actions.map((a: any) => {
                  if (a.name === 'addElement') return `- Add Node: ${a.args.name}`;
                  if (a.name === 'addRelationship') return `- Connect: ${a.args.sourceName} -> ${a.args.targetName}`;
                  return `- ${a.name}`;
              }).join('\n');
              onLogHistory(
                  `TRIZ: ${toolInfo.title}`, 
                  `${result.analysis}\n\n### Proposed Actions:\n${actionSummary}`, 
                  result.analysis.substring(0, 100) + '...',
                  activeTool,
                  { arg1, arg2 }
              );
          }

      } catch (e) {
          console.error("TRIZ Error", e);
          setAnalysisText("Error analyzing model. Please try again.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleApplyAction = (index: number) => {
      const action = suggestions[index];
      if (!action) return;

      try {
          const { name, args } = action;
          if (name === 'addElement') modelActions.addElement(args);
          else if (name === 'addRelationship') modelActions.addRelationship(args.sourceName, args.targetName, args.label, args.direction);
          else if (name === 'deleteElement') modelActions.deleteElement(args.name);
          else if (name === 'setElementAttribute') modelActions.setElementAttribute(args.elementName, args.key, args.value);
          
          setSuggestions(prev => prev.map((s, i) => i === index ? { ...s, status: 'applied' } : s));
      } catch (e) {
          alert("Failed to apply action. Ensure referenced nodes exist.");
      }
  };

  const handleCopy = () => {
      if (analysisText) {
          navigator.clipboard.writeText(analysisText);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      }
  };

  const handleChat = () => {
      if (onAnalyze && analysisText) {
          onAnalyze(analysisText);
          onClose();
      }
  };

  const handleDelete = () => {
      setAnalysisText('');
      setSuggestions([]);
      setGeneratedDocId(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className={`bg-gray-900 rounded-lg w-full max-w-6xl shadow-2xl border ${toolInfo.border} text-white flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800 rounded-t-lg">
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${toolInfo.color}`}>
                TRIZ / <span className="text-white">{toolInfo.title}</span>
            </h2>
            <div className="flex items-center gap-2">
                {onOpenHistory && (
                    <button onClick={onOpenHistory} className="text-gray-400 hover:text-white mr-2" title="View History">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                )}
                <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
            {/* Left: Controls */}
            <div className={`${activeTool === 'principles' ? 'w-1/2' : 'w-1/3'} p-6 border-r border-gray-800 overflow-y-auto bg-gray-800/50`}>
                {activeTool === 'contradiction' && <ContradictionPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'principles' && <PrinciplesPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'ariz' && <ArizPanel isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'sufield' && <SufieldPanel isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'trends' && <TrendsPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
            </div>

            {/* Right: Results */}
            <div className={`${activeTool === 'principles' ? 'w-1/2' : 'w-2/3'} p-6 overflow-y-auto flex flex-col gap-6 bg-gray-900 relative`}>
                
                {analysisText && (
                    <div className="absolute top-4 right-6 flex gap-2 z-10">
                        <button onClick={handleCopy} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition" title="Copy">
                            {isCopied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                        </button>
                        <button onClick={handleChat} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-blue-400 transition" title="Ask AI">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </button>
                        <button onClick={handleDelete} className="p-1.5 rounded bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-400 transition" title="Clear">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {generatedDoc ? (
                    <div className="flex-grow flex flex-col h-full bg-gray-800 rounded border border-gray-700 overflow-hidden">
                        <DocumentEditorPanel 
                            document={generatedDoc} 
                            onUpdate={onUpdateDocument} 
                            onClose={() => setGeneratedDocId(null)} 
                            initialViewMode="preview"
                        />
                    </div>
                ) : (
                    <>
                        {analysisText && (
                            <div className="bg-gray-800 p-4 rounded border border-gray-700 pt-10">
                                <h3 className="text-lg font-bold text-gray-200 mb-2">Analysis</h3>
                                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed markdown-content">
                                    {analysisText}
                                </div>
                            </div>
                        )}

                        {suggestions.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-200 mb-3">Recommended Actions</h3>
                                <div className="space-y-3">
                                    {suggestions.map((action, idx) => (
                                        <div key={idx} className={`p-3 rounded border flex items-center justify-between ${action.status === 'applied' ? 'bg-green-900/20 border-green-600' : 'bg-gray-800 border-gray-700'}`}>
                                            <div className="text-sm">
                                                <div className="font-mono text-xs text-gray-500 uppercase mb-1">{action.name}</div>
                                                <div className="text-gray-200 font-medium">
                                                    {action.name === 'addElement' && `Add: ${action.args.name}`}
                                                    {action.name === 'addRelationship' && `Link: ${action.args.sourceName} → ${action.args.targetName}`}
                                                    {action.name === 'setElementAttribute' && `Set: ${action.args.key} = ${action.args.value} on ${action.args.elementName}`}
                                                    {!['addElement', 'addRelationship', 'setElementAttribute'].includes(action.name) && JSON.stringify(action.args)}
                                                </div>
                                            </div>
                                            {action.status === 'pending' ? (
                                                <button 
                                                    onClick={() => handleApplyAction(idx)}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition"
                                                >
                                                    Apply
                                                </button>
                                            ) : (
                                                <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    Applied
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!analysisText && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p>Select a TRIZ tool to analyze your model.</p>
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-400 animate-pulse text-sm">Applying TRIZ Algorithms...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TrizModal;
