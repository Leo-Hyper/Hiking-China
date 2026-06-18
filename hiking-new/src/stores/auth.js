import { ref, computed, watch } from "vue"
import { useRouter } from "vue-router"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

export function useAuth() {
  const router = useRouter()
  const token = ref(localStorage.getItem("token") || "")
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"))

  const isLoggedIn = computed(() => !!token.value)

  // 监听 token 变化，自动更新路由守卫
  watch(token, () => {
    if (!token.value) {
      localStorage.removeItem("user")
      user.value = null
      if (window.location.pathname === "/profile") {
        router.push("/login")
      }
    }
  })

  async function register(username, email, password) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    token.value = data.token
    user.value = data.user
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    return data
  }

  async function login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    token.value = data.token
    user.value = data.user
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    return data
  }

  function logout() {
    token.value = ""
    user.value = null
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  async function fetchUser() {
    if (!token.value) return null
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token.value}` },
      })
      if (!res.ok) {
        logout()
        return null
      }
      const data = await res.json()
      user.value = data.user
      localStorage.setItem("user", JSON.stringify(data.user))
      return data.user
    } catch {
      logout()
      return null
    }
  }

  return { isLoggedIn, user, register, login, logout, fetchUser, token }
}
