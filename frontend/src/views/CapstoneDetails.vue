<script setup>
import Navbar from '@/components/Navbar.vue';
import Footer from '@/components/Footer.vue';
</script>

<template>
    <div class="min-h-screen flex flex-col bg-ash-white font-Montserrat">

    <header>
      <Navbar />
    </header>

    <main class="flex-1 container mx-auto px-6 py-6 pt-32">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- Left: Capstone Project Details -->
          <section class="md:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-7">
            <h2 class="text-green-text text-3xl font-semibold mb-6">Capstone Project Details</h2>

            <div class="space-y-5 text-base text-gray-800">

              <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Title</div>
                <div class="text-gray-900 font-medium text-base">Green Archive : A Capstone Repository Platform for DLSU CCS</div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Authors</div>
                  <div class="text-gray-900 text-base">Aron Mendoza, John Pork</div>
                </div>
                <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Adviser</div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-gray-900 text-base">Dr. Marivic Tangkeko</span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Program</div>
                  <div class="text-gray-900 text-base">BS Information Technology</div>
                </div>
                <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Section</div>
                  <div class="text-gray-900 text-base">CAPIT3</div>
                </div>
              </div>

              <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Academic Year</div>
                <div class="text-gray-900 text-base">2025 - 2026</div>
              </div>

              <!-- Panelists -->
              <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Panelists</div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2 shadow-sm">
                    <span class="text-gray-900 text-base font-medium">Dr. Ramon Santos</span>
                    <span class="inline-block bg-green-highlight text-dark-green px-3 py-1 rounded-full text-xs font-semibold">Panelist</span>
                  </div>
                  <div class="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2 shadow-sm">
                    <span class="text-gray-900 text-base font-medium">Prof. Luisa Reyes</span>
                    <span class="inline-block bg-green-highlight text-dark-green px-3 py-1 rounded-full text-xs font-semibold">Panelist</span>
                  </div>
                  <div class="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2 shadow-sm">
                    <span class="text-gray-900 text-base font-medium">Engr. Marco dela Cruz</span>
                    <span class="inline-block bg-green-highlight text-dark-green px-3 py-1 rounded-full text-xs font-semibold">Panelist</span>
                  </div>
                </div>
              </div>

              <!-- Abstract -->
              <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Abstract</div>
                <p class="text-gray-700 leading-relaxed text-base">
                  Green Archive is a dedicated capstone repository platform developed for the College of Computer Studies (CCS) at De La Salle University (DLSU). The platform aims to centralize the storage, management, and accessibility of capstone project submissions, facilitating easy search, review, and monitoring by students, faculty, and staff.
                </p>
              </div>

              <div class="mt-2">
                <button class="download-btn inline-flex items-center text-base px-4 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m7-7H5" />
                  </svg>
                  Download Transcript (PDF)
                </button>
              </div>

            </div>
          </section>

          <!-- Right column -->
          <aside class="space-y-6">

            <div class="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <h3 class="text-green-text text-xl font-semibold mb-4">Info Summary</h3>
              <div class="text-base text-gray-700 space-y-4">

                <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Submission Date</div>
                  <div class="text-gray-900 text-base">May 10, 2024</div>
                </div>

                <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Status</div>
                  <div class="mt-1">
                    <span class="inline-block bg-green-highlight text-dark-green px-3 py-1 rounded-full text-sm font-semibold">Approved</span>
                  </div>
                </div>

                <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Research Field</div>
                  <div class="text-gray-900 text-base">Data Management</div>
                </div>

                <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Monitoring</div>
                  <div class="mt-1">
                    <span class="inline-block bg-green-highlight text-dark-green px-3 py-1 rounded-full text-sm font-semibold">Approved</span>
                  </div>
                </div>

              </div>
            </div>

            <div class="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <h3 class="text-green-text text-xl font-semibold mb-4">Quick Actions</h3>
              <div class="space-y-3">
                <button class="text-green-text w-full text-left text-base px-4 py-2.5 border bg-gray-50  rounded-lg hover:bg-gray-200 transition">
                  View Related Research
                </button>
                <button class="w-full text-base px-4 py-2.5 bg-bright-green text-white rounded-lg hover:opacity-95 transition font-medium">
                  Generate AI Summary
                </button>
              </div>
            </div>

          </aside>

        </div>
    </main>
    
    <footer>
      <Footer />
    </footer>

    </div>
</template>