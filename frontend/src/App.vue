<template>
  <div class="app-layout">
    <aside class="sidebar">
      <h2>🔮 Jyotish Portal</h2>
      <nav>
        <router-link to="/">Dashboard</router-link>
        <router-link to="/clients">Clients</router-link>
        <router-link to="/clients/new">+ New Client</router-link>
      </nav>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>
