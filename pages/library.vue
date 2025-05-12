<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const playlists = ref<any[]>([])
const selectedPlaylist = ref<any>(null)
const playlistTracks = ref<any[]>([])
const isLoading = ref(false)
const newPlaylistName = ref('')
const newPlaylistDesc = ref('')
const errorMsg = ref('')
const router = useRouter()

const fetchPlaylists = async () => {
  isLoading.value = true
  try {
    if (authStore.spotifyApi) {
      const response = await authStore.spotifyApi.getUserPlaylists()
      playlists.value = response.body.items
      errorMsg.value = ''
      console.log('Loaded playlists:', playlists.value)
    }
  } catch (error) {
    errorMsg.value = 'Failed to load playlists. Please re-login or check your permissions.'
    console.error('Error fetching playlists:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchPlaylistTracks = async (playlistId: string) => {
  isLoading.value = true
  try {
    if (authStore.spotifyApi) {
      const response = await authStore.spotifyApi.getPlaylistTracks(playlistId)
      playlistTracks.value = response.body.items
      errorMsg.value = ''
      console.log('Loaded tracks:', playlistTracks.value)
      
      // Update the track count in the playlist list
      const playlist = playlists.value.find(p => p.id === playlistId)
      if (playlist) {
        playlist.tracks.total = response.body.total
      }
    }
  } catch (error) {
    errorMsg.value = 'Failed to load playlist tracks.'
    console.error('Error fetching playlist tracks:', error)
  } finally {
    isLoading.value = false
  }
}

const selectPlaylist = (playlist: any) => {
  router.push(`/playlist/${playlist.id}`)
}

const createPlaylist = async () => {
  if (!newPlaylistName.value.trim()) return
  try {
    if (authStore.spotifyApi && authStore.user) {
      const response = await authStore.spotifyApi.createPlaylist(authStore.user.id, {
        name: newPlaylistName.value,
        description: newPlaylistDesc.value,
        public: false
      })
      newPlaylistName.value = ''
      newPlaylistDesc.value = ''
      await fetchPlaylists() // Refresh the playlist list
      alert('Playlist created!')
    }
  } catch (error) {
    alert('Failed to create playlist.')
    console.error(error)
  }
}

const removeTrack = async (trackUri: string) => {
  if (!selectedPlaylist.value) return
  try {
    await authStore.spotifyApi.removeTracksFromPlaylist(selectedPlaylist.value.id, [{ uri: trackUri }])
    await fetchPlaylistTracks(selectedPlaylist.value.id) // Refresh the tracks
    alert('Track removed!')
  } catch (error) {
    alert('Failed to remove track.')
    console.error(error)
  }
}

// Add a refresh function
const refreshPlaylists = async () => {
  await fetchPlaylists()
  if (selectedPlaylist.value) {
    await fetchPlaylistTracks(selectedPlaylist.value.id)
  }
}

// Refresh playlists every 30 seconds
onMounted(() => {
  fetchPlaylists()
  const interval = setInterval(refreshPlaylists, 30000)
  onUnmounted(() => clearInterval(interval))
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold mb-4">Your Playlists</h1>
      <form @submit.prevent="createPlaylist" class="flex flex-col md:flex-row gap-2 mb-6">
        <input
          v-model="newPlaylistName"
          type="text"
          placeholder="New playlist name"
          class="px-4 py-2 rounded bg-gray-800 text-white"
        />
        <input
          v-model="newPlaylistDesc"
          type="text"
          placeholder="Description (optional)"
          class="px-4 py-2 rounded bg-gray-800 text-white"
        />
        <button
          type="submit"
          class="bg-spotify-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Create Playlist
        </button>
      </form>
      <div v-if="errorMsg" class="text-center text-red-400 py-2">{{ errorMsg }}</div>
      <div v-if="isLoading" class="text-center text-gray-400">Loading...</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="playlist in playlists"
          :key="playlist.id"
          class="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          @click="selectPlaylist(playlist)"
        >
          <div class="aspect-square bg-gray-700 rounded-lg mb-4 overflow-hidden">
            <img
              v-if="playlist.images?.[0]?.url"
              :src="playlist.images[0].url"
              :alt="playlist.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-700">
              <span class="material-icons text-gray-500 text-4xl">playlist_play</span>
            </div>
          </div>
          <h3 class="font-medium">{{ playlist.name }}</h3>
          <p class="text-sm text-gray-400">{{ playlist.tracks.total }} tracks</p>
        </div>
      </div>
    </div>

    <div v-if="selectedPlaylist" class="mt-8">
      <h2 class="text-xl font-bold mb-4">Tracks in "{{ selectedPlaylist.name }}"</h2>
      <div v-if="isLoading" class="text-center text-gray-400">Loading tracks...</div>
      <div v-else>
        <div v-if="playlistTracks.length === 0" class="text-gray-400">No tracks in this playlist.</div>
        <ul>
          <li
            v-for="item in playlistTracks"
            :key="item.track.id"
            class="flex items-center justify-between bg-gray-700 rounded p-2 mb-2"
          >
            <div>
              <span class="font-medium">{{ item.track.name }}</span>
              <span class="text-gray-400 text-sm ml-2">
                {{ item.track.artists.map(a => a.name).join(', ') }}
              </span>
            </div>
            <button
              class="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded"
              @click="removeTrack(item.track.uri)"
            >
              Remove
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>