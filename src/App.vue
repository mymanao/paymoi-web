<script setup>
import {Web3AuthProvider} from '@web3auth/modal/vue'
import {web3AuthContextConfig} from './web3authContext'
import Navbar from "./fragments/Navbar.vue";
</script>

<template>
  <main>
    <RouterView v-if="$route.path.startsWith('/overlay/')"/>
    <Web3AuthProvider v-else :config="web3AuthContextConfig">
      <Navbar v-if="!$route.path.startsWith('/donate') && !$route.path.startsWith('/overlay')"/>
      <RouterView/>
      <footer
          v-if="!$route.path.startsWith('/donate') && !$route.path.startsWith('/overlay')"
          class="flex flex-between lg:flex-row flex-col lg:gap-0 gap-6 w-full p-4 text-base-content/70"
      >
        <div class="w-full pl-3 flex gap-3">
          <p>
            &copy; {{ new Date().getFullYear() }} MyManao. PayMoi by MyManao is licensed under the GNU Affero General Public License v3.0
          </p>
        </div>
        <div class="w-full pr-6 flex gap-3 items-center lg:justify-end justify-center">
          <RouterLink to="/terms">Terms of Service</RouterLink>
          <p>•</p>
          <RouterLink to="/privacy">Privacy Policy</RouterLink>
          <p>•</p>
          <a href="https://github.com/orgs/mymanao/repositories" target="_blank">View Source</a>
        </div>
      </footer>
    </Web3AuthProvider>
  </main>
</template>