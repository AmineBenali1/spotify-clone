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
    tokenRefreshTimeout: NodeJS.Timeout | null
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        accessToken: null,
        refreshToken: null,
        expiresIn: 0,
        spotifyApi: null,
        user: null,
        tokenRefreshTimeout: null
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

        async forceRefreshToken() {
            console.log('Forcing immediate token refresh...')
            try {
                await this.refreshAccessToken()
                console.log('Token refresh completed successfully')
                return true
            } catch (error) {
                console.error('Failed to force refresh token:', error)
                return false
            }
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
                    // Schedule token refresh
                    this.scheduleTokenRefresh()
                } catch (error) {
                    console.error('Token verification failed:', error)
                    throw error
                }
            }
        },

        scheduleTokenRefresh() {
            // Clear any existing timeout
            if (this.tokenRefreshTimeout) {
                clearTimeout(this.tokenRefreshTimeout)
            }

            // Schedule refresh 5 minutes before expiration
            const refreshTime = (this.expiresIn - 300) * 1000 // Convert to milliseconds
            console.log(`Scheduling token refresh in ${refreshTime/1000} seconds`)
            
            this.tokenRefreshTimeout = setTimeout(async () => {
                try {
                    await this.refreshAccessToken()
                } catch (error) {
                    console.error('Failed to refresh token:', error)
                    this.logout()
                }
            }, refreshTime)
        },

        async refreshAccessToken() {
            if (!this.spotifyApi || !this.refreshToken) {
                console.error('Cannot refresh token: spotifyApi or refreshToken is missing')
                return
            }

            try {
                console.log('Refreshing access token...')
                const data = await this.spotifyApi.refreshAccessToken()
                console.log('Token refresh successful')
                
                this.accessToken = data.body.access_token
                this.expiresIn = data.body.expires_in

                if (this.spotifyApi) {
                    this.spotifyApi.setAccessToken(this.accessToken)
                }

                // Schedule next refresh
                this.scheduleTokenRefresh()
            } catch (error) {
                console.error('Error refreshing token:', error)
                this.logout()
                throw error
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
                // Try to refresh token if the error is due to token expiration
                if (error.status === 401) {
                    await this.refreshAccessToken()
                    // Retry fetching user profile
                    await this.fetchUserProfile()
                } else {
                    throw error
                }
            }
        },

        logout() {
            console.log('Logging out...')
            // Clear the refresh timeout
            if (this.tokenRefreshTimeout) {
                clearTimeout(this.tokenRefreshTimeout)
                this.tokenRefreshTimeout = null
            }
            this.accessToken = null
            this.refreshToken = null
            this.expiresIn = 0
            this.user = null
            this.spotifyApi = null
        }
    }
})
