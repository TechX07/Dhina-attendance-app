#!/usr/bin/env node

/**
 * PWA Icon Generator
 * 
 * This script generates PWA icons using Canvas API
 * Run with: node scripts/generate-pwa-icons.js
 * 
 * Requires: canvas package - install with: npm install --save-dev canvas
 */

const fs = require('fs');
const path = require('path');

// Simple SVG-based icon generation
function generateSVGIcon(size, withMask = false) {
  const svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="${size}" height="${size}" fill="#4f46e5"/>
    
    <!-- Circle background for maskable -->
    ${withMask ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#4f46e5"/>` : ''}
    
    <!-- Letter "A" -->
    <text
      x="${size / 2}"
      y="${size / 2 + size * 0.15}"
      font-size="${size * 0.6}"
      font-weight="bold"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="white"
      font-family="Arial, sans-serif"
    >A</text>
  </svg>`;
  return svg;
}

// Convert SVG to PNG using canvas if available, otherwise save SVG as fallback
async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating PWA icons...');

  // Try to use canvas if available, otherwise use SVG
  let useCanvas = false;
  try {
    const canvas = require('canvas');
    useCanvas = true;
  } catch {
    console.log('Canvas not available. Generating SVG icons as fallback.');
    console.log('For PNG icons, run: npm install --save-dev canvas');
  }

  if (useCanvas) {
    const { createCanvas } = require('canvas');

    // Generate 192x192 icon
    const canvas192 = createCanvas(192, 192);
    const ctx192 = canvas192.getContext('2d');
    ctx192.fillStyle = '#4f46e5';
    ctx192.fillRect(0, 0, 192, 192);
    ctx192.fillStyle = '#ffffff';
    ctx192.font = 'bold 115px Arial';
    ctx192.textAlign = 'center';
    ctx192.textBaseline = 'middle';
    ctx192.fillText('A', 96, 96);
    
    const buffer192 = canvas192.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'icon-192.png'), buffer192);
    console.log('✓ Generated icon-192.png');

    // Generate 512x512 icon
    const canvas512 = createCanvas(512, 512);
    const ctx512 = canvas512.getContext('2d');
    ctx512.fillStyle = '#4f46e5';
    ctx512.fillRect(0, 0, 512, 512);
    ctx512.fillStyle = '#ffffff';
    ctx512.font = 'bold 310px Arial';
    ctx512.textAlign = 'center';
    ctx512.textBaseline = 'middle';
    ctx512.fillText('A', 256, 256);
    
    const buffer512 = canvas512.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'icon-512.png'), buffer512);
    console.log('✓ Generated icon-512.png');

    // Generate maskable icons
    const canvasMask192 = createCanvas(192, 192);
    const ctxMask192 = canvasMask192.getContext('2d');
    ctxMask192.fillStyle = '#4f46e5';
    ctxMask192.beginPath();
    ctxMask192.arc(96, 96, 96, 0, Math.PI * 2);
    ctxMask192.fill();
    ctxMask192.fillStyle = '#ffffff';
    ctxMask192.font = 'bold 115px Arial';
    ctxMask192.textAlign = 'center';
    ctxMask192.textBaseline = 'middle';
    ctxMask192.fillText('A', 96, 96);
    
    const bufferMask192 = canvasMask192.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'icon-192-maskable.png'), bufferMask192);
    console.log('✓ Generated icon-192-maskable.png');

    const canvasMask512 = createCanvas(512, 512);
    const ctxMask512 = canvasMask512.getContext('2d');
    ctxMask512.fillStyle = '#4f46e5';
    ctxMask512.beginPath();
    ctxMask512.arc(256, 256, 256, 0, Math.PI * 2);
    ctxMask512.fill();
    ctxMask512.fillStyle = '#ffffff';
    ctxMask512.font = 'bold 310px Arial';
    ctxMask512.textAlign = 'center';
    ctxMask512.textBaseline = 'middle';
    ctxMask512.fillText('A', 256, 256);
    
    const bufferMask512 = canvasMask512.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'icon-512-maskable.png'), bufferMask512);
    console.log('✓ Generated icon-512-maskable.png');
  } else {
    // Fallback: Generate SVG icons
    fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), generateSVGIcon(192));
    fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), generateSVGIcon(512));
    fs.writeFileSync(path.join(publicDir, 'icon-192-maskable.svg'), generateSVGIcon(192, true));
    fs.writeFileSync(path.join(publicDir, 'icon-512-maskable.svg'), generateSVGIcon(512, true));
    
    console.log('✓ Generated SVG icons as fallback');
    console.log('  Install canvas for PNG icons: npm install --save-dev canvas');
  }

  console.log('PWA icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
