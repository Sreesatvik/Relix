# AI-Enabled Production Disruption Early Warning System
## Master Execution Plan v2 — Single MCP Server · Parallel Agents · 24/7 Monitor · Full-Domain

**Team:** 5 people (3 core/backend, 2 frontend) · **Timeframe:** 2 hours
**Status:** This document is the single source of truth. Every field name, endpoint, and folder path below is final. Do not rename anything mid-build — if you need a change, shout it out loud to the whole team before touching it.

---

## PART 1 — SCOPE, GROUNDED IN THE PS

The problem statement does not say "machines." It says disruptions come from **machine downtime, material delays, quality deviations, workforce constraints, and changing demand priorities** — and it explicitly calls out production logs, maintenance records, shift schedules, machine status, quality inspection results, and material availability. We were over-indexing on "machine failure" as the only story. We fix that here.

### 1.1 The six domains we model

| Domain | What it covers | Example signals |
|---|---|---|
| **Machine & Maintenance** | Equipment health, downtime, service history | vibration, temperature, unplanned stoppages, overdue service |
| **Quality** | Inspection outcomes, defect trends | defect rate, batch rejection, rework rate |
| **Raw Materials / Procurement** | Inbound material availability | stock-out risk, delayed supplier shipment, quality-flagged incoming batch |
| **Logistics & Post-Production Supply Chain** | Outbound movement of finished goods | dispatch delay, carrier delay, warehouse capacity breach, customer delivery slippage |
| **Workforce** | Staffing constraints affecting a line | shift under-staffing, skill-gap on a critical line, absenteeism spike |
| **Demand / Orders** | Priority and commitment shifts | rush order inserted, priority order at risk, demand spike vs. capacity |

Every one of these domains feeds the **same** detection → monitoring → reasoning pipeline. We are not building six separate systems — one generalized signal schema (§3.1) covers all six. This is what makes the system "not just a machine-failure tool."

### 1.2 Who sees what (from jury brief, mapped to build)

| Role | Primary need | Where it shows up in the build |
|---|---|---|
| Plant/Production Manager | Cross-line prioritized view, $ impact | Manager dashboard (P4) |
| Shift Supervisor | Line-level detail, shift handoff | Supervisor dashboard (P4) |
| Maintenance Engineer | Machine-specific alert + fix | Maintenance dashboard (P5) |
| Quality Inspector | Feeds data in, sees quality alerts | Covered by quality domain filter in role view (P5) |
| Materials/Procurement Planner | Feeds material data, sees delay alerts | Covered by materials domain filter (P5) |
| Plant Head / Ops Director | Escalated, high-impact only | "Critical only" filter on Manager view (P4) |
| Workforce/HR Scheduler | Shift constraint inputs | Covered by workforce domain filter (P5) |

We do not build 7 separate UIs. We build **3 dashboard shells** (Manager, Supervisor, Maintenance) with a **domain filter** that lets Quality/Materials/Workforce/Ops-Director needs be satisfied by filtering the same incident feed. This is a filter/view-mode problem, not a new-screen problem — critical for a 2h build.

---

## PART 2 — SYSTEM ARCHITECTURE (v2)

### 2.1 What changed from v1

| v1 | v2 (this doc) | Why |
|---|---|---|
| 3 MCP servers (A/B/C) | **1 MCP server** | One process, one set of tools, zero cross-server plumbing. Domain separation now happens via tool *parameters* (`domain` field), not separate servers. |
| Investigation → Impact → Response run **sequentially** | Diagnostic Agent + Decision Agent run **in parallel** (`asyncio.gather`), both fed by the same signal + RAG context | Sequential chains add latency and a single point of failure; parallel calls are faster and each agent is independently testable/demoable. |
| No standing monitoring process | **Monitor Agent runs 24/7 as a background loop**, independent of the on-demand reasoning pipeline, and is the thing that pushes alerts to personnel | Matches "early warning," not "warning on click." This is also the most visually impressive live-demo element (an alert appearing in real time on screen). |
| Machine-centric | Six domains (§1.1), same pipeline | Matches the PS fully |

