<script setup lang="ts">
import {useWeb3AuthConnect} from '@web3auth/modal/vue'

const {connect, isConnected} = useWeb3AuthConnect()

// watch(isConnected, (newVal) => {
//   if (newVal) {
//     window.location.href = "/dashboard";
//   }
// })
</script>

<template>
  <div class="min-h-screen flex lg:p-0 p-4 flex-col gap-12 justify-center items-center">
    <div class="flex flex-col gap-8 items-center justify-center max-w-xl">
      <img src="https://pawmi.otternoon.com/assets/paymoi-full.svg" class="w-96" alt="PayMoi Logo"/>
      <p class="text-center">
        แพลตฟอร์มโดเนททางเลือกผ่านบล็อกเชน ไม่มีการเปิดเผยตัวตน ไม่เก็บข้อมูลส่วนตัว ไม่มีค่าแพลตฟอร์ม รับและโดเนทเงินเป็นสกุลเงินดิจิตอล เริ่มสมัครเลย!
      </p>
      <div class="flex gap-2">
        <button v-if="!isConnected" @click="connect" class="btn btn-primary">
          สมัครเลย
        </button>
        <button v-else class="btn btn-primary" @click="$router.push('/dashboard')">
          เข้าหน้าแดชบอร์ด
        </button>
        <a class="btn btn-outline" target="_blank" href="https://manao.otternoon.com/paymoi/guides/">คู่มือ <i
            class="fa-solid fa-arrow-up-right-from-square"></i></a>
      </div>
    </div>
    <div class="lg:flex lg:flex-row grid grid-cols-2 flex-col lg:gap-2 items-center justify-center">
      <div
          class="flex flex-col gap-2 w-48 h-48 items-center justify-center text-center bg-white/10 p-4 rounded border border-white/20">
        <i class="fas fa-person text-3xl"></i>
        <b>ปลอดภัย</b>
        <p>ไม่มีการเปิดเผยชื่อหรือรับเงินแทน</p>
      </div>
      <div
          class="flex flex-col gap-2 w-48 h-48 items-center justify-center text-center bg-white/10 p-4 rounded border border-white/20">
        <i class="fas fa-bolt-lightning text-3xl"></i>
        <b>รวดเร็ว</b>
        <p>ได้เงินเข้าวอลเล็ตทันที ไม่ต้องรอรับเงิน</p>
      </div>
      <div
          class="flex flex-col gap-2 w-48 h-48 items-center justify-center text-center bg-white/10 p-4 rounded border border-white/20">
        <i class="fas fa-money-bill text-3xl"></i>
        <b>ฟรี</b>
        <p>ไม่เสียค่าใช้จ่ายตลอดชีพ ใคร ๆ ก็สมัครได้</p>
      </div>
      <div
          class="flex flex-col gap-2 w-48 h-48 items-center justify-center text-center bg-white/10 p-4 rounded border border-white/20">
        <i class="fas fa-bell text-3xl"></i>
        <b>โอเวอร์เลย์</b>
        <p>มีโอเวอร์เลย์สำหรับสตรีมเมอร์ เพื่อใช้ในสตรีม</p>
      </div>
    </div>
  </div>
</template>
