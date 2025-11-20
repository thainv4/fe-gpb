import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { HisTokenResponse, HisUserInfo, HisTokenStatus } from '@/lib/api/client'

interface HisState {
    token: HisTokenResponse | null
    userInfo: HisUserInfo | null
    tokenStatus: HisTokenStatus | null
    isLoggedIn: boolean
    setToken: (token: HisTokenResponse) => void
    setUserInfo: (userInfo: HisUserInfo) => void
    setTokenStatus: (status: HisTokenStatus) => void
    setLoggedIn: (loggedIn: boolean) => void
    clearHisData: () => void
}

export const useHisStore = create<HisState>()(
    persist(
        (set) => ({
            token: null,
            userInfo: null,
            tokenStatus: null,
            isLoggedIn: false,

            setToken: (token: HisTokenResponse) => {
                set({ token, isLoggedIn: true })
            },

            setUserInfo: (userInfo: HisUserInfo) => {
                set({ userInfo })
            },

            setTokenStatus: (tokenStatus: HisTokenStatus) => {
                set({ tokenStatus })
            },

            setLoggedIn: (isLoggedIn: boolean) => {
                set({ isLoggedIn })
            },

            clearHisData: () => {
                set({
                    token: null,
                    userInfo: null,
                    tokenStatus: null,
                    isLoggedIn: false,
                })
            },
        }),
        {
            name: 'his-storage',
            partialize: (state) => ({
                token: state.token,
                userInfo: state.userInfo,
                tokenStatus: state.tokenStatus,
                isLoggedIn: state.isLoggedIn,
            }),
        }
    )
)
