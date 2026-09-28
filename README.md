# ORCA Marine Intelligence

https://sridev1802.github.io/Poseidon-Atlas-Deployable/                                                               Upgrade the existing Poseidon Atlas app to fully match SIH 26176 – ORCA Marine EcOsystem Reasoning with Collaborative Agents.

Keep the current UI and existing features. Add only the missing requirements:

🤖 ORCA conversational AI chat with multi-turn questions

🧠 Multi-agent workflow: Planner, Ocean, Weather, Satellite/PFZ, GIS, Risk and Route agents

🌡️ SST + 🌿 Chlorophyll + 🌊 Waves + 🌦️ Weather + Tide data

🗺️ Interactive marine map with PFZ, vessel location, hazards, boundaries and restricted zones

🎣 PFZ analysis with distance, conditions and explanation

⚠️ Cyclone, lightning, high-wave and weather safety alerts

🚢 Safe-route optimization avoiding hazards and restricted areas

📊 Charts for marine conditions and forecasts

🔍 Explainable AI: show Why this recommendation? and supporting evidence

🌐 English + Indian regional language support

📚 Data-source/evidence panel showing ISRO, INCOIS, weather and ocean data

🟢🟡🔴 Marine risk levels and actionable recommendations

Use realistic mock/demo data where live APIs are unavailable, clearly label it as mock data, and make the complete workflow visible:

User Query → AI Planning → Multiple Agents → Data Correlation → Risk Analysis → Recommendation → Map + Evidence + Alerts

Do not remove existing Poseidon Atlas features. Prioritize SIH functionality over decorative changes.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://orca-marine-insight.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a0a9b5a7-933b-455c-beb7-b9f515797267).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
