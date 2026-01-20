# 🤖 AI Tool Selection Guide per Prompt

This document maps each execution prompt to the most suitable AI model based on the complexity and nature of the task.

**General Recommendation**: 
- **Claude 3.5 Sonnet**: Best for holistic architecture, complex logic, React components, and large context understanding. Use this for 90% of tasks.
- **GPT-4o / o1-preview**: Excellent for complex algorithm logic (Timetables, Route Optimization) and debugging obscure errors.
- **v0.dev / Bolt.new**: Use these specifically for generating the initial **Frontend UI Components** (forms, dashboards) to get beautiful Tailwind code quickly.

---

## 🏗️ Phase 0: Foundation
| Prompt | Title | Recommended AI | Why? |
| :--- | :--- | :--- | :--- |
| **0.1** | Core Architecture | **Claude 3.5 Sonnet** | Best at maintaining large context of multi-tenancy rules and RLS logic. |
| **0.2** | Auth & RBAC | **Claude 3.5 Sonnet** | Needs to understand Django + React nuance for security. |
| **0.3** | Billing Engine | **Claude 3.5 Sonnet** | Strong at logic flows and integration code (Stripe/Razorpay). |
| **0.4** | Dashboard & Search | **v0.dev + Claude** | Use v0.dev to design the Dashboard UI, then Claude to wire logic. |
| **0.5** | Student 360 Record | **v0.dev + Claude** | The UI needs to be stunning (v0.dev). Logic aggregation by Claude. |

## 🎓 Phase 1: Academics & People
| Prompt | Title | Recommended AI | Why? |
| :--- | :--- | :--- | :--- |
| **1.1** | Academic Year | **Claude 3.5 Sonnet** | Fundamental data modelling. |
| **1.2** | Classes & Subjects | **Claude 3.5 Sonnet** | Standard CRUD + Relational logic. |
| **1.3** | Student Admissions | **Bolt.new** | Can generate the full Multi-step Form Wizard UI instantly. |
| **1.4** | ID Card Designer | **Claude 3.5 Sonnet** | Complex canvas logic (Drag-and-Drop) requires strong coding logic. |
| **1.5** | Staff Management | **Claude 3.5 Sonnet** | Relational data handling. |
| **1.6** | Attendance System | **GPT-4o** | The "Auto-Absent" cron logic and Calendar math is great with GPT-4o. |
| **1.7** | Fees Engine | **GPT-4o** | Financial calculations and ledger logic benefit from GPT's precision. |

## 📚 Phase 2: Learning
| Prompt | Title | Recommended AI | Why? |
| :--- | :--- | :--- | :--- |
| **2.1** | Timetable System | **GPT-o1 (Reasoning)** | **Critical**. Scheduling algorithms are hard. Use a reasoning model. |
| **2.2** | Lesson Planning | **Claude 3.5 Sonnet** | Text-heavy content management. |
| **2.3** | Homework | **Claude 3.5 Sonnet** | CRUD + File handling. |
| **2.4** | Exams & Q-Bank | **Claude 3.5 Sonnet** | Structure data handling. |
| **2.5** | Results & OBE | **GPT-4o** | Complex statistical analysis and grade calculation. |

## 👥 Phase 3: Communication & HR
| Prompt | Title | Recommended AI | Why? |
| :--- | :--- | :--- | :--- |
| **3.1** | HR & Payroll | **GPT-4o** | Tax calcs, Leave offsets, and Salary formulas are math-heavy. |
| **3.2** | Comm Center | **Claude 3.5 Sonnet** | API integration (Twilio/WhatsApp) is standard. |
| **3.3** | Lead Gen CRM | **v0.dev + Claude** | Need a slick "Kanban Board" UI (v0.dev). |
| **3.4** | Website Builder | **Claude 3.5 Sonnet** | Complex logic for JSON-to-React rendering engine. |

## 🚀 Phase 4: Extended
| Prompt | Title | Recommended AI | Why? |
| :--- | :--- | :--- | :--- |
| **4.2** | Transport | **GPT-4o** | Route optimization algorithms. |
| **4.5** | Salah Tracker | **v0.dev** | Needs a gamified, visual UI. |
| **4.6** | Habit Tracker | **Claude 3.5 Sonnet** | Logic for scoring and behavior aggregation. |

## 🌐 Phase 5: Advanced
| Prompt | Title | Recommended AI | Why? |
| :--- | :--- | :--- | :--- |
| **5.2** | Live Class | **Claude 3.5 Sonnet** | Integration with Zoom APIs. |
| **5.3** | Mobile API | **Claude 3.5 Sonnet** | Efficient API design. |

## 🛠️ Phase 6: Admin Utilities
| Prompt | Title | Recommended AI | Why? |
| :--- | :--- | :--- | :--- |
| **6.1** | Certificates | **Claude 3.5 Sonnet** | PDF Generation libraries (ReportLab) are standard. |
| **6.4** | Helpdesk | **Claude 3.5 Sonnet** | Standard ticketing workflow. |
