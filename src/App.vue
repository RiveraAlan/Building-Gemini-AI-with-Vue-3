<script setup>
import { ref } from 'vue';
import GeminiAI from './components/GeminiAI.vue';
import GeminiAITNI from './components/GeminiAITNI.vue';
import Snippy from './components/Snippy.vue';
import Analyzer from './components/Analyzer.vue';

const geminiOptions = ref('text');

</script>

<template>
  <header>
  </header>
  <main>
    <Snippy />
    <Analyzer />
  </main>
</template>

<style scoped>
header,
main {
  max-width: 1280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

header {
  margin-bottom: 20px;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
