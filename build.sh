#!/bin/bash
set -e
cd frontend
npm install --legacy-peer-deps
npm run build
echo "Build directory contents:"
ls -la build || echo "Build directory not found!"
cd ..
