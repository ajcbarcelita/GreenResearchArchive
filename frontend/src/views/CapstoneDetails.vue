<template>
    <div class="min-h-screen flex flex-col bg-ash-white font-Montserrat">
        <header>
            <Navbar />
        </header>

        <main class="flex-1 container mx-auto px-6 py-6 pt-32">
            <div v-if="loading" class="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-2">
                    <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-8.5">
                        <div class="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
                        <div class="space-y-5">
                            <div class="h-10 bg-gray-200 rounded"></div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="h-10 bg-gray-200 rounded"></div>
                                <div class="h-10 bg-gray-200 rounded"></div>
                            </div>
                            <div class="h-10 bg-gray-200 rounded"></div>
                            <div class="h-24 bg-gray-200 rounded"></div>
                            <div class="h-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>

                <aside class="space-y-6">
                    <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5">
                        <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div class="space-y-4">
                            <div class="h-8 bg-gray-200 rounded"></div>
                            <div class="h-8 bg-gray-200 rounded"></div>
                            <div class="h-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5">
                        <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div class="space-y-3">
                            <div class="h-10 bg-gray-200 rounded"></div>
                            <div class="h-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </aside>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Left: Capstone Project Details -->
                <section class="md:col-span-2">
                    <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-8.5 hover:border-green-text transition-all">
                        <h2 class="text-green-text text-3xl font-semibold mb-6 pb-2 border-b-2 border-green-text/30">Capstone Project Details</h2>

                        <div class="space-y-5 text-base text-gray-800">
                            <!-- Title Section -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">TITLE</div>
                                <div class="text-gray-900 font-semibold text-base">{{ capstone?.title }}</div>
                            </div>

                            <!-- Authors and Adviser Grid -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                    <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">AUTHORS</div>
                                    <div class="text-gray-900 font-medium text-base">{{ (capstone?.authors && capstone.authors.length) ? capstone.authors.join(', ') : capstone?.groupName }}</div>
                                </div>
                                <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                    <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">ADVISER</div>
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="text-gray-900 font-medium text-base">{{ capstone?.adviserName }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Program and Section Grid -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">PROGRAM</div>
                                <div class="text-gray-900 font-medium text-base">{{ capstone?.programCode }}</div>
                            </div>

                            <!-- Academic Year -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">ACADEMIC YEAR</div>
                                <div class="text-gray-900 font-medium text-base">2025 - 2026</div>
                            </div>

                            <!-- Abstract -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">ABSTRACT</div>
                                <div class="bg-white border border-gray-300 rounded-lg p-3">
                                    <p class="text-gray-700 leading-relaxed text-base">{{ capstone?.abstract }}</p>
                                </div>
                            </div>
                            
                            <!-- Keywords -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Keywords</div>
                                <div class="text-gray-900 font-medium text-base">{{ (capstone?.keywords || ['Tech','Try','Test','Dog','Cat']).join(', ') }}</div>
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
                                <div class="text-gray-900 font-medium text-base">{{ capstone?.submittedAt }}</div>
                            </div>

                            <!-- Research Field -->
                            <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">RESEARCH FIELD</div>
                                <div class="text-gray-900 font-medium text-base">{{ capstone?.researchField }}</div>
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


                </aside>
            </div>
        </main>

        <footer>
            <Footer />
        </footer>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { getCapstoneDetails } from '@/services/repositoryService'

const route = useRoute()
const capstone = ref(null)
const loading = ref(true)
const MIN_LOAD_MS = 300
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const load = async (id) => {
    loading.value = true
    const start = Date.now()
    try {
        const data = await getCapstoneDetails(id)
        const elapsed = Date.now() - start
        if (elapsed < MIN_LOAD_MS) await sleep(MIN_LOAD_MS - elapsed)
        capstone.value = data
    } catch (e) {
        console.error('Failed to load capstone details', e)
        capstone.value = null
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    const id = route.params.id || null
    load(id)
})

watch(() => route.params.id, (newId) => {
    if (newId) load(newId)
})

</script>