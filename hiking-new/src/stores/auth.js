import { ref, computed, watch } from "vue"
import { useRouter } from "vue-router"

const API_URL = import.meta.env.VITE_API_URL || "https://hiking-china-api.onrender.com"

// 全局单例
let authState = null

export function useAuth() {
  if (authState) return authState

  const router = useRouter()
  
  // 从 localStorage 恢复状态
  const token = ref(localStorage.getItem("token") || "")
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"))

  const isLoggedIn = computed(() => !!token.value)

  // 监听 token 变化，保持 localStorage 同步
  watch(token, (newVal) => {
    if (newVal) {
      localStorage.setItem("token", newVal)
    } else {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      user.value = null
    }
  })

  // 监听 user 变化，保持 localStorage 同步
  watch(user, (newVal) => {
    if (newVal) {
      localStorage.setItem("user", JSON.stringify(newVal))
    }
  })

  async function register(username, email, password) {
    const res = await fetchWithRetry(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    token.value = data.token
    user.value = data.user
    return data
  }

  async function login(email, password) {
    const res = await fetchWithRetry(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    token.value = data.token
    user.value = data.user
    return data
  }

  function logout() {
    token.value = ""
    user.value = null
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  async function fetchUser() {
    if (!token.value) return null
    try {
      const res = await fetchWithRetry(`${API_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token.value}` },
      })
      if (!res.ok) {
        logout()
        return null
      }
      const data = await res.json()
      user.value = data.user
      return data.user
    } catch {
      return null
    }
  }

  authState = { isLoggedIn, user, token, register, login, logout, fetchUser }
  return authState
}

// 带重试的 fetch（供 AuthPage.vue 等非 store 场景使用）
async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { ...options, credentials: "include" })
      if (res.status === 503 && i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)))
        continue
      }
      return res
    } catch (err) {
      if (i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)))
        continue
      }
      throw new Error("网络连接失败，请检查网络后重试")
    }
  }
  throw new Error("请求失败")
}
