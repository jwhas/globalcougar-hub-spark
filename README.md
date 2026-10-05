# GlobalCougar Hub

Act as an expert frontend engineer and UI/UX designer. Build a complete, interactive, high-fidelity web application prototype in a single self-contained HTML file (using Tailwind CSS and standard vanilla JavaScript) for an international student platform at BYU called "GlobalCougar".

The design must faithfully digitize our team's 8 paper prototype screens with smooth navigation, realistic demo data, and a clean collegiate design system (BYU Navy `#002E5D`, Royal Blue `#0062B8`, warm slate grays, clean white cards, and subtle gold accents).

### Navigation & Architecture
Implement a persistent top navigation bar with:
- Platform branding: "GlobalCougar | BYU International Student Hub"
- User profile indicator: "JA - James"
- Screen Switcher / Tab dropdown so the user can freely jump between all 8 prototype screens, plus functional "[< Back to Home]" buttons on sub-pages.
- Persistent floating action button in the bottom-right corner with a bot icon that opens the AI Assistant from any screen.

---

### The 8 Prototype Screens to Implement:

#### 1. Screen 1: Welcome & Onboarding
- Header: "Welcome!" with toggle options for `[Login (Returning User)]` and `[Begin (New User)]`.
- Title: "INTERNATIONAL STUDENT HUB".
- Input: "Select Your Home Country" dropdown with common international student origins (e.g., South Korea, Brazil, Canada, Nigeria, Japan, Germany).
- Multi-select interactive chip group: "What describes your situation? (Select more than one)" with selectable bubble tags (e.g., "Undergraduate F-1", "Transfer Student", "Living On-Campus", "First Time in USA", "Married / Family", "Seeking On-Campus Job").
- CTA button: "Continue to Hub ->" that saves state and navigates to Screen 2.

#### 2. Screen 2: Central Hub / Home Dashboard
- Main navigation grid of 6 primary feature cards (hover effects, icons, short subtitles):
  1. [Check List / To-Do Journey] -> Opens Screen 3
  2. [Updates & Legal News] -> Opens Screen 4
  3. [Community & Slang] -> Opens Screen 5
  4. [AI Assistant] -> Opens Screen 6
  5. [BYU ISSS Office] -> Opens Screen 7
  6. [Career Help & Aid] -> Opens Screen 8
- Bottom section:
  - Inspiring quote card: *"The journey of a thousand miles begins with a single step. Welcome to your new home in Provo."*
  - High-quality BYU campus photo banner placeholder with a warm welcome message.

#### 3. Screen 3: Gamified "To-Do List" Journey Map
- Header: "To-Do List Roadmap" with view toggle pills: `[1 Month]`, `[1 Week]`, `[Timeline View]`.
- Date range display: "Current Window: 2026/09/28 – 2026/10/28".
- Visual interactive roadmap / game-board trail:
  - Render an SVG or styled flex winding path with circular stepping-stone nodes representing sequential onboarding milestones:
    - Node 1: "START: Obtain I-20 & Pay SEVIS Fee" (Completed)
    - Node 2: "F-1 Visa Interview & Approval" (Completed)
    - Node 3: "Book Flights to SLC / Provo" (Completed)
    - Node 4: "STOP / Mandatory Checkpoint: TB Health Screening & Immunizations" (Current Active Step - highlighted with a pulsing ring)
    - Node 5: "BYU Housing Check-In"
    - Node 6: "Open Local Bank Account"
    - Node 7: "ISSS In-Person Check-In (1351 WSC)"
    - Node 8: "FINISH: First Day of Classes" (Flag icon)
  - Clicking any node opens a detail drawer/modal showing required documents, office locations, and a button to toggle completion status.

