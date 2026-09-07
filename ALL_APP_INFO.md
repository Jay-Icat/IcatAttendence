# ICAT-Attendance — Complete Application Information & Codebase Guide

> **Document Type:** Master Codebase Reference & Architecture Manual  
> **System Name:** ICAT-Attendance Portal (`icat-attendance`)  
> **Target Organization:** ICAT Design & Media College  
> **Authorized Domain:** `@icat.ac.in`  
> **Last Verified Branch:** `Main`  
> **Framework:** Next.js 16.3.0 (App Router), React 19, Firebase v12, Google Apps Script v4.3.0  

---

## 1. Executive Summary & Purpose

**ICAT-Attendance** is an automated, real-time student attendance management web portal built specifically for the faculty and administration of **ICAT Design & Media College**. 

The system enables faculty to:
1. Authenticate securely using their official `@icat.ac.in` Google Workspace account.
2. Select their department, batch, date, session period, module title, and module tutor.
3. Rapidly mark student attendance (**P**resent, **A**bsent, **OD** / On-Duty) via desktop or mobile interface.
4. Concurrently sync attendance data into **two storage tiers**:
   - **Cloud Firestore (`attendance_history`)**: Stores historical records of each session with logged-in faculty credentials, session metrics, and student rosters (with an automated 1-month retention policy).
   - **Live Master Google Sheet via Google Apps Script (GAS)**: Deterministically inserts attendance marks directly into departmental tabs and batch sub-tables using an anchor-indexing algorithm without popup blockers or CORS constraints.

---

## 2. Technology Stack & Dependencies

### Core Framework & Runtime
- **Next.js 16.3.0**: App Router architecture (`src/app/`).
- **React 19.0.0 & React DOM 19.0.0**: Functional components, React Hooks (`useState`, `useEffect`, `useMemo`, `useContext`).
- **Node.js**: Server runtime supporting Next.js server actions and API route proxies.

### Cloud & Database Services
- **Firebase Authentication (v12.18.0)**: Google OAuth Provider with strict `@icat.ac.in` hosted domain (`hd`) filtering.
- **Cloud Firestore**: Real-time NoSQL cloud database for storing faculty attendance session history.
- **Google Sheets API / GViz (Google Visualization API)**: Read-only live ingestion without OAuth quota or API key costs (`/gviz/tq?tqx=out:json`).
- **Google Apps Script (GAS)**: Custom backend webhook engine (`AutoAttendenceAPI.gs` / v4.3.0) deployed as a Web App to write directly to Google Sheets cells.

### UI & Enhancements
- **Lucide React (`^0.468.0`)**: Modern vector iconography.
- **Canvas Confetti (`^1.9.4`)**: Celebratory animation upon successful attendance sync.
- **Pure CSS Glassmorphism (`src/app/globals.css`)**: Dark/Light mode theme engine with ambient glowing backdrops, customized scrollbars, and mobile-optimized touch controls.

---

## 3. High-Level Architecture & Data Flow

```
                                  +---------------------------------------+
                                  |         ICAT Faculty Member           |
                                  |   (Mobile Safari/Chrome or Desktop)   |
                                  +-------------------+-------------------+
                                                      |
                                        Google Sign-in (@icat.ac.in)
                                                      v
                                  +---------------------------------------+
                                  |       Next.js 16 Frontend App         |
                                  |     (AuthContext & UI Components)     |
                                  +---------+-------------------+---------+
                                            |                   |
                     GViz Real-time Read    |                   | Sync Submission
                     (Direct Sheet Fetch)   |                   |
                                            v                   v
                        +----------------------+     +----------------------------------+
                        | Google Spreadsheet   |     | Next.js API Routes               |
                        | (Dept & Helper Tabs) |     | - /api/sync (Server Proxy)       |
                        +----------------------+     | - /api/logs (Filesystem Logger)  |
                                                     +-------+------------------+-------+
                                                             |                  |
                                            Firestore Write  |                  | Forward Payload
                                                             v                  v
                                                +------------------+    +-----------------------+
                                                | Cloud Firestore  |    | Google Apps Script    |
                                                | (History Doc &   |    | Web App (/exec)       |
                                                |  1-Month Purge)  |    | (Resilient Anchor V4) |
                                                +------------------+    +-----------+-----------+
                                                                                    |
                                                                        Write Marks | To Exact Cells
                                                                                    v
                                                                        +-----------------------+
                                                                        | Master Google Sheet   |
                                                                        | (UID, GT, GDD, etc.)  |
                                                                        +-----------------------+
```

---

## 4. Codebase Directory & File Inventory

