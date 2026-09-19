# NTMVA — Network Topology Mapper & Vulnerability Analyzer

NTMVA (Network Topology Mapper & Vulnerability Analyzer) is a cybersecurity application designed to discover network devices, analyze exposed services, identify potential vulnerabilities, and visualize network topology through a unified interface.

---

## Features

- Network discovery using Nmap
- Port scanning and service detection
- Nmap NSE script analysis
- CVE matching
- Evidence-based vulnerability detection
- Vulnerability risk scoring
- Network topology visualization
- Device inspection
- Scan history
- Vulnerability analysis
- Report generation

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Flow

### Backend
- Node.js
- Express
- TypeScript

### Security Tools
- Nmap
- Nmap NSE

---

# Requirements

Before running NTMVA, install the following:

- Node.js 18+ or newer
- npm
- Nmap
- Git

---

# 1. Install Nmap

NTMVA uses Nmap for network discovery, port scanning, service detection, and NSE-based analysis.

## Windows

Download and install Nmap from:

https://nmap.org/download.html

After installation, open Command Prompt or PowerShell and verify:

```bash
nmap --version


Linux
For Debian/Ubuntu:
sudo apt update
sudo apt install nmap
Verify:
nmap --version

macOS
Using Homebrew:
brew install nmap
Verify:
nmap --version

2. Install Node.js
Download and install Node.js from:
https://nodejs.org/
Verify the installation:
node --version
npm --version

3. Clone the Repository
Clone the NTMVA repository:
git clone https://github.com/Ashish2846/NTMVA.git
Move into the project directory:
cd NTMA
If your repository folder is named NTMVA, use cd NTMVA.

4. Install Project Dependencies
Install the required Node.js packages:
npm install
This installs the dependencies listed in package.json.

5. Run NTMVA
Start the development application using the project's configured npm script:
npm run dev
After starting the application, open the local URL shown in the terminal, usually something similar to:
http://localhost:5173

6. Using NTMVA
Once the application is running:
1. Open the NTMVA dashboard.
2. Configure the scan options.
3. Enter the target IP address or network.
4. Start the Nmap scan.
5. NTMVA processes the Nmap results.
6. Discovered devices and services are displayed.
7. Vulnerability analysis is performed using collected evidence.
8. CVE information is matched where applicable.
9. Risk levels are calculated.
10. Network topology and scan results can be reviewed through the dashboard.


Architecture
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
Dashboard / Reports / History

Project Structure
NTMVA/
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   └── services/
│
├── server/
│   ├── data/
│   ├── services/
│   └── index.ts
│
├── tools/
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.server.json
├── vite.config.ts
└── index.html

Security Notes
NTMVA is intended for authorized security testing and network assessment.
Only scan systems and networks that you own or have explicit permission to test.
Do not use NTMVA to scan unauthorized systems.

Project Purpose
NTMVA was developed as a cybersecurity project to simplify network discovery, attack-surface analysis, vulnerability identification, and network topology visualization through a unified interface.

Author
Ashish Arman Toppo
GitHub:
https://github.com/Ashish2846
