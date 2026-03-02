<script setup>
// ...existing code...
import Menubar from 'primevue/menubar'

defineOptions({
  name: 'AppNavbar',
})

const navItems = [
  { label: 'Dashboard', active: true },
  { label: 'Profile' },
  { label: 'Logout' },
]
// ...existing code...
</script>

<template>
  <header class="navbar-wrap">

    <Menubar :model="navItems" class="main-navbar">
      <template #start>
        <span class="brand">Green Archive</span>
      </template>

      <template #item="{ item }">
        <a href="#" class="nav-link" :class="{ active: item.active }">
          {{ item.label }}
        </a>
      </template>
    </Menubar>
  </header>
</template>

<style scoped>
.navbar-wrap {
  width: 100%;
}


:deep(.main-navbar) {
  border: 0;
  border-radius: 0;
  background: #1f6b3a;
  padding: 0 28px;
  min-height: 56px;
}

:deep(.main-navbar .p-menubar-root-list) {
  margin-left: auto;
  gap: 8px;
}

:deep(.main-navbar .p-menubar-button) {
  color: #fff;
}

.brand {
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 18px;
  font-weight: 700;
  padding: 4px 12px;
  border-bottom: 2px solid transparent;
}
</style>
