<template>
  <div class="dark bg-slate-900 text-white min-h-screen font-sans">
    <header class="bg-slate-800 border-b border-slate-700">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <NuxtLink to="/" class="flex items-baseline gap-2">
          <h1 class="text-2xl font-bold">Debtt.</h1>
          <span class="text-lg text-gray-400">Tools</span>
        </NuxtLink>
        <nav class="hidden sm:flex items-center space-x-4">
          <NuxtLink to="/" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800" active-class="text-primary-400">Start</NuxtLink>
          <NuxtLink to="/poules-converter" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800" active-class="text-primary-400">Poules Converter</NuxtLink>
        </nav>
      </div>
    </header>
    <main class="container mx-auto p-4 sm:p-6 lg:p-8">
      <slot />
    </main>
  </div>
</template> 