# 📝 Documentation Workflow

## Core Principles

1.  **Docs First**: Before writing complex code, ensuring the `docs/specs/` or `docs/architecture/` reflects the plan.
2.  **Single Source of Truth**: The `docs/` folder is the authoritative source. If the code behaves differently than the docs, the code is likely wrong (or the docs need updating).
3.  **Update on PR**: Pull Requests that change logic MUST include documentation updates.

## How to Update

### Adding a New Feature
1.  Create a new Markdown file in `docs/specs/` describing the feature.
2.  Link it in `docs/README.md`.
3.  Implement the feature.

### Modifying Existing Logic
1.  Update the relevant file in `docs/specs/` or `docs/architecture/`.
2.  Make changes to the code.

## Tools
- We use **Markdown** for all documentation.
- Use **Mermaid** for diagrams (flowcharts, sequence diagrams).