```
d:\Projects\AutoAttendence\
├── .env / .env.example / .env.local  # Firebase config & allowed domain
├── AGENTS.md                         # Next.js agent rule configuration
├── AutoAttendanceAPI.gs              # Google Apps Script master source code
├── GAS_CODE_TO_COPY.js               # Copy-ready script for administrators
├── GAS_CODE_TO_COPY_V3.js            # Alternate copy script
├── google_apps_script.js             # Local mirror of the Apps Script engine
├── app-logs.json                     # Server log file (max 1000 entries)
├── firestore.rules                   # Firestore security access rules
├── next.config.mjs                   # Next.js configuration
├── package.json                      # Dependencies and scripts
├── public/                           # Static assets
│   ├── icat-emblem.png               # Official ICAT crest emblem
│   └── ...
└── src/
    ├── app/
    │   ├── layout.js                 # Global HTML root layout, meta tags, AuthProvider
    │   ├── page.js                   # Primary Attendance Taking interface
    │   ├── globals.css               # Design system, themes, glassmorphism, responsive styles
    │   ├── admin/
    │   │   ├── page.js               # Admin Page Server Component
    │   │   └── AdminClient.js        # Admin Dashboard (Password protected, URL config, Script guide)
    │   ├── history/
    │   │   ├── page.js               # History Page Server Component
    │   │   └── HistoryClient.js      # Monthly Firestore Attendance Logs viewer & student roster
    │   ├── log/
    │   │   ├── page.js               # System Log Page Server Component
    │   │   └── LogClient.js          # Live viewer for app-logs.json
    │   └── api/
    │       ├── logs/route.js         # GET, POST, DELETE system logs
    │       ├── sheets/route.js       # GET/POST proxy to Google Apps Script
    │       └── sync/route.js         # Server-to-server POST proxy to GAS (No CORS)
    ├── components/
    │   ├── Header.jsx                # Brand emblem, status pill, user badge, theme toggle, date/dept dropdowns
    │   ├── StudentRow.jsx            # Row layout for individual students with P / A / OD toggle buttons
    │   ├── WeekendHoliday.jsx        # Weekend holiday alert screen (Sat & Sun)
    │   ├── LoginScreen.jsx           # Google OAuth sign-in modal with domain constraints
    │   ├── ActionBar.jsx             # Filter chips, batch dropdown, quick batch actions (All P, All A, Invert)
    │   ├── StudentCard.jsx           # Grid-card presentation for students with history dots
    │   ├── StudentList.jsx           # Grid list wrapper for StudentCards
    │   ├── FloatingSyncBar.jsx       # Floating bottom action bar with count and sync trigger
    │   ├── StatsOverview.jsx         # Attendance metric cards and progress distribution bar
    │   ├── SessionBar.jsx            # Date & Session switcher control bar
    │   ├── DefaultersModal.jsx       # Modal identifying students below 75% attendance
    │   ├── RandomStudentModal.jsx    # Random student selector tool for interactive classes
    │   └── SetupGuideModal.jsx       # In-app setup & connection diagnostic modal
    ├── context/
    │   └── AuthContext.jsx           # Firebase Authentication Context Provider & state hooks
    └── lib/
        ├── constants.js              # Attendance statuses, sessions, default URLs, date utilities
        ├── firebase.js               # Firebase Client initialization & configuration detection
        ├── firestoreHistory.js       # Firestore save, fetch, and monthly purge functions
        ├── googleSheets.js           # Client-side coordination for sheets and sync execution
        ├── gvizSheets.js             # GViz parser for Google Sheet tabs & helper lists
        ├── logger.js                 # Universal client logger transmitting to /api/logs
        └── mockData.js               # Fallback mock data for testing & simulation
```

---

## 5. Subsystems & Key Modules Explained

### 5.1. Authentication & Security Layer
- **Source Files**: `src/context/AuthContext.jsx`, `src/lib/firebase.js`, `firestore.rules`
- **Mechanism**:
  - Uses Firebase Auth `signInWithPopup(auth, googleProvider)`.
  - Configures `GoogleAuthProvider.setCustomParameters({ hd: 'icat.ac.in', prompt: 'select_account' })`.
  - On auth state change or login callback, it enforces `email.endsWith('@' + allowedDomain)`. If a user attempts to authenticate using a personal Gmail or non-ICAT account, they are immediately signed out with an `Access Denied` alert.
  - `firestore.rules` enforces that only authenticated users (`request.auth != null`) can read and write to `attendance_history`.

