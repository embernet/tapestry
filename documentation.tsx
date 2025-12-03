
import React from 'react';
import { GuidanceContent } from './types';

// ============================================================================
// TAPESTRY TOOL DOCUMENTATION & GUIDANCE REGISTRY
// ============================================================================

export interface ToolDocumentationItem {
    id: string; // Unique key for lookup
    name: string;
    color: string;
    desc: string; // Short description for list view
    summary: string; // Paragraph for User Guide
    icon: React.ReactNode;
    subItems?: { name: string; desc: string; icon: React.ReactNode }[];
    hideInGuide?: boolean; // If true, hides from the User Guide list but keeps available for Guidance Panel lookup
    
    // The detailed content for the Guidance Panel (Lightbulb)
    guidance: GuidanceContent;
}

// Full 40 Principles Data for use in Tool and Documentation
export const TRIZ_PRINCIPLES_FULL = [
    { 
        id: 1, name: "1. Segmentation", 
        general: "Break the system into smaller, independent, or distinct parts.",
        engineering: "Divide an object into independent parts. Make an object easy to disassemble. Example: Modular furniture allows easier transport and assembly.",
        business: "Segment market audiences into niches. Break a large project into agile sprints. Example: Franchise business models where local branches operate independently.",
        software: "Microservices architecture. Containerisation. Example: Splitting a monolithic application into microservices for independent deployment.",
        social: "Divide a large community into smaller interest groups or local chapters. Example: Neighbourhood watch schemes operating locally within a city-wide framework.",
        environment: "Create habitat corridors or patches rather than one large block. Example: Managing forest segmentation to prevent the spread of wildfires.",
        education: "Break a curriculum into modules or bite-sized lessons. Example: Micro-learning platforms delivering content in 5-minute segments.",
        health: "Isolate patients with contagious diseases. Organise hospital wards by specialty. Example: Triage systems separating patients by urgency and condition.",
        arts: "Divide a story into chapters or episodes. Example: A TV series telling a long narrative in distinct hourly segments.",
        culinary: "Slice ingredients to speed up cooking or enable sharing. Example: Slicing vegetables finely (julienne) to ensure they cook instantly in a wok, or cutting a pizza into slices for distribution."
    },
    { 
        id: 2, name: "2. Taking Out", 
        general: "Extract the useful part or remove the harmful part.",
        engineering: "Separate an interfering part or property from an object. Example: Using a fibre optic cable to separate the light source from the area of illumination.",
        business: "Outsourcing non-core functions. Example: A company outsourcing its payroll to a specialist firm to focus on product development.",
        software: "Abstract classes or interfaces. Example: Extracting an interface from a class to decouple the implementation from the usage.",
        social: "Remove disruptive individuals from a group setting. Example: Moderators banning trolls from an online forum to maintain constructive dialogue.",
        environment: "Remove pollutants from a waste stream. Example: Carbon capture technology extracting CO2 from industrial emissions.",
        education: "Remove distractions from the learning environment. Example: 'Quiet hours' in libraries to ensure focus.",
        health: "Surgical removal of a tumour. Example: Dialysis removing toxins from the blood when kidneys fail.",
        arts: "Editing a film to remove scenes that drag the pace. Example: Minimalism in design, removing all non-essential elements.",
        culinary: "Remove inedible or unpleasant parts. Example: Deboning a chicken or peeling vegetables to remove tough skins, or skimming fat off a stock."
    },
    { 
        id: 3, name: "3. Local Quality", 
        general: "Optimise each part of the system for its specific function or environment.",
        engineering: "Change the shape of an object from symmetrical to asymmetrical. Example: Mixing vessels with asymmetrical baffles to improve mixing efficiency.",
        business: "Regional pricing strategies or personalised marketing. Example: A supermarket placing high-margin items at eye level.",
        software: "Edge computing or local caching. Example: Storing frequently accessed data on a user's device rather than the server.",
        social: "Empower local councils to make decisions relevant to their specific area. Example: Local bylaws addressing specific town needs rather than national laws.",
        environment: "Micro-climate management. Example: Planting shade-loving plants under trees and sun-loving ones in open areas of the same garden.",
        education: "Personalised learning plans for students. Example: Giving extra time to students with dyslexia during exams.",
        health: "Targeted drug delivery. Example: Applying cream directly to a rash rather than taking a systemic pill.",
        arts: "Varying the texture of a painting in specific areas. Example: Using impasto for light highlights while keeping shadows smooth.",
        culinary: "Treat different ingredients in a dish differently. Example: Sealing a steak for a crust while keeping the inside rare, or seasoning only the meat and not the sauce until the end."
    },
    { 
        id: 4, name: "4. Asymmetry", 
        general: "Replace symmetrical forms or processes with asymmetrical ones to solve the problem.",
        engineering: "Change the shape of an object from symmetrical to asymmetrical. Example: Mixing vessels with asymmetrical baffles to improve mixing efficiency.",
        business: "Niche marketing or uneven resource allocation. Example: The 80/20 rule (Pareto principle) focusing 80% of effort on the top 20% of clients.",
        software: "Asymmetric cryptography. Example: Using a public key for encryption and a private key for decryption.",
        social: "Positive discrimination or affirmative action. Example: Grants specifically for under-represented groups to balance historical inequality.",
        environment: "Windbreaks planted perpendicular to prevailing winds (asymmetrical landscape). Example: Designing a building with a larger south-facing facade for solar gain.",
        education: "Focusing more teaching resources on struggling students. Example: Smaller class sizes for special needs education.",
        health: "Treating the stronger eye to force the weaker eye to work (patching). Example: Designing prosthetics that handle specific asymmetrical loads.",
        arts: "Asymmetrical composition to create visual interest. Example: The rule of thirds in photography.",
        culinary: "Plating food off-centre for visual appeal. Example: Placing the main protein to the side with a swoop of sauce, rather than centrally, or using a knife with a chisel grind (asymmetric edge) for precise sushi cuts."
    },
    { 
        id: 5, name: "5. Merging", 
        general: "Combine identical or similar objects/operations in space or time.",
        engineering: "Assemble identical or similar parts to perform parallel operations. Example: A catamaran hull combining two hulls for stability.",
        business: "Mergers and Acquisitions. Example: Airline alliances sharing codes and lounges to offer broader service.",
        software: "Connection pooling or merging git branches. Example: Combining multiple CSS files into one to reduce HTTP requests.",
        social: "Community centres serving multiple groups. Example: Co-housing projects where residents share common facilities like kitchens.",
        environment: "Permaculture guilds. Example: Planting beans, corn, and squash together (Three Sisters) to support each other.",
        education: "Interdisciplinary courses. Example: A 'STEM' class combining Science, Technology, Engineering, and Maths projects.",
        health: "Polypills combining multiple medications. Example: Combined vaccines like MMR (Measles, Mumps, Rubella).",
        arts: "Mixed media art. Example: A collage combining photography, painting, and text.",
        culinary: "Combine ingredients into a single mixture. Example: Making a soup or stew where flavours merge over time, or blending spices to create a curry powder."
    },
    { 
        id: 6, name: "6. Universality", 
        general: "Make one part perform multiple functions, removing the need for other parts.",
        engineering: "Eliminate the need for other parts. Example: A sofa-bed serves as both seating and sleeping furniture.",
        business: "Cross-trained employees. Example: A store manager who can also handle checkout and stock replenishment.",
        software: "Polymorphism or full-stack frameworks. Example: Using a single function to handle input from both mouse and touch.",
        social: "Community leaders acting as mediators and organisers. Example: A library that also functions as a polling station and internet cafe.",
        environment: "Multi-functional landscapes. Example: A wetland that treats water, provides habitat, and offers flood protection.",
        education: "Teachers who cover multiple subjects in primary school. Example: A tablet used as a textbook, notebook, and research tool.",
        health: "Broad-spectrum antibiotics. Example: A GP (General Practitioner) who diagnoses a wide range of conditions.",
        arts: "A prop that serves multiple purposes in a play. Example: A wooden box acting as a table, a seat, and a podium in theatre.",
        culinary: "Use a single tool for many tasks. Example: A chef's knife used for crushing garlic, chopping herbs, and slicing meat, removing the need for a garlic press."
    },
    { 
        id: 7, name: "7. Nested Doll", 
        general: "Place one object inside another, or pass one object through the cavity of another.",
        engineering: "Place one object inside another. Example: A telescopic antenna or camera lens.",
        business: "Franchise within a store. Example: A Starbucks coffee shop located inside a Sainsbury's supermarket.",
        software: "Encapsulation or virtual machines. Example: Docker containers running inside a virtual machine.",
        social: "Sub-committees within a larger committee. Example: A local council operating within a county council structure.",
        environment: "Seed banks. Example: Seeds stored inside a protective vault, inside a mountain (Svalbard).",
        education: "Spiral curriculum. Example: Revisiting the same topic (e.g., Photosynthesis) at increasing levels of complexity each year.",
        health: "Stents placed inside arteries. Example: Endoscopy (camera inside a tube inside the body).",
        arts: "A play within a play. Example: The 'Mousetrap' scene in Hamlet.",
        culinary: "Stuffing one food item inside another. Example: A Turducken (chicken in a duck in a turkey) or stuffed olives."
    },
    { 
        id: 8, name: "8. Anti-Weight", 
        general: "Compensate for a negative factor by combining it with something that provides an opposing force.",
        engineering: "Compensate for weight by merging with objects that provide lift. Example: A boat's hydrofoils lifting the hull out of the water to reduce drag.",
        business: "Subsidies or strategic partnerships. Example: Government grants lifting the financial burden of R&D for startups.",
        software: "Load balancing. Example: Using a Content Delivery Network (CDN) to offload static asset delivery from the main server.",
        social: "Support groups. Example: A mentorship programme where experienced members support newcomers.",
        environment: "Carbon offsetting. Example: Planting trees to balance out carbon emissions from a flight.",
        education: "Teaching assistants. Example: Using TAs to share the load of classroom management.",
        health: "Crutches or exoskeletons. Example: A water birth pool to support the mother's weight.",
        arts: "Comic relief. Example: Inserting a funny scene after a tragic one to lift the mood.",
        culinary: "Use lightness to counteract heaviness. Example: Using yeast or bicarbonate of soda to make dough rise against gravity, or cutting a rich fatty dish with acidic lemon juice."
    },
    { 
        id: 9, name: "9. Preliminary Anti-Action", 
        general: "Prepare for a known harm by creating a counter-action in advance.",
        engineering: "Pre-stressing materials. Example: Rebar in concrete is pulled tight before pouring to counteract future loads.",
        business: "Hedging or insurance. Example: Taking out liability insurance before launching a risky product.",
        software: "Input sanitization. Example: Validating and cleaning user input before it reaches the database to prevent SQL injection.",
        social: "Pre-emptive diplomacy. Example: Holding peace talks before a conflict escalates.",
        environment: "Controlled burns. Example: Burning underbrush intentionally to prevent larger, uncontrolled wildfires.",
        education: "Pre-teaching difficult vocabulary. Example: Introducing key terms before reading a complex text.",
        health: "Vaccination. Example: Introducing a harmless virus part to train the immune system before real exposure.",
        arts: "Foreshadowing. Example: Hinting at a twist early in the story to make it believable later.",
        culinary: "Preventing adverse reactions. Example: Marinating meat to tenderise it before cooking, or chilling dough to prevent it shrinking in the oven."
    },
    { 
        id: 10, name: "10. Preliminary Action", 
        general: "Perform required changes before they are needed.",
        engineering: "Pre-glued wallpaper. Example: Surgical instruments sterilised and packed before the operation starts.",
        business: "Mise en place. Example: Chefs chopping and preparing all ingredients before service begins.",
        software: "Pre-fetching or caching. Example: Loading the next video chunk while the current one is playing.",
        social: "Agendas circulated before meetings. Example: Sending briefing notes so participants arrive prepared.",
        environment: "Pre-sorting waste. Example: Separating glass, paper, and plastic at home before collection.",
        education: "Flipped classroom. Example: Students watching lectures at home so class time is used for discussion.",
        health: "Prophylactic medication. Example: Taking anti-malarial tablets before travelling to the tropics.",
        arts: "Priming a canvas. Example: Applying a base coat to a canvas before painting.",
        culinary: "Mise en place. Example: Chopping, measuring, and preparing all ingredients into bowls before turning on the heat."
    },
    { 
        id: 11, name: "11. Beforehand Cushioning", 
        general: "Prepare emergency measures in advance to compensate for low reliability.",
        engineering: "Airbags or emergency chutes. Example: A run-flat tyre that works even after a puncture.",
        business: "Emergency funds. Example: Keeping a cash reserve to cover operational costs during a downturn.",
        software: "Backups and redundancy. Example: RAID disk arrays ensuring data is safe if one drive fails.",
        social: "Safety nets. Example: Unemployment benefits providing a cushion for job loss.",
        environment: "Flood defences. Example: Building levees or flood barriers before the rainy season.",
        education: "Spare pens and paper. Example: A teacher keeping extra supplies for students who forget theirs.",
        health: "First aid kits. Example: Keeping an EpiPen on hand for severe allergic reactions.",
        arts: "Understudies. Example: Rehearsing a second actor to take over if the lead falls ill.",
        culinary: "Preventing sticking or burning. Example: Greasing a tin and lining it with parchment paper before adding cake batter, or keeping a frozen pizza as a backup dinner."
    },
    { 
        id: 12, name: "12. Equipotentiality", 
        general: "Change conditions so that an object doesn't have to be raised or lowered (worked against).",
        engineering: "Limit position changes in a potential field. Example: Using a mechanic's pit to work under a car without lifting it.",
        business: "Flat organisational structure. Example: Allowing employees to switch teams without a change in rank or pay grade.",
        software: "Stateless servers. Example: Designing a system where any server can handle any request, removing the 'cost' of routing.",
        social: "Universal Basic Income. Example: Providing a flat baseline income to remove the 'cliff edge' of benefits.",
        environment: "Contour ploughing. Example: Ploughing along the contour lines of a slope to prevent soil erosion.",
        education: "Mixed-ability grouping. Example: Removing sets/streams so students can move between topics without label changes.",
        health: "Accessible design. Example: Replacing stairs with ramps so wheelchairs don't need lifting.",
        arts: "Tracking shots. Example: Moving the camera on rails to keep the subject in frame without refocussing.",
        culinary: "Optimising workflow. Example: Sliding chopped vegetables directly from the chopping board into a pan held at the same level, rather than lifting them."
    },
    { 
        id: 13, name: "13. The Other Way Round", 
        general: "Invert the action to solve the problem.",
        engineering: "Invert the action(s) used to solve the problem. Example: Running on a treadmill (floor moves, you stay still).",
        business: "Reverse auctions. Example: Suppliers bidding to sell to a buyer, driving prices down.",
        software: "Inversion of Control (IoC). Example: A framework calling your code rather than you calling the library.",
        social: "Restorative justice. Example: The offender repairing harm to the victim rather than just being punished by the state.",
        environment: "Rewilding. Example: Removing human intervention to let nature manage itself, rather than managing nature.",
        education: "Student-led teaching. Example: Students preparing a lesson to teach the class.",
        health: "Biofeedback. Example: Learning to control heart rate by watching it on a monitor.",
        arts: "Negative space drawing. Example: Drawing the spaces around an object rather than the object itself.",
        culinary: "Inverting the process. Example: Making an Upside-Down Cake (fruit at bottom, batter on top, then flipped), or searing meat *after* sous-vide cooking (reverse sear)."
    },
    { 
        id: 14, name: "14. Spheroidality", 
        general: "Move from linear/flat parts to curved/spherical parts or movements.",
        engineering: "Replace rectilinear parts with curvilinear ones. Example: Using ball bearings to reduce friction instead of flat sliding surfaces.",
        business: "Circular economy. Example: Designing products to be recycled back into raw materials rather than a linear 'take-make-waste' model.",
        software: "Iterative development loops. Example: Agile development cycles rather than a linear waterfall process.",
        social: "Circle time. Example: Sitting in a circle for meetings to encourage equality and eye contact.",
        environment: "Swales. Example: Digging curved ditches on contours to hold water in the landscape.",
        education: "Spiral learning. Example: Revisitng topics at deeper levels rather than linear progression.",
        health: "Rotational exercises. Example: Exercises that involve twisting the core for better functional fitness.",
        arts: "Dome architecture. Example: Using geodesic domes for strength and space.",
        culinary: "Using curved shapes. Example: Using a Wok for stir-frying to allow even heat distribution and tossing, or scooping melon balls for presentation."
    },
    { 
        id: 15, name: "15. Dynamics", 
        general: "Make parts movable or adaptive to change operating characteristics.",
        engineering: "Allow characteristics to change for optimal operation. Example: A Formula 1 car with an adjustable rear wing (DRS).",
        business: "Dynamic pricing. Example: Uber surge pricing adjusting to demand in real-time.",
        software: "Auto-scaling. Example: Server infrastructure that adds more instances automatically when traffic spikes.",
        social: "Flexible working. Example: Employees choosing their own hours or location.",
        environment: "Adaptive flood barriers. Example: The Thames Barrier closing only when a high tide is predicted.",
        education: "Adaptive learning software. Example: A quiz app that gets harder as the student gets answers right.",
        health: "Dynamic splints. Example: Braces that allow some movement to aid healing.",
        arts: "Improv theatre. Example: A play with no script, adapting to audience suggestions.",
        culinary: "Adaptive tools or states. Example: Using an immersion blender that can be moved around the pot, or folding dough to develop gluten."
    },
    { 
        id: 16, name: "16. Partial or Excessive Actions", 
        general: "If exactness is hard, go for slightly less or slightly more.",
        engineering: "Rough machining followed by precision. Example: Spray painting a stencil (excessive paint) to get a sharp image.",
        business: "MVP (Minimum Viable Product). Example: Launching a product with just enough features (partial) to test the market.",
        software: "Fuzzy search. Example: Returning approximate results when an exact match isn't found.",
        social: "Brainstorming. Example: Generating 100 wild ideas (excessive) to find 3 good ones.",
        environment: "Over-planting. Example: Planting more trees than needed, knowing some will not survive.",
        education: "Over-learning. Example: Practising a skill beyond initial mastery to ensure retention.",
        health: "Hyper-hydration. Example: Drinking slightly more water than needed to ensure full hydration.",
        arts: "Caricature. Example: Exaggerating features in a drawing to capture the essence of a person.",
        culinary: "Approximations. Example: Reducing a sauce until it 'coats the back of a spoon' rather than measuring exact viscosity, or salting 'to taste' (incremental excess)."
    },
    { 
        id: 17, name: "17. Another Dimension", 
        general: "Move to a new dimension (e.g. from line to plane, plane to space).",
        engineering: "Move an object in 2D or 3D space. Example: A spiral staircase uses vertical space to save floor area.",
        business: "Vertical integration. Example: A manufacturer buying its supplier to control the supply chain.",
        software: "3D Arrays or Event Sourcing. Example: Storing the history of data changes (time dimension) not just current state.",
        social: "Intersectionality. Example: Looking at how race, class, and gender interact rather than viewing them in isolation.",
        environment: "Vertical farming. Example: Growing crops in stacked layers to save land.",
        education: "VR learning. Example: Using Virtual Reality to explore a historical site in 3D.",
        health: "3D scanning (MRI/CT). Example: Imaging the body in slices rather than a flat X-ray.",
        arts: "Holography. Example: Creating 3D images on a 2D surface.",
        culinary: "Using vertical space. Example: Stacking layers in a cake or lasagne, or using a skewer (kebab) to cook ingredients in a line."
    },
    { 
        id: 18, name: "18. Mechanical Vibration", 
        general: "Use oscillation or vibration.",
        engineering: "Cause an object to oscillate. Example: An ultrasonic bath cleaning jewellery with sound waves.",
        business: "Market disruption. Example: Launching a controversial campaign to 'shake up' the market.",
        software: "Chaos Engineering. Example: Randomly crashing servers (vibration) to test system resilience (Netflix Simian Army).",
        social: "Pulse surveys. Example: Short, frequent check-ins with staff to gauge morale.",
        environment: "Sonic pest control. Example: Using sound waves to repel rodents.",
        education: "Spaced repetition. Example: Revisiting flashcards at oscillating intervals.",
        health: "Vibration plates. Example: Using whole-body vibration for muscle therapy.",
        arts: "Vibrato. Example: Oscillating pitch in singing to add warmth to a note.",
        culinary: "Agitation. Example: Whisking egg whites to aerate them, or shaking a cocktail to chill and mix it simultaneously."
    },
    { 
        id: 19, name: "19. Periodic Action", 
        general: "Use periodic or pulsed actions instead of continuous ones.",
        engineering: "Use pulsed actions. Example: An impact driver uses pulses of torque to turn a stuck screw.",
        business: "Sprints. Example: Working in 2-week cycles rather than a continuous flow.",
        software: "Polling or Cron jobs. Example: Checking for new emails every 5 minutes rather than maintaining a constant connection.",
        social: "Festivals and holidays. Example: Periodic celebrations to break up the routine of the year.",
        environment: "Intermittent irrigation. Example: Watering crops in pulses to reduce evaporation.",
        education: "Pomodoro technique. Example: Studying for 25 minutes then taking a 5-minute break.",
        health: "Interval training (HIIT). Example: Short bursts of intense exercise followed by rest.",
        arts: "Stroboscope. Example: Using flashing lights to create a slow-motion effect on a dance floor.",
        culinary: "Pulsing. Example: Pulsing a food processor to chop chunks without turning them into paste, or basting a turkey every 30 minutes."
    },
    { 
        id: 20, name: "20. Continuity of Useful Action", 
        general: "Make all parts of an object work at full load, all the time.",
        engineering: "Carry on work continuously. Example: A flywheel stores energy to keep a machine running smoothly between power pulses.",
        business: "24/7 Operations. Example: A global team handing over work across time zones to keep a project moving continuously.",
        software: "Streaming. Example: Watching a movie while it downloads, rather than waiting for the whole file.",
        social: "Shift work. Example: Doctors covering nights and weekends so hospital care is continuous.",
        environment: "Continuous cover forestry. Example: Harvesting select trees rather than clear-cutting, keeping the forest ecosystem intact.",
        education: "Lifelong learning. Example: Continuous professional development (CPD) throughout a career.",
        health: "Continuous Glucose Monitoring (CGM). Example: A sensor tracking blood sugar 24/7.",
        arts: "Long take. Example: Filming a scene in one continuous shot without cuts.",
        culinary: "Constant motion. Example: Constantly stirring a risotto to release starch, or using a rotisserie to cook meat evenly without stopping."
    },
    { 
        id: 21, name: "21. Skipping", 
        general: "Conduct harmful or hazardous operations at very high speed.",
        engineering: "Conduct a process at high speed. Example: Cutting plastic very fast to avoid melting it with heat build-up.",
        business: "Fail fast. Example: Rapidly prototyping and testing to identify bad ideas before investing too much.",
        software: "Skip lists or bypassing cache. Example: Jumping to keyframes in video compression.",
        social: "Ripping off the plaster. Example: Delivering bad news quickly and directly.",
        environment: "Flash heating. Example: Pasteurising milk at high heat for a short time to kill bacteria without spoiling taste.",
        education: "Skim reading. Example: Quickly scanning a text to get the gist before deep reading.",
        health: "High-velocity thrust. Example: Chiropractic adjustment done quickly to avoid muscle resistance.",
        arts: "Time-lapse. Example: Speeding up a long process (like a flower opening) to make it visible.",
        culinary: "High heat speed. Example: Flash-frying (stir fry) vegetables to keep them crunchy, or flambéing to burn off alcohol quickly."
    },
    { 
        id: 22, name: "22. Blessing in Disguise", 
        general: "Convert harm into benefit.",
        engineering: "Use harmful factors to achieve a positive effect. Example: Using waste heat from an engine to warm the car cabin.",
        business: "Crisis PR. Example: Using a product recall as an opportunity to demonstrate excellent customer service.",
        software: "Honeypots. Example: Setting up a fake vulnerable server to attract hackers and study their methods.",
        social: "Post-traumatic growth. Example: Communities bonding and becoming stronger after a disaster.",
        environment: "Composting. Example: Turning rotting food waste into nutrient-rich soil.",
        education: "Learning from mistakes. Example: Analysing incorrect answers to deepen understanding.",
        health: "Inoculation. Example: Injecting a harmful virus part to build immunity.",
        arts: "Wabi-sabi. Example: Embracing cracks or imperfections in pottery as aesthetic features (Kintsugi).",
        culinary: "Controlled spoilage. Example: Fermentation turning 'rotting' cabbage into Sauerkraut, or mould on blue cheese adding flavour."
    },
    { 
        id: 23, name: "23. Feedback", 
        general: "Introduce feedback to improve a process or action.",
        engineering: "Refer back or cross-check. Example: A thermostat turning the heating off when the temperature is reached.",
        business: "NPS Scores. Example: Surveying customers after a purchase to improve service.",
        software: "Error reporting. Example: An app sending a crash report to developers automatically.",
        social: "Peer review. Example: Scientists checking each other's work before publication.",
        environment: "Biological indicators. Example: Monitoring the population of bees to check ecosystem health.",
        education: "Formative assessment. Example: Quizzes during a course to check understanding before the final exam.",
        health: "Biofeedback therapy. Example: Using sensors to see muscle tension and learning to relax it.",
        arts: "Audience reaction. Example: Comedians adjusting their set based on laughter.",
        culinary: "Tasting. Example: Continually tasting the dish as you cook and adjusting seasoning (salt/acid) based on the sensory feedback."
    },
    { 
        id: 24, name: "24. Intermediary", 
        general: "Use an intermediary object or process.",
        engineering: "Use an intermediary carrier article. Example: Using a plectrum to play guitar to protect fingers and change sound.",
        business: "Brokerage. Example: Using a mortgage broker to find the best deal from banks.",
        software: "Middleware or API Gateway. Example: A server that sits between the client and the database to handle security.",
        social: "Mediators. Example: A neutral third party facilitating divorce negotiations.",
        environment: "Cover crops. Example: Planting clover to fix nitrogen in the soil before planting wheat.",
        education: "Scaffolding. Example: Using a template or frame to help a student write an essay.",
        health: "Carrier oils. Example: Mixing essential oils with a base oil before applying to skin.",
        arts: "Maquette. Example: Building a small clay model before making a large statue.",
        culinary: "Using a buffer. Example: Cooking in a Bain-marie (water bath) to gently melt chocolate, or using baking parchment to prevent sticking."
    },
    { 
        id: 25, name: "25. Self-Service", 
        general: "Make an object serve itself.",
        engineering: "Make an object perform auxiliary helpful functions. Example: Self-cleaning glass coated with a material that breaks down dirt.",
        business: "Self-checkout. Example: Supermarkets allowing customers to scan and bag their own goods.",
        software: "Garbage collection. Example: Programming languages (like Java) that automatically clear unused memory.",
        social: "Self-help groups. Example: Alcoholics Anonymous where members support each other without professional leaders.",
        environment: "Rewilding. Example: Letting nature manage vegetation and water flow without human intervention.",
        education: "Self-directed learning. Example: Montessori schools where children choose their own activities.",
        health: "Self-diagnosis. Example: Using a home pregnancy test kit.",
        arts: "Auto-generative art. Example: Writing code that generates music or visuals on its own.",
        culinary: "Internal reactions. Example: A self-saucing pudding creating its own sauce during baking, or sourdough starter maintaining its own yeast culture."
    },
    { 
        id: 26, name: "26. Copying", 
        general: "Use simple, inexpensive copies instead of fragile or expensive originals.",
        engineering: "Use simpler and inexpensive copies. Example: Crash testing cars with dummies instead of humans.",
        business: "Franchising. Example: Replicating a business model (McDonald's) rather than expanding one huge store.",
        software: "Virtualisation. Example: Testing software on a virtual machine copy rather than risking the production server.",
        social: "Role models. Example: Copying the behaviours of a successful person.",
        environment: "Biomimicry. Example: Designing Velcro by copying the hooks on burdock seeds.",
        education: "Simulations. Example: Pilots training in a flight simulator before flying a real jet.",
        health: "Generic drugs. Example: Using a cheaper unbranded version of a drug with the same active ingredients.",
        arts: "Prints. Example: Selling lithograph copies of a painting to reach a wider audience.",
        culinary: "Substitutes. Example: Using margarine instead of butter for cost, or using vegetarian 'meat' analogues."
    },
    { 
        id: 27, name: "27. Cheap Short-Living Objects", 
        general: "Replace an expensive object with multiple inexpensive, short-lived ones.",
        engineering: "Replace an expensive object with multiples. Example: Using disposable paper cups instead of ceramic mugs at a large event.",
        business: "Pop-up shops. Example: Renting a temporary space for a month rather than a 5-year lease.",
        software: "Lambda functions. Example: Spinning up a server process for milliseconds to run code, then destroying it.",
        social: "Gig economy. Example: Hiring a freelancer for a specific task rather than a full-time employee.",
        environment: "Biodegradable packaging. Example: Packaging that lasts only as long as the food, then rots away.",
        education: "Scratchpads. Example: Using rough paper for working out, then discarding it.",
        health: "Disposable syringes. Example: Using a new plastic syringe for every injection to prevent infection.",
        arts: "Street art. Example: Chalk drawings on pavement that wash away with rain.",
        culinary: "Edible/Disposable containers. Example: Serving tacos in a shell (eaten), or using paper plates at a picnic."
    },
    { 
        id: 28, name: "28. Mechanics Substitution", 
        general: "Replace a mechanical system with a sensory or field-based system.",
        engineering: "Replace a mechanical method with a sensory method. Example: Using a laser distance measurer instead of a tape measure.",
        business: "Digital signatures. Example: Signing a PDF electronically instead of posting a paper contract.",
        software: "Voice UI. Example: Asking Siri to set an alarm instead of typing it in.",
        social: "Nudging. Example: Painting footsteps on the ground to guide crowds rather than using barriers.",
        environment: "Electric fences. Example: Using an electric shock (field) to contain cattle rather than a heavy wooden wall.",
        education: "Audiobooks. Example: Listening to a book instead of reading the physical text.",
        health: "Aromatherapy. Example: Using smell to influence mood rather than pills.",
        arts: "Digital art. Example: Painting on an iPad instead of using canvas and oils.",
        culinary: "Chemical cooking. Example: Cooking fish with acid (Ceviche) instead of heat, or using molecular gastronomy spheres instead of chopped fruit."
    },
    { 
        id: 29, name: "29. Pneumatics and Hydraulics", 
        general: "Use intangible parts (air, fluid, information) instead of solid parts.",
        engineering: "Use gas and liquid parts. Example: Hydraulic brakes using fluid pressure to stop a car.",
        business: "Cash flow liquidity. Example: Ensuring assets are 'liquid' (cash) to move quickly.",
        software: "Fluid layouts. Example: Web designs that flow to fill the screen size.",
        social: "Fluid hierarchies. Example: Holacracy, where roles change dynamically rather than fixed job titles.",
        environment: "Air insulation. Example: Double glazing using a layer of gas to trap heat.",
        education: "Immersive learning. Example: Learning a language by being surrounded by it (fluid environment) rather than textbooks.",
        health: "Water therapy. Example: Exercising in a pool to reduce impact on joints.",
        arts: "Inflatables. Example: Art installations made of air-filled plastic.",
        culinary: "Aeration and fluids. Example: Mousses, foams, and soufflés which rely on trapped air for structure, or serving a Jus instead of a thick gravy."
    },
    { 
        id: 30, name: "30. Flexible Shells and Thin Films", 
        general: "Use flexible shells and thin films to isolate the object.",
        engineering: "Use flexible shells instead of 3D structures. Example: Bubble wrap protecting fragile items.",
        business: "Drop-shipping. Example: A business that is just a 'thin shell' marketing front, with no inventory.",
        software: "API Wrappers. Example: A simple library that wraps complex code to make it easy to use.",
        social: "Personal boundaries. Example: Learning to say 'no' to protect one's energy.",
        environment: "Mulching. Example: A thin layer of bark chips to protect soil moisture.",
        education: "Flashcards. Example: Thin cards with concise information for revision.",
        health: "Contact lenses. Example: A thin film correcting vision instead of heavy glasses.",
        arts: "Gold leaf. Example: Applying a microscopically thin layer of gold for decoration.",
        culinary: "Edible barriers. Example: Sausage casings, pastry shells (vol-au-vents), or using cling film to poach eggs."
    },
    { 
        id: 31, name: "31. Porous Materials", 
        general: "Make an object porous or add porous elements.",
        engineering: "Make an object porous. Example: Sintered metal filters allowing gas through but stopping particles.",
        business: "Transparency. Example: Open-book management where all employees see the financials.",
        software: "Open ports. Example: Allowing specific traffic through a firewall.",
        social: "Open borders. Example: Allowing free movement of people between countries (Schengen Area).",
        environment: "Permeable paving. Example: Driveways that let rain soak through to prevent flooding.",
        education: "Open University. Example: Education systems that allow entry without prior qualifications.",
        health: "Transdermal patches. Example: Nicotine patches that let drugs seep through the skin.",
        arts: "Negative space sculpture. Example: Sculptures (like Henry Moore's) with holes as key features.",
        culinary: "Spongy textures. Example: Sponge cake absorbing syrup, or aerated bread (ciabatta) holding pockets of flavour."
    },
    { 
        id: 32, name: "32. Colour Changes", 
        general: "Change the colour or transparency of an object or its environment.",
        engineering: "Change the colour of an object. Example: UV-sensitive sunglasses that turn dark in sunlight.",
        business: "Rebranding. Example: Changing a logo to green to emphasise eco-friendliness.",
        software: "Syntax highlighting. Example: Code editors colouring keywords to make code readable.",
        social: "Traffic light system. Example: Using Red/Amber/Green status to communicate project health.",
        environment: "Camouflage. Example: Animals changing colour to blend in.",
        education: "Colour-coding notes. Example: Highlighting key dates in yellow and names in pink.",
        health: "Blue light filters. Example: Reducing blue light on screens at night to aid sleep.",
        arts: "Mood lighting. Example: Changing stage lights to red to signify danger.",
        culinary: "Visual cues. Example: Cooking steak until it turns brown (Maillard reaction), or using food colouring to make a dish look more appealing."
    },
    { 
        id: 33, name: "33. Homogeneity", 
        general: "Make interacting objects out of the same material.",
        engineering: "Make objects interacting of the same material. Example: Welding plastic with a plastic rod of the same type.",
        business: "Cultural fit. Example: Hiring employees who share the same values as the company.",
        software: "Full-stack JavaScript. Example: Using Node.js on the server and React on the client so the language is the same.",
        social: "Echo chambers. Example: Social media algorithms showing you views that match your own.",
        environment: "Monoculture. Example: Planting a field with only one type of crop (efficient but risky).",
        education: "Streaming by ability. Example: Putting students of similar ability in the same class.",
        health: "Blood transfusion. Example: Matching blood types exactly to prevent rejection.",
        arts: "Monochrome. Example: Painting using only shades of a single colour.",
        culinary: "Matching flavours. Example: Cooking beef in beef stock, or pairing wine with food from the same region (Terroir)."
    },
    { 
        id: 34, name: "34. Discarding and Recovering", 
        general: "Discard parts that have fulfilled their function or recover used parts.",
        engineering: "Make portions go away. Example: Dissolvable stitches that disappear once the wound heals.",
        business: "Pop-up teams. Example: A task force assembled for a project and disbanded afterwards.",
        software: "Garbage collection. Example: Software automatically clearing memory that is no longer being used.",
        social: "Rites of passage. Example: Graduating and leaving school life behind to enter adulthood.",
        environment: "Composting. Example: Food waste rotting down to become soil for new plants.",
        education: "Unlearning. Example: Discarding outdated knowledge (e.g., Pluto is a planet) to learn new facts.",
        health: "Exfoliation. Example: Scrubbing away dead skin cells to reveal new skin.",
        arts: "Ephemeral art. Example: Ice sculptures meant to melt away.",
        culinary: "Consumable vessels. Example: Eating the bread bowl after finishing the soup, or sugar cages that dissolve in sauce."
    },
    { 
        id: 35, name: "35. Parameter Changes", 
        general: "Change the physical state, concentration, or degree of flexibility.",
        engineering: "Change an object's physical state. Example: Freezing food to preserve it.",
        business: "Pivot. Example: A company changing from selling products to selling subscriptions (SaaS).",
        software: "Type casting. Example: Converting a number to a string to display it.",
        social: "Social mobility. Example: Moving from one social class to another.",
        environment: "Desalination. Example: Changing salt water into fresh water.",
        education: "Gamification. Example: Changing a lesson from a lecture into a game.",
        health: "Anaesthesia. Example: Changing consciousness state to perform surgery.",
        arts: "Remixing. Example: Changing the tempo and style of a song.",
        culinary: "Changing state. Example: Freezing fruit to make sorbet, or melting chocolate to mould it."
    },
    { 
        id: 36, name: "36. Phase Transitions", 
        general: "Use phenomena occurring during phase transitions.",
        engineering: "Use volume changes or heat loss. Example: Steam engines using the expansion of water into steam.",
        business: "Tipping points. Example: A product going viral after reaching a critical mass of users.",
        software: "Blue-Green deployment. Example: The moment of switching traffic from the old version to the new version.",
        social: "Revolution. Example: The sudden shift from one political system to another.",
        environment: "Snow melt. Example: Utilizing the spring thaw to fill reservoirs.",
        education: "The 'Aha!' moment. Example: The sudden transition from confusion to understanding.",
        health: "Fever breaking. Example: The point where the body temperature drops and recovery begins.",
        arts: "The drop in music. Example: The transition from build-up to the main beat in electronic music.",
        culinary: "Latent heat. Example: Using 'carry-over cooking' where meat continues to cook after being removed from the oven due to retained heat."
    },
    { 
        id: 37, name: "37. Thermal Expansion", 
        general: "Use thermal expansion (or contraction) of materials.",
        engineering: "Use expansion of materials. Example: Bimetallic strips in thermostats bending as they heat up.",
        business: "Economic boom/bust. Example: Expanding the workforce during a boom and contracting during a recession.",
        software: "Auto-scaling. Example: Adding more servers as 'heat' (traffic load) increases.",
        social: "Crowd swelling. Example: A protest growing in size as emotions run high.",
        environment: "Sea level rise. Example: Water expanding as it warms.",
        education: "Brainstorming expansion. Example: Expanding a simple idea into a complex project.",
        health: "Vasodilation. Example: Blood vessels expanding to release heat during exercise.",
        arts: "Crescendo. Example: Music getting louder and 'larger' to build tension.",
        culinary: "Rising. Example: Soufflés or puff pastry expanding in the oven due to hot air and steam."
    },
    { 
        id: 38, name: "38. Strong Oxidants", 
        general: "Replace normal environment with an enriched one.",
        engineering: "Replace common air with oxygen-enriched air. Example: Using Nitrous Oxide in cars to boost speed.",
        business: "Accelerators. Example: Joining a startup accelerator to boost growth with funding and mentorship.",
        software: "GPU acceleration. Example: Using a graphics card to speed up calculations.",
        social: "Echo chambers (intensified). Example: Online groups where extreme views are amplified.",
        environment: "Eutrophication. Example: Excess nutrients (nitrogen) in water causing algae blooms.",
        education: "Gifted programmes. Example: Enriched curriculum for high-achieving students.",
        health: "Hyperbaric chambers. Example: Breathing pure oxygen to speed up healing.",
        arts: "Saturation. Example: Boosting the colours in a photo to make them more vivid.",
        culinary: "Enrichment. Example: Whipping extra air into cream to make it fluffy, or using a smoking gun to infuse intense smoky flavour."
    },
    { 
        id: 39, name: "39. Inert Atmosphere", 
        general: "Replace a normal environment with an inert or neutral one.",
        engineering: "Replace normal environment with inert one. Example: Argon gas in double glazing or light bulbs to prevent reactions.",
        business: "Stealth mode. Example: Developing a product in secret to avoid competitor attention.",
        software: "Sandboxing. Example: Running untrusted code in an isolated environment so it can't affect the system.",
        social: "Safe spaces. Example: Environments where people can speak freely without fear of judgement.",
        environment: "Seed vaults. Example: Storing seeds in cold, dry conditions to stop them germinating.",
        education: "Exam conditions. Example: Creating a silent, neutral environment for testing.",
        health: "Sterile field. Example: Creating a germ-free area for surgery.",
        arts: "White cube gallery. Example: Displaying art on white walls with no distractions.",
        culinary: "Vacuum packing. Example: Sous-vide cooking in a vacuum bag to prevent oxidation and flavour loss."
    },
    { 
        id: 40, name: "40. Composite Materials", 
        general: "Change from uniform to composite (multiple) materials.",
        engineering: "Change from uniform to composite. Example: Carbon fibre (fabric + resin) is stronger and lighter than steel.",
        business: "Cross-functional teams. Example: A squad containing a designer, developer, and tester.",
        software: "Hybrid cloud. Example: Using both private on-premise servers and public cloud storage.",
        social: "Multiculturalism. Example: A society enriched by the combination of many cultures.",
        environment: "Permaculture. Example: Designing systems that combine different plants and animals.",
        education: "Blended learning. Example: Combining online digital media with traditional classroom methods.",
        health: "Multivitamins. Example: Taking a single pill containing many different nutrients.",
        arts: "Collage. Example: Creating an image by assembling different forms like paper, photos, and fabric.",
        culinary: "Emulsions. Example: Mayonnaise (oil and vinegar) or reinforced structures like puff pastry (layers of dough and butter)."
    }
];

