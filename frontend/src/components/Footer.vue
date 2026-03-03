<template>
  <footer class="footer-glass text-white">
    <div class="container mx-auto px-6 py-6">
      <div class="text-center text-sm opacity-95">
        © 2026 De La Salle University - College of Computer Studies. All rights reserved.
      </div>
    </div>
  </footer>
</template>

<script setup>

</script>

<style scoped>
.footer-glass {
  background-color: var(--color-dark-green);
  background-image: linear-gradient(90deg, var(--color-dark-green), var(--color-bright-green));
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  border-top: 3px solid rgba(255,255,255,0.06);
  box-shadow: 0 6px 18px rgba(10,20,15,0.15);
}

.footer-glass .container {
  max-width: 1100px;
}

</style>
