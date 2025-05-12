export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const code = body.code

        if (!code) {
            throw new Error('No authorization code provided')
        }

        const clientId = process.env.SPOTIFY_CLIENT_ID
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI

        if (!clientId || !clientSecret || !redirectUri) {
            console.error('Missing environment variables:', {
                clientId: !!clientId,
                clientSecret: !!clientSecret,
                redirectUri: !!redirectUri
            })
            throw new Error('Server configuration error')
        }

        const params = new URLSearchParams()
        params.append('grant_type', 'authorization_code')
        params.append('code', code)
        params.append('redirect_uri', redirectUri)

        console.log('Requesting token from Spotify...')
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
            },
            body: params
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Spotify token error:', errorData)
            throw new Error(`Spotify API error: ${errorData.error_description || errorData.error || 'Unknown error'}`)
        }

        const data = await response.json()
        console.log('Successfully received token from Spotify')
        return data
    } catch (error) {
        console.error('Error in token endpoint:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to exchange code for token'
        })
    }
})
