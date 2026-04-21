# Aura-Stream: Real-Time ML Personalization Engine

**Aura-Stream** is a high-performance, session-based content synthesis engine that leverages real-time Machine Learning (Logistic Regression) to personalize user feeds on the fly. By transforming every scroll and heart-click into a live training session, the system solves the "Cold Start" problem, providing instant feed adaptation without requiring traditional user authentication.

---

## 📸 Interface Preview



## 🚀 Core Features

* **Online Learning Loop:** Re-trains a unique Logistic Regression model in milliseconds on every user interaction for true real-time personalization.
* **Dual-Speed Telemetry:** Buffers passive interactions (skips) to optimize network bandwidth while force-syncing active interactions (likes) for immediate feed updates.
* **Auth-less Persistence:** Implements "Shadow Profiles" using cryptographic UUIDs and LocalStorage, allowing for deep personalization in anonymous guest sessions.
* **Exploration vs. Exploitation:** A hybrid ranking algorithm that balances "Smart" ML picks (80%) with "Discovery" items (20%) to prevent content echo chambers.
* **Snap-Scroll Architecture:** A responsive React UI designed for high-density image delivery with specialized FastAPI cache-control middleware.

---

## 🏗️ Technical Stack

- **Frontend:** React.js, Tailwind CSS, Lucide Icons, Vite.
- **Backend:** FastAPI (Python), Uvicorn (Asynchronous Server).
- **Machine Learning:** Scikit-Learn (Logistic Regression), Pandas, NumPy.
- **Database:** PostgreSQL, SQLAlchemy 2.0 (Modern Declarative Style).

---

## 🧠 System Architecture & Data Flow

The system operates on a closed-loop feedback mechanism:

1.  **Interaction:** The user interacts with the UI (Heart or Scroll).
2.  **Telemetry:** Data is categorized as "Active" or "Passive" and sent to the `/interact` endpoint.
3.  **Training:** The backend pulls the **Session-Specific History**, joins it with the **Movie Feature Set**, and trains a personal Logistic Regression model.
4.  **Inference:** The model scores 2,000+ candidates and sorts them by the probability of user interest.
5.  **Injection:** The top-ranked items are injected back into the frontend feed, replacing future content with personalized recommendations.

---

## 📈 ML Implementation Detail

The core recommendation logic utilizes **Genre-Feature Vectorization**. 
* Each movie is represented as a 25-dimensional binary vector (e.g., `Action: 1`, `Comedy: 0`).
* The model learns specific coefficients (weights) for these dimensions per user session.
* **Formula:** $P(Like) = \frac{1}{1 + e^{-(\beta_0 + \beta_1x_1 + ... + \beta_nx_n)}}$
* The system uses the calculated probabilities to rank the entire unseen catalog, ensuring the user always sees content with the highest predicted engagement score first.


Developed by [Vinayak Mishra] – *Engineering intelligence into every scroll.*