🔐 Accès à l'application Spotify

Pour des raisons de sécurité liées à l'authentification avec l'API Spotify, toute personne souhaitant tester ce projet doit choisir l'une des deux options suivantes :

✅ Option 1 (recommandée) : Me contacter

Veuillez m’envoyer votre nom d’utilisateur Spotify et l’adresse e-mail associée au compte.
Je pourrai ainsi autoriser manuellement votre accès à l’application via mon compte développeur.

📩 Contact : Amine.BENALI@um6p.ma

🔧 Option 2 : Utiliser votre propre compte Spotify Developer

Si vous préférez utiliser votre propre configuration :

Créez un compte sur Spotify Developer Dashboard

Créez une nouvelle application

Récupérez votre Client ID et Client Secret

Ajoutez http://127.0.0.1:3000/callback aux Redirect URIs dans les paramètres de l’application

Créez un fichier .env à la racine du projet avec ce format :

SPOTIFY_CLIENT_ID=your_client_id_here

SPOTIFY_CLIENT_SECRET=your_client_secret_here

SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback

# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
