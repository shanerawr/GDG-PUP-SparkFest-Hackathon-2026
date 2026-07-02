# BantayBayan: Ang boses ng bayan para sa ligtas na pamayanan

BantayBayan is a crowdsourced incident mapping and reporting platform built for disaster-prone and urban communities.

## Project Brief
When disaster strikes or infrastructure fails, the gap between citizens experiencing the hazard and the authorities meant to fix it is dangerously wide. BantayBayan transforms everyday citizens into active community protectors by allowing them to pin real-time hazards—such as floods, downed power lines, or road accidents—directly onto a map.

* **Role-Based Authentication:** A secure login and signup system separates access levels. Citizens can submit, edit, and track their reports, while emergency responders (LGU, PNP, BFP, DRRMO, and Barangay Responders) and administrators access specialized dashboard controls.
* **Proactive Alerts:** Users categorize incidents using color-coded severity tags (*Minor*, *Needs Attention*, *Urgent*, *Critical*). Citizens can save their daily routes, and the app calculates if a hazard is reported along their path, sending real-time notification alerts.
* **Reliable Crowdsourcing:** To prevent spam and ensure reliable data, entries are community-verified through a public upvote system. Reports that have not yet been officially acknowledged by authorities display an **Unverified Disclaimer** badge to prevent misinformation.
* **Multi-Agency & Municipality Routing:** BantayBayan provides LGUs and emergency responders with a centralized dashboard. Reports are automatically tagged by municipality/location and routed to the appropriate government agency (e.g., PNP for Peace & Order, BFP/DRRMO for Fire and Flood, and localized filtering for Barangay responders).
* **Accountability:** Transparent progress tags (*Unresolved*, *Pending Resolution*, *Resolved*) hold authorities accountable, allowing citizens to see exactly when an issue is being addressed.

This solution directly addresses **SDG 9 (Industry, Innovation & Infrastructure)** and **SDG 11 (Sustainable Cities & Communities)** by leveraging technology to build smarter, safer, and more inclusive communities.

## Team Name and Members
* **Team Name:** Debug Chewy Ratz
* **Members:**
  * John Andrew Lim
  * Razzielle Rios
  * Shanessa Tugaoen
  * Aisea Jevinissi Vidal

## Google & Developer Technologies Used
* **Google Maps Platform:** Used for rendering maps, placing interactive color-coded hazard pins, search/address resolution, and tracking saved routes.
* **Google Cloud Platform (GCP):** Used for managing Maps API credentials, access restrictions, and billing dashboards.
* **Figma:** Used for UI/UX wireframing, component design, and prototyping responsive application layouts.
* **Antigravity IDE:** Used as the primary development environment to build, refactor, and debug the application.
* **MongoDB Atlas & Express:** Used for backend database storage of citizen accounts, report records, active comments, and notification events.
* **React, Vite, & TailwindCSS:** Used to build a responsive, high-performance web interface.

## Getting Started / How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shanerawr/GDG-PUP-SparkFest-Hackathon-2026.git
   cd GDG-PUP-SparkFest-Hackathon-2026
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   MONGODB_URI=your_mongodb_atlas_connection_string
   ```

4. **Run the application (Frontend & Backend):**
   ```bash
   # Terminal 1: Start the backend server
   node api/index.js

   # Terminal 2: Start the Vite dev server
   npm run dev
   ```

## Test Accounts

To facilitate evaluation and testing of role-based features, the database is pre-seeded with the following test accounts. You can use these credentials to log in and evaluate different user roles, capabilities, and dashboards:

| Account Role | Username | Password | Key Features & Access to Test |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin` | Full administrative access. Test overall system oversight, citizen ID verification, report moderation, and agency management. |
| **Verified Citizen** | `testcitizen` | `Testcitizen123` | Pre-verified citizen account with existing report history and 35+ upvotes. Test submitting verified hazard pins, saving travel routes, upvoting, and commenting. |
| **Unverified Citizen** | `test-shane` | `test-shane` | Standard citizen account with pending verification status. Test submitting reports (displays the **Unverified Disclaimer** badge), exploring community feeds, and requesting verification. |
| **Emergency Responder (Malabon)** | `bfp-malabon` | `bfp-malabon` | Bureau of Fire Protection responder for Malabon City. Access specialized responder dashboards, view agency-routed emergencies (Fire/Flood), and update incident progress tags (*Unresolved*, *Pending Resolution*, *Resolved*). |
| **LGU Officer (Malabon)** | `lgu-malabon` | `lgu-malabon` | Local Government Unit official for Malabon City. Access localized municipal oversight dashboards, monitor road/infrastructure hazards, and manage community safety reports within the jurisdiction. |
| **Emergency Responder (Manila)** | `bfp-manila` | `bfp-manila` | Bureau of Fire Protection responder for City of Manila. View Manila-specific fire and flood emergencies and manage dispatch statuses. |
| **LGU Officer (Manila)** | `lgu-manila` | `lgu-manila` | Local Government Unit official for City of Manila. Monitor all public works, infrastructure, and utility hazard reports across Manila. |

> [!TIP]
> **Quick Test Tip:** You can open an incognito or private browser window to log in as a citizen (e.g., `testcitizen`) while keeping an LGU/Responder account (`bfp-malabon` or `lgu-malabon`) open in your main window to test real-time report routing, upvoting, and status updates!

> [!NOTE]
> This project was developed for the **GDG PUP SparkFest Hackathon 2026**.
