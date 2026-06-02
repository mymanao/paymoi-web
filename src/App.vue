<script setup>
import {Web3AuthProvider} from '@web3auth/modal/vue'
import {web3AuthContextConfig} from './web3authContext'
import Navbar from "./fragments/Navbar.vue";
import Footer from "./fragments/Footer.vue";
</script>

<template>
  <main>
    <RouterView v-if="$route.path.startsWith('/overlay/')"/>
    <Web3AuthProvider v-else :config="web3AuthContextConfig">
      <Navbar v-if="!$route.path.startsWith('/donate') && !$route.path.startsWith('/overlay')"/>
      <RouterView/>
      <Footer v-if="!$route.path.startsWith('/donate') && !$route.path.startsWith('/overlay')"/>
    </Web3AuthProvider>
  </main>
</template>