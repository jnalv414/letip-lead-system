# Le Tip Lead System - Documentation

This directory contains all project documentation organized by purpose.

## Directory Structure

```
docs/
├── planning/           # Planning methodologies and implementation guides
├── orchestration/      # Multi-agent coordination and execution
└── App/FrontEnd/          # Dashboard-specific documentation
```

## Planning Documentation (`planning/`)

Comprehensive planning frameworks and implementation guides:

- **GlobalRuleSections.md** - Core principles and patterns extracted from CLAUDE.md
- **PlanningPrompts.md** - "Vibe planning" templates for exploratory research before implementation
- **coding-prompt.md** - Implementation guide for Puppeteer → Apify migration

**When to use**: Before implementing new features, use PlanningPrompts.md to explore options, then create a detailed coding-prompt.md for the implementation agent.

---

## Orchestration Documentation (`orchestration/`)

Multi-agent coordination, phase planning, and execution instructions:

- **README.md** (formerly README_ORCHESTRATION.md) - Overview of orchestration approach
- **ORCHESTRATION_INDEX.md** - Master index of all orchestration files
- **ORCHESTRATION_INSTRUCTIONS.md** - How to coordinate multiple agents in parallel
- **AGENT_PHASE1_SPECIFICATIONS.md** - Detailed specs for Phase 1 agents
- **PHASE1_AGENT_BRIEFS.md** - Task briefs for 5 specialist agents (execute in parallel)
- **PHASE1_EXECUTION_SUMMARY.md** - Summary of Phase 1 execution
- **FINAL_HANDOFF.md** - Final delivery checklist and integration guide
- **QUICK_START.md** - Quick reference for getting started

**Workflow**:
1. Read `ORCHESTRATION_INSTRUCTIONS.md` to understand coordination approach
2. Review `AGENT_PHASE1_SPECIFICATIONS.md` for detailed agent requirements
3. Execute agents using `PHASE1_AGENT_BRIEFS.md`
4. Follow `FINAL_HANDOFF.md` for integration and delivery

---

## Dashboard Documentation (`App/FrontEnd/`)

Next.js 16 dashboard build plans and specifications:

- **DASHBOARD_BUILD_PLAN.md** - Complete plan for building the dashboard

**Tech Stack**: Next.js 16, TypeScript, Tailwind CSS, ShadCN/UI, Zustand, Socket.io

---

## Quick Navigation

**Planning a new feature?**
→ Start with `planning/PlanningPrompts.md`

**Coordinating multiple agents?**
→ Read `orchestration/ORCHESTRATION_INSTRUCTIONS.md`

**Building the dashboard?**
→ Follow `App/FrontEnd/DASHBOARD_BUILD_PLAN.md`

**Understanding core principles?**
→ Review `planning/GlobalRuleSections.md`

---

## External Documentation

- **Root README.md** - Project overview and getting started
- **Root CLAUDE.md** - AI agent development instructions and architecture
