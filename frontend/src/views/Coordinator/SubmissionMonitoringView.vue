<script setup>
import { computed, ref } from 'vue'
import Footer from '@/components/Footer.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import { getStoredUser } from '../../services/authService'

const user = ref(getStoredUser())
const isFaculty = computed(
  () => String(user.value?.roleName || '').trim().toLowerCase() === 'faculty',
)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <header>
      <NavbarFaculty v-if="isFaculty" />
      <NavbarCoordinator v-else />
    </header>

    <main class="flex-1 flex items-center justify-center px-4 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <section class="w-full max-w-3xl rounded-2xl border border-[#cfe0d6] bg-white p-8 text-center shadow-sm">
        <h1 class="text-3xl font-extrabold text-[#17362b]">Submission Monitoring</h1>
        <p class="mt-3 text-[#355347]">This is a placeholder view. Submission monitoring tools will be added here.</p>
      </section>
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>
