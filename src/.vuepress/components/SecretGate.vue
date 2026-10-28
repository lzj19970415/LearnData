<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{ cipher: string; hint?: string }>();

const unlocked = ref(false);
const html = ref("");
const input = ref("");
const error = ref(false);
const remember = ref(false);
const working = ref(false);

const STORAGE_KEY = "secret-gate-pwd";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);

  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

async function decryptWith(password: string): Promise<string | null> {
  try {
    const payload = JSON.parse(atob(props.cipher)) as {
      s: string;
      i: string;
      c: string;
    };
    const key = await deriveKey(password, b64ToBytes(payload.s));
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(payload.i) as unknown as BufferSource },
      key,
      b64ToBytes(payload.c) as unknown as BufferSource,
    );

    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

async function tryUnlock(): Promise<void> {
  const pwd = input.value.trim();

  if (!pwd || working.value) return;

  working.value = true;
  const text = await decryptWith(pwd);
  working.value = false;

  if (text === null) {
    error.value = true;
    setTimeout(() => {
      error.value = false;
    }, 1500);
    return;
  }

  html.value = text;
  unlocked.value = true;

  if (remember.value) localStorage.setItem(STORAGE_KEY, pwd);
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved)
    void decryptWith(saved).then((text) => {
      if (text !== null) {
        html.value = text;
        unlocked.value = true;
      }
    });
});
</script>

<template>
  <div v-if="unlocked" class="secret-gate-content" v-html="html"></div>
  <div v-else class="secret-gate">
    <div class="secret-gate-card" :class="{ shake: error }">
      <p class="secret-gate-title">🔒 此内容已加密</p>
      <p v-if="hint" class="secret-gate-hint">{{ hint }}</p>
      <input
        v-model="input"
        type="password"
        class="secret-gate-input"
        placeholder="请输入查看密码"
        @keydown.enter="tryUnlock"
      />
      <label class="secret-gate-remember">
        <input v-model="remember" type="checkbox" />
        记住密码（仅保存在本机浏览器）
      </label>
      <button
        type="button"
        class="secret-gate-btn"
        :disabled="working"
        @click="tryUnlock"
      >
        {{ working ? "解密中…" : "解锁" }}
      </button>
      <p v-if="error" class="secret-gate-error">密码不正确，请重试</p>
    </div>
  </div>
</template>

<style scoped>
.secret-gate {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

.secret-gate-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  max-width: 22rem;
  padding: 2rem 2.5rem;
  text-align: center;
  background: rgba(128, 128, 128, 0.06);
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 12px;
}

.secret-gate-title {
  margin: 0;
  font-weight: 600;
}

.secret-gate-hint {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.7;
}

.secret-gate-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-radius: 6px;
}

.secret-gate-remember {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  font-size: 0.8rem;
  opacity: 0.75;
}

.secret-gate-btn {
  padding: 0.45rem 1.5rem;
  cursor: pointer;
  background: rgba(128, 128, 128, 0.12);
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-radius: 6px;
}

.secret-gate-btn:hover {
  background: rgba(128, 128, 128, 0.2);
}

.secret-gate-error {
  margin: 0;
  color: #d33;
  font-size: 0.85rem;
}

.secret-gate-card.shake {
  animation: secret-gate-shake 0.4s;
}

@keyframes secret-gate-shake {
  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-6px);
  }

  75% {
    transform: translateX(6px);
  }
}

.secret-gate-content :deep(h2) {
  margin-top: 1.5rem;
}
</style>
