# AegisFlow (InvoiceIQ) ⚡
**AI-Powered Financial Intelligence & Risk Management SaaS**

AegisFlow is a full-stack, enterprise-grade SaaS platform designed to bring advanced machine learning and predictive financial intelligence to the Pakistani business market. It moves beyond standard invoice tracking by utilizing AI to cluster client risk, forecast liquidity, and stress-test cash flow against macroeconomic shocks.

## 🚀 Tech Stack & Architecture

### **Frontend (The Interface)**
* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS with a custom Dark Mode Glassmorphism aesthetic.
* **Data Visualization:** Recharts (Cash Flow & Predictive Trajectories).
* **Localization:** Fully localized for Pakistani Rupees (PKR).
* **Hosting/Deployment:** Vercel.
* **Monitoring:** Vercel Web Analytics (@vercel/analytics).

### **Backend (The Logic Engine)**
* **Framework:** Python / FastAPI.
* **Hosting/Deployment:** Railway.
* **Machine Learning & AI:**
  * **K-Means Clustering (`scikit-learn`):** Analyzes historical payment delays and invoice volumes to assign mathematical Risk Tiers (High, Medium, Low) to clients.
  * **LSTM Neural Networks (`PyTorch`):** Long Short-Term Memory models to project 30, 60, and 90-day cash flow liquidity.
  * **Generative Adversarial Networks (GANs):** Simulates worst-case economic scenarios (Market Constriction, Hyper-Inflation) to stress-test financial survivability.

### **Database & Authentication (The Data Grid)**
* **Database:** Supabase (PostgreSQL).
* **Security:** Strict Row Level Security (RLS) policies.
* **Authentication:** Supabase Auth (Magic Links / Email Verification) locked to production routing.

---

## 🛠️ The Engineering Journey & Development Phases

The development of AegisFlow was executed in four distinct engineering phases, overcoming significant architectural and state-management challenges.

### **Phase 1: Foundation & The UI Grid**
The project began by establishing a secure, scalable data grid. We integrated Next.js with Supabase, setting up the relational tables for `clients` and `invoices`. The UI was engineered with a premium Glassmorphism design system, allowing users to generate branded PDF invoices and manage client profiles. 

### **Phase 2: The AI Processing Pipeline**
The core differentiator of AegisFlow is its Python-driven intelligence. We stood up a FastAPI backend on Railway to handle heavy mathematical computations that a Node.js server shouldn't process. We successfully linked the Next.js frontend to the Python API, allowing the platform to pass live database metrics into the K-Means and LSTM models.

### **Phase 3: System Debugging & Circuit Optimization**
This phase involved closing critical logical and routing loops:
* **The 422 Schema Sync:** Resolved a massive `422 Unprocessable Content` error by rigidly aligning the Next.js JSON payload with the Python Pydantic models, explicitly mapping variables to `Number()` to ensure clean data transfer.
* **The Recharts Render Bug:** Eradicated the classic `width(-1)` negative dimension rendering error by injecting explicit `minWidth={1}` DOM boundaries, preventing race conditions during the initial React layout pass.
* **The Dynamic Time-Sync:** Addressed a critical logical flaw where the static database lacked a clock. We engineered a frontend "Time-Sync" circuit that dynamically compares `due_date` against the live calendar date ($\Delta t$), visually flagging invoices as `Overdue` and recalculating the precise `avg_payment_delay_days` before sending the data to the AI.

### **Phase 4: Production & Market Readiness**
To transition from a developer environment to a live product:
* **Production Authentication:** Rewired the Supabase Site URLs and Redirect wildcards (`/**`) to seamlessly route email verifications to the live Vercel domain instead of `localhost`.
* **Telemetry & Analytics:** Injected Vercel Web Analytics into the root layout to monitor live traffic and user routing.
* **Native Feedback Loop:** Deployed an in-app `feedback` PostgreSQL table and UI modal, allowing beta testers to communicate directly with the database.

---

## 🔮 Future Roadmap
* Map the production Vercel build to a dedicated `.tech` domain.
* Expand the GAN stress-testing parameters to include industry-specific regional shocks.
* Automate the K-Means clustering via Supabase Edge Functions (CRON jobs) for background processing.

**Developed in Kasur, Punjab.**