### 2.2 The three agents (final)

1. **Monitor Agent (24/7 background loop)**
   Runs continuously (e.g. every 5–10 seconds in the demo, simulating a real-time feed). Pulls the latest synthetic signal batch across all six domains, computes rule-based risk scores, and the moment any line/domain crosses threshold:
   - Pushes a `NEW_ALERT` event over a WebSocket (or short-poll endpoint if WS is too risky in 2h) to the frontend, addressed to the correct role(s) (see §3.4 alert routing).
   - Triggers the Diagnostic + Decision agents **asynchronously in parallel** for that incident.
   - This agent does **not** call the LLM — it is pure rules/thresholds (Python/pandas), exactly as the source material insists ("detection should not be an LLM"). It is "the agent" only in the sense that it is a standing, autonomous, always-on process — not because it reasons with a model.

2. **Diagnostic Agent (LLM, RAG-grounded)**
   Given a triggered incident: calls the MCP server's operational tool (for the relevant domain + line) and the RAG tool (`search_knowledge_base`, filtered by `doc_type=incident_report`/`root_cause_analysis`) **concurrently**, then makes **one** LLM call to produce root cause + evidence + a plain-language explanation.

3. **Decision Agent (LLM, business + response combined)**
   Given the **same** triggered incident (not the Diagnostic Agent's output — this is what makes it parallel, not sequential): calls the MCP server's business-context tool (targets/orders/cost) and the RAG tool (filtered by `doc_type=sop`/`response_playbook`/`escalation_policy`) **concurrently**, then makes **one** LLM call to produce business impact + what-if comparison + recommended action.

   Diagnostic and Decision agents are kicked off with `asyncio.gather(diagnostic(incident), decision(incident))` — they run at the same time, not one waiting on the other. The orchestrator merges both outputs into the single `DisruptionIncident` object (§3.3) once both resolve. This means **Decision does not wait for root cause** — it works off signals + business context directly, and root cause is presented alongside it, not upstream of it. Slight product trade-off (Decision doesn't literally get the root-cause sentence as input) — acceptable, since business impact calculation only needs signals + severity, not the narrative explanation, and this is what buys us the parallelism.

### 2.3 Full architecture diagram

```
                    ┌────────────────────────────────────────┐
                    │   SYNTHETIC DATA GENERATORS (6 domains) │
                    │   machine · quality · materials ·       │
                    │   logistics · workforce · demand        │
                    └───────────────────┬──────────────────────┘
                                        │ written to /data/*.json, refreshed on a loop
                                        ▼
        ┌──────────────────────────────────────────────────────────┐
        │              MONITOR AGENT (24/7 background loop)          │
        │              pure Python rules, no LLM, runs every N sec   │
        │              scans all 6 domains → risk_score per entity   │
        └───────┬───────────────────────────────────┬────────────────┘
                │ risk_score > threshold              │ pushes to
                ▼                                      ▼
   ┌─────────────────────────────┐        ┌─────────────────────────┐
   │  ORCHESTRATOR                │        │  ALERT BUS               │
   │  fires both agents in        │        │  WebSocket / poll        │
   │  parallel via asyncio.gather │        │  routed by role (§3.4)   │
   └───────┬───────────────┬─────┘        └─────────────┬─────────────┘
           │               │                              │
           ▼               ▼                              ▼
 ┌───────────────┐ ┌───────────────┐              FRONTEND (live alert
 │ DIAGNOSTIC     │ │ DECISION       │              toast / badge, role-
 │ AGENT (LLM)    │ │ AGENT (LLM)    │              routed)
 │ root cause +   │ │ impact + what- │
 │ evidence       │ │ if + action    │
 └───────┬───────┘ └───────┬───────┘
         │  both call the SAME MCP server, concurrently, for their own tools
         └───────────┬───────────┘
                      ▼
         ┌─────────────────────────────┐
         │   MCP SERVER (single)        │
         │   operational tools (6       │
         │   domains) + RAG search tool │
         │   + business context tool    │
         └─────────────────────────────┘
                      │
                      ▼ merged once both agents resolve
         ┌─────────────────────────────┐
         │  DisruptionIncident (final    │
         │  merged JSON) → /api/incidents│
         └───────────────┬───────────────┘
                          ▼
              FRONTEND: Manager / Supervisor /
              Maintenance dashboards + domain
              filters + Acknowledge/Escalate/Resolve
```

---

## PART 3 — EXACT CONTRACTS (lock these in minute 0–15, then freeze)

### 3.1 Universal Signal Schema (covers all 6 domains — this is the key unifying object)

Every domain's synthetic data reduces to this shape so the Monitor Agent has **one** detection code path, not six:

```json
{
  "signal_id": "SIG-00231",
  "domain": "machine",              // machine | quality | materials | logistics | workforce | demand
  "entity_id": "M17",               // machine_id / batch_id / material_id / shipment_id / line_id / order_id
  "line_id": "LINE-4",
  "timestamp": "2026-08-19T10:31:00Z",
  "metric_name": "vibration_index",
  "value": 7.8,
  "threshold": 5.0,
  "severity_hint": "HIGH",          // computed by the rule that generated this signal
  "text_note": "Technician flagged unusual noise on Line 4 conveyor bearing"   // optional, feeds RAG
}
```

**Domain-specific `metric_name` vocab (so all 3 backend people generate consistent data):**

| domain | example metric_names |
|---|---|
| machine | `vibration_index`, `temperature_c`, `unplanned_stops_24h` |
| quality | `defect_rate`, `rework_rate`, `batch_reject_flag` |
| materials | `stock_days_remaining`, `supplier_delay_hours`, `incoming_qc_fail_flag` |
| logistics | `dispatch_delay_hours`, `warehouse_capacity_pct`, `carrier_delay_flag` |
| workforce | `staffing_pct_of_plan`, `skill_gap_flag`, `absenteeism_pct` |
| demand | `priority_order_at_risk_flag`, `demand_vs_capacity_ratio` |

### 3.2 Risk Score (computed by Monitor Agent, pure Python)

```python
# one function, six domains, same shape in/out
def compute_risk_score(signals: list[Signal]) -> float:
    # weighted breach severity across the signals for one entity/line
    # e.g. sum(min(1.0, value/threshold - 1) * domain_weight) normalized to 0-1
    ...
```

Domain weights (tune once, do not bikeshed): `machine=0.30, quality=0.20, materials=0.20, logistics=0.15, workforce=0.10, demand=0.05`. This single function is what makes the system "not machine-only" — a materials + logistics combination can cross threshold with zero machine signals involved.

### 3.3 `DisruptionIncident` — the ONE object frontend consumes (merged output)

```json
{
  "incident_id": "INC-204",
  "created_at": "2026-08-19T10:32:00Z",
  "domain_mix": ["machine", "quality"],
  "line_id": "LINE-4",
  "risk_score": 0.78,
  "risk_level": "HIGH",
  "status": "OPEN",                  // OPEN | ACKNOWLEDGED | ESCALATED | RESOLVED
  "signals": [ /* array of Signal objects from 3.1 that triggered this */ ],

  "diagnostic": {
    "root_cause": "Machine M17 bearing wear",
    "evidence": [
      {"source_type": "incident_report", "doc_id": "INC-1042", "snippet": "Similar vibration+defect pattern, resolved via bearing replacement"},
      {"source_type": "maintenance_log", "doc_id": "MAINT-882", "snippet": "M17 last serviced 34 days ago, overdue by 6 days"}
    ],
    "explanation": "Vibration rose 31% over 3 days alongside a defect-rate increase; maintenance is overdue and a near-identical pattern preceded a bearing failure in INC-1042."
  },

  "decision": {
    "business_impact": {
      "units_at_risk": 8400,
      "orders_at_risk": 2,
      "delivery_delay_hours": 11,
      "estimated_cost_inr": 140000,
      "severity": "CRITICAL"
    },
    "what_if": [
      {"action": "DO_NOTHING", "units_lost": 8400, "cost_inr": 140000, "delay_hours": 11},
      {"action": "REPAIR_NOW", "units_lost": 1200, "cost_inr": 40000, "delay_hours": 2},
      {"action": "SHIFT_TO_LINE_3", "units_lost": 2100, "cost_inr": 60000, "delay_hours": 3}
    ],
    "recommended_action": {
      "action": "SHIFT_TO_LINE_3",
      "reason": "Line 3 has spare capacity; reduces shortfall by 75% vs. doing nothing",
      "sop_reference": "SOP-014",
      "escalation_required": true
    }
  },

  "role_summaries": {
    "plant_manager": "Line 4 at CRITICAL risk — ₹1.4L exposure on 2 orders. Recommend shifting 30% load to Line 3.",
    "supervisor": "M17 bearing wear likely. Shift 30% of Line 4 output to Line 3, notify maintenance.",
    "maintenance": "M17: vibration +31%, maintenance overdue 6 days, bearing stock = 1. Inspect during next window.",
    "quality": "Defect rate on Line 4 rose alongside a mechanical fault — expect this to resolve once M17 is serviced.",
    "materials": "Bearing stock for M17 = 1 unit. Recommend reorder.",
    "workforce": null
  }
}
```

`role_summaries` having a domain-specific line for every secondary role (quality/materials/workforce) is what lets those personas be satisfied via filtering instead of new screens.

### 3.4 Alert routing (who gets pinged by the Monitor Agent)

```json
{
  "alert_id": "ALERT-889",
  "incident_id": "INC-204",
  "severity": "CRITICAL",
  "routed_roles": ["plant_manager", "supervisor", "maintenance"],
  // routing rule: severity CRITICAL -> manager+supervisor+maintenance
  // severity HIGH -> supervisor+maintenance
  // severity MEDIUM -> supervisor only
  // domain=quality also always includes "quality" role; materials -> "materials"; workforce -> "workforce"
  "created_at": "2026-08-19T10:32:01Z"
}
```

---

## PART 4 — THE SINGLE MCP SERVER (final tool list)

One server, one process, `stdio` transport (official `mcp` Python SDK). All operational domains + RAG + business context live here — differentiated by tool **parameters**, not by separate servers.

| Tool | Signature | Used by |
|---|---|---|
| `get_domain_status` | `(domain: str, entity_id: str = None, line_id: str = None)` | Diagnostic Agent — pulls current signals for the domain/entity in question, across all 6 domains via one generalized tool |
| `get_signal_history` | `(entity_id: str, domain: str, hours: int = 72)` | Diagnostic Agent — trend context (e.g. "vibration over last 3 days") |
| `search_knowledge_base` | `(query: str, doc_type: str = None, top_k: int = 5)` | Both agents — one shared vector store, `doc_type` filters: `incident_report`, `root_cause_analysis`, `sop`, `escalation_policy`, `response_playbook`, `safety_policy` |
| `get_business_context` | `(line_id: str)` | Decision Agent — returns targets, affected orders, cost-per-hour-downtime in one call (collapsed from the old 4 separate Server-C tools, since we have 2 hours not 3) |

This is a genuine simplification: the old design's `get_production_targets` / `get_customer_commitments` / `get_order_priorities` / `get_cost_data` are merged into one `get_business_context(line_id)` call that returns all four as one object — one round trip instead of four.

---

## PART 5 — TEAM ALLOCATION (zero-merge-conflict edition)

**Golden rule to avoid merge conflicts: everyone owns their own file(s) end-to-end. Nobody edits another person's file. Integration happens only through the JSON contracts in Part 3 and the FastAPI route boundaries in Part 6.**

### Repo layout (create this exact structure at minute 0)

```
/backend
  /data
    generate_machine.py         ← P1
    generate_quality.py         ← P1
    generate_materials.py       ← P1
    generate_logistics.py       ← P1
    generate_workforce.py       ← P1
    generate_demand.py          ← P1
    knowledge_docs.py           ← P2  (incident reports, SOPs, escalation policies as raw text)
  /mcp_server
    server.py                   ← P2  (the single MCP server, all 4 tools)
    rag_store.py                 ← P2  (chunking + embedding + retrieval)
  /monitor
    monitor_agent.py             ← P1  (24/7 loop, risk scoring, alert firing)
    risk_rules.py                 ← P1  (compute_risk_score + domain weights)
  /agents
    diagnostic_agent.py          ← P3
    decision_agent.py             ← P3
    orchestrator.py               ← P3  (asyncio.gather + merge into DisruptionIncident)
  main.py                         ← P3  (FastAPI app, routes, WebSocket)
  models.py                       ← shared, edited together in first 15 min then frozen
/frontend
  /manager                       ← P4
  /supervisor                    ← P4
  /maintenance                   ← P5
  /shared (role switcher, alert toast, domain filter component) ← P5
```

### P1 — Backend: Data + Monitor Agent
- Write 6 synthetic data generators, each producing `Signal` objects (§3.1) matching the shared vocab table.
- Write `risk_rules.py`: `compute_risk_score()`.
- Write `monitor_agent.py`: background loop (`asyncio` task started on FastAPI startup) that re-scans data every 5–10s, computes risk per `(line_id, domain-cluster)`, and when threshold crossed: (a) posts to the Alert Bus, (b) calls `orchestrator.handle_incident()`.
- **Interface P1 delivers to P3:** a running background task that calls one function, `orchestrator.handle_incident(signals: list[Signal], line_id: str) -> None` — P3 owns everything downstream of that call.

### P2 — Backend: MCP Server + RAG
- Write 15–20 synthetic knowledge docs (incident reports, SOPs, escalation policies, response playbooks) as plain text with `doc_type` + `line_id`/`machine_id` metadata.
- Chunk (1 doc = 1 chunk, event-based, no need for splitting), embed (local `sentence-transformers`, or featherless.ai embeddings), store in Chroma in-memory.
- Implement the 4 MCP tools from Part 4.
- **Interface P2 delivers to P3:** the MCP server importable/callable as an async client, or — if MCP client wiring risks time — expose the same 4 tools as plain async Python functions in `mcp_server/server.py` that P3 imports directly. **Decide this in minute 15 based on how comfortable P2 is with the MCP SDK; a plain function-call fallback is explicitly acceptable and loses zero pitch value**, since "MCP" is an architecture claim you can make in the pitch regardless of whether the wire protocol is literally used in the 2h build.

### P3 — Backend: Agents + Orchestrator + API
- `diagnostic_agent.py`: given `(signals, line_id)`, calls `get_domain_status` + `get_signal_history` + `search_knowledge_base` (doc_type=incident_report/root_cause_analysis) concurrently, then one LLM call → returns the `diagnostic` object from §3.3.
- `decision_agent.py`: given `(signals, line_id)`, calls `get_business_context` + `search_knowledge_base` (doc_type=sop/response_playbook/escalation_policy) concurrently, then one LLM call (with the hardcoded what-if multiplier table, §5-note below) → returns the `decision` object from §3.3.
- `orchestrator.py`: `handle_incident()` — runs `asyncio.gather(diagnostic_agent.run(...), decision_agent.run(...))`, merges both into `DisruptionIncident`, assigns `incident_id`, pushes to in-memory incident store, pushes alert to Alert Bus.
- `main.py`: FastAPI app exposing the routes in Part 6, plus WebSocket for live alerts.
- What-if multiplier table (kept simple, per §5 of v1 plan): `DO_NOTHING=1.0, REPAIR_NOW=0.14, SHIFT_LINE=0.25` applied to `units_at_risk` — no solver.

### P4 — Frontend: Manager + Supervisor views
- Build against the `DisruptionIncident` mock JSON from §3.3 starting minute 5 — do not wait for backend.
- Manager view: cross-line prioritized incident list (sorted by `risk_score` × `estimated_cost_inr`), incident detail panel, what-if comparison table, "Critical only" toggle (serves Ops Director persona).
- Supervisor view: same incident list filtered to their line(s), `role_summaries.supervisor` text, Acknowledge/Escalate/Resolve buttons (calls the workflow route in Part 6).
- Live alert toast: subscribes to the WebSocket/poll endpoint, shows a toast when a `NEW_ALERT` routed to their role arrives.

### P5 — Frontend: Maintenance view + shared components + workflow
- Maintenance view: machine-centric incident cards using `role_summaries.maintenance`, `diagnostic.evidence`, `diagnostic.root_cause`.
- Role switcher component (shared): toggles which dashboard + which `role_summaries` field is shown; also drives the **domain filter** (quality/materials/workforce) that services the secondary personas without new screens.
- Escalation workflow UI: Acknowledge → Escalate → Resolve state machine, calling `PATCH /api/incidents/{id}/status`.
- Final integration pass: replace P4's mocks with live API/WebSocket once P3's `main.py` is up (~minute 90).

---

## PART 6 — FASTAPI ROUTES (exact, freeze at minute 15)

```
GET  /api/incidents                 → list[DisruptionIncident], sorted by risk_score desc
GET  /api/incidents/{incident_id}   → DisruptionIncident
PATCH /api/incidents/{incident_id}/status   body: {"status": "ACKNOWLEDGED"|"ESCALATED"|"RESOLVED"}
GET  /api/alerts?role=supervisor    → list[Alert] routed to that role, unread first
WS   /ws/alerts                     → pushes Alert objects in real time as Monitor Agent fires them
GET  /api/domains/{domain}/signals?line_id=LINE-4   → raw signals, for drill-down / debugging
```

Frontend needs nothing beyond these five endpoints. If WebSocket setup proves risky, fall back to `GET /api/alerts?since=<timestamp>` polled every 3s from the frontend — same alerting effect, less infra risk. **Decide WS vs. poll at minute 20, not later.**

---

## PART 7 — TECH STACK (final)

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **FastAPI**, single process | per your instruction — one app, `uvicorn main:app`, background task for Monitor Agent, no separate services to deploy |
| Concurrency | Python `asyncio` (`asyncio.gather` for parallel agents, `asyncio.create_task` for the 24/7 monitor loop) | native to FastAPI, no extra infra |
| MCP | Official `mcp` Python SDK, single server, `stdio` transport — or plain async function fallback (see P2 note) | one server = one thing to debug |
| Vector store | Chroma in-memory (or flat cosine-similarity list as fallback) | zero setup |
| Embeddings + LLM | featherless.ai (already integrated in a prior project) or any OpenAI-compatible endpoint, JSON-mode/structured-output prompting | no new API key setup mid-build |
| Realtime alerts | FastAPI native WebSocket, or 3s polling fallback | matches 24/7 monitor requirement |
| Frontend | React (Vite) if P4/P5 are confident; Streamlit only as a fallback if WS/React data-fetching risks time | React needed for WebSocket-driven live toast; Streamlit can still poll |
| Data persistence | In-memory Python dict / JSON files only | no DB in scope |
| Deployment | Local only | out of scope |

---

## PART 8 — TIMELINE (120 minutes)

| Time | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| 0–15 | Align on §3.1/3.2/3.3 contracts with whole team | same | same | same | same |
| 15–45 | Build 6 data generators + risk_rules.py | Write knowledge docs + chunk/embed + Chroma store | Skeleton FastAPI app + mock `/api/incidents` returning §3.3 JSON | Manager+Supervisor UI against mock JSON | Maintenance UI + role switcher against mock JSON |
| 45–75 | monitor_agent.py loop working, firing to a stub orchestrator function | MCP server: implement all 4 tools, test each in isolation | diagnostic_agent.py + decision_agent.py written, tested independently with hardcoded signals | What-if comparison table UI, Critical-only toggle | Escalation workflow UI (Acknowledge/Escalate/Resolve) |
| 75–95 | Wire monitor_agent → orchestrator.handle_incident() for real | Support P3 integrating MCP tool calls into both agents | orchestrator.py: asyncio.gather + merge; wire into main.py; WS/poll alert route | Wire live incident list to `/api/incidents` | Wire live alert toast to `/ws/alerts` (or poll) |
| 95–110 | End-to-end test: 1 full domain-mix incident (machine+quality) flows from data → monitor → agents → API → both dashboards | same | same | same | same |
| 110–120 | Bug bash + rehearse demo script (Part 9) | | | | |

**Build exactly 2 demo incidents end-to-end:** (1) machine+quality combo on Line 4 [primary], (2) materials+logistics combo on Line 2 [shows domain breadth, proves this isn't machine-only]. Do not attempt a third.

---

## PART 9 — DEMO SCRIPT

1. Dashboard sits idle — Monitor Agent is visibly running (small "live" indicator, last-scanned timestamp ticking).
2. Signals evolve in the background data (P1's generator nudges values up on a timer, or you trigger it manually for the demo).
3. Alert toast fires in real time — "Line 4: CRITICAL risk detected" — visible on screen without a page refresh. **This is the moment that sells "24/7 monitoring" to the jury.**
4. Click into the incident. Diagnostic panel and Decision panel are both already populated (because they ran in parallel, not sequentially) — point this out explicitly: "these two analyses ran simultaneously, not one after another."
5. Root cause + evidence shown (RAG-grounded, cites a past incident).
6. Business impact + what-if table shown — do nothing vs. repair vs. shift.
7. Switch role view — Plant Manager → Supervisor → Maintenance — same incident, three different framings from `role_summaries`.
8. Switch domain filter to show the *second* incident (materials+logistics on Line 2) — "the same pipeline catches a supply-chain disruption with zero machine signals involved."
9. Click Escalate — status updates live for anyone else viewing the incident.

---

## PART 10 — EXPLICIT NON-GOALS (unchanged from v1, still binding)

- ❌ Real constraint solver for what-if — hardcoded multiplier table
- ❌ Real database — in-memory/JSON only
- ❌ More than 2 demo incidents
- ❌ Training any ML model — pure rule-based detection
- ❌ Cloning external GitHub repos
- ❌ More than 1 MCP server, more than 3 agents, more than 3 dashboard shells

---

## PART 11 — WHY THIS VERSION IS STRONGER FOR THE JURY

| Jury requirement | How v2 answers it |
|---|---|
| Early detection before impact | 24/7 Monitor Agent, live alert push, not detection-on-click |
| Business impact understanding | Decision Agent + what-if table, in ₹ and units and hours |
| Role-friendly insights | 3 dashboards + `role_summaries` covering all 7 personas via filtering |
| Risk prioritization | Manager view sorted by risk_score × cost |
| Recommended actions | `recommended_action` with SOP citation |
| Natural language explanations | `diagnostic.explanation`, plain English, evidence-cited |
| Workflow support for escalation | Acknowledge/Escalate/Resolve state machine |
| Not just machine-downtime | 6 domains, 2 demo incidents proving domain breadth |
| Measurable operational value | Every incident carries a ₹ cost and a units-saved delta between "do nothing" and recommended action |
