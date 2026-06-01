<script setup lang="ts">
import { useWeb3AuthConnect } from '@web3auth/modal/vue'

const { connect, loading, isConnected, error } = useWeb3AuthConnect()
</script>

<template>
  <button @click="connect" :disabled="loading || isConnected">
    <span v-if="loading">Connecting...</span>
    <span v-else-if="isConnected">Connected</span>
    <span v-else>Connect</span>
  </button>
  <div v-if="error">{{ error.message }}</div>
</template>