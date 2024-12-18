# HRollCall - Blockchain-Powered Attendance System

HRollCall is a decentralized attendance management system that leverages blockchain technology to provide secure, transparent, and efficient attendance tracking for educational institutions and organizations.

## Features

- **Decentralized Verification**: Secure attendance records using blockchain technology
- **QR Code Integration**: Easy attendance marking through QR code scanning
- **Role-Based Access**: Separate interfaces for teachers and students
- **Real-Time Updates**: Instant attendance tracking and verification
- **Tamper-Proof Records**: Immutable attendance data stored on the blockchain
- **Analytics Dashboard**: Comprehensive attendance statistics and reporting

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Decentralised Ledger**: Hedera 

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask wallet

### Installation

1. Clone the repository
```bash
git clone https://github.com/notnotrachit/hrollcall.git
cd hrollcall
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Start the development server
```bash
npm run dev
# or
pnpm run dev
```

4. Open your browser and visit `http://localhost:8080`

### Connecting to Hedera

1. Install MetaMask browser extension
2. Add Hedera Testnet
3. Connect your wallet to the application
4. Select your role (Teacher/Student)

## Usage

### For Teachers

- Create new classes
- Generate attendance QR codes
- View attendance records
- Download attendance reports
- Manage student enrollments

### For Students

- Scan QR codes to mark attendance
- Check enrolled classes

## Project Structure

```
src/
├── components/         # Reusable UI components
├── context/           # React context providers
├── lib/              # Utility functions and blockchain services
├── pages/            # Main application pages
└── styles/           # Global styles and Tailwind config
```
