import { defineStore } from 'pinia'
import SpotifyWebApi from 'spotify-web-api-node'

interface User {
    id: string
    display_name?: string
    email?: string
    images?: Array<{ url: string }>
}

interface AuthState {
    accessToken: string | null
    refreshToken: string | null
    expiresIn: number
    spotifyApi: SpotifyWebApi | null
    user: User | null
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        accessToken: null,
        refreshToken: null,
        expiresIn: 0,
        spotifyApi: null,
        user: null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken,
    },

    actions: {
        async initialize() {
            const config = useRuntimeConfig()
            this.spotifyApi = new SpotifyWebApi({
                clientId: config.public.spotifyClientId,
                clientSecret: config.spotifyClientSecret,
                redirectUri: config.public.spotifyRedirectUri,
            })
        },

        async setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
            this.accessToken = accessToken
            this.refreshToken = refreshToken
            this.expiresIn = expiresIn

            if (this.spotifyApi) {
                this.spotifyApi.setAccessToken(accessToken)
                this.spotifyApi.setRefreshToken(refreshToken)
            }
        },

        async refreshAccessToken() {
            if (!this.spotifyApi || !this.refreshToken) return

            try {
                const data = await this.spotifyApi.refreshAccessToken()
                this.accessToken = data.body.access_token
                this.expiresIn = data.body.expires_in

                if (this.spotifyApi) {
                    this.spotifyApi.setAccessToken(this.accessToken)
                }
            } catch (error) {
                console.error('Error refreshing token:', error)
                this.logout()
            }
        },

        async fetchUserProfile() {
            if (!this.spotifyApi) return

            try {
                const data = await this.spotifyApi.getMe()
                this.user = data.body
            } catch (error) {
                console.error('Error fetching user profile:', error)
            }
        },

        logout() {
            this.accessToken = null
            this.refreshToken = null
            this.expiresIn = 0
            this.user = null
            this.spotifyApi = null
        }
    }
})
