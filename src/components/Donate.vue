<script setup lang="ts">
import {useRoute} from "vue-router"
import {useWeb3Auth} from '@web3auth/modal/vue'
import {useWeb3AuthConnect} from '@web3auth/modal/vue'
import {onMounted, ref, computed, watch} from "vue"
import {fetchBalance, sendUSDC} from "../helpers.ts";
import type {Streamer, WebConfig} from "../types.ts";
import {showModal} from "../composables/useModal.ts";

const route = useRoute()
const {provider} = useWeb3Auth()
const {connect, isConnected} = useWeb3AuthConnect()

const streamer = ref<Streamer | null>(null)
const webConfig = ref<WebConfig>({})
const notFound = ref(false)

const donatorName = ref("")
const thbAmount = ref(20)
const message = ref("")
const rate = ref(33)
const sending = ref(false)
const address = ref("");
const usdcBalance = ref("0.00");
const ethBalance = ref("0.0000");


const usdcAmount = computed(() => (thbAmount.value / rate.value).toFixed(6))

const avatarUrl = computed(() => webConfig.value.avatarUrl ?? `https://gravatar.com/avatar/${Date.now()}?d=retro&s=600`)
const bannerUrl = computed(() => webConfig.value.bannerUrl ?? `https://picsum.photos/seed/${Date.now()}/800/600`)
const bannerStyle = computed(() => ({
  backgroundImage: bannerUrl.value ? `url(${bannerUrl.value})` : 'none',
  backgroundColor: webConfig.value.colors?.background ?? '#1b1717',
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'repeat',
}))


onMounted(async () => {
  const name = route.params.name
  const res = await fetch(`https://paypoint.otternoon.com/v1/streamers/${name}`)
  const data = await res.json()
  if (!data.success) {
    notFound.value = true;
    return
  }
  streamer.value = data.streamer
  try {
    webConfig.value = JSON.parse(data.streamer.web_config) ?? {}
  } catch {
  }

  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=thb')
    const d = await r.json()
    rate.value = d['usd-coin'].thb
  } catch {
  }

  //@ts-ignore
  my_modal_5.showModal();
})

watch(provider, async (p) => {
  if (!p) return
  const accounts = (await p.request({method: 'eth_accounts'})) as string[];
  if (accounts?.length) {
    address.value = accounts[0]
    const {usdc, eth} = await fetchBalance(accounts[0]);
    if (!usdc || !eth) {
      alert("ไม่สามารถยอดเหรียญในบัญชีได้")
    } else {
      usdcBalance.value = usdc;
      ethBalance.value = eth;
    }
  }
}, {immediate: true})


