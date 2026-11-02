import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  GitFork,
  TrendingUp,
  Zap,
  Crown,
  Settings,
  Command,
  Lock,
  ChevronRight,
  ChevronDown,
  Info,
  Lightbulb,
  ExternalLink,
  Search,
  ArrowRight
} from 'lucide-react';
import { User } from '../types';

interface SuperAdminManualPageProps {
  currentUser: User;
  onNavigateToView?: (view: 'pipeline' | 'sla' | 'multiplier' | 'archive' | 'dashboard' | 'admin' | 'topology') => void;
}

interface ManualSection {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  fiveYearOldSummary: string;
  realWorldAnalogy: string;
  visualWalkthrough: Array<{
    target: string;
    description: string;
    howToUse: string;
  }>;
  stepByStepAction: string[];
  secretAdminProTips: string[];
}

const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'loading-screen',
    badge: 'STAGE 00',
    title: 'The Boot Loader & Engine Igniter',
    subtitle: 'High-speed kernel initialization, security checks & asset hydration',
    icon: Zap,
    image: '/manual-assets/01_loading_screen.png',
    fiveYearOldSummary: 'Imagine waking up in the morning and turning on your favorite video game console. Before the game starts, a friendly robot checks that all your toys and power cords are plugged in so everything runs super fast without crashing!',
    realWorldAnalogy: 'Like an airplane pilot running the pre-flight safety checklist and starting the jet engines before passengers get to take off.',
    visualWalkthrough: [
      {
        target: 'Pulsing Thrill Emerald Sphere',
        description: 'The green glowing power gem in the center.',
        howToUse: 'Tells you the backend database and Supabase secure auth sockets are waking up. It pulses to let you know the system is alive.'
      },
      {
        target: 'Dynamic Initialization Terminal',
        description: 'The real-time status text below the logo.',
        howToUse: 'Watches database connections, SLA clock workers, and cached creative cards load cleanly in under 1.2 seconds.'
      },
      {
        target: 'Clean Minimalist Stage',
        description: 'Distraction-free black canvas (#0B0E14).',
        howToUse: 'Zero clutter! As soon as checks turn green, it automatically reveals your live dashboard.'
      }
    ],
    stepByStepAction: [
      'Open the application in any modern web browser.',
      'Watch the green power ring complete its circular self-test.',
      'If you have already signed in previously, it skips right past into your Kanban pipeline in 1 second.'
    ],
    secretAdminProTips: [
      'You can instantly test or skip the boot screen at any time by adding ?skipLoading=true to your URL.',
      'If you want to demo the sleek boot animation to your executive team, add ?demo=true to experience the full visual sequence.'
    ]
  },
  {
    id: 'auth-page',
    badge: 'SECURITY & ACCESS',
    title: 'The VIP Entrance (Supabase Magic Link & Passkeys)',
    subtitle: 'Passwordless authentication gate protecting your creative kingdom',
    icon: Lock,
    image: '/manual-assets/02_auth_page.png',
    fiveYearOldSummary: 'This is the magic front door of the clubhouse! Instead of remembering a giant, hard password that you might lose, the clubhouse sends a secret golden invitation letter straight to your email. You click it, and poof—the door opens just for you!',
    realWorldAnalogy: 'Like arriving at a VIP concert where your name is already on the golden guest list—no secret passwords needed, just show your golden pass.',
    visualWalkthrough: [
      {
        target: 'Email Input Box',
        description: 'The sleek input field where your team types their work email address.',
        howToUse: 'Type your official work email (like previewsites40@gmail.com). No password box is shown because passwords can be guessed or stolen!'
      },
      {
        target: 'Send Magic Link Button',
        description: 'The glowing green button with the spark icon.',
        howToUse: 'Click this to dispatch a cryptographically secure one-time login link to your inbox that expires in 15 minutes.'
      },
      {
        target: 'Direct Enterprise OAuth (Google / Single Sign-On)',
        description: 'Instant 1-click authentication button.',
        howToUse: 'If your organization uses Google Workspace, click to log in with 1 tap through official enterprise SSO.'
      }
    ],
    stepByStepAction: [
      'Type your verified email address into the box.',
      'Click "Send Magic Link".',
      'Open your inbox, tap the link from Thrill ContentOps, and you will be immediately logged in with your exact assigned role (Super Admin, Content Manager, or Specialist).'
    ],
    secretAdminProTips: [
      'As Super Admin (previewsites40@gmail.com), your email is hardcoded with highest-tier executive authorization.',
      'When you invite team members from the Super Admin page, they will receive this magic link automatically.'
    ]
  },
  {
    id: 'kanban-board',
    badge: 'CORE ENGINE',
    title: 'The Production Conveyor Belt (Kanban Pipeline)',
    subtitle: 'The 6-stage assembly line moving raw ideas into viral published assets',
    icon: Layers,
    image: '/manual-assets/03_kanban_board.png',
    fiveYearOldSummary: 'Picture a super fun toy factory with 6 conveyor belts side by side! Ideas start on the far left as rough sketches. Toy makers build them, inspectors check them with magnifying glasses, and when they are 100% perfect, they get wrapped in pretty boxes and launched to the world on the far right!',
    realWorldAnalogy: 'Like a gourmet restaurant kitchen: 1. Taking the customer order -> 2. Chef prepping ingredients -> 3. Cooking on the grill -> 4. Head chef inspecting the dish -> 5. Plating on golden trays -> 6. Serving to happy guests.',
    visualWalkthrough: [
      {
        target: 'Column 1: DRAFTING (Stage 1)',
        description: 'Where raw ideas and creative hooks are born.',
        howToUse: 'Specialists fill in the title, hook formula, visual concept, and target audience.'
      },
      {
        target: 'Column 2: SLA_REVIEW (Stage 2 - Hot Potato!)',
        description: 'The speed-test countdown zone.',
        howToUse: 'Content Managers have exactly 4 hours to review the concept. A clock ticks down—if it reaches zero, it sounds an alarm!'
      },
      {
        target: 'Column 3: IN_PRODUCTION (Stage 3)',
        description: 'The creative workshop.',
        howToUse: 'Animators, video editors, and copywriters record videos, design assets, and upload working drive links.'
      },
      {
        target: 'Column 4: QA_GATE (Stage 4 - The Strict Gatekeeper)',
        description: 'The strict checkpoint with 4 locks.',
        howToUse: 'Every asset must pass 4 tests: Brand Voice, Visual Polish, Audio Cleanness, and Compliance. No exceptions!'
      },
      {
        target: 'Column 5: READY_TO_PUBLISH (Stage 5)',
        description: 'The launch hangar.',
        howToUse: 'Approved assets waiting for the optimal posting window across TikTok, YouTube, Instagram, or LinkedIn.'
      },
      {
        target: 'Column 6: PUBLISHED (Stage 6)',
        description: 'The victory vault!',
        howToUse: 'Content that is live in the wild generating views, engagement, and revenue.'
      }
    ],
    stepByStepAction: [
      'Click the "+ New Asset Brief" button at the top right to start a card.',
      'Drag and drop cards across columns to advance them through the factory stages.',
      'If you try to move a card without proper authorization, the RACI Gatekeeper will politely stop you and explain why!'
    ],
    secretAdminProTips: [
      'Press "Cmd + K" or "/" on your keyboard to instantly filter cards by name.',
      'Click the "SLA Risk" filter at the top to only see cards with less than 60 minutes remaining on their timer.'
    ]
  },
  {
    id: 'kanban-card',
    badge: 'ATOMIC UNIT',
    title: 'The Magic Information Card (Content Asset)',
    subtitle: 'Every hook, creator, deadline, and tier badge packaged into a single smart token',
    icon: Sparkles,
    image: '/manual-assets/04_kanban_card.png',
    fiveYearOldSummary: 'This card is like a Pokémon trading card or a golden ticket for every single video or post! It shows who is making it, how cool it is (Hero, Hub, or Hygiene), what type of story it tells, and how much time is left before it is due!',
    realWorldAnalogy: 'Like a hospital patient chart or a custom car build sheet clipped to the windshield as it moves down the manufacturing line.',
    visualWalkthrough: [
      {
        target: 'Format Tier Badge (HERO / HUB / HYGIENE)',
        description: 'Gold crown for HERO (giant campaigns), Emerald shield for HUB (weekly episodic series), Slate tag for HYGIENE (daily quick posts).',
        howToUse: 'Immediately signals how much production budget and priority this piece of content gets.'
      },
      {
        target: 'Pillar Tag (ENTERTAINMENT / EDUCATION / PRODUCT / COMMUNITY)',
        description: 'Color-coded topic tag.',
        howToUse: 'Keeps our content balanced so we never bore our audience with too much sales talk or too much fluff.'
      },
      {
        target: 'SLA Countdown Ring & Badge',
        description: 'Visual timer showing remaining turnaround hours.',
        howToUse: 'Green = plenty of time (>2 hours). Amber = hurry up (<2 hours). Red pulsing = breached/overdue!'
      },
      {
        target: 'Creator Avatar & Assignee Pill',
        description: 'Face of the specialist responsible for the deliverable.',
        howToUse: 'Shows exactly who is currently working on it so nobody has to guess who to ask for an update.'
      }
    ],
    stepByStepAction: [
      'Click anywhere on a card to open its full Creative Studio & Inspection Panel.',
      'Hover over the SLA clock to see the exact minute deadline.',
      'Click the multiplier icon on any HERO card to break it down into 5 bite-sized child assets.'
    ],
    secretAdminProTips: [
      'Super Admins can reassign any card to any user simply by opening the card detail and selecting a new owner from the dropdown.'
    ]
  },
  {
    id: 'new-brief-modal',
    badge: 'CREATIVE SPARK',
    title: 'The Blueprint Creator (New Creative Brief Modal)',
    subtitle: 'Standardized intake form ensuring every asset has a winning hook and clear strategy',
    icon: Lightbulb,
    image: '/manual-assets/05_new_brief_modal.png',
    fiveYearOldSummary: 'When you want to build a super awesome LEGO spaceship, you do not just start throwing bricks around! First, you draw what it should look like, pick your favorite colors, and decide what special missions it will do. This form is where you plan your spaceship before building it!',
    realWorldAnalogy: 'Like an architect blueprint before builders pour concrete: title, dimensions, materials, and who gets the keys.',
    visualWalkthrough: [
      {
        target: 'Asset Title Input',
        description: 'The name of your video or article.',
        howToUse: 'Give it an energetic, memorable title like "How We Scaled Our Cloud Engine to 10M Users".'
      },
      {
        target: 'Format Tier Picker (Hero, Hub, Hygiene)',
        description: 'Three visual toggle cards.',
        howToUse: 'Choose Hero for flagship quarterly launches, Hub for weekly series, or Hygiene for daily tactical posts.'
      },
      {
        target: 'Strategic Pillar Selector',
        description: 'Selects the primary goal of the content.',
        howToUse: 'Pick Entertainment (viral humor/skits), Education (in-depth how-to), Product (feature highlights), or Culture (behind-the-scenes).'
      },
      {
        target: 'The Hook Formulation Formula',
        description: 'The first 3 seconds that stop people from scrolling.',
        howToUse: 'Draft the shocking visual or curiosity statement that captures attention before viewers swipe away!'
      }
    ],
    stepByStepAction: [
      'Click the "+ New Asset Brief" button in the top navigation bar or press "N" on your keyboard.',
      'Fill in the title, pick the format tier and strategic pillar.',
      'Assign a specialist creator and click "Create Asset Brief".',
      'The card will instantly appear on the "Drafting" column of your Kanban board!'
    ],
    secretAdminProTips: [
      'You can ask the built-in Thrill Copilot AI (sparkles in bottom right) to "Draft a brief for a YouTube video about our new security features" and it will pre-fill this entire modal for you!'
    ]
  },
  {
    id: 'qa-inspector-modal',
    badge: 'QUALITY GATE',
    title: 'The 4-Point Airport Security Gate (QA Inspector Studio)',
    subtitle: 'Military-grade quality veto checkpoints before any asset is allowed near public eyes',
    icon: ShieldCheck,
    image: '/manual-assets/06_qa_inspector_modal.png',
    fiveYearOldSummary: 'Think of this like passing through airport security before getting on a giant rocket ship! The security guard checks your passport, your tickets, your backpack, and makes sure you do not have any melted chocolate in your pockets. If all 4 stamps are approved, you get to fly!',
    realWorldAnalogy: 'Like a car manufacturer crash-test and safety inspection: Brakes, Airbags, Seatbelts, and Emissions must ALL pass before the car leaves the factory.',
    visualWalkthrough: [
      {
        target: 'Check 1: Brand Voice & Messaging Fidelity',
        description: 'Verifies tone, correct logos, and Thrill brand colors.',
        howToUse: 'Toggle to ON if the messaging matches our company guidelines.'
      },
      {
        target: 'Check 2: Visual Quality & Audio Mastering',
        description: 'Ensures crystal-clear 4K/1080p video and normalized -14 LUFS sound.',
        howToUse: 'Verify that there is no background hiss, no blurry text, and smooth motion cuts.'
      },
      {
        target: 'Check 3: Regulatory & Compliance Verification',
        description: 'Legal terms, disclosure disclaimers, and music licensing rights.',
        howToUse: 'Confirms that all background music and images are 100% royalty-free and legally safe.'
      },
      {
        target: 'Check 4: Platform Aspect Ratio & Formatting Specs',
        description: 'Verifies 9:16 vertical reels or 16:9 widescreen YouTube layout.',
        howToUse: 'Ensures buttons and text are not cut off by TikTok or Instagram overlays.'
      },
      {
        target: 'The Gatekeeper Sign-off Button',
        description: 'The master golden authorization key.',
        howToUse: 'Only lights up green once all 4 checkboxes above are marked as passed!'
      }
    ],
    stepByStepAction: [
      'When an asset moves into "QA_GATE", click the card to open this inspector.',
      'Review the attached deliverable preview.',
      'Click each of the 4 verification toggles after inspecting the deliverable.',
      'Click "Authorize & Move to Ready to Publish".'
    ],
    secretAdminProTips: [
      'Only users with the role of CONTENT_MANAGER or SUPER_ADMIN have the legal power to stamp and sign this gate. Specialists cannot sign their own work (RACI Separation of Duties).'
    ]
  },
  {
    id: 'asset-multiplier-modal',
    badge: 'REPURPOSING ENGINE',
    title: 'The 1-to-5 Asset Multiplier (Content Atomizer)',
    subtitle: 'Turn 1 massive flagship Hero video into 5 high-converting child assets in 1 click',
    icon: GitFork,
    image: '/manual-assets/07_asset_multiplier_modal.png',
    fiveYearOldSummary: 'Imagine you have one giant watermelon. If you try to eat the whole watermelon at once, you will get messy! But if your mom slices it up into 5 yummy popsicles, smoothie cups, and fruit bowls, everyone at the party gets a treat! The Asset Multiplier does that with your videos!',
    realWorldAnalogy: 'Like butchering 1 prized Wagyu cut into steaks, burgers, sliders, skewers, and bone broth—maximizing every single gram of value.',
    visualWalkthrough: [
      {
        target: 'Parent Hero Asset Card',
        description: 'The master original long-form video or keynote presentation.',
        howToUse: 'Displays the source content that will be broken down into derivative formats.'
      },
      {
        target: 'Child Asset 1: Viral Short-Form Cutdown (9:16)',
        description: '60-second highlight clip for TikTok and YouTube Shorts.',
        howToUse: 'Extracts the most explosive 60-second insight from the main video.'
      },
      {
        target: 'Child Asset 2: LinkedIn Executive Carousel',
        description: '10-slide visual slide deck breaking down the core framework.',
        howToUse: 'Reaches professionals who prefer reading bite-sized charts over watching video.'
      },
      {
        target: 'Child Asset 3: Newsletter Deep-Dive Breakdown',
        description: 'Editorial article sent to your email subscriber list.',
        howToUse: 'Provides full written transcripts and action steps.'
      },
      {
        target: 'Child Asset 4: X / Twitter Mega-Thread',
        description: '8-tweet hook-and-lesson sequence.',
        howToUse: 'Drives viral social shares and discussion.'
      },
      {
        target: 'Child Asset 5: Community Discussion Prompt',
        description: 'Discord/Telegram engagement spark.',
        howToUse: 'Asks an intriguing question based on the video to start conversations.'
      }
    ],
    stepByStepAction: [
      'Locate any HERO card in your pipeline and click the fork icon in its upper corner.',
      'Review the 5 proposed child asset briefs generated by the system.',
      'Click "Generate & Spawn All 5 Child Assets".',
      'Watch 5 new connected cards automatically drop into your Drafting queue linked to the parent!'
    ],
    secretAdminProTips: [
      'Child assets keep an invisible link to their parent Hero card. When the parent publishes, child assets automatically receive high-velocity syndication tags.'
    ]
  },
  {
    id: 'asset-detail-studio',
    badge: 'STUDIO DEEP DIVE',
    title: 'The Creative Asset Detail Studio',
    subtitle: 'Complete deliverable dossier: links, revisions, history logs, and RACI ownership',
    icon: BookOpen,
    image: '/manual-assets/08_asset_detail_studio.png',
    fiveYearOldSummary: 'This is like opening the diary or backpack of a single toy! Inside, you can see every note the creators wrote, who drew the pictures, which websites they stored their video files on, and a history book showing every step the toy took since day one!',
    realWorldAnalogy: 'Like an official case file in a detective agency, containing evidence photos, witness statements, timestamps, and investigator signatures.',
    visualWalkthrough: [
      {
        target: 'Deliverable Production URL Input',
        description: 'Google Drive, Figma, Frame.io, or Loom preview link.',
        howToUse: 'Specialists paste their finished render link here so reviewers can watch the video with 1 click.'
      },
      {
        target: 'RACI Assignment Matrix',
        description: 'Responsible (Creator), Accountable (Manager), Consulted (Stakeholder), Informed (Lead).',
        howToUse: 'Displays exactly who does the work and who has final veto power.'
      },
      {
        target: 'Revision & Feedback History',
        description: 'Full chronological change record.',
        howToUse: 'If a manager requests changes, their specific notes are saved here permanently so feedback is never lost in chat apps.'
      },
      {
        target: 'SLA History & Timeline Tracking',
        description: 'Exact minutes spent in each stage of production.',
        howToUse: 'Highlights bottlenecks so you can see where projects slow down.'
      }
    ],
    stepByStepAction: [
      'Click on any non-QA card on the Kanban board to open the detail studio.',
      'Update links, revise the hook formula, or view the audit timeline.',
      'Click "Save Changes" to sync the state instantly across the entire company.'
    ],
    secretAdminProTips: [
      'You can directly transition an asset from here to the next stage using the "Advance Stage" button in the modal footer.'
    ]
  },
  {
    id: 'guard-block-modal',
    badge: 'RACI GOVERNANCE',
    title: 'The RACI Security Guard (Veto Block Shield)',
    subtitle: 'Automated policy enforcement preventing unauthorized stage skips or rogue approvals',
    icon: Lock,
    image: '/manual-assets/09_guard_block_modal.png',
    fiveYearOldSummary: 'Imagine you are at an amusement park and try to sneak onto the giant rollercoaster before being tall enough! The friendly park ranger waves his hands and says: "Hold on little buddy! You need your safety helmet and your parent with you before this ride starts!" That keeps everyone safe!',
    realWorldAnalogy: 'Like trying to board an international flight without passing through border passport control—the gate turns red and sounds a pleasant chime until proper credentials are presented.',
    visualWalkthrough: [
      {
        target: 'Glowing Red Shield Alert Icon',
        description: 'Visual indicator of an active policy enforcement event.',
        howToUse: 'Informs the user that the requested state transition was halted by server-side business rules.'
      },
      {
        target: 'Specific Rule Violation Explanation',
        description: 'Crystal-clear text stating why the action was blocked.',
        howToUse: 'Examples: "Stage 4 (QA_GATE) cannot transition to READY_TO_PUBLISH without complete 4-point verification check sign-off" or "Only Content Managers can approve SLA briefs".'
      },
      {
        target: 'Required Role & Next Steps Guidance',
        description: 'Actionable instructions on how to legitimately resolve the block.',
        howToUse: 'Tells the specialist who to ping on the team to get the required sign-off.'
      }
    ],
    stepByStepAction: [
      'When an unauthorized drag-or-drop or illegal button press occurs, this modal appears automatically.',
      'Read the explanation text to understand which rule was violated.',
      'Click "Acknowledge & Return" to restore the card to its valid position.'
    ],
    secretAdminProTips: [
      'Super Admins have master override permissions in the system, but normal specialists will ALWAYS be constrained by these security guardrails.'
    ]
  },
  {
    id: 'velocity-dashboard',
    badge: 'METRICS & SPEED',
    title: 'The Speedometer & Mission Control (Velocity & SLA Dashboard)',
    subtitle: '30-day analytics tracking production throughput, turnaround velocity, and pillar balance',
    icon: TrendingUp,
    image: '/manual-assets/10_velocity_dashboard.png',
    fiveYearOldSummary: 'Think of this like the dashboard inside a race car! It has dials that show how fast the car is zooming, how much gas is in the tank, and a scoreboard showing how many golden trophies your team has won this month!',
    realWorldAnalogy: 'Like the cockpit display on a commercial airliner: altitude, airspeed, fuel burn rate, and navigation compass all visible on one screen.',
    visualWalkthrough: [
      {
        target: 'Active Production Volume Metric',
        description: 'Total active cards currently moving through the 6 stages.',
        howToUse: 'Shows how busy the creative pipeline is right now.'
      },
      {
        target: 'Average SLA Turnaround Time Card',
        description: 'The average hours it takes to move an asset from concept to approved.',
        howToUse: 'Target is under 4.0 hours for SLA briefs and under 24 hours for full production.'
      },
      {
        target: 'On-Time SLA Reliability Percentage (94%+)',
        description: 'The percentage of assets delivered before their timer expired.',
        howToUse: 'Green = healthy team. Red = team is overloaded with too much work.'
      },
      {
        target: 'Pillar Distribution Radar / Bar Chart',
        description: 'Visual breakdown across Entertainment, Education, Product, and Community.',
        howToUse: 'Ensures we do not over-index on one topic and neglect other audience segments.'
      }
    ],
    stepByStepAction: [
      'Click "Velocity & SLA Dashboard" in the left sidebar menu.',
      'Switch between 7-day, 14-day, and 30-day time horizons.',
      'Export key metrics to share in executive leadership meetings.'
    ],
    secretAdminProTips: [
      'Click any metric card to instantly filter the main Kanban pipeline to only the assets contributing to that metric.'
    ]
  },
  {
    id: 'topology-pipeline-flow',
    badge: 'SYSTEM TOPOLOGY',
    title: 'The Live Energy Map (Interactive System Topology Engine)',
    subtitle: 'Real-time animated circuit diagram showing data pulses, active workloads, and network flows',
    icon: Zap,
    image: '/manual-assets/11_topology_pipeline_flow.png',
    fiveYearOldSummary: 'This is like looking at a glowing ant farm or a futuristic circuit board from outer space! You can see little glowing particles of light running through electric pipes, showing exactly where all your team members are working at this very second!',
    realWorldAnalogy: 'Like the master electrical control room of a bustling city: you can see power flowing through substations and see where any fuse is about to blow.',
    visualWalkthrough: [
      {
        target: 'Animated Particle Cables',
        description: 'Glowing green, gold, and red light pulses traveling between stages.',
        howToUse: 'Pulses move faster when production velocity increases and turn amber when an asset is nearing its SLA limit.'
      },
      {
        target: 'The 4 Architectural Lenses (Sub-nav pills)',
        description: 'Toggle between Pipeline Flow, Hub & Spoke Network, RACI Matrix, and Pillar Allocation.',
        howToUse: 'Click each tab to view the organization through four completely different operational viewpoints!'
      },
      {
        target: 'Node Inspect Drawer',
        description: 'Click any node to see its live cards and health score.',
        howToUse: 'Reveals which operators are assigned to that stage and what blockers exist.'
      }
    ],
    stepByStepAction: [
      'Click "Live System Topology" in the sidebar or top header toggle [⚡ Live Topology Engine].',
      'Use your mouse to hover over nodes to highlight active connection pathways.',
      'Click on any stage box to reveal the active assets currently inside that stage.'
    ],
    secretAdminProTips: [
      'Use this screen during board presentations or all-hands company meetings—executives love watching the real-time particle flows represent live business throughput!'
    ]
  },
  {
    id: 'super-admin-hub',
    badge: 'COMMAND CENTER',
    title: 'The Captain’s Chair (Super Admin User & Invite Hub)',
    subtitle: 'Centralized operator provisioning, magic link invitation dispatch, and role governance',
    icon: Crown,
    image: '/manual-assets/12_super_admin_hub.png',
    fiveYearOldSummary: 'This is the Captain’s room on a giant pirate ship! Only the Captain has the golden key to this room. Here, the Captain gives new sailors their jobs—who steers the ship wheel, who cooks the delicious food, and who climbs the tall mast to look for treasure!',
    realWorldAnalogy: 'Like the master HR and IT administration portal at Apple or Google: create accounts, assign security clearances, and revoke access with 1 tap.',
    visualWalkthrough: [
      {
        target: 'Invite New Operator Form',
        description: 'Type an email and pick their security clearance role.',
        howToUse: 'Input their email (e.g. colleague@company.com), select their role (Content Manager, Specialist, etc.), and click "Send Magic Link Invite".'
      },
      {
        target: 'Live Operators Table',
        description: 'Displays every team member, their assigned role, and status.',
        howToUse: 'Easily change a user’s role on the fly with the dropdown or remove access using the red trash button.'
      },
      {
        target: 'Role Hierarchy Reference Cards',
        description: 'Reference cards explaining what each role can and cannot do.',
        howToUse: 'Quick guide reminding you of the exact legal and operational boundaries for each tier.'
      }
    ],
    stepByStepAction: [
      'Navigate to "Super Admin & Team" in the sidebar.',
      'Enter the new team member’s email address.',
      'Select their role from the dropdown.',
      'Click "Send Magic Link Invite" — Supabase sends them an instant login email.',
      'They appear immediately in the team roster below!'
    ],
    secretAdminProTips: [
      'Only accounts with SUPER_ADMIN clearance can view this page. If any other role attempts to visit, they are redirected with a security warning.',
      'The primary administrator account is previewsites40@gmail.com.'
    ]
  },
  {
    id: 'settings-modal',
    badge: 'ENGINE TUNING',
    title: 'The Engine Tuner (Settings & AI Brain Configuration)',
    subtitle: 'Customize SLA turnaround threshold limits, Gemini API keys, and notification triggers',
    icon: Settings,
    image: '/manual-assets/13_settings_modal.png',
    fiveYearOldSummary: 'Imagine you have a magic robot puppy. In this room, you can teach the puppy new tricks! You can tell it how fast it should run, what language it should speak, and how loud it should bark when someone knocks on the front door!',
    realWorldAnalogy: 'Like the settings preferences in an iPhone: WiFi, FaceID, notification sounds, and Siri intelligence settings all arranged neatly.',
    visualWalkthrough: [
      {
        target: 'SLA Duration Sliders',
        description: 'Configures default review timers (e.g. 4 hours vs 2 hours).',
        howToUse: 'Set custom deadlines according to your company’s production cadence.'
      },
      {
        target: 'Gemini AI API Configuration',
        description: 'Powers the built-in Thrill Copilot assistant.',
        howToUse: 'Connect your enterprise Google AI Studio key to activate instant brief writing and QA analysis.'
      },
      {
        target: 'Sound & Alert Toggles',
        description: 'Enable audio chimes for stage advances or SLA breach warnings.',
        howToUse: 'Keep operators alert when high-priority tasks enter their queue.'
      }
    ],
    stepByStepAction: [
      'Click the gear icon in the top right corner of the dashboard.',
      'Adjust your preferred timers and AI automation preferences.',
      'Click "Save Settings" to apply changes immediately.'
    ],
    secretAdminProTips: [
      'Setting SLA review time to 2.0 hours triggers tighter countdown badges, great for fast-paced breaking news content teams.'
    ]
  },
  {
    id: 'keyboard-shortcuts-modal',
    badge: 'SUPER SPEED',
    title: 'The Secret Ninja Cheat Codes (Keyboard Shortcuts)',
    subtitle: 'Blazing fast single-key commands allowing power operators to fly through the dashboard',
    icon: Command,
    image: '/manual-assets/14_keyboard_shortcuts_modal.png',
    fiveYearOldSummary: 'These are like secret secret video game cheat codes! Instead of clicking five buttons with your mouse, you can just tap one magic key on your keyboard and ZOOP—a new toy pops up or your screen zooms straight to the map!',
    realWorldAnalogy: 'Like a concert pianist playing chords smoothly without having to stop and stare at individual sheet music notes.',
    visualWalkthrough: [
      {
        target: 'Key "N" (New Brief)',
        description: 'Instantly opens the New Creative Brief modal.',
        howToUse: 'Press "N" from anywhere on the Kanban board to immediately start typing an idea.'
      },
      {
        target: 'Key "D" (Dashboard View)',
        description: 'Quick toggle to the Velocity & SLA analytics.',
        howToUse: 'Check 30-day performance in a split second.'
      },
      {
        target: 'Key "T" (Live Topology)',
        description: 'Switches directly to the animated energy flow engine.',
        howToUse: 'Inspect live system cables without lifting your fingers off the keyboard.'
      },
      {
        target: 'Key "?" or "Shift + /"',
        description: 'Opens this keyboard shortcuts cheat-sheet overlay.',
        howToUse: 'Press whenever you forget a shortcut to see all keys on your screen.'
      }
    ],
    stepByStepAction: [
      'Press "?" anywhere in the application to bring up this overlay.',
      'Practice pressing "N" to draft a brief and "Escape" to close modals.',
      'Watch your daily operational speed double!'
    ],
    secretAdminProTips: [
      'Pressing "Escape" instantly dismisses any open modal or inspection drawer, returning you to your clean board.'
    ]
  }
];

