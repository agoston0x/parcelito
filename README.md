# Parcelito

Token baskets for everyone. A World Mini App for buying, creating, and gifting curated token portfolios.

**ETHGlobal Buenos Aires 2025**

## Features

- **Buy** - Purchase curated token baskets with one transaction
- **Create** - Build your own token basket for others to follow
- **Gift** - Send crypto gifts to friends via World ID or email

## Tech Stack

- **World Chain** - Free gas for World ID verified users
- **World MiniKit** - Native World App integration
users
- **ENS** - Usernames minted as subdomains under parcelito.eth, information about user activity including token baskets purchased or gifted, stored in text records. Possiblity for encryption.
- **1Inch** - Tokens purchased seamlessly on multiple chains in Background.
-  

## Getting Started

```bash
# Install dependencies
npm install

# Copy env example and fill in values
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Presentation Mode

The `/ethglobal` route is a real-time presentation for demos:

- **Viewer mode**: `https://your-domain.com/ethglobal`
- **Presenter mode**: `https://your-domain.com/ethglobal?presenter=YOUR_SECRET`

Presenter can control slides with arrow keys or on-screen buttons. All viewers sync in real-time.


## Environment Variables

NEXT_PUBLIC_PRESENTER_TOKEN=your_secret_presenter_token
NEXT_PUBLIC_WLD_APP_ID=your_world_app_id
```

## Deploy

Deploy to Vercel:

```bash
vercel
```

## License

MIT
