<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const playlist = ref<any>(null)
const tracks = ref<any[]>([])
const isLoading = ref(false)
const errorMsg = ref('')

const fetchPlaylist = async () => {
  isLoading.value = true
  try {
    if (authStore.spotifyApi) {
      const response = await authStore.spotifyApi.getPlaylist(route.params.id as string)
      playlist.value = response.body
      console.log('Loaded playlist:', playlist.value)
    }
  } catch (error) {
    errorMsg.value = 'Failed to load playlist. Please re-login or check your permissions.'
    console.error('Error fetching playlist:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchPlaylistTracks = async () => {
  isLoading.value = true
  try {
    if (authStore.spotifyApi) {
      const response = await authStore.spotifyApi.getPlaylistTracks(route.params.id as string)
      tracks.value = response.body.items
      errorMsg.value = ''
      console.log('Loaded tracks:', tracks.value)
    }
  } catch (error) {
    errorMsg.value = 'Failed to load playlist tracks.'
    console.error('Error fetching playlist tracks:', error)
  } finally {
    isLoading.value = false
  }
}

const removeTrack = async (trackUri: string) => {
  if (!playlist.value) return
  try {
    await authStore.spotifyApi.removeTracksFromPlaylist(playlist.value.id, [{ uri: trackUri }])
    await fetchPlaylistTracks()
    alert('Track removed!')
  } catch (error) {
    alert('Failed to remove track.')
    console.error(error)
  }
}

onMounted(async () => {
  await fetchPlaylist()
  await fetchPlaylistTracks()
})
</script>

<template>
  <div class="space-y-8">
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
    </div>

    <div v-else-if="errorMsg" class="text-center text-red-400 py-2">
      {{ errorMsg }}
    </div>

    <div v-else-if="playlist" class="space-y-6">
      <!-- Playlist Header -->
      <div class="flex items-end space-x-6">
        <div class="w-48 h-48 flex-shrink-0">
          <img
            v-if="playlist.images?.[0]?.url"
            :src="playlist.images[0].url"
            :alt="playlist.name"
            class="w-full h-full object-cover rounded-lg shadow-lg"
          />
          <div v-else class="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
            <span class="material-icons text-gray-500 text-6xl">playlist_play</span>
          </div>
        </div>
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-2">{{ playlist.name }}</h1>
          <p class="text-gray-400">{{ playlist.description }}</p>
          <p class="text-sm text-gray-400 mt-2">
            {{ playlist.tracks.total }} tracks • Created by {{ playlist.owner.display_name }}
          </p>
        </div>
      </div>

      <!-- Tracks List -->
      <div class="mt-8">
        <h2 class="text-2xl font-bold mb-4">Tracks</h2>
        <div v-if="tracks.length === 0" class="text-gray-400">No tracks in this playlist.</div>
        <ul v-else class="space-y-2">
          <li
            v-for="item in tracks"
            :key="item.track.id"
            class="flex items-center justify-between bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-center space-x-4">
              <img
                v-if="item.track.album?.images?.[0]?.url"
                :src="item.track.album.images[0].url"
                :alt="item.track.name"
                class="w-12 h-12 rounded"
              />
              <div>
                <h3 class="font-medium">{{ item.track.name }}</h3>
                <p class="text-sm text-gray-400">
                  {{ item.track.artists.map(a => a.name).join(', ') }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <a
                :href="item.track.external_urls.spotify"
                target="_blank"
                rel="noopener"
                class="text-gray-400 hover:text-white"
              >
                <span class="material-icons">open_in_new</span>
              </a>
              <button
                class="text-red-500 hover:text-red-400"
                @click="removeTrack(item.track.uri)"
              >
                <span class="material-icons">remove_circle</span>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template> 