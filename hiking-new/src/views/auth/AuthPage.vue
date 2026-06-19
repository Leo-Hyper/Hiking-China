<template>
  <div class="min-h-screen flex items-center justify-center bg-[#fafaf9] px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg">
          徒步
        </div>
        <h1 class="text-2xl font-bold text-charcoal">徒步中国</h1>
        <p class="text-sm text-slate-400 mt-1">加入徒步爱好者社区</p>
      </div>

      <!-- 登录表单 -->
      <div v-if="mode === 'login'" class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h2 class="text-xl font-bold text-charcoal mb-6">登录</h2>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">邮箱</label>
            <input v-model="form.email" type="email" required placeholder="your@email.com"
                   class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">密码</label>
            <input v-model="form.password" type="password" required minlength="6" placeholder="至少6个字符"
                   class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
          </div>
          <div v-if="errorMsg" class="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{{ errorMsg }}</div>
          <button type="submit" :disabled="loading"
                  class="w-full py-3 bg-charcoal text-white font-medium rounded-xl hover:bg-graphite transition-all disabled:opacity-50">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        <p class="text-center text-sm text-slate-400 mt-6">
          还没有账号？<button @click="mode = 'register'" class="text-forest-600 font-medium hover:underline">注册</button>
        </p>
      </div>

      <!-- 注册表单 -->
      <div v-else class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h2 class="text-xl font-bold text-charcoal mb-6">注册</h2>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">用户名</label>
            <input v-model="form.username" type="text" required minlength="2" maxlength="20" placeholder="2-20个字符"
                   class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">邮箱</label>
            <input v-model="form.email" type="email" required placeholder="your@email.com"
                   class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">密码</label>
            <input v-model="form.password" type="password" required minlength="6" placeholder="至少6个字符"
                   class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
          </div>
          <div v-if="errorMsg" class="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{{ errorMsg }}</div>
          <button type="submit" :disabled="loading"
                  class="w-full py-3 bg-forest-600 text-white font-medium rounded-xl hover:bg-forest-700 transition-all disabled:opacity-50">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>
        <p class="text-center text-sm text-slate-400 mt-6">
          已有账号？<button @click="mode = 'login'" class="text-forest-600 font-medium hover:underline">登录</button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue"
import { useRouter } from "vue-router"
import { useAuth } from "../../stores/auth"

const router = useRouter()
const auth = useAuth()
const mode = ref("login")
const loading = ref(false)
const errorMsg = ref("")
const form = reactive({ username: "", email: "", password: "" })

async function handleLogin() {
  loading.value = true
  errorMsg.value = ""
  try {
    await auth.login(form.email, form.password)
    router.push("/")
  } catch (err) {
    errorMsg.value = err.message || "登录失败，请重试"
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  loading.value = true
  errorMsg.value = ""
  try {
    await auth.register(form.username, form.email, form.password)
    router.push("/")
  } catch (err) {
    errorMsg.value = err.message || "注册失败，请重试"
  } finally {
    loading.value = false
  }
}
</script>
