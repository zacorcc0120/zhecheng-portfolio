// Add a local GLB/GLTF URL here when real project geometry is available.
// Null keeps the procedural demonstration. Export from Rhino in metres with
// manageable polygon counts; GLB is normalized to the viewer automatically.
export const modelAssets = {
  architecture: null as string | null, // /models/vernacular-ai.glb
  tower: null as string | null, // /models/drum-tower.glb
  lattice: {
    octet: null as string | null, // /models/lattice-octet.glb
    kelvin: null as string | null,
    honeycomb: null as string | null,
    voronoi: null as string | null,
  },
};
