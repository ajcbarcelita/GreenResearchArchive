<script setup>
import Footer from '@/components/Footer.vue'
import NavbarAdmin from '@/components/NavbarAdmin.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <header>
      <NavbarAdmin />
    </header>

    <main class="flex-1 flex items-center justify-center px-4 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <section class="w-full max-w-3xl rounded-2xl border border-[#cfe0d6] bg-white p-8 text-center shadow-sm">
        <h1 class="text-3xl font-extrabold text-[#17362b]">Repository</h1>
        <p class="mt-3 text-[#355347]">This is a placeholder view for admin repository access.</p>
      </section>
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>
