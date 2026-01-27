// Detailed silhouette paths for better contour tracing

// Pikachu Silhouette (Side profile/Standing)
const PIKACHU_PATH = `
  M123,417 c-12,-8 -17,-28 -9,-38 c3,-3 1,-7 -7,-14 c-17,-14 -13,-45 5,-49 c7,-2 9,-5 7,-11 c-3,-8 -2,-11 6,-20 
  c12,-12 11,-15 -3,-28 c-20,-20 -15,-40 10,-43 c9,-1 11,-4 8,-12 c-6,-15 13,-46 32,-52 c9,-3 8,-7 -5,-35 
  c-16,-34 -13,-43 14,-35 c15,4 32,18 38,30 c6,12 15,16 35,14 c28,-2 32,-5 49,-28 c26,-37 66,-50 63,-20 
  c-1,10 -8,27 -15,38 c-10,16 -10,19 1,19 c23,1 55,54 44,72 c-5,9 -4,11 6,11 c24,0 28,15 5,23 c-16,5 -17,7 -5,17 
  c19,16 13,38 -9,38 c-7,0 -13,4 -13,10 c0,5 5,14 11,20 c12,11 12,13 1,22 c-7,6 -13,15 -13,20 c0,22 -38,53 -61,50 
  c-13,-2 -15,0 -13,16 c2,18 -3,23 -27,27 c-15,2 -29,-1 -31,-8 c-2,-6 -10,-11 -17,-11 c-8,0 -20,7 -27,15 
  c-12,14 -46,14 -60,0 c-8,-8 -21,-13 -36,-13 c-31,0 -61,28 -56,52 c3,12 -5,16 -24,10 c-12,-3 -26,-10 -31,-15 
  l-10,-9 l11,-12 Z
`;

// Doraemon Silhouette
const DORAEMON_PATH = `
  M193,467 c-30,-7 -44,-24 -36,-44 c3,-6 1,-16 -5,-23 c-11,-13 -13,-40 -3,-54 c4,-6 3,-15 -3,-24 c-20,-31 6,-71 39,-60 
  c5,2 7,-3 4,-12 c-9,-27 9,-58 37,-65 c11,-3 11,-5 3,-18 c-14,-22 -7,-55 14,-69 c32,-21 82,-15 107,13 c17,19 19,43 5,66 
  c-5,9 -5,11 3,14 c28,9 43,40 33,67 c-3,9 -1,13 6,12 c28,-6 53,24 40,49 c-5,9 -4,15 2,20 c13,10 13,38 0,51 
  c-6,6 -8,15 -4,20 c9,15 -3,38 -21,41 c-10,2 -20,9 -23,16 c-4,13 -18,17 -66,19 c-33,1 -64,-2 -69,-7 c-4,-5 -22,-6 -40,-3 
  c-27,5 -41,1 -53,-12 Z
`;

// Wrap them in SVG containers. 
// Using a viewBox that fits the coordinates (mostly 0-512 range).
const PIKACHU_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="white"/>
    <path transform="translate(20, 0)" d="${PIKACHU_PATH}" fill="black"/>
</svg>
`;

const DORAEMON_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="white"/>
    <path transform="translate(0, 0)" d="${DORAEMON_PATH}" fill="black"/>
</svg>
`;

export const PRESET_URIS = {
    PIKACHU: `data:image/svg+xml;base64,${btoa(PIKACHU_SVG)}`,
    DORAEMON: `data:image/svg+xml;base64,${btoa(DORAEMON_SVG)}`
};