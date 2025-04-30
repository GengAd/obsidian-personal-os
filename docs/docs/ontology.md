---
title: Personal OS Ontology
sidebar_label: Ontology
sidebar_position: 3
---
_With classifier-style groupings that support natural language phrasing._
## 📁 Motivational
_“Why?” – entities that define what you move toward or away from_
### Aspirational
_Entities representing desired outcomes you aim to realize_
- Dream – _an idealized or emotionally charged vision_
- Desire – _an emotionally felt inclination toward something you want to obtain or experience_
- Goal – _a specific, desired outcome_
    - Competence-Level – _a target internal capability or skill level treated as a goal_
    - Milestone – _a significant checkpoint or completion marker on the path to a goal_
    - Target – _a predefined value or condition that must be reached_
:::tip[Example]

“A Dream is an Aspirational entity, and any Aspirational entity is a Motivational entity.”

:::
### Aversive
_Entities representing negative outcomes you seek to avoid_
- Nightmare – _a vivid, emotionally charged vision of an unwanted future_
- Fear – _an emotionally charged anticipation of danger or failure_
- Risk – _a specific negative potential outcome_
### 🧩 Related Concepts (Not Classes)

| Concept           | Description                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | _An identity-linked directional value or commitment. Best represented as a property or note attached to an Agentive entity (e.g., a Person)._ |
| Achievement       | _A goal that has been attained. Represented as a `Goal` with `status: done`._                                                                 |
| Consequence       | _A realized `Risk`. Not a class, but useful in retrospective/review contexts._                                                                |
| Vision            | _A contextual or narrative tool, often part of a Dream or Goal._                                                                              |
| Pain              | _A remembered or experienced state. Tracked in journals, not modeled as a class._                                                             |
| Emotion / Feeling | _Affective states that are not directionally useful. Better represented as tags or part of journal/reflection entries._                       |

## 📁 Operational
_“How?” – entities that structure, repeat, or execute goal-directed behavior_
### Strategic
_Orchestrating + Occurring – entities that structure behavior toward a defined end_
- Project – _a structured initiative coordinating tasks to achieve a goal_
- Mission 
- Plan – _a roadmap that defines steps toward a future outcome_
- Course – _a structured program of sequential learning activities with a defined end_
- Process – _a structured sequence of operations designed for repeatable results with known boundaries_
### Iterative
_Orchestrating + Recurring – entities that coordinate ongoing cycles of structured behavior_
- Responsibility – _an ongoing obligation to uphold standards or manage a domain_
- Cycle – _a repeating phase-based operational structure, often tied to strategic goals_
### Tactical
_Executing + Occurring – entities that represent direct, focused units of work_
- Task – _a discrete, actionable unit of execution_
- Combat – _a direct, attention-intensive problem or confrontation_
- Meeting – _a coordinated session for synchronization or decision-making_
- Training – _a focused activity aimed at developing or refining skill_
### Repetitive
_Executing + Recurring – entities that involve regular, direct-action loops_
- Routine – _a sequence of actions regularly repeated to maintain standards_
- Exercise – _a structured action performed for development or reinforcement_
- Drill – _a high-precision repetition used for mastery or emergency response_
### 🧩 Related Concepts (Not Classes)

| Concept   | Description                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Challenge | _A test of ability, often used as a motivational wrapper around tasks or projects_                           |
| Sprint    | _A bounded execution timeframe used within projects or cycles_                                               |
| Session   | _A single instance of active work or learning, often logged under Tactical or Repetitive entities_           |
| Habit     | _A persistent behavioral pattern; tracked through `Routine`, `Drill`, or `Reflection`, not a distinct class_ |
| Regimen   | _A strict set of behaviors within a health or development context; modeled as `Routine` or `Cycle`_          |
| Practice  | _An open-ended repetition of skills; best logged under `Training` or `Exercise`_                             |
| Rotation  | _A shifting schedule of duties, best captured as a metadata property of `Routine` or `Responsibility`_       |

## 📁 Instrumental
_“With what?” – entities that enable, guide, constrain, or shape execution_
### Executional
_Entities that directly enable or operationalize action_
- Competence – _a validated level of skill or readiness to perform_
    - Skill – _a learned ability to perform actions effectively_
    - Technique – _a tactical method used during execution_
- System – _an integrated set of tools, agent,  processes_
- Tool – _a physical or digital object used to perform tasks_
    - Application – _a software product used for executing work_
    - Software – _a general-purpose system for executing work_
    - Plugin – _a modular enhancement for an application_
    - Widget – _a small, functional interface component_
### Instructional
_Entities that guide or structure specific actions_
- Method – _a prescribed way of doing something_
- Guide – _a broader instructional document or path_
- Procedure – _a step-by-step operational protocol_
    - How-To – _a short, instructional sequence_
