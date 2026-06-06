<script setup lang="ts">
import {
  useWeb3Auth,
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
} from "@web3auth/modal/vue";
import { onMounted, ref, watch } from "vue";
import { fetchBalance, randomTips, sendUSDC } from "../helpers.ts";
import { showModal } from "../composables/useModal.ts";

const { connect, loading, isConnected } = useWeb3AuthConnect();
const { disconnect } = useWeb3AuthDisconnect();
const { provider } = useWeb3Auth();

const address = ref("");
const usdcBalance = ref("0.00");
const ethBalance = ref("0.0000");
const rate = ref(33);
const isFetchingBalance = ref(true);

const transferAddress = ref("");
const transferAmount = ref("");
const sending = ref(false);

watch(
  provider,
  async (p) => {
    if (!p) return;
    const accounts = (await p.request({ method: "eth_accounts" })) as string[];
    if (accounts?.length) {
      address.value = accounts[0];
      const { usdc, eth } = await fetchBalance(accounts[0]);
      if (!usdc || !eth) {
        await showModal("ไม่สามารถยอดเหรียญในบัญชีได้");
      } else {
        usdcBalance.value = usdc;
        ethBalance.value = eth;
        isFetchingBalance.value = false;
      }
    }
  },
  { immediate: true },
);

onMounted(async () => {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=thb",
    );
    const d = await r.json();
    rate.value = d["usd-coin"].thb;
  } catch {}
});

async function transfer() {
  if (!provider.value) return;

  if (!transferAddress.value) {
    await showModal("กรุณากรอกเลขที่บัญชี");
    return;
  }

  if (!transferAmount.value || Number(transferAmount.value) <= 0) {
    await showModal("กรุณากรอกจำนวนเงิน");
    return;
  }

  sending.value = true;

  try {
    const txhash = await sendUSDC(
      provider.value,
      transferAddress.value,
      transferAmount.value.toString(),
    );

    const { usdc, eth } = await fetchBalance(address.value);
    if (!usdc || !eth) {
      await showModal("ไม่สามารถยอดเหรียญในบัญชีได้");
    } else {
      usdcBalance.value = usdc;
      ethBalance.value = eth;
    }

    transferAddress.value = "";
    transferAmount.value = "";

    showModal(
      "ธุรกรรมเสร็จสิ้น จะทำการแสดงหน้าประวัติธุรกรรมจาก BaseScan ที่เปิดในหน้าใหม่",
    ).then(() => {
      window.open(
        import.meta.env.DEV
          ? `https://sepolia.basescan.org/tx/${txhash}`
          : `https://basescan.org/tx/${txhash}`,
        "_blank",
      );
    });
  } catch (e) {
    await showModal("โอนไม่สำเร็จ: " + e);
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center w-full">

    <div v-if="loading || isFetchingBalance" class="flex flex-col gap-2 items-center justify-center">
      <div
          class="flex flex-col gap-8 items-center justify-center max-w-xl"
      >
        <p class="text-center text-2xl">
          <span class="loading loading-infinity loading-xl"></span>
          กำลังโหลดข้อมูล
        </p>
        <p class="text-center text-sm italic">
          {{ randomTips() }}
        </p>
      </div>
      <button class="btn btn-success" v-show="!isConnected && !loading" @click="connect"
              :disabled="loading || isConnected">
        ลงชื่อเข้าใช้
      </button>
    </div>
    <div class="flex flex-col gap-4 max-w-2xl w-full" v-else-if="isConnected">
      <div class="collapse collapse-arrow border border-base-300 bg-white/5">
        <input type="checkbox"/>
        <div class="collapse-title text-xl font-semibold">
          ยอดเงินและเลขที่บัญชี
        </div>
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
              <input
                  v-model="address"
                  type="text"
                  class="input w-full disabled"
                  readonly
              />
            </div>
          </div>
        </div>
      </div>

      <div class="collapse collapse-arrow border border-base-300 bg-white/5">
        <input type="checkbox"/>
        <div class="collapse-title text-xl font-semibold">
          โอนเงิน
        </div>
        <div class="collapse-content">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <p>เลขที่บัญชีปลายทาง</p>
              <input
                  v-model="transferAddress"
                  type="text"
                  class="input w-full"
                  placeholder="0x..."
              />
            </div>

            <div class="flex flex-col gap-2">
              <p>จำนวนเงิน (USDC)</p>
              <input
                  v-model="transferAmount"
                  type="number"
                  min="0"
                  step="0.000001"
                  class="input w-full"
              />
            </div>

            <button
                class="btn btn-primary"
                :disabled="sending"
                @click="transfer"
            >
        <span
            v-if="sending"
            class="loading loading-spinner loading-sm"
        ></span>
              โอนเงิน
            </button>
          </div>
        </div>
      </div>
      <button class="btn btn-error" @click="disconnect()">ลงชื่อออก</button>
    </div>
  </div>
</template>