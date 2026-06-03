<script setup lang="ts">
import {useWeb3AuthConnect} from "@web3auth/modal/vue";
import {ref, watch} from "vue";

const hasAccount = ref<boolean>(false);
const {isConnected} = useWeb3AuthConnect();

watch(isConnected, (c) => {
  hasAccount.value = c
})
</script>
<template>
  <header
      class="navbar bg-base-100/80 backdrop-blur-sm border-b border-base-300/40 px-4">
    <div class="flex-1">
      <RouterLink to="/" class="btn btn-ghost text-lg font-semibold">
        <img src="https://pawmi.otternoon.com/assets/paymoi-full.svg" alt="PayMoi Logo" class="w-36">
      </RouterLink>
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal px-1">
        <li>
          <RouterLink to="/">หน้าแรก</RouterLink>
        </li>
        <li v-if="hasAccount">
          <RouterLink to="/dashboard">แดชบอร์ด</RouterLink>
        </li>
        <li>
          <RouterLink to="/account">บัญชี</RouterLink>
        </li>
      </ul>
    </div>
  </header>
</template>