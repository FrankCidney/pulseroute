# AURA — Astronaut Health Monitor

AURA is a hackathon prototype for the NASA Space Apps Challenge 2026 challenge **[Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)**.

## Problem statement — draft

On long-duration space missions, astronauts may experience health changes while far from immediate support on Earth. Crew members need a clear way to review relevant health and spacecraft-environment indicators, notice when a change may need attention, and understand what response steps to consider when communication is delayed.

Our team is prototyping AURA, an offline-capable, easy-to-understand health-monitoring interface for that setting. It brings sample crew and cabin readings together, explains scenario-based alerts in plain language, and presents a short set of response steps for review. The current demo uses simulated data to show the intended workflow; it is not connected to medical devices and is not validated clinical guidance.

## Challenge fit

The official challenge asks teams to create software that gathers astronaut health indicators and enables astronauts to evaluate and act on their health. AURA is directly aimed at that workflow:

1. **Review:** see a crew member’s key readings and spacecraft conditions together.
2. **Understand:** see which sample indicators triggered an alert.
3. **Respond:** review scenario-specific response steps and save a local snapshot.

The public challenge listing describes the challenge as intermediate and focuses on long-duration spaceflight health monitoring. Its summary does not specify a required device, dataset, algorithm, or implementation language. We should check the live project-submission form and organizer guidance for any additional requirements before submitting.

## Development status

**Current stage: interactive concept prototype.** The app demonstrates the proposed user experience with generated readings and preset situations; it is not yet a real health-monitoring product.

### Implemented in the prototype

- A simplified overview of crew status, sample health readings, and cabin conditions.
- Five repeatable demo situations: baseline, solar storm, high cabin CO₂, low cabin pressure, and fluid-shift / eye-risk indicators.
- Rule-based scenario alerts, a guided self-check flow, and illustrative response checklists.
- Local browser storage for incident records and saved sample snapshots.
- Progressive Web App configuration intended to support offline use.
- A sources panel that identifies the NASA references currently listed in the project.

### Not implemented or not yet validated

- Connections to real wearables, spacecraft sensors, or live NASA data feeds.
- Evidence that the prototype’s thresholds and calculated scores are clinically or operationally validated.
- A verified mapping from every displayed estimate to source data, methods, units, and limitations.
- Transmission of queued records to Mission Control; the current queue is local storage only.
- Clinical review of the response text. The demo must not be used to diagnose or treat anyone.

## Screening and submission checks

- Keep the story centered on astronaut health monitoring: what is measured, what the astronaut learns, and what they can do next.
- Clearly label simulated data and distinguish implemented features from planned integrations.
- Explain the source, transformation, units, and limitations of each NASA dataset or reference used. Do not imply that a NASA source validates a formula unless that validation is documented.
- Show one complete, easy-to-follow scenario from readings to alert explanation to response steps.
- Confirm the challenge selection, project fields, media/demo requirements, team details, and deadline in the official submission portal or with the local event organizers. Those submission details are not specified in the public challenge summary linked above.
- Resolve the product naming for submission: the repository is named **PulseRoute**, while the prototype currently presents itself as **AURA**.

## Run locally

```bash
npm install
npm run dev
```

To type-check and create a production build:

```bash
npm run build
```