async function donate() {
  if (!provider.value || !streamer.value) return
  if (!donatorName.value) {
    await showModal("กรุณากรอกชื่อ");
    return
  }
  if (thbAmount.value < 1) {
    await showModal("จำนวนเงินขั้นต่ำ 1 บาท");
    return
  }

  sending.value = true
  try {
    const accounts = await provider.value.request({method: 'eth_accounts'}) as string[]
    const from = accounts[0]
    const txhash = await sendUSDC(provider.value, streamer.value.wallet_addr, usdcAmount.value)
    await fetch('https://paypoint.otternoon.com/v1/donate/pending', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        from, to: streamer.value.wallet_addr,
        amount: usdcAmount.value,
        donator: donatorName.value,
        message: message.value, txhash
      })
    })
    showModal("ธุรกรรมเสร็จสิ้น จะทำการแสดงหน้าประวัติธุรกรรมจาก BaseScan ที่เปิดในหน้าใหม่")
        .then(() => {
          window.open(import.meta.env.DEV ? `https://sepolia.basescan.org/tx/${txhash}` : `https://basescan.org/tx/${txhash}`, '_blank')
        })
  } catch (e) {
    await showModal("เกิดข้อผิดพลาด: " + e)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center p-4 relative" :style="bannerStyle">
    <div class="absolute inset-0 backdrop-blur-sm bg-black/50 pointer-events-none"/>

    <div v-if="notFound" class="relative text-center text-white">
      <p class="text-2xl">ไม่พบสตรีมเมอร์นี้</p>
    </div>

    <div v-else-if="!streamer" class="relative flex flex-col items-center gap-4">
      <span class="loading loading-infinity loading-xl text-white"></span>
    </div>

    <div v-else class="relative w-full max-w-md">
      <dialog id="my_modal_5" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box">
          <h3 class="text-2xl mb-6 font-bold text-center">โดเนทเป็นคริปโต</h3>
          <div class="divider"></div>
          <div class="flex flex-col gap-2">
            <p class="font-bold text-yellow-500">
              แนะนำอ่านคู่มือแบบละเอียด: <a class="link" href="https://manao.otternoon.com/paymoi/guides">เปิดหน้าคู่มือ
              <i
                  class="fa-solid fa-arrow-up-right-from-square"></i></a>
            </p>
            <div class="collapse collapse-arrow border border-base-300 bg-white/5">
              <input type="checkbox"/>
              <div class="collapse-title text-xl font-semibold">วิธีเติมเงิน</div>
              <div class="collapse-content">
                <ul class="list-decimal list-inside">
                  <li>เปิดบัญชี <a class="link" href="https://www.binance.th/th">Binance TH <i
                      class="fa-solid fa-arrow-up-right-from-square"></i></a></li>
                  <li>ซื้อเหรียญ <b>USD Coin (USDC)</b> <a class="link" href="https://www.binance.th/th/convert">เปิดเมนูซื้อขาย
                    <i
                        class="fa-solid fa-arrow-up-right-from-square"></i></a></li>
                  <li>กดถอนเงินออก <a class="link"
                                      href="https://www.binance.th/th/announcement/crypto-deposit-%7C-withdrawal/3f5f1b8c95f544d4b1276f458df6366f">ดูวิธีการ
                    <i
                        class="fa-solid fa-arrow-up-right-from-square"></i></a></li>
                  <li>เลือกเหรียญ <b>USD Coin (USDC)</b> เลือกเครือข่าย <b>Base</b></li>
                  <li>กรอกบัญชีตามด้านล่างต่อไปนี้</li>
                </ul>
                <p class="text-base font-bold text-red-400">
                  เลือกโอนผ่านเน็ตเวิร์ก "Base" เท่านั้น ไม่งั้นเงินหายนะ!
                </p>
                <input v-model="address" type="text" min="1" class="input w-full disabled" readonly/>
                <p>
                  จากนั้น ทำแบบเดียวกันแบบข้างต้น แต่เลือกเหรียญ ETH ซื้อไว้ 5 บาทก็พอ และ "เลือกเครือข่าย Base
                  เหมือนเดิมเท่านั้น"
                  โอนเข้ามาที่บัญชีเดิมเพียงแค่ 1 บาทไว้เป็นค่าธรรมเนียมของบล็อกเชน ใช้ธุรกรรมละเพียงหลักสตางค์
                  ผ่านเครือข่าย Base
                </p>
              </div>
            </div>
            <div class="collapse collapse-arrow border border-base-300 bg-white/5">
              <input type="checkbox"/>
              <div class="collapse-title text-xl font-semibold">ยอดเงินและเลขที่บัญชี</div>
              <div class="collapse-content">
                <div class="flex flex-col gap-4">
                  <p class="text-base">
                    ยอดเงินปัจจุบัน:
                    <span class="text-success font-bold">
                      {{ usdcBalance }} USDC
                    ({{
                        (Number(usdcBalance.replace(/,/g, '')) * rate).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })
                      }} บาท)
                    </span>
                  </p>
                  <p class="text-base">
                    เงินจ่ายค่าธรรมเนียม:
                    <span class="text-success font-bold">
                      {{ ethBalance }} ETH
                    </span>
                  </p>
                  <div class="flex flex-col gap-2">
                    <p class="text-base">
                      เลขที่บัญชีของฉัน:
                    </p>
                    <input v-model="address" type="text" class="input w-full disabled" readonly/>
                  </div>
                </div>
              </div>
            </div>
            <div class="divider"></div>
            <p class="text-sm">
              เงินในกระเป๋าจะคงอยู่ สามารถใช้เพื่อโดเนทครั้งต่อไปได้
              สามารถขายเป็นเงินไทยด้วยการโอนกลับไปที่เดิมแล้วกดขายได้เลย (ในแอพ Binance TH ผ่านเมนู Buy/Sell)
              <br> <br>
              โอนเหรียญออกจากกระเป๋าได้ที่ <a class="link" href="/account" target="_blank">หน้าบัญชี
              <i
                  class="fa-solid fa-arrow-up-right-from-square"></i></a> หรือ <a class="link" href="https://wallet.web3auth.io" target="_blank">Web3Auth Wallet
              <i
                  class="fa-solid fa-arrow-up-right-from-square"></i></a>
              โดยล็อกอินด้วยบัญชีเดียวกันกับ PayMoi
              <span class="divider"></span>
              (เปย์มัวไม่มีหน้าที่ในการครอบครองเงินใด ๆ ทั้งสิ้น กระเป๋าเงินถูกจัดการโดย MetaMask ของบริษัท ConsenSys)
            </p>
          </div>
          <div class="modal-action">
            <div class="flex gap-2">
              <a href="https://manao.otternoon.com/paymoi/guides" target="_blank">
                <button class="btn btn-accent">อ่านคู่มือเต็ม <i
                    class="fa-solid fa-arrow-up-right-from-square"></i></button>
              </a>
              <form method="dialog">
                <button class="btn btn-success">รู้แล้ว</button>
              </form>
            </div>
          </div>
        </div>
      </dialog>

      <div class="flex justify-center mb-0 z-10 relative">
        <div class="avatar">
          <div class="w-24 rounded-full ring-4 ring-base-100 shadow-xl bg-base-300">
            <img :src="avatarUrl" alt="Avatar"
                 @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"/>
          </div>
        </div>
      </div>

      <div class="card shadow-xl -mt-12 pt-0 bg-base-100"
           :style="webConfig.colors?.background ? `background-color:${webConfig.colors?.background}` : ''"
      >
        <div class="card-body gap-4 pt-16">

          <div class="text-center">
            <h1 class="text-2xl font-bold"
                :style="webConfig.colors?.header ? `color:${webConfig.colors.header}` : ''">
              {{ streamer.display_name }}
            </h1>
            <p v-if="webConfig.subText" class="text-sm opacity-70 mt-1">{{ webConfig.subText }}</p>
          </div>

          <div v-if="!isConnected" class="flex flex-col gap-2 items-center">
            <p class="text-sm opacity-70">กรุณาเข้าสู่ระบบเพื่อโดเนท</p>
            <button class="btn btn-primary w-full" @click="connect">Login</button>
          </div>

          <template v-else>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ชื่อของคุณ</legend>
              <input v-model="donatorName" type="text" class="input w-full" placeholder="ชื่อ"/>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ webConfig.amountLabel ?? 'จำนวน (บาท)' }}</legend>
              <input v-model.number="thbAmount" type="number" min="1" class="input w-full"/>
              <p class="label">≈ {{ usdcAmount }} USDC</p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ webConfig.messageLabel ?? 'ข้อความ (ไม่บังคับ)' }}</legend>
              <textarea v-model="message" class="textarea w-full" rows="3"/>
            </fieldset>

            <button class="btn btn-primary w-full" :disabled="sending" @click="donate">
              <span v-if="sending" class="loading loading-spinner loading-sm"></span>
              {{ webConfig.confirmLabel ?? 'โดเนทเลย!' }}
            </button>
          </template>

        </div>
      </div>

    </div>
  </div>
</template>

<style>
.link {
  color: var(--color-blue-500);
  text-decoration: underline;
}
</style>