# GridPulse ⚡

**Live demo:**  https://parthsingh03.github.io/gridpulse/


A campus energy ecosystem: occupancy-aware HVAC/lighting optimization, a live energy dashboard, and peer-to-peer sharing and trading of surplus solar or battery energy credits.

Built for the **Yuva Yodha hackathon** (idea-submission round, October 2026).

## The idea

Campus buildings waste enormous energy cooling, heating, and lighting empty rooms. GridPulse closes the loop in four steps:

1. **Sense** — room-level occupancy (PIR sensors / ESP32 in production, simulated in this prototype)
2. **Save** — automatically adjust HVAC and lighting to real occupancy
3. **Trade** — list surplus solar/battery energy and trade credits between buildings and hostels
4. **Earn** — reward conservation with green points

## Prototype

JARVIS-style 3D campus hologram: a hand-rolled canvas 3D engine (orbit/zoom) rendering 8 buildings on a glowing grid, with energy heat glow (emerald → amber → red), per-room lit windows driven by simulated occupancy, radar sweep, scanlines, HUD, layer toggle, cinematic auto-rotate, and click-for-info cards.

All data in the prototype is simulated. The production path uses ESP32/PIR/smart-meter telemetry over MQTT with LSTM models trained on meter history.

## Projected impact

Based on a published energy audit of Uttaranchal University, Dehradun (18.2 lakh kWh/yr):

- **2,71,703 kWh/year** saved
- **₹16.4 lakh/year** in cost savings
- **223 tCO₂/year** avoided
- **~2.2-month** payback on a ₹3 lakh pilot

## Run it

No build step, no dependencies — just open `index.html` in a browser:

```bash
# or serve locally
python3 -m http.server
# then open http://localhost:8000
```

## Tech

HTML, CSS, vanilla JavaScript (canvas 2D for the hologram's custom 3D engine). Zero frameworks, zero build tools.
