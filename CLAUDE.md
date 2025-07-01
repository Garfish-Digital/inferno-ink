# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based static website for "Inferno Ink," a tattoo parlor business. The site features:
- Single-page application with sections for hero, services, artists, gallery, and contact
- Interactive particle system background animation
- Custom cursor implementation
- Scroll-based animations with fade-in and slide effects
- SCSS styling with custom variables and fire/metal theme
- No backend - purely static site generation

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at localhost:4321 |
| `npm run build` | Build production site to ./dist/ |
| `npm run preview` | Preview production build locally |
| `npm run astro check` | Type check and validate Astro files |

## Architecture

**Frontend Framework:** Astro v5 with static output
**Styling:** SCSS with modular architecture (global.scss, sections.scss, variables.scss)
**JavaScript:** ES6 modules for interactive features (particles, cursor, animations)
**Build:** Static site generation, no server-side rendering

### Key Files Structure
- `src/pages/index.astro` - Main page with all sections
- `src/styles/` - SCSS modules with design system variables
- `src/scripts/` - JavaScript modules for interactive features
- `astro.config.mjs` - Astro configuration (static output)
- `tsconfig.json` - TypeScript config extending Astro strict preset

### Interactive Features
The site includes three JavaScript modules that are imported and initialized in the main page:
1. **ParticleSystem** - Canvas-based particle animation background
2. **CustomCursor** - Replaces default cursor (body has `cursor: none`)
3. **ScrollAnimations** - Handles fade-in and slide animations on scroll

### Styling System
Uses SCSS with a fire/metal theme including:
- Gothic and metal typography fonts (Cinzel, Orbitron, Inter)
- Fire-themed color palette with glow effects
- Responsive design with container max-width
- Animation transitions using custom easing functions