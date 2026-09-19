# NTMVA — Network Topology Mapper & Vulnerability Analyzer

NTMVA is a cybersecurity application for network discovery, service analysis, vulnerability detection, and network topology visualization.

## Features

- Network discovery using Nmap
- Port and service detection
- Nmap NSE analysis
- CVE matching
- Evidence-based vulnerability detection
- Risk scoring
- Network topology visualization
- Device inspection
- Scan history
- Report generation

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- React Flow

**Backend**
- Node.js
- Express
- TypeScript

**Security Tools**
- Nmap
- Nmap NSE

## Architecture

```text
Nmap Scanner
     ↓
Nmap XML
     ↓
XML Parser
     ↓
Normalized Scan Model
     ↓
Evidence Collector
     ↓
Vulnerability Engine
     ↓
CVE Matching
     ↓
Risk Engine
     ↓
Dashboard & Reports


Project Structure
NTMVA/
├── src/
├── server/
├── public/
├── tools/
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts

Purpose
NTMVA was developed as a cybersecurity project to simplify network discovery, attack-surface analysis, and vulnerability assessment through a unified interface.
