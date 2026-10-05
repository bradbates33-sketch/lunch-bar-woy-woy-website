module.exports = {
  reactStrictMode: true,
  images: {
    // Item photos uploaded in the Square dashboard are served from Square's
    // image bucket; Next resizes/compresses them before they reach visitors.
    remotePatterns: [
      { protocol: 'https', hostname: 'items-images-production.s3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 'items-images-production.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'items-images-sandbox.s3.us-west-2.amazonaws.com' },
    ],
    formats: ['image/webp'],
  },
};
