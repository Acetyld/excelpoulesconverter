<script setup lang="ts">
import { ref } from 'vue'
import type { Poule } from '~/types/poule-viewer';
import html2canvas from 'html2canvas';

definePageMeta({
  layout: 'default'
})

const file = ref<File | null>(null)
const isLoading = ref(false)
const poules = ref<Poule[]>([])
const toast = useToast()
const leaderboardContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    file.value = target.files[0]
    processFile()
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const processFile = async () => {
  if (!file.value) {
    toast.add({ title: 'Error', description: 'Please select a file first.', color: 'error' })
    return
  }

  isLoading.value = true
  const formData = new FormData()
  formData.append('excelFile', file.value)

  try {
    const response = await fetch('/api/poule-viewer', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to process file')
    }

    const data = await response.json()
    poules.value = data

    toast.add({ title: 'Success', description: 'File processed successfully!', color: 'success' })

  } catch (error) {
    if (error instanceof Error) {
      toast.add({ title: 'Error', description: error.message, color: 'error' })
    } else {
      toast.add({ title: 'Error', description: 'An unknown error occurred', color: 'error' })
    }
  } finally {
    isLoading.value = false
  }
}

const takeScreenshot = async () => {
  if (!leaderboardContainer.value) {
    return
  }
  try {
    const canvas = await html2canvas(leaderboardContainer.value, {
      backgroundColor: '#0c143f',
      useCORS: true,
      scale: 2 
    })
    const image = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = image
    a.download = 'poule-leaderboard.png'
    a.click()
    a.remove()
    toast.add({ title: 'Success', description: 'Screenshot captured!', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to capture screenshot.', color: 'error' })
  }
}

const getRowClass = (index: number, pouleName: string, totalRows: number) => {
  const baseClass = 'border-b border-blue-900/50'
  if (pouleName === 'Poule A') {
    if (index === 0) return `${baseClass} bg-yellow-400/10 font-bold`
    if (index === 1) return `${baseClass} bg-slate-400/10 font-bold`
    if (index === 2) return `${baseClass} bg-orange-400/10 font-bold`
  } else {
    if (index < 2) return `${baseClass} bg-green-500/10`
    if (index >= totalRows - 2) return `${baseClass} bg-red-500/10`
  }
  return baseClass
}

</script> 
<template>
  <div class="bg-gradient-to-br from-[#0c143f] to-[#1d2b5a] min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
    <header class="text-center mb-8">
      <UIcon name="i-heroicons-star-solid" class="text-5xl text-yellow-400 mb-2" />
      <h1 class="text-3xl sm:text-4xl font-bold uppercase tracking-widest text-white/90">
        League Phase
      </h1>
      <div class="flex justify-center items-center space-x-4 mt-6">
        <input type="file" @change="handleFileChange" accept=".xlsx,.xls" ref="fileInput" class="hidden" />
        <button @click="triggerFileInput" class="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center space-x-2">
          <UIcon name="i-heroicons-arrow-up-tray-solid" />
          <span>Upload Excel</span>
        </button>
        <button @click="takeScreenshot" :disabled="poules.length === 0" class="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <UIcon name="i-heroicons-camera-solid" />
          <span>Screenshot</span>
        </button>
      </div>
    </header>

    <main>
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-5xl text-white/80" />
      </div>

      <div v-else-if="poules.length > 0" ref="leaderboardContainer" class="p-4 bg-transparent rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="poule in poules" :key="poule.name" 
            :class="[
              'bg-blue-900/40 rounded-xl shadow-2xl overflow-hidden border border-blue-800/50', 
              poule.name === 'Verliezerseiland' ? 'border-red-500/50' : ''
            ]">
            <h3 :class="[
              'p-3 text-center font-bold uppercase tracking-wider',
              poule.name === 'Verliezerseiland' ? 'bg-red-800/70' : 'bg-blue-700/70'
            ]">{{ poule.name }}</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-black/20">
                  <tr>
                    <th class="p-2.5 font-semibold uppercase text-xs text-white/60">#</th>
                    <th v-for="header in poule.headers" :key="header" class="p-2.5 font-semibold uppercase text-xs text-white/60">{{ header }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in poule.data" :key="index" :class="getRowClass(index, poule.name, poule.data.length)">
                    <td class="p-2.5 font-medium text-white/80">{{ index + 1 }}</td>
                    <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="p-2.5 text-white/90 whitespace-nowrap">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
       <div v-else class="text-center py-16 text-white/50">
        <UIcon name="i-heroicons-cloud-arrow-up" class="text-6xl mx-auto" />
        <h3 class="mt-4 text-2xl font-semibold">Upload an Excel File</h3>
        <p class="mt-1">The leaderboard will appear here.</p>
      </div>
    </main>

  </div>
</template> 