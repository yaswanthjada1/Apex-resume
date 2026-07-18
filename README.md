# Apex Resume

An advanced, minimal, open-source engineering tool designed for automated ATS resume optimization and layout compilation. Apex Resume works by anchoring entirely onto target job requirements, utilizing a local AI inference model loop to intelligently extract skills, align keywords, and restructure professional copy without corporate timeline inflation or artificial hallucination.

## Core Architecture & Engine Flow

The application is structured around a Job-First Optimization Workflow:

- Deterministic Parsing Engine: Rather than relying on smaller LLMs to execute mathematical scores directly, the model operates strictly as a binary keyword matching matrix. The final ATS structural metrics and alignment scores are computed locally using native JavaScript execution.
- Dynamic Blueprint Formulation: Forms initialize with clean, non-hardcoded default values, allowing real-time state mutations to render live, machine-readable previews instantaneously on an isolated canvas.
- Local Privacy Infrastructure: Orchestrates background network requests to local ports to guarantee complete data security for uploaded elements and job data arrays.

## Key Feature Modules

### 1. ATS Compliance Workspace

- State Health Polling: Background synchronization logic that checks network port lifecycles dynamically without causing false offline state flags during execution passes.
- Optimization Analytics Dashboard: A conditional three-gate loading panel featuring clean, custom SVG processing rings that switch from an active processing matrix directly to structured metrics displays.

### 2. ATS Resume Builder

- Primary Metadata & Identity Node: Clean, structural entry portals for personal metadata context fields.
- Dynamic Skills Tag Grid: Interactive tag arrays letting users append unique technology tokens or cleanly strip them out using integrated controls.
- Professional Chronology Track: Generates expandable multi-item position blocks equipped with local AI rewriters to transform standard text into metric-driven, action-verb bullet strings.
- Isolated About Me Generation: Tailored paragraph formulation targeting structural job specs explicitly while avoiding robotic copying or chronological exaggeration.

## Project Structure Matrix

```text
├── public/                 # Static web assets
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Footer.jsx      # Dynamic connection monitoring block
│   │   ├── Navbar.jsx      # Navigation shell
│   │   └── ModelSelector.jsx
│   ├── pages/
│   │   ├── AtsChecker.jsx  # ATS compliance workspace
│   │   ├── LandingPage.jsx
│   │   └── ResumeBuilder.jsx
│   ├── hooks/
│   │   └── useOllama.js    # Local Ollama request handler
│   ├── data/
│   │   ├── industryKeywords.json
│   │   └── resumeTemplates.json
│   ├── index.css           # Contains targeted @media print rules
│   └── main.jsx
├── utils/                  # Clean data formatting extensions
└── package.json
```

## Setup & Port Ingestion Pipelines

### Prerequisites

Ensure you have the local model container engine initialized and running in your background command line terminal:

```bash
ollama run qwen2.5-coder:1.5b
```

### Frontend Workspace Activation

1. Clone the repository and install dependency paths:

```bash
npm install
```

2. Execute the local development environment server:

```bash
npm run dev
```

3. Open the browser interface:

Navigate to http://localhost:5173/

## Exporting Print Layouts

The application implements strict @media print style rulesets to guarantee flawless, single-column formatting. When you click Export ATS Compliant PDF, the system isolates the document canvas:

- All interactive form components, control menus, breadcrumbs, and UI styling frameworks are automatically stripped from the viewport pass.
- Default browser components such as timestamps, margins, and URL indicators are bypassed to maintain professional, corporate-ready visual layouts.
