const withOptimizedImages = require('next-optimized-images');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  handleImages: ['jpeg', 'png', 'svg']
}

module.exports = withOptimizedImages(nextConfig)
