import { defineStore } from 'pinia'

export const usePlayerStore = defineStore('player', {
    state: () => ({
        deviceId: null as string | null,
        player: null as any,
        currentTrack: null as any,
        isPlaying: false,
    }),
    actions: {
        setDeviceId(id: string) {
            this.deviceId = id
        },
        setPlayer(player: any) {
            this.player = player
        },
        setCurrentTrack(track: any) {
            this.currentTrack = track
        },
        setIsPlaying(isPlaying: boolean) {
            this.isPlaying = isPlaying
        }
    }
})