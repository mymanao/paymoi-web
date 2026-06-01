<script setup>
import {Web3AuthProvider} from '@web3auth/modal/vue'
import {web3AuthContextConfig} from './web3authContext'
</script>

<template>
  <main>
    <RouterView v-if="$route.path.startsWith('/overlay/')" />
    <Web3AuthProvider v-else :config="web3AuthContextConfig">
      <RouterView/>
    </Web3AuthProvider>
  </main>
</template>