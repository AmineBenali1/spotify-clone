/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./components/**/*.{js,vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
        "./error.vue"
    ],
    theme: {
        extend: {
            colors: {
                'spotify-green': '#1DB954',
                'spotify-black': '#191414',
                'spotify-gray': '#282828',
                'spotify-light-gray': '#B3B3B3'
            }
        }
    },
    plugins: []
} 