- Template – _a reusable layout for consistent creation_
    - Checklist – _a list of actions to standardize execution_
    - Tactic - a template for a tactical operation
    - Course-Template – _a blueprint for creating instructional paths_
    - Exercise-Template – _a repeatable training unit format_
    - Mission-Template – _a format for organizing purpose-driven actions_
### Informational
_Entities that support reasoning, synthesis, or contextual understanding_
- Note – _a stored personal thought, quote, or insight_
- Knowledge – _aggregated and relevant understanding_ >> To add to concepts, knowledge represents "mastered" Instrumental entities. 
- Example – _a concrete illustration of a pattern or use case_
- Source – _source data or structured references_
    - Book – _an extended work with useful insights or learning value_
- Reference – _a citation or link to external information_
- Model – _a structured representation used in execution_
    - Design – _a deliberate arrangement or model for something_
- Documentation – _detailed explanations of systems or procedures_
- Description – _a general overview or explanation of something_
    - Mission-Description – _a narrative summary or explanation of a mission_
- Statement – _a testable or philosophical claim_
- Concept – _a core abstraction or category used in modeling_
- Term – _a specific word used within a conceptual model_
- Property – _a measurable or descriptive attribute_
- Relation – _a semantic or structural connection between concepts_
### Regulatory
_Entities that constrain or structure decision-making or performance_
- Principle – _a guiding value or heuristic_ / _an abstract, generalizable rule or value used to guide behavior_
- Rule – _a formal or informal behavioral constraint_
- Requirement – _a needed condition or prerequisite_
- Criteria – _specific rules or checklists used to evaluate outcomes_
- Benchmark – _reference value or best-practice target used for comparison_
- Standard – _a defined expectation or norm for performance or design_
### Behavioral
_Entities that shape mindset, perception, or motivation during action_
- Belief – _a personal assumption or value that influences behavior_
- Mindset – _an overarching attitude that colors decision-making_
- Trigger – _a stimulus or condition that activates a behavior_
- Quote – _an inspirational or clarifying statement_
- Prayer – _a ritualized or reflective phrase used before action_
- Tip – _a short practical piece of advice_
- Helper – _a message, label, or UI tip that assists execution_
- Setting – _a stored or changeable configuration that affects environment_

## 📁 Evaluative
_“How well?” – entities that represent the result of an assessment, reflection, or comparative judgment_
### Indicator
_Entities that represent tracked or measured values reflecting current or past performance_
- Metric – _a numeric value tracked over time (e.g. daily steps, hours slept)_
- KPI – _a high-level performance metric tied to a strategic objective_
- Target – _a predefined numeric or qualitative threshold to be reached_
- Score – _a discrete rating of success or performance (e.g. 4/5 stars, A+)_
### Reflection
_Entities that represent personal or subjective insight derived from observation or journaling_
- Journal – _a narrative log used to observe patterns, behavior, or mindset_
- Insight – _a realization or lesson drawn from experience or analysis_
- Feedback – _a reaction from others or from self in response to behavior or outcomes_
### Judgment
_Entities that express structured evaluations based on criteria or comparisons_
- Evaluation – _a structured result comparing observed outcomes to expectations_
- Scorecard – _a summary table comparing results across several key dimensions_
- Leaderboard – _a ranked list comparing performance across agents or entities_
- Review – _a periodic or event-based summary of performance, progress, or quality_

## 📁 Agentive
_“Who?” – entities that initiate, perform, or are responsible for actions and outcomes_
- Person – _an individual actor with goals, responsibilities, and behaviors_
- Team – _a small group of people collaborating on shared tasks or missions_
- Organization – _a broader collective structure such as a business, institution, or community_

## 📁 Contextual
_“Under what conditions?” – entities that define scope, framing, setting, or timing for actions and evaluations_
### Temporal
_Entities that define when something occurs, progresses, or is relevant_
- Date – _a specific day used to group or frame entries, logs, or actions (e.g. 2025-04-24)_
- Period – _a named or structured time range for organizing effort (e.g. Q2 2025, Launch Phase)_
- Stage – _a bounded phase in a project or process (e.g. Stage 1: Planning, Stage 2: Execution)_
- Arc – _a higher-level transformation or narrative track across multiple activities (e.g. Career Shift, Launch OS)_
### Topical
_Entities that define domain, subject, or thematic category_
- Area – _a domain or sphere of responsibility, work, or life (e.g. Health, Business, Relationships)_
- Domain – _a knowledge field or discipline that informs action (e.g. Design, Psychology)_
- Category – _a thematic or structural grouping used to classify entities (e.g. Tool Types, Content Formats)_
### Situational
_Entities that define physical, digital, or role-based framing for actions_
- Environment – _a physical, social, or digital setting that shapes execution (e.g. Remote, On-site, Test Server)_
- Role – _a situational identity or function assigned to an agent within a specific context (e.g. CEO, Coach, Reviewer)_