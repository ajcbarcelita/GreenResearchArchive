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
                <section class="md:col-span-2">
                    <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-8.5 hover:border-green-text transition-all">
                        <h2 class="text-green-text text-3xl font-semibold mb-6 pb-2 border-b-2 border-green-text/30">Capstone Project Details</h2>

                        <div class="space-y-5 text-base text-gray-800">
                            <!-- Title Section -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">TITLE</div>
                                <div class="text-gray-900 font-semibold text-base">Green Archive : A Capstone Repository Platform for DLSU CCS</div>
                            </div>

                            <!-- Authors and Adviser Grid -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                    <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">AUTHORS</div>
                                    <div class="text-gray-900 font-medium text-base">Aron Mendoza, John Pork</div>
                                </div>
                                <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                    <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">ADVISER</div>
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="text-gray-900 font-medium text-base">Dr. Marivic Tangkeko</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Program and Section Grid -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                    <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">PROGRAM</div>
                                    <div class="text-gray-900 font-medium text-base">BS Information Technology</div>
                                </div>
                                <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                    <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">SECTION</div>
                                    <div class="text-gray-900 font-medium text-base">CAPIT3</div>
                                </div>
                            </div>

                            <!-- Academic Year -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">ACADEMIC YEAR</div>
                                <div class="text-gray-900 font-medium text-base">2025 - 2026</div>
                            </div>

                            <!-- Panelists -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-3">PANELISTS</div>
                                <div class="space-y-2">
                                    <div class="flex items-center justify-between bg-white border-2 border-gray-300 rounded-lg px-4 py-2 shadow-sm">
                                        <span class="text-gray-900 text-base font-semibold">Dr. Ramon Santos</span>
                                        <span class="inline-block bg-green-highlight text-dark-green px-3 py-1 rounded-full text-xs font-bold border border-green-text/30">Panelist</span>
                                    </div>
                                    <div class="flex items-center justify-between bg-white border-2 border-gray-300 rounded-lg px-4 py-2 shadow-sm">
                                        <span class="text-gray-900 text-base font-semibold">Prof. Luisa Reyes</span>
                                        <span class="inline-block bg-green-highlight text-dark-green px-3 py-1 rounded-full text-xs font-bold border border-green-text/30">Panelist</span>
                                    </div>
                                    <div class="flex items-center justify-between bg-white border-2 border-gray-300 rounded-lg px-4 py-2 shadow-sm">
                                        <span class="text-gray-900 text-base font-semibold">Engr. Marco dela Cruz</span>
                                        <span class="inline-block bg-green-highlight text-dark-green px-3 py-1 rounded-full text-xs font-bold border border-green-text/30">Panelist</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Abstract -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">ABSTRACT</div>
                                <div class="bg-white border border-gray-300 rounded-lg p-3">
                                    <p class="text-gray-700 leading-relaxed text-base">
                                        Green Archive is a dedicated capstone repository platform developed for the College of Computer Studies (CCS) at De La Salle University (DLSU). The platform aims to centralize the storage, management, and accessibility of capstone project submissions, facilitating easy search, review, and monitoring by students, faculty, and staff.
                                    </p>
                                </div>
                            </div>

                            <!-- Download Button -->
                            <div class="mt-4 pt-2 border-t-2 border-gray-300">
                                <button class="download-btn inline-flex items-center text-base px-6 py-3 bg-green-text text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition border-2 border-green-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
                                    </svg>
                                    Download Transcript (PDF)
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Right column -->
                <aside class="space-y-6">
                    <!-- Info Summary Card -->
                    <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 hover:border-green-text transition-all">
                        <h3 class="text-green-text text-xl font-semibold mb-4 pb-2 border-b-2 border-green-text/30">Info Summary</h3>
                        <div class="text-base text-gray-700 space-y-4">
                            <!-- Submission Date -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">SUBMISSION DATE</div>
                                <div class="text-gray-900 font-medium text-base">May 10, 2024</div>
                            </div>

                            <!-- Status -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">STATUS</div>
                                <div class="mt-1">
                                    <span class="inline-block bg-green-highlight text-dark-green px-4 py-1.5 rounded-full text-sm font-bold border-2 border-green-text/40">APPROVED</span>
                                </div>
                            </div>

                            <!-- Research Field -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">RESEARCH FIELD</div>
                                <div class="text-gray-900 font-medium text-base">Data Management</div>
                            </div>

                            <!-- Monitoring -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">MONITORING STATUS</div>
                                <div class="mt-1">
                                    <span class="inline-block bg-green-highlight text-dark-green px-4 py-1.5 rounded-full text-sm font-bold border-2 border-green-text/40">APPROVED</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions Card -->
                    <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 hover:border-green-text transition-all">
                        <h3 class="text-green-text text-xl font-semibold mb-4 pb-2 border-b-2 border-green-text/30">Quick Actions</h3>
                        <div class="space-y-3">
                            <button class="w-full text-left text-base px-4 py-3 border-2 border-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 hover:border-green-text transition font-semibold text-gray-800 shadow-sm">
                                View Related Research
                            </button>
                            <button class="w-full text-base px-4 py-3 bg-green-text text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md border-2 border-green-800">
                                Generate AI Summary
                            </button>
                        </div>
                    </div>

                    <!-- Additional Stats Card -- Lagay ko lang for now but might be removed -->
                    <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 hover:border-green-text transition-all">
                        <h3 class="text-green-text text-xl font-semibold mb-4 pb-2 border-b-2 border-green-text/30">Statistics</h3>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="text-center p-3 bg-gray-100 border-2 border-gray-400 rounded-lg shadow-sm">
                                <div class="text-2xl font-bold text-gray-800">247</div>
                                <div class="text-xs font-semibold text-gray-600 uppercase">Views</div>
                            </div>
                            <div class="text-center p-3 bg-gray-100 border-2 border-gray-400 rounded-lg shadow-sm">
                                <div class="text-2xl font-bold text-gray-800">89</div>
                                <div class="text-xs font-semibold text-gray-600 uppercase">Downloads</div>
                            </div>
                            <div class="text-center p-3 bg-gray-100 border-2 border-gray-400 rounded-lg shadow-sm">
                                <div class="text-2xl font-bold text-gray-800">4.5</div>
                                <div class="text-xs font-semibold text-gray-600 uppercase">Rating</div>
                            </div>
                            <div class="text-center p-3 bg-gray-100 border-2 border-gray-400 rounded-lg shadow-sm">
                                <div class="text-2xl font-bold text-gray-800">12</div>
                                <div class="text-xs font-semibold text-gray-600 uppercase">Citations</div>
                            </div>
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
