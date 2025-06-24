<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'default'
})

const file = ref<File | null>(null)
const isLoading = ref(false)
const toast = useToast()

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    file.value = target.files[0]
  }
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
    const response = await fetch('/api/process', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to process file')
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get('content-disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'user_totals.xlsx'
      
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)

    toast.add({ title: 'Success', description: 'File processed and download started!', color: 'success' })

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
</script> 
<template>
  <div>
    <UCard>
      <template #header>
        <div class="flex items-center space-x-4">
          <UIcon name="i-heroicons-document-arrow-up" class="text-3xl text-primary" />
          <h2 class="text-2xl font-bold">Excel Poules Converter</h2>
        </div>
      </template>

      <div class="space-y-4">
        <p>Upload uw Excel-bestand met poule-gegevens om het te verwerken en de totalen te berekenen.</p>
        <form @submit.prevent="processFile" class="space-y-6">
          <UFormField label="Selecteer Excel-bestand" name="excelFile">
            <UInput type="file" @change="handleFileChange" accept=".xlsx,.xls" size="lg" />
          </UFormField>

          <UButton type="submit" :loading="isLoading" :disabled="!file" size="lg" icon="i-heroicons-cog-6-tooth">
            Bestand verwerken
          </UButton>
        </form>
      </div>

    </UCard>
  </div>
</template>

