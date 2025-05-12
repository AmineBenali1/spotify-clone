import { useAuthStore } from '~/stores/auth'
import { usePlayerStore } from '~/stores/player'

export default defineNuxtPlugin(() => {
    if (process.client) {
        const authStore = useAuthStore()
        const playerStore = usePlayerStore()

        // @ts-ignore
        if (!window.onSpotifyWebPlaybackSDKReady) {
            // @ts-ignore
            window.onSpotifyWebPlaybackSDKReady = () => { }
        }
        if (!document.getElementById('spotify-sdk')) {
            const script = document.createElement('script')
            script.id = 'spotify-sdk'
            script.src = 'https://sdk.scdn.co/spotify-player.js'
            document.head.appendChild(script)
        }

        // @ts-ignore
        window.onSpotifyWebPlaybackSDKReady = () => {
            // @ts-ignore
            const player = new window.Spotify.Player({
                name: 'Spotify Clone Player',
                getOAuthToken: (cb: any) => { cb(authStore.accessToken) },
                volume: 0.5
            })

            player.addListener('ready', ({ device_id }: any) => {
                playerStore.setDeviceId(device_id)
            })

            player.addListener('player_state_changed', (state: any) => {
                if (!state) return
                playerStore.setCurrentTrack(state.track_window.current_track)
                playerStore.setIsPlaying(!state.paused)
            })

            player.connect()
            playerStore.setPlayer(player)
        }
    }
})