### 5.2. Google Sheets Reader (GViz Engine)
- **Source Files**: `src/lib/gvizSheets.js`, `src/lib/googleSheets.js`
- **Mechanism**:
  - Leverages the Google Visualization API endpoint:
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`
  - Does not require server-side Google Service Accounts or API keys; works as long as the spreadsheet is accessible within the organization or via link sharing.
  - **Dynamic Department Discovery**: Preconfigured for all ICAT departments:
    `UID`, `GAD`, `GDD`, `GT`, `GRD`, `IDS`, `ANIM`, `VFX`, `Photography`, `MMT`, `FAD`.
  - **Helper Parsing (`fetchHelperList`) & Strict 3-Tier Module Filtering**:
    - Queries `Helper_Modules` sheet with 3 strict criteria:
      1. **Odd Semester Filter**: Col D (`Sem`) must be odd (`1, 3, 5, 7`).
      2. **Strict Program Title Isolation**: Col B (`Program Title`) must match `activeProgram` exactly (e.g. `PGPPGDD` from `PGPPGDD - I`, `MMT MSc` from `MMT MSc - I`, or `activeSheet`).
      3. **Strict Academic Year Scoping**: Col C (`Year`) must match `activeYearNumber` (`1, 2, 3, 4`) resolved from `selectedBatch` via `parseYearNumber()`. No cross-year fallback dumping.
    - **Guaranteed Isolation & Precision**:
      - `GDD` Year 1: Exactly 8 odd modules.
      - `GDD` Year 2: Exactly 12 odd modules.
      - `GDD` Year 3: Exactly 13 odd modules.
      - `PGPPGDD` Year 1: Exactly 6 odd modules (strictly isolated from `GDD`).
      - `MMT` Year 1: Exactly 8 odd modules (strictly isolated from `MMT MSc`).
      - `MMT MSc` Year 1: Exactly 9 odd modules (strictly isolated from `MMT`).
      - `ANIM` Year 1/2/3/4: Scoped strictly per year.
    - Employs an in-memory cache (`helperCache`) to avoid re-fetching static helper sheets across department tab and year switches.
    - Automatically clears the selected module whenever the active program or year changes if the previous module does not belong to the newly scoped module list.
    - Queries `Helper_Tutors` sheet: Extracts faculty names from Column B (or fallback Column A).
  - **Student Parser**:
    - Column A: Roll Number / Student ID.
    - Column B: Student Name.
    - Column C: Department Name.
    - Column D: Batch / Year.
    - Column H onward: Historic session attendance marks.

### 5.3. Google Apps Script Attendance Sync Engine (v4.3.0)
- **Source Files**: `AutoAttendanceAPI.gs`, `google_apps_script.js`, `src/app/api/sync/route.js`
- **Execution Workflow**:
  1. The client sends payload to Next.js API `/api/sync`.
  2. `/api/sync` runs server-to-server fetch (`method: 'POST'`) to the Google Apps Script Web App URL (`.../exec`). This eliminates browser CORS restrictions and follows Google 302 redirects cleanly.
  3. **Structural Sheet Indexing (`buildSheetIndex`)**:
     - Scans the first 35 rows and columns from H (Col 8) onwards to identify exact date columns.
     - Parses all sub-batch blocks in the active sheet, identifying:
       - `titleRow`: Row where Module Title is stored.
       - `tutorRow`: Row where Module Tutor is stored.
       - `sessionRow`: Header row containing `S1`, `S2`, `S3`.
       - `students`: Array of student rows belonging to that batch.
  4. **Target Column Resolution**:
     - Resolves the date's base column.
     - Calculates session offset: `S1` (+0), `S2` (+1), `S3` (+2).
  5. **Auto-Healing**:
     - If previous entries accidentally overwrote header rows (e.g. putting 'P' in the tutor row or session row), the engine automatically cleans and restores the session label (`S1`, `S2`, `S3`) and resets styling.
  6. **Strict Guard Rails**:
     - Strictly enforces: `targetRow > sessionRow`.
     - Student marks are never written to header rows.
     - Cell colors are automatically applied:
       - **P**: Green (`#dcfce7` background, `#166534` text)
       - **A**: Red (`#fee2e2` background, `#991b1b` text)
       - **L**: Yellow (`#fef3c7` background, `#92400e` text)
       - **OD**: Purple (`#ede9fe` background, `#6d28d9` text)

### 5.4. Cloud Firestore History & Retention Subsystem
- **Source Files**: `src/lib/firestoreHistory.js`, `src/app/history/HistoryClient.js`
- **Collection Name**: `attendance_history`
- **Stored Document Schema**:
  ```javascript
  {
    date: "YYYY-MM-DD",
    monthKey: "YYYY-MM",        // e.g. "2026-09"
    timestamp: 1788772800000,
    createdAt: ServerTimestamp,
    teacherName: "Faculty Name", // Logged-in Google profile name
    teacherEmail: "faculty@icat.ac.in",
    teacherPhoto: "https://lh3.googleusercontent.com/...",
    department: "GT",
    batch: "IV",
    module: "Game Architecture",
    moduleTutor: "Faculty Member",
    session: "Session 1 (09:15 AM - 11:00 AM)",
    presentCount: 24,
    absentCount: 2,
    odCount: 1,
    totalMarked: 27,
    studentRecords: [
      { roll: "101", name: "Student Name", mark: "P", batch: "IV" },
      ...
    ]
  }
  ```