export const SuperAdminManualPage: React.FC<SuperAdminManualPageProps> = ({
  currentUser,
  onNavigateToView
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(MANUAL_SECTIONS[0].id);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // STRICT ACCESS GUARD: Only Super Administrators can view this manual
  if (currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0B0E14] text-white select-none">
        <div className="max-w-md w-full bg-[#121620] border border-[#FF4B55]/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-[#FF4B55]/10 to-transparent pointer-events-none" />
          <div className="h-16 w-16 mx-auto rounded-2xl bg-[#FF4B55]/15 border border-[#FF4B55]/30 flex items-center justify-center text-[#FF4B55]">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Super Admin Clearance Required</h2>
          <p className="text-sm text-[#8F9CAE] leading-relaxed">
            The Interactive System Manual and Architecture Playbook contains proprietary operational secrets, RACI governance rules, and system schemas. Access is strictly restricted to executive Super Administrators.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181E2C] border border-white/5 text-xs text-[#8F9CAE]">
              Current Role: <span className="font-semibold text-white">{currentUser.role}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  const filteredSections = MANUAL_SECTIONS.filter((s) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q) ||
      s.fiveYearOldSummary.toLowerCase().includes(q) ||
      s.badge.toLowerCase().includes(q)
    );
  });

  const activeSection = MANUAL_SECTIONS.find((s) => s.id === activeSectionId) || MANUAL_SECTIONS[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0E14] text-white">
      {/* Top Banner Header */}
      <header className="px-6 py-5 border-b border-white/[0.08] bg-[#121620]/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#00E599]/20 to-[#00E599]/5 border border-[#00E599]/30 flex items-center justify-center text-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.15)]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Super Admin Interactive System Manual</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF4B55]/15 text-[#FF4B55] border border-[#FF4B55]/30">
                Confidential • Super Admin Only
              </span>
            </div>
            <p className="text-xs text-[#8F9CAE]">
              Complete visual guide with real screenshots, 5-year-old friendly analogies, and pro tips for every form, modal, and card.
            </p>
          </div>
        </div>

        {/* Search Bar & Fast Navigation */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F9CAE]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search forms, modals, rules..."
              className="w-full bg-[#181E2C] border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8F9CAE] focus:outline-none focus:border-[#00E599]/50 transition-colors"
            />
          </div>
          {onNavigateToView && (
            <button
              onClick={() => onNavigateToView('pipeline')}
              className="px-3 py-1.5 rounded-xl bg-[#00E599] text-[#0B0E14] text-xs font-bold hover:bg-[#00cc88] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <span>Back to Pipeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Layout: Left Nav Column + Right Interactive Manual Studio */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sticky Navigation Column */}
        <aside className="w-80 border-r border-white/[0.08] bg-[#121620]/40 overflow-y-auto p-4 space-y-2 shrink-0">
          <div className="px-2 py-1 text-[11px] font-bold text-[#8F9CAE] uppercase tracking-wider">
            All Dashboard Components ({filteredSections.length})
          </div>

          <div className="space-y-1">
            {filteredSections.map((sec, idx) => {
              const IconComp = sec.icon;
              const isSelected = sec.id === activeSection.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-[#181E2C] border-[#00E599]/40 text-white shadow-[0_0_15px_rgba(0,229,153,0.08)]'
                      : 'bg-transparent border-transparent text-[#8F9CAE] hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isSelected ? 'bg-[#00E599]/15 text-[#00E599]' : 'bg-[#181E2C] text-[#8F9CAE]'
                  }`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-[10px] font-black tracking-wider uppercase ${
                        isSelected ? 'text-[#00E599]' : 'text-[#8F9CAE]'
                      }`}>
                        {sec.badge}
                      </span>
                      <span className="text-[10px] text-white/30 font-mono">#{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="text-xs font-semibold truncate text-white">{sec.title}</div>
                    <div className="text-[11px] text-[#8F9CAE] truncate mt-0.5">{sec.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick FAQ Accordion in Sidebar */}
          <div className="pt-6 border-t border-white/[0.08] mt-6 space-y-3">
            <div className="px-2 text-[11px] font-bold text-[#8F9CAE] uppercase tracking-wider">
              Super Admin FAQ
            </div>

            <div className="space-y-2">
              {[
                {
                  q: 'Who can bypass the QA Gate?',
                  a: 'Strictly Super Admins (previewsites40@gmail.com) and Content Managers who hold the master 4-point signing authority.'
                },
                {
                  q: 'What happens when an SLA breaches?',
                  a: 'The countdown badge turns pulsing red, alarms sound if enabled in settings, and an automated audit record is written to PostgreSQL.'
                },
                {
                  q: 'How does Supabase Magic Link work?',
                  a: 'Users receive an encrypted login token via email that signs them directly into their account with no password to remember or lose.'
                }
              ].map((faq, i) => (
                <div key={i} className="bg-[#181E2C]/80 border border-white/[0.06] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between text-white hover:text-[#00E599] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-[#8F9CAE] transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedFaq === i && (
                    <div className="px-3 pb-3 pt-1 text-[11px] text-[#8F9CAE] leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Detail Pane: The Live Manual Page */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {/* Header of Active Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
                {activeSection.badge}
              </span>
              <span className="text-xs text-[#8F9CAE] font-medium">• Dashboard Component Guide</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {activeSection.title}
            </h2>
            <p className="text-sm text-[#8F9CAE] max-w-3xl leading-relaxed">
              {activeSection.subtitle}
            </p>
          </div>

          {/* High-Resolution Screenshot Showcase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8F9CAE] px-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#00E599]" />
                Actual System Visual (Captured from Live Production UI)
              </span>
              <span className="font-mono text-[11px] text-white/40">{activeSection.image.replace('/manual-assets/', '')}</span>
            </div>

            <div className="rounded-2xl border border-white/[0.12] bg-[#121620] overflow-hidden shadow-2xl relative group">
              <img
                src={activeSection.image}
                alt={activeSection.title}
                className="w-full h-auto object-cover max-h-[540px] transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
            </div>
          </div>

          {/* 5-Year-Old Explanation Card (The Hero Metaphor) */}
          <div className="bg-gradient-to-br from-[#181E2C] to-[#121620] border border-[#00E599]/20 rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#00E599]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#00E599]/15 border border-[#00E599]/30 flex items-center justify-center text-[#00E599] shrink-0">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    How it works in super simple words (5-Year-Old Explanation)
                  </h3>
                  <p className="text-xs text-[#00E599] font-medium">Simple, clear, and impossible to forget</p>
                </div>

                <p className="text-sm text-white/90 leading-relaxed font-normal">
                  "{activeSection.fiveYearOldSummary}"
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs text-[#8F9CAE] bg-[#0B0E14]/60 p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-amber-400 shrink-0">💡 Real-Life Comparison:</span>
                  <span>{activeSection.realWorldAnalogy}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Walkthrough: Every Single Button & Form Field Explained */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-[#00E599]" />
              What Every Single Button, Form & Indicator Does
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSection.visualWalkthrough.map((item, i) => (
                <div key={i} className="bg-[#121620] border border-white/[0.08] rounded-xl p-4 space-y-2 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-md bg-[#181E2C] border border-white/10 text-white font-mono text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <h4 className="text-xs font-bold text-white">{item.target}</h4>
                  </div>
                  <p className="text-xs text-[#8F9CAE] leading-relaxed">
                    {item.description}
                  </p>
                  <div className="text-[11px] text-[#00E599] bg-[#00E599]/5 border border-[#00E599]/20 p-2 rounded-lg font-medium">
                    <span className="font-bold">How to use: </span>{item.howToUse}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Operator Action Plan */}
          <div className="bg-[#121620] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#00E599]" />
              Step-by-Step Operator Instructions
            </h3>

            <div className="space-y-2.5">
              {activeSection.stepByStepAction.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-[#8F9CAE]">
                  <span className="h-5 w-5 rounded-full bg-[#00E599]/15 text-[#00E599] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed text-white/90">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Super Admin Secret Pro Tips */}
          <div className="bg-[#181E2C] border border-amber-500/30 rounded-2xl p-6 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-amber-400">
              <Crown className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Super Admin Executive Secrets & Pro Tips</h3>
            </div>

            <ul className="space-y-2">
              {activeSection.secretAdminProTips.map((tip, i) => (
                <li key={i} className="text-xs text-amber-200/90 flex items-start gap-2 leading-relaxed">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Section Switcher Footer */}
          <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
            {(() => {
              const curIdx = MANUAL_SECTIONS.findIndex((s) => s.id === activeSection.id);
              const prev = curIdx > 0 ? MANUAL_SECTIONS[curIdx - 1] : null;
              const next = curIdx < MANUAL_SECTIONS.length - 1 ? MANUAL_SECTIONS[curIdx + 1] : null;

              return (
                <>
                  {prev ? (
                    <button
                      onClick={() => setActiveSectionId(prev.id)}
                      className="px-4 py-2 rounded-xl bg-[#181E2C] border border-white/[0.08] text-xs font-semibold text-white hover:border-[#00E599]/40 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>← Previous: {prev.title}</span>
                    </button>
                  ) : <div />}

                  {next ? (
                    <button
                      onClick={() => setActiveSectionId(next.id)}
                      className="px-4 py-2 rounded-xl bg-[#00E599] text-[#0B0E14] text-xs font-bold hover:bg-[#00cc88] transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Next: {next.title} →</span>
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
};
