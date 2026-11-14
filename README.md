# 🛰️ AURA — Autonomous Universal Rescue & Astronaut Health Monitor

**AURA** is an offline-first, cockpit-grade Progressive Web Application (PWA) built for the **NASA Space Apps Challenge 2026** (*Create Health Monitoring Software for Astronauts on Space Missions*).

During cis-lunar (Artemis) and Mars transit missions, radio communication with Mission Control in Houston incurs a **3 to 44-minute round-trip latency**, and solar conjunction blackouts can last up to two weeks. Simultaneously, onboard medical wearables (*Astroskin* biometric vests), personal active radiation dosimeters, and spacecraft cabin sensors (*ECLSS*) operate in isolated hardware silos.

AURA bridges this gap by acting as an **Autonomous Digital Flight Surgeon** directly on the crew's local cabin network.

---

## ✨ Core Capabilities

- **Real-Time Multi-Sensor Fusion**: Correlates wearable biometric telemetry (3-lead ECG, Heart Rate, $SpO_2$, Respiration Rate, HRV RMSSD, Core Temp) with spacecraft cabin life support ($pCO_2$, $pO_2$, Cabin Pressure, Ambient Temp, Ionizing Radiation Dose Rate).
- **Zero-Hallucination Deterministic Clinical Engine**: Evaluates physiological and environmental trends against codified **NASA Exploration Medical Capabilities (ExMC)** and **IMPACT 1.0 Medical Condition List (ICL)** rulesets (`Hypercapnia`, `Acute Hypoxia`, `Solar Particle Event`, `SANS & Cephalic Fluid Shift`, and `Severe Cognitive Fatigue`).
- **Predictive Cognitive Fatigue Index (*Canaria* Model)**: Combines 72-hour sleep debt, autonomic HRV trends, and ambient cabin $CO_2$ to forecast crew reaction-time degradation 4 hours in advance.
- **Cephalic Fluid Shift & SANS Tracker (*Ani's Cuff* Model)**: Tracks microgravity headward venous redistribution, intraocular pressure spikes, and optic disc edema risk.
- **Molecular Countermeasure Recommender (*SpaceGenes+* / NASA OSDR Model)**: Estimates DNA double-strand break and oxidative stress risk using NASA Open Science Data Repository baselines (`OSD-574` Inspiration4 & `OSD-379`) to prescribe targeted prophylactic radioprotectants.
- **Guided Self-Assessment Wizard & Multi-Modal Optical Scanner**: Interactive step-by-step clinical procedure guides for non-physician Crew Medical Officers and optical triage for papilledema and dermatological lesions.
- **Earth Dual-Use Mode**: One-click switch between **Deep Space (Mars Transit)** and **Earth Dual-Use (Remote Rural Clinic / Disaster Relief)** mode.
- **100% Offline-First with Store-and-Forward Burst Queue**: Powered by `IndexedDB` (`Dexie.js`) and a Service Worker (`vite-plugin-pwa`) to log incidents offline and queue compressed telemetry bursts for delayed Earth transmission.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript (Strict Mode), Vite
- **Aerospace HUD Styling**: Tailwind CSS, `lucide-react` icons, high-contrast dark mode (`#080B10` space void palette, $48\times48\text{ px}$ glove-friendly touch targets, tabular monospaced numerals)
- **Telemetry Visualization**: `recharts` (high-framerate sliding-window waveforms)
- **Offline Storage & PWA**: `Dexie.js` (`IndexedDB`), `vite-plugin-pwa`

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Type-check and build production offline bundle
npm run build
```
