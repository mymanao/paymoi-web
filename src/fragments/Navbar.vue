<script setup lang="ts">
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
        <li>
          <RouterLink to="/dashboard">แดชบอร์ด</RouterLink>
        </li>
      </ul>
    </div>
  </header>
</template>