- **Automated 1-Month Retention (`purgeOldMonthHistory`)**:
  - Whenever a new history record is saved, the application initiates an asynchronous purge of any document where `monthKey < currentMonthKey`.
  - The `/history` page exclusively queries documents matching `monthKey == currentMonthKey`, ensuring clean month-to-month rollovers.

### 5.5. Administration Portal (`/admin`)
- **Source Files**: `src/app/admin/AdminClient.js`, `src/app/admin/page.js`
- **Security**: Hardcoded administrative password (`rajivicatdrao`).
- **Functionality**:
  - Allows administrators to update and persist the target Google Sheet URL and Apps Script `/exec` URL in `localStorage`.
  - Provides a comprehensive, step-by-step guide for Google Apps Script deployment (covering both first-time deployment and "New version" updates).
  - Features 1-click clipboard copying of the complete `AutoAttendenceAPI.gs` code.

### 5.6. Logging System (`/log` & `/api/logs`)
- **Source Files**: `src/lib/logger.js`, `src/app/api/logs/route.js`, `src/app/log/LogClient.js`
- **Storage**: Server-side JSON file `app-logs.json`.
- **Capping**: Automatically limits history to the latest 1,000 log events.
- **Log Levels**: `info`, `warn`, `error`, `exception`.

---

## 6. Business Logic, Rules & Conventions

### UI Terminology & Labeling Convention
- **Primary Top Selector (Header)**: Labeled **"Batch"** (formerly "Department"). Displays the department / major program code (`Batch: UID`, `Batch: GDD`, `Batch: GT`, etc.).
- **Sub-Selector (Control Bar)**: Labeled **"Year"** (formerly "Batch"). Filters the academic year / cohort within that batch (e.g. `Year: GDD - I`, `Year: GDD - II`, `Year: PGPPGDD - I`).
- **Student Badges & History**: Renders as `Year ...` and `Batch & Year`.

### Session Schedules
Configured in `src/lib/constants.js`:
- **S1 (Session 1)**: `09:15 AM - 11:00 AM`
- **S2 (Session 2)**: `11:15 AM - 01:00 PM`
- **S3 (Session 3)**: `02:00 PM - 04:00 PM`

### Smart Session Detection
`getSmartCurrentSession()` evaluates the client's current time:
- Before 11:15 AM (< 675 min): Defaults to `S1`.
- Between 11:15 AM and 2:00 PM (675–839 min): Defaults to `S2`.
- 2:00 PM onwards (>= 840 min): Defaults to `S3`.

### Weekend Holiday Behavior
- Saturday (Day 6) and Sunday (Day 0) are detected via `isWeekend` and `isDateWeekend`.
- Automatically displays `<WeekendHoliday />` card explaining that attendance is not required on weekends.
- The date selector enables browsing any day of the current calendar month (`getDaysInCurrentMonth()`).

### Attendance Status Codes
Defined in `ATTENDANCE_STATUS`:
- **`P`**: Present (Green badge)
- **`A`**: Absent (Red badge)
- **`OD`**: On-Duty / Excused (Purple badge)

### Local Storage Keys
Defined in `STORAGE_KEYS`:
- `autoattend_theme`: Active visual theme (`dark` / `light`).
- `autoattend_active_dept`: Last selected department tab.
- `autoattend_sheet_url`: Custom Google Spreadsheet URL.
- `autoattend_script_url`: Custom Apps Script Web App URL.

---

## 7. Environment Variables Reference

Defined in `.env` / `.env.local` / `.env.example`:

| Variable Name | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase Web API Key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth Domain | `icat-attendance.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase Project ID | `icat-attendance` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage Bucket | `icat-attendance.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Cloud Messaging Sender ID | `1234567890` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase Application ID | `1:123456:web:...` |
| `NEXT_PUBLIC_ALLOWED_ORG_DOMAIN` | Yes | Restricted Email Domain for Faculty Sign-In | `icat.ac.in` |
| `NEXT_PUBLIC_APPS_SCRIPT_URL` | Optional | Default fallback Google Apps Script Web App URL | `https://script.google.com/macros/s/.../exec` |

---

## 8. Development, Maintenance & GitHub Update Protocol

1. **Local Development**:
   ```bash
   npm run dev
   ```
2. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```
3. **Linting**:
   ```bash
   npm run lint
   ```
4. **Maintenance Protocol for GitHub Pushes**:
   Whenever changes are made to features, database schemas, Apps Script functions, or configuration:
   - Update this file (`ALL_APP_INFO.md`) to reflect the latest changes.
   - Commit the updated documentation alongside code changes to preserve full project context across conversations and contributors.
