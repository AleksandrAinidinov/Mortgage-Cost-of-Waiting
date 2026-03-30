# Mortgage Cost of Waiting Engine

## Problem
Homeowners considering breaking or switching their mortgage are often paralyzed by market volatility. They ask, **"Is it worth waiting for a better rate?"** but have no way to quantify the actual daily cost of that delay. 

## What it does

It acts as a wrapper around Perch's public APIs to generate a "Time-to-Decision" analysis using just 7 inputs:
- **Daily Loss**: Shows the exact dollar amount lost per day by delaying a switch.
- **Break-Even Rate**: Calculates the exact rate the market needs to drop to in order to justify waiting.
- **Accurate Penalties**: Uses Perch's penalty calculator to get real IRD (Interest Rate Differential) costs instead of relying on basic estimates.

## Tech Stack
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript

## Quick Start
1. Clone the repository.
2. Run `npm install` in both the `frontend` and `backend` directories.
3. Run `npm run dev` in both directories to start the servers.
4. Open `http://localhost:5173` in your browser.

## API Integration Note
This prototype directly integrates with Perch’s APIs to power the decision engine with real data.

- Uses Perch’s **Pathfinder (rate comparison)** to fetch live mortgage rates and scenarios based on user inputs  
- Uses Perch’s **Penalty Calculator** to compute accurate IRD-based break costs instead of relying on static formulas  
- Combines both responses server-side to calculate:
  - **Daily cost of waiting**
  - **Break-even rate threshold**
  - **Net financial impact of switching vs delaying**

For demo purposes, external endpoints are defined in `backend/src/config/constants.ts` (in production, these would be stored in environment variables).
