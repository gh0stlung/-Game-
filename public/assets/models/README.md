# Models folder

This folder is for 3D character model files (.glb).

The game currently uses a procedural character built from
Three.js primitives - no external model files are needed.

If you want to use a custom character:
1. Place a .glb file here named: character.glb
2. Update src/game/player.js to load it with GLTFLoader
