# SmartCAMPOST

Intelligent Parcel Tracking, Collection, and Delivery System Using QR Code, GPS, and AI

## Overview

SmartCAMPOST is an innovative digital solution designed to modernize postal logistics in Cameroon by leveraging CAMPOST's national infrastructure.
It enables users to track parcels in real-time, request home pickups, and manage payments digitally using Orange Money, MTN MoMo, or CAMPOST Money.

The system integrates:

- QR Code-based parcel identification
- GPS for delivery route tracking
- AI-powered predictions for delivery time and anomaly detection
- SMS and push notifications for transparent customer updates

## Objectives

- Simplify the customer experience through real-time tracking and digital payments.
- Reduce lost or delayed parcels via automated event scanning.
- Enable home pickup and delivery coordination through GPS.
- Optimize postal operations using AI-based data insights.

## System Architecture

Multi-platform Design:

### Web Application (Admin & Agents)

- Backend: Spring Boot (Java)
- Frontend: Vue.js

### Mobile Application (Clients & Agents)

- Flutter (cross-platform: Android/iOS)
- Database: MySQL
- Cloud Storage: For proof-of-delivery photos and documents

## Key Features

| Module           | Description                                                                |
| ---------------- | -------------------------------------------------------------------------- |
| Client App       | Create parcel requests, pay online, track shipments, receive notifications |
| Agent App        | Scan QR Codes, update parcel status, handle pickup and delivery            |
| Admin Dashboard  | Supervise all parcels, agents, and payments across agencies                |
| QR Code Tracking | Unique QR for each parcel, scanned at each transit point                   |
| AI Integration   | Predict delivery time, detect delays or lost parcels                       |
| Digital Payment  | Integrated Orange Money, MTN Money, and CAMPOST Money APIs                 |

## Technologies Used

| Layer             | Technology                |
| ----------------- | ------------------------- |
| Frontend (Web)    | Vue.js                    |
| Mobile            | Flutter                   |
| Backend           | Spring Boot (Java)        |
| Database          | MySQL                     |
| AI                | Python (predictive model) |
| Version Control   | Git & GitHub              |
| DevOps (optional) | Docker, CI/CD             |
| Tools             | StarUML, MySQL Workbench  |

## Database & Modeling

- MCD (Conceptual Data Model) - defines entities such as Client, Parcel, Agent, Agency, Payment, etc.
- MLD (Logical Data Model) - defines tables, PK/FK, constraints, and relationships.
- UML Diagrams:
  - Use Case Diagram
  - Class Diagram
  - Sequence Diagrams
  - Activity Diagram

## Innovation

- Combines AI + QR Code + GPS for intelligent tracking.
- Digitalization of postal operations across Cameroon.
- Predictive analytics to enhance logistics efficiency.
- End-to-end transparency for both agents and clients.

## How It Works

1. Client creates or requests pickup via mobile app.
2. System generates a unique QR Code for the parcel.
3. Agent scans QR at each transit or delivery stage.
4. Client receives automatic SMS or push notifications on status updates.
5. Payment and invoice generation happen seamlessly in-app.
6. AI predicts estimated delivery time based on distance and past trends.

## Installation (Local Development)

Clone the repository:

```bash
git clone https://github.com/your-username/SmartCAMPOST.git
cd SmartCAMPOST
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd ../frontend
npm install
npm run serve
```

### Mobile

```bash
cd ../mobile
flutter pub get
flutter run
```

## Project Structure

```text
SmartCAMPOST/
├── backend/          # Spring Boot backend
├── frontend/         # Vue.js web interface
├── mobile/           # Flutter app
├── database/         # MySQL scripts (MCD, MLD, schema)
├── docs/             # UML diagrams, reports, documentation
└── README.md         # Project overview
```

## Development Methodology

Hybrid approach:

- Merise and UML for analysis and modeling.
- Agile for iterative development and testing.

## Author

Nguend Arthur Johann
Software Engineering Student - ICT University, Cameroon

Email: <nguend.johann@ictuniversity.edu.cm>
