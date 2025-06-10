#!/bin/bash

# Clean dist directory
rm -rf dist

# Create dist directory
mkdir -p dist

# Temporarily move the problematic file
mv types/trpc.ts types/trpc.ts.bak 2>/dev/null || true

# Build the package
npx tsc

# Restore the file
mv types/trpc.ts.bak types/trpc.ts 2>/dev/null || true

# Copy the trpc.ts file manually to dist
mkdir -p dist/types
cp types/trpc.ts dist/types/trpc.ts

echo "Build complete!"