# 🛡️ CascadeShield: Dependency Modelling & Failure Propagation Simulator

**CascadeShield** is a front-end simulation tool designed to visualize microservice failure paths, calculate live blast radii, and demonstrate real-time mitigation via circuit breakers. Built for rapid resilience testing and incident response visualization.

---

## 🚀 Key Features

* **Visual Failure Propagation (BFS Engine):** Simulates how a failure in a single core service (e.g., Auth or User DB) cascades downstream through interconnected microservices.
* **Preset Scenario Testing:** Instant 1-click simulation buttons for common outages:
  * *Scenario 1: Payment Outage & Recovery*
  * *Scenario 2: Auth Service Bottleneck*
  * *Scenario 3: User DB Primary Failure*
  * *Scenario 4: Database Replication Lag*
* **1-Click Mitigation Recovery:** Trip circuit breakers instantly to reroute traffic, halt blast propagation, and restore system health to safe states.
* **Live Blast Radius & Metrics:** Real-time calculation of System Impact %, Revenue Risk, and Single Points of Failure (SPOFs).
* **Causal Trace Log:** Terminal-style logging showing hop-by-hop failure progression for debugging and auditing.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6+)
* **Styling & UI:** Modern responsive dashboard design with custom animations and interactive node maps.
* **Architecture Logic:** Breadth-First Search (BFS) graph traversal for cascading failure simulation.

---

## 🎯 How to Use / Demo

1. Open the live application link.
2. Select any **Judge Preset Scenario** from the control bar to trigger a live failure wave.
3. Observe the causal trace log and the real-time update of system impact metrics.
4. Click **"1-Click Mitigate All"** or trip individual circuit breakers to watch the system recover.

---

## 💡 Real-World Use Cases

* **Chaos Engineering:** Pre-test system vulnerabilities before production outages occur.
* **Incident Response:** Quickly trace root causes during complex distributed system failures.
* **Developer Onboarding:** Visualize microservice dependency mapping in seconds.
*
