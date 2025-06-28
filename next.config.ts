/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config: import('webpack').Configuration) => {
    config.module!.rules!.push({
      test: /\.(mp3)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[hash][ext][query]'
      }
    });
    return config;
  }
};

module.exports = nextConfig;

// import sountrack from "/public/sountrack.mp3";
const sountrack = "/sountrack.mp3";