#### 4. Screen 4: Campus & Legal Updates Feed
- Header with back button: "[< Back to Home] Updates & Announcements".
- Filter tabs: `[All]`, `[Legal / Visa]`, `[Campus Life]`, `[Deadlines]`.
- Chronological feed with severity badges:
  - 08/23/26: "Student Visa Renewal Deadline Notice" (Tag: High Priority / Legal - explanation of 60-day grace period and I-20 extension rules).
  - 08/23/26: "Weekly Internships & CPT Info Session for International Students" (Tag: Career / ISSS).
  - 08/21/26: "Club Rush in Brigham Square" (Tag: Campus Life - meet 100+ student organizations).
  - 08/21/26: "BYU Football Home Opener vs. Notre Dame" (Tag: Culture & Sports - student ticket lottery instructions).

#### 5. Screen 5: Community Hub & Slang Learning
- Header with back button: "[< Back to Home] Community".
- 4 interactive feature cards:
  1. [Join the International Student Online Forum]: Active discussion threads (e.g., "Best grocery stores for Asian spices in Orem", "Winter coats recommendations").
  2. [News: Get Your Updates]: Direct link into the legal/campus updates feed.
  3. [Career Help]: Portal to international job search resources.
  4. [Learn American & BYU Slang]: Flashcard / quiz module explaining local terms (e.g., "The Creamery", "Y Mountain", "Syllabus Week", "All-Nighter", "FHE", "Testing Center etiquette").

#### 6. Screen 6: AI Campus & Life Assistant
- Header with back button: "[< Back to Home] GlobalCougar AI Assistant".
- Interactive chat UI with conversational history matching the prototype:
  - Bot: *"Hi James! How can I help you navigate life at BYU today?"*
  - User: *"What is on my agenda this week?"*
  - Bot: *"Here is your schedule: You have your TB screening appointment tomorrow at 10:00 AM at the Student Health Center, followed by ISSS Document Check-In at 2:00 PM."*
  - User: *"I need to setup my bank account. Also where is my counselor's room?"*
  - Bot: *"To set up your bank account, bring your Passport, Form I-20, BYU ID, and proof of Provo address to Chase or Wells Fargo on Cougar Blvd (no SSN required for basic checking). Your international advisor's office is located in JNRB 4561."*
- Functional message input field: Allows typing questions with simulated responsive answers, plus clickable quick-prompt chips: `["Work Hour Limits"]`, `["Drivers License"]`, `["Winter Prep"]`.

#### 7. Screen 7: BYU ISSS Quick Actions & Directory
- Header with back button: "[< Back to Home] BYU International Student Services (ISSS)".
- Quick Actions & Contact Section:
  - [Email ISSS]: Displays `international@byu.edu` with one-click copy button.
  - [Phone Number]: Displays `(801) 422-2695` with office hours (M-F 8am-5pm).
  - [Schedule 1-on-1 Appointment]: Direct link button to the advisor booking calendar.
  - Office location card: "1351 Wilkinson Student Center (WSC), Provo, UT 84602".
- More Info / Official Links Section:
  - Clean directory cards pointing to deep ISSS documentation pages: F-1 Travel Signatures, CPT/OPT Work Authorization, Reduced Course Load Petitions, and Tax Filing (Sprintax).

#### 8. Screen 8: Career Help & Resources
- Header with back button: "[< Back to Home] Career Help".
- 3 primary interactive sections:
  1. [Scholarships]: Searchable directory of private and departmental scholarships open to non-US citizens / international students.
  2. [Career Advisor]: Schedule appointments with business and STEM career coaches familiar with H-1B, STEM OPT extensions, and CPT regulations.
  3. [Classes for International Students]: Curated list of BYU courses focused on English communication, American business culture, and academic writing.

---

### Output Requirements:
1. Deliver the entire solution in **one single, runnable HTML code block** containing all Tailwind CSS styles (via CDN), custom CSS animations, and vanilla JavaScript for full screen-switching logic and interactive widgets.
2. Ensure every button, tab, and card works smoothly to navigate between screens.
3. Make the visual design modern, accessible, clean, and polished so it can be evaluated directly for user testing.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/29832275-9ed9-5a38-a81e-b0ab68e067db).

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
