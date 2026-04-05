# Astro Portal — Frontend

Vue 3 single-page application for the Astro Portal CRM.

## Stack

- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Pinia
- **Router**: Vue Router 4
- **HTTP**: Axios
- **Charts**: Chart.js + vue-chartjs
- **Dates**: Day.js

## Project Structure

```
frontend/src/
├── App.vue              # Root layout: sidebar, header, profile modal
├── main.js              # App entry point
├── style.css            # Tailwind imports
├── views/               # Page components
│   ├── Dashboard.vue    # KPIs, charts, recent activity
│   ├── CustomerList.vue # Customer table with search
│   ├── CustomerForm.vue # Create/edit customer
│   ├── CustomerDetail.vue # Profile with tabs
│   ├── VisitForm.vue    # Create/edit visit
│   ├── SolutionList.vue # Solution catalog
│   ├── SolutionForm.vue # Create/edit solution
│   ├── TemplateList.vue # Templates + send email/WhatsApp + logs
│   ├── TemplateForm.vue # Create/edit template
│   ├── AdminUsers.vue   # User management (admin only)
│   └── Login.vue        # Login page
├── api/                 # Axios API layer
├── stores/              # Pinia state management
└── router/              # Vue Router config
```

## API Proxy

Vite proxies `/api/*` to `http://backend:8000` (stripping `/api` prefix).
