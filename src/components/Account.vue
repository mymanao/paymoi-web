<script setup lang="ts">
import {useWeb3AuthConnect, useWeb3AuthDisconnect} from '@web3auth/modal/vue'

const {connect, loading, isConnected, error} = useWeb3AuthConnect();
const {disconnect} = useWeb3AuthDisconnect();
</script>

<template>
  <div class="min-h-screen grid place-items-center w-full">

    <button @click="connect" :disabled="loading || isConnected">
      <span v-if="loading">
        <p class="text-center text-2xl">
        <span class="loading loading-infinity loading-xl"></span>
          กำลังโหลดข้อมูล
        </p>
      </span>
      <button class="btn btn-error" v-else-if="isConnected" @click="disconnect()">ลงชื่อออก</button>
      <button class="btn btn-primary" v-else>ลงชื่อเข้าใช้</button>
    </button>
    <div v-if="error">{{ error.message }}</div>
  </div>
</template>