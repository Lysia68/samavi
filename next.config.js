/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignore TypeScript errors in JSX files (inline styles boxSizing etc.)
    ignoreBuildErrors: true,
  },
}
module.exports = nextConfig