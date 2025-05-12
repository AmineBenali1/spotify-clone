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
        user: null
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
            console.log('Setting tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, expiresIn })
            this.accessToken = accessToken
            this.refreshToken = refreshToken
            this.expiresIn = expiresIn

            if (this.spotifyApi) {
                this.spotifyApi.setAccessToken(accessToken)
                this.spotifyApi.setRefreshToken(refreshToken)
                
                // Verify token is working
                try {
                    await this.spotifyApi.getMe()
                    console.log('Token verification successful')
                } catch (error) {
                    console.error('Token verification failed:', error)
                    throw error
                }
            }
        },

        async fetchUserProfile() {
            if (!this.spotifyApi) {
                console.error('Cannot fetch user profile: spotifyApi is not initialized')
                return
            }

            try {
                console.log('Fetching user profile...')
                const data = await this.spotifyApi.getMe()
                this.user = data.body
                console.log('User profile fetched successfully:', this.user)
            } catch (error) {
                console.error('Error fetching user profile:', error)
                throw error
            }
        },

        logout() {
            console.log('Logging out...')
            this.accessToken = null
            this.refreshToken = null
            this.expiresIn = 0
            this.user = null
            this.spotifyApi = null
        }
    }
})