export const TOOL_DOCUMENTATION: ToolDocumentationItem[] = [
    {
        id: 'schema',
        name: "Schema",
        color: "text-teal-400",
        desc: "Define visual language.",
        summary: "The Schema tool provides a semantic framework for your knowledge graph, rooted in ontology engineering and data modeling principles. Its purpose is to enforce consistency and meaning across your model by defining standard tags and relationship types. Principles include type-safety and standardized vocabulary. Use this when starting a new domain model or standardizing a team's language. Tip: Define a 'Default Relationship' to speed up entry. Compliments: **Bulk Edit** allows you to quickly apply your new schema to existing nodes.",
        icon: <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
        subItems: [
            { name: "Active Schema", desc: "Switch between color/tag schemes (e.g. Business, Design Thinking).", icon: <path d="M7 7h.01M7 3h5" /> },
            { name: "Edit Schema", desc: "Customize tag colors and relationship definitions.", icon: <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> }
        ],
        guidance: {
            title: "Schema Management",
            sections: [
                {
                    title: "Why use Schemas?",
                    text: "Schemas act as the 'grammar' of your graph. By defining consistent colors for tags (e.g., 'Risk' is always red) and standardizing relationship names (e.g., 'causes' instead of 'leads to' or 'makes'), you make the graph readable by others and by AI tools."
                },
                {
                    title: "Quick Tips",
                    items: [
                        "Use **Active Schema** to quickly switch contexts (e.g., from 'Business' view to 'Technical' view).",
                        "Set a **Default Relation** if you are mapping a process where every step follows the same logic (e.g., 'then').",
                        "The **Default Tags** input allows you to auto-tag every new node you create, perfect for rapid brainstorming sessions."
                    ]
                }
            ]
        }
    },
    {
        id: 'layout',
        name: "Layout",
        color: "text-orange-400",
        desc: "Control graph physics.",
        summary: "Based on force-directed graph drawing algorithms used in network science, the Layout tool simulates physical forces to reveal clusters and structure. Its purpose is to untangle complex networks automatically. Principles involve repulsion between nodes and attraction along edges. Use this when a graph becomes messy or hard to read. Tip: Use 'Shake' if nodes get stuck in local minima. Compliments: **Explorer** offers alternative structural views (like Treemaps) when physics layout is insufficient.",
        icon: <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />,
        subItems: [
            { name: "Simulate", desc: "Start physics simulation to auto-arrange nodes.", icon: <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /> },
            { name: "Spread", desc: "Adjust the target distance between connected nodes.", icon: <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /> },
            { name: "Repel", desc: "Adjust how strongly nodes push away from each other.", icon: <path d="M18 12H6" /> },
            { name: "Shake", desc: "Jiggle nodes to unstuck them.", icon: <path d="M12 8v4l3 3" /> }
        ],
        guidance: {
            title: "Physics & Layout",
            sections: [
                {
                    title: "Understanding Forces",
                    text: "The graph acts like a physical system. Nodes are charged particles that repel each other, while relationships are springs that pull connected nodes together."
                },
                {
                    title: "Controls",
                    items: [
                        "**Spread:** Determines the length of the 'springs'. Increase this to untangle dense clusters.",
                        "**Repel:** Determines the magnetic push between nodes. Increase this if nodes are overlapping.",
                        "**Simulate:** Runs the physics engine continuously. Use this to watch the graph organize itself.",
                        "**Shake:** Applies a sudden random force to all nodes. Useful if the graph settles in a 'tangled' state and needs a nudge to find a better arrangement."
                    ]
                }
            ]
        }
    },
    {
        id: 'analysis',
        name: "Analysis",
        color: "text-purple-400",
        desc: "Graph theory stats.",
        summary: "Derived from graph theory and social network analysis, this tool identifies structural importance within your network. Its purpose is to find key influencers, bottlenecks, and isolated clusters mathematically. Principles include centrality, degree distribution, and connectivity. Use this to identify single points of failure (Articulations) or key hubs. Tip: Use filters to focus analysis on specific sub-graphs. Compliments: **Strategy** tools help you plan actions based on the structural weaknesses identified here.",
        icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
        subItems: [
            { name: "Simulation", desc: "Propagate impact (increase/decrease) through connections.", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> },
            { name: "Highlight/Filter", desc: "Identify Isolated nodes, Hubs, Sources, Sinks, etc.", icon: <path d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /> }
        ],
        guidance: {
            title: "Structural Analysis",
            sections: [
                {
                    title: "Node Classification",
                    items: [
                        "**Isolated:** Nodes with no connections. Often represent forgotten ideas or gaps in modeling.",
                        "**Leaves:** Nodes with only one connection. These are often end-states or inputs.",
                        "**Hubs:** Nodes with many connections. These are critical infrastructure; if a hub fails, many things are affected.",
                        "**Sources:** Nodes that only have outgoing arrows (Inputs/Causes).",
                        "**Sinks:** Nodes that only have incoming arrows (Outputs/Effects)."
                    ]
                },
                {
                    title: "Impact Simulation",
                    text: "Clicking 'Play' in Simulation mode allows you to click a node and see how a change (Increase/Decrease) propagates through the network based on relationship types (e.g. 'causes' vs 'inhibits')."
                }
            ]
        }
    },
    {
        id: 'scamper',
        name: "SCAMPER",
        color: "text-cyan-400",
        desc: "Ideation technique.",
        summary: "Developed by Bob Eberle in 1971 as a simplified version of Alex Osborn's brainstorming techniques. Its purpose is to spark lateral thinking and innovation by forcing specific modifications to an idea. Principles revolve around the seven operators: Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse. Use this when you are stuck or need to iterate on a product feature. Tip: Rapidly cycle through all letters for one node. Compliments: **TRIZ** offers more rigorous solutions if simple brainstorming isn't solving the technical contradiction.",
        icon: <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
        subItems: [
            { name: "S, C, A, M, P, E, R", desc: "Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse.", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> }
        ],
        guidance: {
            title: "SCAMPER Ideation",
            sections: [
                {
                    text: "Select a node and apply one of the seven operators to generate new ideas.",
                    items: [
                        "**Substitute:** Who or what else could do this? Other materials? Other times?",
                        "**Combine:** Can we blend purposes? Combine units? Combine ideas?",
                        "**Adapt:** What else is like this? What can I copy? Who does this better?",
                        "**Modify:** Change meaning, color, motion, sound, smell, form, shape? Magnify? Minify?",
                        "**Put to another use:** New ways to use as is? Other uses if modified?",
                        "**Eliminate:** What to subtract? Smaller? Condensed? Lower?",
                        "**Reverse:** Transpose positive and negative? Turn it backward? Upside down? Reverse roles?"
                    ]
                }
            ]
        }
    },
    {
        id: 'triz',
        name: "TRIZ",
        color: "text-indigo-400",
        desc: "Inventive Problem Solving.",
        summary: "Created by Genrich Altshuller in 1946, TRIZ was originally conceived and used to solve engineering problems. However, the principles have proved so fundamental that over the years they have been extended to apply to many other domains including business, strategy, software engineering, and science in general. Tapestry Studio includes re-interpretations of the original engineering principles for these other disciplines.",
        icon: <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
        subItems: [
            { name: "Contradiction Matrix", desc: "Solve technical conflicts.", icon: <rect x="4" y="4" width="16" height="16" rx="2" /> },
            { name: "40 Principles", desc: "Apply inventive principles.", icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /> },
            { name: "ARIZ", desc: "Algorithm for Inventive Problem Solving.", icon: <path d="M19 11H5" /> },
            { name: "Su-Field", desc: "Substance-Field Analysis.", icon: <path d="M13 10V3L4 14" /> },
            { name: "Trends", desc: "Evolution Trends.", icon: <path d="M13 7h8m0 0v8" /> }
        ],
        guidance: {
            title: "TRIZ: Theory of Inventive Problem Solving",
            sections: [
                {
                    title: "Core Concept",
                    text: "TRIZ solves problems by identifying and resolving contradictions. A contradiction exists when improving one parameter (e.g., speed) worsens another (e.g., stability). Originally designed for engineering, it is now widely used in business, software, and social systems."
                },
                {
                    title: "Available Tools",
                    items: [
                        "**Contradiction Matrix:** Maps 39 engineering parameters to 40 inventive principles to solve trade-offs.",
                        "**40 Principles:** A collection of abstract solutions (e.g. Segmentation, Asymmetry) that can be applied to nodes. Tapestry Studio provides definitions for Engineering, Business, and Software contexts.",
                        "**Su-Field Analysis:** Models systems as two substances and a field. If a system is incomplete, TRIZ suggests how to complete the triangle.",
                        "**Trends of Evolution:** Predicts how systems mature (e.g., towards micro-levels, towards increased dynamism)."
                    ]
                }
            ]
        }
    },
    {
        id: 'triz-contradiction',
        name: "Contradiction Matrix",
        color: "text-indigo-400",
        desc: "Solve trade-offs.",
        summary: "Specific guidance for the Contradiction Matrix.",
        icon: <rect x="4" y="4" width="16" height="16" rx="2" />,
        guidance: {
            title: "TRIZ: Contradiction Matrix",
            sections: [
                {
                    title: "How to use",
                    text: "Use this tool when you face a trade-off: You want to improve feature A, but doing so makes feature B worse.",
                    items: [
                        "**Improving Feature:** Select the node representing the parameter you want to improve.",
                        "**Worsening Feature:** Select the node representing the parameter that degrades as a result.",
                        "**Result:** The AI maps these to the standard 39 TRIZ parameters and suggests relevant Inventive Principles (from the 40 Principles) to resolve the conflict without compromise."
                    ]
                }
            ]
        }
    },
    {
        id: 'triz-principles',
        name: "40 Principles",
        color: "text-violet-400",
        desc: "Apply inventive patterns.",
        summary: "Specific guidance for the 40 Principles.",
        icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />,
        guidance: {
            title: "TRIZ: 40 Inventive Principles",
            sections: [
                {
                    title: "Direct Application",
                    text: "Apply abstract inventive patterns directly to a node to spark innovation. Tapestry Studio offers re-interpretations of these principles for different domains.",
                    items: [
                        "Select a **Principle** from the dropdown (e.g., Segmentation, Local Quality).",
                        "Select a **Problem Domain** (e.g., Business, Engineering, Software) to see the principle defined in that context.",
                        "Select a **Target Node** to apply the principle to.",
                        "**Result:** The AI suggests how to modify the node or add new nodes to implement the principle using the selected perspective."
                    ]
                }
            ]
        }
    },
    {
        id: 'triz-ariz',
        name: "ARIZ",
        color: "text-pink-400",
        desc: "Complex problem algorithm.",
        summary: "Specific guidance for ARIZ.",
        icon: <path d="M19 11H5" />,
        guidance: {
            title: "TRIZ: ARIZ (Algorithm for Inventive Problem Solving)",
            sections: [
                {
                    title: "Step-by-Step Solving",
                    text: "ARIZ is for complex, ill-defined problems where the contradiction is not immediately obvious.",
                    items: [
                        "**Mini-Problem:** Describe the situation where everything remains the same but the harmful effect disappears.",
                        "**Conflict Zone:** Identify the specific space and time where the conflict occurs.",
                        "**Ideal Final Result (IFR):** The system performs the required function itself without complicating the system.",
                        "**Result:** The AI walks through these steps to suggest graph modifications."
                    ]
                }
            ]
        }
    },
    {
        id: 'triz-sufield',
        name: "Su-Field Analysis",
        color: "text-rose-400",
        desc: "Substance-Field Modeling.",
        summary: "Specific guidance for Su-Field Analysis.",
        icon: <path d="M13 10V3L4 14" />,
        guidance: {
            title: "TRIZ: Su-Field Analysis",
            sections: [
                {
                    title: "Completing the Triangle",
                    text: "Every functioning system can be modeled as two substances (S1, S2) interacting via a Field (F).",
                    items: [
                        "**Incomplete Model:** If one element is missing, the system doesn't work.",
                        "**Harmful Interaction:** If the interaction is bad, introduce a third substance (S3) or modify the field.",
                        "**Input:** Describe the interaction you are modeling.",
                        "**Result:** The AI identifies the missing or harmful elements and suggests 'Injections' (new nodes) to fix the Su-Field model."
                    ]
                }
            ]
        }
    },
    {
        id: 'triz-trends',
        name: "Evolution Trends",
        color: "text-teal-400",
        desc: "Predict system future.",
        summary: "Specific guidance for Evolution Trends.",
        icon: <path d="M13 7h8m0 0v8" />,
        guidance: {
            title: "TRIZ: Trends of Engineering System Evolution",
            sections: [
                {
                    title: "Forecasting",
                    text: "Systems evolve according to objective laws, not random chance.",
                    items: [
                        "**S-Curve Analysis:** Where is the system in its lifecycle? (Infancy -> Growth -> Maturity -> Decline).",
                        "**Transition to Super-System:** The system becomes a part of a larger system.",
                        "**Increasing Dynamization:** Rigid parts become flexible, then field-based.",
                        "**Input:** Select a node representing a system.",
                        "**Result:** The AI predicts the next evolutionary stage and suggests 'Future State' nodes."
                    ]
                }
            ]
        }
    },
    {
        id: 'lss',
        name: "Lean Six Sigma",
        color: "text-blue-400",
        desc: "Process Improvement.",
        summary: "A fusion of Toyota's Lean manufacturing (waste reduction) and Motorola's Six Sigma (defect reduction). Its purpose is to improve process performance and quality systematically. Principles include DMAIC (Define, Measure, Analyze, Improve, Control) and flow optimization. Use this to analyze workflows, supply chains, or service delivery issues modeled in your graph. Tip: Map the 'Current State' before designing the 'Future State'. Compliments: **Theory of Constraints** helps identify *where* to apply LSS improvements for maximum system impact.",
        icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
        subItems: [
            { name: "Project Charter", desc: "Problem, Scope, Goals.", icon: <path d="M9 12h6" /> },
            { name: "SIPOC", desc: "Suppliers, Inputs, Process, Outputs, Customers.", icon: <path d="M8 7h12" /> },
            { name: "VoC", desc: "Voice of Customer analysis.", icon: <path d="M11 5v14" /> },
            { name: "DMAIC", desc: "Define, Measure, Analyze, Improve, Control.", icon: <path d="M4 4v5h.5" /> },
            { name: "5 Whys", desc: "Root Cause Analysis.", icon: <path d="M8 9c.5 0 1" /> },
            { name: "Fishbone", desc: "Ishikawa Diagram.", icon: <path d="M4 12h16" /> }
        ],
        guidance: {
            title: "Lean Six Sigma",
            sections: [
                {
                    title: "DMAIC Framework",
                    items: [
                        "**Define:** What is the problem? Who is the customer?",
                        "**Measure:** What is the baseline performance?",
                        "**Analyze:** What are the root causes of defects or waste?",
                        "**Improve:** How can we fix the root cause?",
                        "**Control:** How do we sustain the gains?"
                    ]
                },
                {
                    title: "Common Tools",
                    items: [
                        "**SIPOC:** High-level process map (Suppliers, Inputs, Process, Outputs, Customers).",
                        "**5 Whys:** Drilling down to root cause by asking 'Why?' five times.",
                        "**Fishbone:** Categorizing causes (Man, Machine, Material, Method, Measurement, Environment)."
                    ]
                }
            ]
        }
    },
    {
        id: 'toc',
        name: "Theory of Constraints",
        color: "text-amber-400",
        desc: "Constraint Management.",
        summary: "Introduced by Eliyahu Goldratt in his 1984 novel 'The Goal'. Its purpose is to identify and manage the single biggest limiting factor (bottleneck) in a system. Principles state that a chain is no stronger than its weakest link. Use this when a system is underperforming despite local improvements. Tip: Focus all attention on the constraint; ignore non-constraints initially. Compliments: **Lean Six Sigma** provides the tools to exploit and elevate the constraint once identified.",
        icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        subItems: [
            { name: "Current Reality Tree", desc: "Identify Core Constraints.", icon: <path d="M12 9v2" /> },
            { name: "Evaporating Cloud", desc: "Resolve Conflicts.", icon: <path d="M3 15a4 4 0 004 4" /> },
            { name: "Future Reality Tree", desc: "Visualize Solutions.", icon: <path d="M13 10V3" /> }
        ],
        guidance: {
            title: "Theory of Constraints (TOC)",
            sections: [
                {
                    text: "TOC posits that every system is limited by at least one constraint (bottleneck). Improving non-constraints does not improve system performance.",
                    items: [
                        "**Current Reality Tree (CRT):** Use logic to trace 'Undesirable Effects' back to a root cause.",
                        "**Evaporating Cloud:** Resolve conflicts by exposing invalid assumptions.",
                        "**Future Reality Tree (FRT):** Map out the 'what if' scenario of a solution injection to ensure it creates desirable effects without negative side effects."
                    ]
                }
            ]
        }
    },
    {
        id: 'ssm',
        name: "Soft Systems",
        color: "text-cyan-400",
        desc: "Complex Problem Solving.",
        summary: "Developed by Peter Checkland in the 1960s at Lancaster University. Its purpose is to tackle 'messy', ill-defined problem situations involving human complexity. Principles focus on holism and understanding diverse worldviews (CATWOE). Use this for organizational change, cultural issues, or stakeholder conflicts. Tip: Use 'Rich Pictures' to capture emotional and political connections, not just logic. Compliments: **Strategy** tools help formalize the soft insights into actionable plans.",
        icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7" />,
        subItems: [
            { name: "Rich Picture", desc: "Explore Relationships & Climate.", icon: <path d="M4 16l4.586-4.586" /> },
            { name: "CATWOE", desc: "Worldview Analysis.", icon: <path d="M3 11H5" /> },
            { name: "Activity Models", desc: "Root Definitions.", icon: <path d="M19 11H5" /> }
        ],
        guidance: {
            title: "Soft Systems Methodology (SSM)",
            sections: [
                {
                    title: "For 'Messy' Problems",
                    text: "Unlike engineering problems, human systems often have no clear definition of the problem itself. SSM helps structure this ambiguity."
                },
                {
                    title: "CATWOE Analysis",
                    items: [
                        "**C**ustomers: Beneficiaries/Victims.",
                        "**A**ctors: Who does the activities?",
                        "**T**ransformation: Input -> Output.",
                        "**W**orldview: What makes this T meaningful?",
                        "**O**wners: Who can stop T?",
                        "**E**nvironment: Constraints outside control."
                    ]
                }
            ]
        }
    },
    {
        id: 'strategy',
        name: "Strategy",
        color: "text-lime-400",
        desc: "Strategic Frameworks.",
        summary: "A collection of classic strategic frameworks (SWOT from the 60s, Porter's Five Forces from 1979). Its purpose is to assess internal and external environments for planning. Principles involve structured categorization of factors to reveal strategic fit. Use this for business planning, market analysis, or competitive positioning. Tip: Be specific; vague strengths lead to vague strategies. Compliments: **Analysis** tools can validate if your perceived 'Strengths' are actually structurally significant in your network.",
        icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
        subItems: [
            { name: "SWOT", desc: "Strengths, Weaknesses, Opportunities, Threats.", icon: <rect x="4" y="4" width="16" height="16" /> },
            { name: "PESTEL", desc: "Macro-environmental factors.", icon: <path d="M3 11H5" /> },
            { name: "Porter's 5 Forces", desc: "Competitive Analysis.", icon: <path d="M9 12l2 2" /> }
        ],
        guidance: {
            title: "Strategic Clarity: Analysis Frameworks",
            sections: [
                {
                    title: "Scanning the Horizon",
                    text: "Use these frameworks to systematically map internal capabilities against external realities.",
                    items: [
                        "**SWOT:** The fundamental balance sheet. internal attributes (Strengths/Weaknesses) vs external conditions (Opportunities/Threats).",
                        "**PESTEL & Variants:** Macro-environmental scanning. Look beyond competitors to Political, Economic, Social, and Tech shifts.",
                        "**Porter's Five Forces:** Industry structure. Assess profitability by looking at Supplier/Buyer power, Substitutes, and Rivalry.",
                        "**CAGE:** Global strategy. Measure Cultural, Administrative, Geographic, and Economic distances between markets."
                    ]
                },
                {
                    title: "AI-Augmented Strategy",
                    text: "The AI acts as a red-teamer and researcher.",
                    items: [
                        "**Blind Spot Detection:** The AI generates factors you might miss due to internal bias.",
                        "**Contextual Generation:** It reads your graph to tailor generic factors (e.g., 'Inflation') to your specific nodes (e.g., 'Rising costs of raw materials for Node X').",
                        "**Custom Strategies:** Define your own frameworks in the 'Custom' tab to guide the AI with bespoke logic."
                    ]
                }
            ]
        }
    },
    {
        id: 'explorer',
        name: "Explorer",
        color: "text-yellow-400",
        desc: "Visual Graph Analysis.",
        summary: "A visualization suite based on hierarchical data techniques like Treemaps (Shneiderman, 1990s). Its purpose is to provide macro-views of graph data that node-link diagrams cannot. Principles involve area-based visualization and radial trees. Use this to understand the distribution of tags or density of relationships. Tip: Use Treemaps to quickly see which topics dominate your knowledge base. Compliments: **Word Cloud** provides a text-content perspective to match this structural perspective.",
        icon: <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
        subItems: [
            { name: "Treemap", desc: "Hierarchical view of structure.", icon: <path d="M4 6h16" /> },
            { name: "Sunburst", desc: "Radial view of relationships.", icon: <path d="M12 3v1" /> },
            { name: "Tag Distribution", desc: "Tag frequency.", icon: <path d="M7 7h.01" /> }
        ],
        guidance: {
            title: "Exploring Structure",
            sections: [
                {
                    title: "Alternative Views",
                    text: "Node-link diagrams are great for paths, but poor for density. Use these tools to see the 'weight' of your model.",
                    items: [
                        "**Treemaps:** Good for spotting dominant tags or highly connected nodes at a glance.",
                        "**Sunburst:** Good for walking through the graph layer by layer from a central point."
                    ]
                }
            ]
        }
    },
    {
        id: 'wordcloud',
        name: "Word Cloud",
        color: "text-pink-400",
        desc: "Text Analysis.",
        summary: "A text mining visualization technique popularised in the web 2.0 era. Its purpose is to reveal the prominence of terms within your graph's textual content. Principles involve frequency-based sizing. Use this to perform a quick content audit or sentiment check of your notes. Tip: Use 'Full Text' mode to find themes buried in descriptions. Compliments: **Explorer** (Tag Distribution) handles explicit categorization, while this handles implicit content.",
        icon: <path d="M7 7h.01M7 3h5" />,
        subItems: [
            { name: "Tag Cloud", desc: "Tag frequency cloud.", icon: <path d="M7 7h.01" /> },
            { name: "Relationship Cloud", desc: "Connectivity cloud.", icon: <path d="M13 10l-4 4" /> },
            { name: "Full Text", desc: "Analyze content text.", icon: <path d="M19 20H5" /> }
        ],
        guidance: {
            title: "Beyond Frequency: Word Clouds as Creative Triggers",
            sections: [
                {
                    title: "Visualising Your Model",
                    items: [
                        "**Tag Cloud:** High-level categorisation. What themes dominate your taxonomy?",
                        "**Relationship Cloud:** Structural connectivity. Which nodes are the busiest hubs?",
                        "**Node Name Analysis:** Conceptual vocabulary. How are you naming your entities?",
                        "**Full Text Analysis:** Deep content context. What words appear most in your descriptions and notes?"
                    ]
                },
                {
                    title: "Lateral Thinking with AI View Modes",
                    text: "Words are often coloured by mood, situation, or bias. Use the AI Transformation modes to shift your perspective and break cognitive deadlock:",
                    items: [
                        "**Antonyms:** Invert the problem. If the cloud shows 'Chaos', the antonym 'Order' might define your goal state.",
                        "**Synonyms:** Explore nuance. Are there subtler, more precise words to describe the situation?",
                        "**Exaggerated:** Amplify the signal. See where things are heading if current trends continue unchecked.",
                        "**Understated:** Ground reality. Counteract over-optimism or panic to see the bare facts.",
                        "**Hypernyms:** Zoom Out. Move to abstract categories to see the 'Big Picture' (e.g., 'Car' → 'Vehicle').",
                        "**Hyponyms:** Zoom In. Get specific to find concrete examples and edge cases (e.g., 'Vehicle' → 'Truck').",
                        "**Related:** Lateral Hop. Find adjacent concepts to widen the scope of investigation.",
                        "**Metaphors:** Shift Paradigm. Break out of the domain by comparing your system to biology, mechanics, or art.",
                        "**Simplified:** Check Communication. Can technical jargon be explained in plain English?",
                        "**Formalised:** Increase Gravitas. Highlight the seriousness or professional weight of the topic."
                    ]
                }
            ]
        }
    },
    {
        id: 'diagrams',
        name: "Diagrams",
        color: "text-cyan-400",
        desc: "Mermaid.js Editor.",
        summary: "Uses Mermaid.js, a syntax-based diagramming tool inspired by Markdown. Its purpose is to generate formal, documentation-ready diagrams (UML, Flowcharts) from your graph data. Principles involve code-as-infrastructure and separating content from formatting. Use this when you need to export your model for formal reports or presentations. Tip: Use the AI command bar to style the diagram code. Compliments: **Layout** provides the flexible, exploratory view, while this provides the rigid, presentation view.",
        icon: <path d="M7 12l3-3 3 3 4-4" />,
        subItems: [
            { name: "Editor", desc: "Text-to-diagram editor supporting Flowcharts, Sequence, etc.", icon: <path d="M4 5h14" /> }
        ],
        guidance: {
            title: "Diagram Generation",
            sections: [
                {
                    title: "Mermaid.js Integration",
                    text: "You can convert your casual knowledge graph into formal diagrams (Flowcharts, Gantt, Sequence, Class Diagrams) using the Mermaid syntax."
                },
                {
                    title: "AI Styling",
                    text: "Use the AI Command bar in the diagram panel to say things like 'Make all red nodes circles' or 'Group by tag'."
                }
            ]
        }
    },
    {
        id: 'bulk',
        name: "Bulk Edit",
        color: "text-pink-400",
        desc: "Mass Tagging.",
        summary: "A productivity tool designed for batch operations. Its purpose is to speed up the taxonomy management of large graphs. Principles involve selection-based application. Use this when you import raw data and need to categorize it quickly. Tip: Use in conjunction with 'Filter' to tag specific subsets of nodes. Compliments: **Schema** defines the tags you apply here.",
        icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
        subItems: [
            { name: "Add/Remove Tags", desc: "Apply tags to nodes by clicking them.", icon: <path d="M7 7h.01" /> }
        ],
        guidance: {
            title: "Batch Operations",
            sections: [
                {
                    text: "Set a list of tags to Add and/or Remove. Activate the tool, then click nodes on the canvas. The changes are applied immediately to clicked nodes.",
                    items: ["Useful for quickly categorizing imported data.", "Combine with Filters to find and tag groups of nodes."]
                }
            ]
        }
    },
    {
        id: 'command',
        name: "Command",
        color: "text-green-400",
        desc: "Quick Entry.",
        summary: "Inspired by command-line interfaces (CLI) and text-based adventure parsers. Its purpose is high-speed data entry without leaving the keyboard. Principles involve shorthand syntax (A->B). Use this for rapid brainstorming or taking meeting minutes directly into the graph. Tip: You can paste multiline text to create complex structures instantly. Compliments: **Markdown** offers a full-document editing experience for similar syntax.",
        icon: <path d="M8 9l3 3-3 3m5 0h3" />,
        subItems: [
            { name: "Quick Add", desc: "Add nodes/links via text: A -> B.", icon: <path d="M5 20h14" /> }
        ],
        guidance: {
            title: "Command Syntax",
            sections: [
                {
                    title: "Quick Entry",
                    items: [
                        "`A -> B` creates a directed link.",
                        "`A -- B` creates a link with no direction.",
                        "`A -[label]-> B` adds a label.",
                        "`A:tag1,tag2` adds tags.",
                        "`A -> B; C -> D` handles multiple operations."
                    ]
                }
            ]
        }
    },
    {
        id: 'random_walk',
        name: "Random Walk",
        color: "text-rose-400",
        desc: "Explore connectivity.",
        summary: "Automated traversal of the graph to discover serendipitous connections.",
        icon: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
            </>
        ),
        guidance: {
            title: "Random Walk: The Value of Wandering",
            sections: [
                {
                    title: "Emergent Patterns",
                    text: "Patterns in complex situations often emerge only after reflection and exploring how concepts connect. Many people focus on the areas they already know, which can create blind spots and missed opportunities."
                },
                {
                    title: "Breaking Thought Loops",
                    text: "Random walks help break familiar thought loops, revealing fresh insights, hidden relationships, and a broader understanding of the context. This wider perspective is often what’s needed to tackle wicked problems effectively."
                }
            ]
        }
    }
];
