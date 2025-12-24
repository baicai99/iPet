# Vite Build Plugins

This directory contains custom Vite plugins for the iPet UniApp build process.

## Plugin Architecture

Plugins are integrated in `vite.config.js` and executed during the build process to enhance the build output with additional metadata, optimizations, or transformations.

## Current Plugins

### Placeholder for Agent 5: Build Meta Plugin

The build-meta plugin will be added by Agent 5 to generate build metadata including:
- Version information
- Commit hash
- Build timestamp
- Environment fingerprints

**Integration Point**: See `vite.config.js` plugins array for the mount point.

## Creating New Plugins

Vite plugins follow the Rollup plugin API. Example structure:

```javascript
export function myPlugin(options) {
  return {
    name: 'my-plugin',
    // Plugin hooks
    buildStart() {
      // Called when build starts
    },
    generateBundle(outputOptions, bundle) {
      // Called when bundle is generated
    }
  }
}
```

## References

- [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html)
- [Rollup Plugin API](https://rollupjs.org/guide/en/#plugin-development)
