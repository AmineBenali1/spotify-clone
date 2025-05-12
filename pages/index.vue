<template>
  <div class="page">
    <div v-if="!authStore.isAuthenticated" class="login-container">
      <h1>Welcome to My Music App</h1>
      <button @click="login" class="login-btn">Login with Spotify</button>
    </div>

    <div v-else class="content">
      <!-- User Profile -->
      <div class="profile">
        <div class="user">
          <img
            v-if="authStore.user?.images?.[0]?.url"
            :src="authStore.user.images[0].url"
            alt="Profile"
            class="avatar"
          />
          <div>
            <h2>Welcome, {{ authStore.user?.display_name }}</h2>
            <p>{{ authStore.user?.email }}</p>
          </div>
        </div>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>

      <!-- Random Tracks -->
      <div class="section">
        <h2>Discover New Music</h2>
        <div v-if="isLoading" class="loading">Loading...</div>
        <div v-else-if="errorMsg" class="error">{{ errorMsg }}</div>
        <div v-else-if="randomTracks.length === 0" class="empty">No tracks available.</div>
        <div v-else class="tracks">
          <div v-for="track in randomTracks" :key="track.id" class="track">
            <div class="track-image">
              <img
                v-if="track.album?.images?.[0]?.url"
                :src="track.album.images[0].url"
                :alt="track.name"
              />
              <div v-else class="no-image">
                <span class="material-icons">music_note</span>
              </div>
            </div>
            <h3>{{ track.name }}</h3>
            <p>{{ track.artists.map(a => a.name).join(', ') }}</p>
            <div class="track-buttons">
              <a
                :href="track.external_urls.spotify"
                target="_blank"
                rel="noopener"
                class="spotify-link"
              >
                <span class="material-icons">play_circle</span>
                Play on Spotify
              </a>
              <div class="dropdown">
                <button @click="openPlaylistDropdown(track)" class="add-btn">
                  <span class="material-icons">playlist_add</span>
                </button>
                <div
                  v-if="showPlaylistDropdown && currentTrack?.id === track.id"
                  class="dropdown-menu"
                >
                  <div v-if="userPlaylists.length === 0" class="no-playlists">
                    No playlists found
                  </div>
                  <button
                    v-for="playlist in userPlaylists"
                    :key="playlist.id"
                    @click="addToPlaylist(track.uri, playlist.id)"
                    class="playlist-btn"
                  >
                    {{ playlist.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recently Played -->
      <div class="section">
        <h2>Recently Played</h2>
        <div v-if="isLoading" class="loading">Loading...</div>
        <div v-else-if="errorMsg" class="error">{{ errorMsg }}</div>
        <div v-else-if="recentTracks.length === 0" class="empty">No recent tracks available.</div>
        <div v-else class="tracks">
          <div v-for="item in recentTracks" :key="item.track.id" class="track">
            <div class="track-image">
              <img
                v-if="item.track.album?.images?.[0]?.url"
                :src="item.track.album.images[0].url"
                :alt="item.track.name"
              />
              <div v-else class="no-image">
                <span class="material-icons">music_note</span>
              </div>
            </div>
            <h3>{{ item.track.name }}</h3>
            <p>{{ item.track.artists.map(a => a.name).join(', ') }}</p>
            <a
              :href="item.track.external_urls.spotify"
              target="_blank"
              rel="noopener"
              class="spotify-link"
            >
              <span class="material-icons">play_circle</span>
              Play on Spotify
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const authStore = useAuthStore()
const randomTracks = ref<any[]>([])
const recentTracks = ref<any[]>([])
const isLoading = ref(false)
const errorMsg = ref('')
const userPlaylists = ref<any[]>([])
const selectedPlaylistId = ref<string>('')
const showPlaylistDropdown = ref(false)
const currentTrack = ref<any>(null)

const fetchRandomTracks = async () => {
  if (!authStore.spotifyApi) {
    console.error('Spotify API not initialized')
    errorMsg.value = 'Spotify API not initialized. Please try logging in again.'
    return
  }
  
  isLoading.value = true
  try {
    console.log('Fetching random tracks...')
    // Get new releases first
    const newReleases = await authStore.spotifyApi.getNewReleases({ limit: 20 })
    const albums = newReleases.body.albums.items
    
    // Get tracks from these albums
    const tracksPromises = albums.map(async album => {
      const tracks = await authStore.spotifyApi.getAlbumTracks(album.id)
      // Add album info to each track
      return tracks.body.items.map(track => ({
        ...track,
        album: {
          ...album,
          images: album.images
        }
      }))
    })
    
    const tracksResults = await Promise.all(tracksPromises)
    
    // Flatten and shuffle tracks
    const allTracks = tracksResults.flat()
    randomTracks.value = allTracks
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)
    
    console.log('Successfully loaded random tracks:', randomTracks.value)
    errorMsg.value = ''
  } catch (error: any) {
    console.error('Error fetching random tracks:', error)
    errorMsg.value = error.message || 'Failed to load tracks. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const fetchRecentTracks = async () => {
  if (!authStore.spotifyApi) {
    console.error('Spotify API not initialized')
    errorMsg.value = 'Spotify API not initialized. Please try logging in again.'
    return
  }
  
  isLoading.value = true
  try {
    console.log('Fetching recent tracks...')
    const response = await authStore.spotifyApi.getMyRecentlyPlayedTracks({ limit: 3 })
    
    if (!response?.body?.items) {
      throw new Error('Invalid response format from Spotify API')
    }
    
    // Keep only the 3 most recent tracks
    recentTracks.value = response.body.items.slice(0, 3)
    console.log('Successfully loaded recent tracks:', recentTracks.value)
    errorMsg.value = ''
  } catch (error: any) {
    console.error('Error fetching recent tracks:', error)
    errorMsg.value = error.message || 'Failed to load recent tracks. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const fetchUserPlaylists = async () => {
  if (!authStore.spotifyApi) return
  try {
    const response = await authStore.spotifyApi.getUserPlaylists()
    userPlaylists.value = response.body.items
  } catch (error) {
    console.error('Error fetching user playlists:', error)
  }
}

const addToPlaylist = async (trackUri: string, playlistId: string) => {
  if (!authStore.spotifyApi) return
  try {
    await authStore.spotifyApi.addTracksToPlaylist(playlistId, [trackUri])
    alert('Track added to playlist!')
    showPlaylistDropdown.value = false
  } catch (error) {
    console.error('Error adding track to playlist:', error)
    alert('Failed to add track to playlist')
  }
}

const openPlaylistDropdown = (track: any) => {
  currentTrack.value = track
  showPlaylistDropdown.value = true
  fetchUserPlaylists()
}

const login = () => {
  const scope = [
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'streaming'
  ].join(' ')

  const params = new URLSearchParams({
    client_id: config.public.spotifyClientId,
    response_type: 'code',
    redirect_uri: config.public.spotifyRedirectUri,
    scope
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

const logout = () => {
  authStore.logout()
  window.location.reload()
}

// Add refresh interval
let refreshInterval: NodeJS.Timeout

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await fetchRandomTracks()
    await fetchRecentTracks()
    // Refresh recently played tracks every 10 seconds
    refreshInterval = setInterval(fetchRecentTracks, 10000)
  }
})

onUnmounted(() => {
  // Clear the interval when component is unmounted
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.page {
  background-color: #121212;
  min-height: 100vh;
  color: white;
  padding: 20px;
}

.login-container {
  text-align: center;
  padding: 100px 20px;
}

.login-btn {
  background-color: #1DB954;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
}

.profile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.logout-btn {
  background-color: #333;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  margin-bottom: 20px;
  font-size: 24px;
}

.loading {
  text-align: center;
  padding: 20px;
}

.error {
  color: #ff4444;
  text-align: center;
  padding: 20px;
}

.empty {
  color: #888;
  text-align: center;
  padding: 20px;
}

.tracks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.track {
  background-color: #282828;
  padding: 15px;
  border-radius: 8px;
}

.track-image {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin-bottom: 15px;
  background-color: #333;
  border-radius: 4px;
  overflow: hidden;
}

.track-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.track h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.track p {
  margin: 0 0 10px 0;
  color: #888;
  font-size: 14px;
}

.track-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spotify-link {
  color: #1DB954;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
}

.add-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 5px;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: #282828;
  min-width: 200px;
  border-radius: 4px;
  padding: 5px;
  margin-top: 5px;
  z-index: 1;
}

.no-playlists {
  padding: 10px;
  color: #888;
}

.playlist-btn {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}

.playlist-btn:hover {
  background-color: #333;
}
</style>