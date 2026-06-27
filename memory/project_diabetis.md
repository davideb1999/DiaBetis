---
name: project-diabetis
description: App DiaBetis para calculadora de insulina tipo 1 - stack, estructura y estado del proyecto
metadata:
  type: project
---

App de calculadora de insulina para diabetes tipo 1, orientada a la novia del usuario (Dexcom).

**Stack:**
- Frontend: Angular 19 + Angular Material → `frontend/` (puerto 4200)
- Backend: Node.js + Express + TypeScript + SQLite (better-sqlite3) → `backend/` (puerto 3000)
- AI: Claude API (claude-sonnet-4-6) para análisis de fotos de comida

**Arranque:** Doble clic en `iniciar-diabetis.bat` o correr manualmente:
- Backend: `node -e "require('./node_modules/ts-node/register'); require('./src/index.ts')"`
- Frontend: `npx ng serve --open`

**API Key:** `backend/.env` → `ANTHROPIC_API_KEY=...`

**Fórmulas de cálculo dosis:**
- Dosis carbos = carbos / ICR
- Corrección = (glucemia_actual - glucemia_objetivo) / ISF
- Ajuste tendencia Dexcom: DoubleUp +20%, SingleUp +10%, etc.
- Total redondeado a 0.5u

**Estimación ratios desde TDD (si no los sabe):**
- ICR = 500 / TDD
- ISF = 1800 / TDD

**Nightscout:** La app lee `/api/v1/entries/current.json` del servidor Nightscout de la novia.
Dexcom → Dexcom Share → Nightscout → esta app.

**Estado:** MVP completo. Pendiente API Key de Anthropic para que funcione el análisis de fotos.

**Why:** App personal para gestión de insulina tipo 1 con IA para reconocimiento de comida.
**How to apply:** El usuario no sabe Python (no instalado), usamos Node.js para todo. No tiene conocimientos médicos avanzados, usar lenguaje simple en la UI.
