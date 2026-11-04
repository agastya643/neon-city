import * as THREE from 'three';

export const MAP_SIZE = 1200;
export const CHUNK_SIZE = 120;
export const STREAM_RADIUS = 2;

const districts = [
  { id: 'downtown', name: 'Downtown', bounds: [-1, 0, -1, 0], color: 0x162c42, style: 'glass', landmark: 'Bank' },
  { id: 'civic', name: 'Civic Center', bounds: [0, 1, -1, 0], color: 0x786f63, style: 'stone', landmark: 'Town Hall' },
  { id: 'industrial', name: 'Industrial Zone', bounds: [-1, 1, -3, -2], color: 0x57534c, style: 'industrial', landmark: 'Factory' },
  { id: 'airport', name: 'Airport', bounds: [-1, 1, -5, -4], color: 0x868c91, style: 'airport', landmark: 'Terminal' },
  { id: 'beachfront', name: 'Beachfront', bounds: [2, 4, -1, 1], color: 0xd7ad75, style: 'beach', landmark: 'Marina' },
  { id: 'stadium', name: 'Stadium', bounds: [4, 5, 0, 1], color: 0x474e59, style: 'stadium', landmark: 'Stadium' },
  { id: 'suburbs', name: 'Suburbs', bounds: [-1, 1, 2, 4], color: 0x567451, style: 'suburb', landmark: 'School' },
  { id: 'oldtown', name: 'Old Town', bounds: [-4, -2, -1, 1], color: 0x76513f, style: 'brick', landmark: 'Museum' },
];

const POI_NAMES = [
  ['Bank', 'bank', '◆'], ['Post Office', 'post', '✉'], ['Hospital + Helipad', 'hospital', '✚'], ['Police Station', 'police', '★'],
  ['Fire Station', 'fire', '▲'], ['Town Hall Clocktower', 'townhall', '◷'], ['School', 'school', '▣'], ['Library', 'library', '▤'],
  ['Museum', 'museum', '◈'], ['Art Gallery', 'gallery', '◇'], ['Lake Park', 'park', '●'], ['Cinema Strip', 'cinema', '▶'],
  ['Stadium', 'stadium', '◎'], ['Gym', 'gym', '⌁'], ['Airport Terminal', 'terminal', '✈'], ['Control Tower', 'tower', '⌖'],
  ['Train Station', 'train', '▰'], ['Bus Stop', 'bus', '▱'], ['Mall', 'mall', '▦'], ['Gas Station', 'gas', '⛽'],
  ['Car Dealership', 'dealer', '▧'], ['Repair Garage', 'garage', '⚙'], ['Restaurants + Bars', 'food', '♨'], ['Hotel', 'hotel', '▣'],
  ['Apartments', 'apartments', '▥'], ['Factory', 'factory', '▤'], ['Warehouse', 'warehouse', '▰'], ['Lighthouse', 'lighthouse', '✦'],
  ['Forest Viewpoint', 'viewpoint', '⌃'], ['Harbor Pier', 'pier', '⚓'], ['Marina', 'marina', '⛵'],
];

function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

function drawFacade(label, color, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`; ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = `#${accent.toString(16).padStart(6, '0')}`;
  for (let y = 12; y < 246; y += 24) for (let x = 10; x < 122; x += 22) {
    ctx.globalAlpha = 0.45 + ((x + y) % 3) * 0.15; ctx.fillRect(x, y, 12, 14);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(5, 5, 118, 18);
  ctx.fillStyle = '#eaffff'; ctx.font = 'bold 9px sans-serif'; ctx.fillText(label.toUpperCase().slice(0, 18), 9, 18);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 2;
  return texture;
}

const sharedGeometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  pole: new THREE.CylinderGeometry(0.08, 0.12, 4, 6),
  palm: new THREE.CylinderGeometry(0.12, 0.2, 4, 5),
};

export const MAP_LANDMARKS = [];
POI_NAMES.forEach(([name, id, icon], index) => {
  const district = index < 6 ? [-45, -30] : index < 14 ? [10, 10] : index < 20 ? [250, 30] : index < 27 ? [-250, 0] : index < 31 ? [340, 20] : [0, 0];
  MAP_LANDMARKS.push({ id, name, icon, x: district[0] + (index % 4) * 13, z: district[1] + Math.floor(index / 4) * 12 });
});
MAP_LANDMARKS.find((m) => m.id === 'terminal').x = 0;
MAP_LANDMARKS.find((m) => m.id === 'terminal').z = -510;
MAP_LANDMARKS.find((m) => m.id === 'lighthouse').x = 470;
MAP_LANDMARKS.find((m) => m.id === 'lighthouse').z = -20;
MAP_LANDMARKS.find((m) => m.id === 'viewpoint').x = -370;
MAP_LANDMARKS.find((m) => m.id === 'viewpoint').z = -360;
MAP_LANDMARKS.find((m) => m.id === 'stadium').x = 430;
MAP_LANDMARKS.find((m) => m.id === 'stadium').z = 80;
MAP_LANDMARKS.find((m) => m.id === 'school').x = 20;
MAP_LANDMARKS.find((m) => m.id === 'school').z = 300;
MAP_LANDMARKS.find((m) => m.id === 'museum').x = -320;
MAP_LANDMARKS.find((m) => m.id === 'museum').z = 0;
MAP_LANDMARKS.find((m) => m.id === 'library').x = -270;
MAP_LANDMARKS.find((m) => m.id === 'library').z = 70;
MAP_LANDMARKS.find((m) => m.id === 'gallery').x = -350;
MAP_LANDMARKS.find((m) => m.id === 'gallery').z = 60;

function makeBox(mesh, x, y, z, sx, sy, sz) {
  mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.updateMatrix();
}

function buildChunk(cx, cz, colliders) {
  const root = new THREE.Group();
  root.name = `chunk:${cx}:${cz}`;
  const rand = seeded((cx + 100) * 73856093 ^ (cz + 100) * 19349663);
  const centerX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
  const centerZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2;
  const district = districts.find((d) => cx >= d.bounds[0] && cx <= d.bounds[1] && cz >= d.bounds[2] && cz <= d.bounds[3]) || { name: 'Mixed District', color: 0x263443, style: 'mixed' };
  const groundMat = new THREE.MeshStandardMaterial({ color: district.color, roughness: 0.93 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(centerX, -0.12, centerZ); root.add(ground);

  const roadMat = new THREE.MeshStandardMaterial({ color: 0x222a31, roughness: 0.9 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(22, 0.12, CHUNK_SIZE), roadMat);
  road.position.set(centerX, 0.01, centerZ); root.add(road);
  const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(CHUNK_SIZE, 0.12, 18), roadMat);
  crossRoad.position.set(centerX, 0.015, centerZ); root.add(crossRoad);
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x8c9398, roughness: 0.8 });
  [-14, 14].forEach((offset) => { const s = new THREE.Mesh(new THREE.BoxGeometry(4, 0.18, CHUNK_SIZE), sidewalkMat); s.position.set(centerX + offset, 0.06, centerZ); root.add(s); });
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf6e9a1 });
  for (let z = cz * CHUNK_SIZE + 8; z < (cz + 1) * CHUNK_SIZE; z += 14) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 5), stripeMat); stripe.position.set(centerX, 0.09, z); root.add(stripe);
  }

  const texture = drawFacade(district.name, district.color, district.style === 'glass' ? 0x30dff5 : 0xe9a46e);
  const facadeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texture, roughness: 0.75, metalness: district.style === 'glass' ? 0.35 : 0.05 });
  const boxes = [];
  const instanced = new THREE.InstancedMesh(sharedGeometries.box, facadeMat, 22);
  instanced.castShadow = true;
  let count = 0;
  for (let row = 0; row < 4; row += 1) for (let side of [-1, 1]) {
    const x = centerX + side * (26 + rand() * 18);
    const z = centerZ - 48 + row * 30 + rand() * 7;
    const w = 12 + rand() * 13;
    const d = 13 + rand() * 12;
    const h = district.style === 'glass' ? 22 + rand() * 70 : district.style === 'suburb' ? 5 + rand() * 5 : district.style === 'brick' ? 8 + rand() * 15 : 10 + rand() * 26;
    makeBox(instanced, x, h / 2, z, w, h, d); instanced.setMatrixAt(count++, instanced.matrix);
    boxes.push({ minX: x-w/2, maxX: x+w/2, minZ: z-d/2, maxZ: z+d/2 });
  }
  instanced.count = count; root.add(instanced); instanced.instanceMatrix.needsUpdate = true;
  colliders.push(...boxes);

  if (district.style === 'beach') {
    for (let i=0;i<8;i++) { const palm = new THREE.Mesh(sharedGeometries.palm, new THREE.MeshStandardMaterial({ color: 0x745a3a })); palm.position.set(centerX + (i%2 ? 31 : -31), 2, centerZ-45+i*13); root.add(palm); }
  }
  if (district.style === 'industrial') {
    for (let i=0;i<4;i++) { const stack = new THREE.Mesh(new THREE.CylinderGeometry(1,1.6,24,8),new THREE.MeshStandardMaterial({color:0x575b60})); stack.position.set(centerX-40+i*26,12,centerZ+22); root.add(stack); }
  }

  const lampMat = new THREE.MeshStandardMaterial({ color: 0x272d34, emissive: 0x141820 });
  const lamps = new THREE.InstancedMesh(sharedGeometries.pole, lampMat, 8);
  let n=0;
  for (let z=cz*CHUNK_SIZE+12;z<(cz+1)*CHUNK_SIZE;z+=48) for (const side of [-1,1]) { makeBox(lamps,centerX+side*18,2,z,1,1,1); lamps.setMatrixAt(n++,lamps.matrix); }
  lamps.count=n; root.add(lamps);

  return { root, district, boxes, dispose() { root.traverse((o)=>{ if(o.geometry && !Object.values(sharedGeometries).includes(o.geometry)) o.geometry.dispose(); if(o.material && !Array.isArray(o.material)) o.material.dispose(); }); } };
}

function buildInfrastructure(scene) {
  const group = new THREE.Group(); scene.add(group);
  const road = new THREE.MeshStandardMaterial({ color: 0x252a30, roughness: 0.85 });
  const line = new THREE.MeshBasicMaterial({ color: 0xf7eab0 });
  const addRoad = (w,h,d,x,y,z,material=road) => { const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material); m.position.set(x,y,z); group.add(m); return m; };
  // Highway ring, elevated at the north/south, with a river span and a main interchange.
  addRoad(24,1,1040,0,4,-520); addRoad(24,1,1040,0,4,520);
  addRoad(1040,1,24,-520,4,0); addRoad(1040,1,24,520,4,0);
  [-1,1].forEach((side)=>{ for(let k=0;k<15;k++){ const rail=addRoad(0.35,1.1,42,side*14,4.7,-480+k*68,new THREE.MeshStandardMaterial({color:0x9ba5ab,metalness:.7,roughness:.3})); rail.rotation.y=0; } });
  for(let i=-5;i<=5;i++){ addRoad(0.22,0.03,1000,i*3,4.55,-520,line); addRoad(1000,0.03,0.22,-520,4.55,i*3,line); }
  // Airport connector from ring to terminal.
  addRoad(20,0.8,380,0,2,-420); for(let z=-600;z<-240;z+=24) addRoad(.18,.03,8,0,2.44,z,line);
  // Ramps and interchange ramps as sloped mesh strips.
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(11,0.75,165),road); ramp.position.set(38,3,-260); ramp.rotation.x=-0.08; group.add(ramp);
  const ramp2 = ramp.clone(); ramp2.position.set(-38,3,260); ramp2.rotation.x=0.08; group.add(ramp2);
  // Tunnel portal around the western approach.
  addRoad(26,12,18,-520,6,0,new THREE.MeshStandardMaterial({color:0x414951})); addRoad(16,8,22,-520,4,0,new THREE.MeshBasicMaterial({color:0x090d12}));
  // Rest stop canopy and toll booths.
  addRoad(45,0.7,18,520,8,-510,new THREE.MeshStandardMaterial({color:0xdee3e5}));
  for(let i=-2;i<=2;i++){ addRoad(7,3,4,i*8,2,520,new THREE.MeshStandardMaterial({color:0x54616b})); }
  return group;
}

export function createCityMap(scene) {
  const infrastructure = buildInfrastructure(scene);
  const loaded = new Map();
  const colliders = [];
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x2d98bc, roughness: 0.24, metalness: 0.2, transparent: true, opacity: 0.88 });
  const river = new THREE.Mesh(new THREE.BoxGeometry(58,0.45,MAP_SIZE),waterMat); river.position.set(-155,-0.05,0); scene.add(river);
  const hill = new THREE.Mesh(new THREE.ConeGeometry(95,54,9),new THREE.MeshStandardMaterial({color:0x31543b,flatShading:true})); hill.position.set(-370,25,-360); scene.add(hill);
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(90,MAP_SIZE),new THREE.MeshStandardMaterial({color:0xe6ca8d})); beach.rotation.x=-Math.PI/2; beach.position.set(440,-0.02,0); scene.add(beach);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(280,MAP_SIZE),new THREE.MeshStandardMaterial({color:0x167aa7,roughness:.28})); ocean.rotation.x=-Math.PI/2; ocean.position.set(610,-0.07,0); scene.add(ocean);
  // bridges across the river and stylized airport runway.
  [-310,0,310].forEach((z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(95,.9,16),new THREE.MeshStandardMaterial({color:0x727c83}));b.position.set(-155,.25,z);scene.add(b);});
  const runway=new THREE.Mesh(new THREE.BoxGeometry(100,.12,320),new THREE.MeshStandardMaterial({color:0x393e43}));runway.position.set(0,.1,-520);scene.add(runway);
  const runwayLine=new THREE.Mesh(new THREE.BoxGeometry(2,.03,240),new THREE.MeshBasicMaterial({color:0xffffff}));runwayLine.position.set(0,.18,-520);scene.add(runwayLine);
  const clock=new THREE.Clock();
  let currentWeather='clear';
  const rainGeo=new THREE.BufferGeometry();const rainPos=[];for(let i=0;i<900;i++)rainPos.push((Math.random()-.5)*180,Math.random()*65,(Math.random()-.5)*180);
  rainGeo.setAttribute('position',new THREE.Float32BufferAttribute(rainPos,3));
  const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0x9ccaff,size:.18,transparent:true,opacity:.7}));rain.visible=false;scene.add(rain);
  const cameraRay=new THREE.Raycaster();
  function update(position,dt,time,weather) {
    const cx=Math.floor(position.x/CHUNK_SIZE),cz=Math.floor(position.z/CHUNK_SIZE);
    for(let x=cx-STREAM_RADIUS;x<=cx+STREAM_RADIUS;x++)for(let z=cz-STREAM_RADIUS;z<=cz+STREAM_RADIUS;z++){
      const key=`${x},${z}`; if(!loaded.has(key)){const chunk=buildChunk(x,z,colliders);scene.add(chunk.root);loaded.set(key,chunk);}
    }
    for(const [key,chunk] of loaded){const [x,z]=key.split(',').map(Number);if(Math.abs(x-cx)>STREAM_RADIUS||Math.abs(z-cz)>STREAM_RADIUS){scene.remove(chunk.root);chunk.dispose();loaded.delete(key);}}
    const phase=(time/600)*Math.PI*2;const daylight=(Math.sin(phase-Math.PI/2)+1)/2;
    scene.background.setRGB(.018+daylight*.56,.035+daylight*.68,.09+daylight*.82);
    scene.fog.color.copy(scene.background);scene.fog.near=weather==='fog'?30:180;scene.fog.far=weather==='fog'?210:760;
    currentWeather=weather;rain.visible=weather==='rain';rain.position.set(position.x,0,position.z);
    if(weather==='rain'){const a=rain.geometry.attributes.position;for(let i=0;i<a.count;i++){a.array[i*3+1]-=dt*34;if(a.array[i*3+1]<0)a.array[i*3+1]=65;}a.needsUpdate=true;}
  }
  function isBlocked(x,z,radius){for(const b of colliders){if(x+radius>b.minX&&x-radius<b.maxX&&z+radius>b.minZ&&z-radius<b.maxZ)return true;}return false;}
  function cameraPoint(player,desired){const dir=desired.clone().sub(player);const length=dir.length();cameraRay.set(player.clone().add(new THREE.Vector3(0,1.4,0)),dir.normalize());const hits=cameraRay.intersectObjects([...loaded.values()].map(c=>c.root),true);if(hits.length&&hits[0].distance<length)return player.clone().add(dir.multiplyScalar(Math.max(1.4,hits[0].distance-.6))).add(new THREE.Vector3(0,1.4,0));return desired;}
  update(new THREE.Vector3(0,0,0),0,0,'clear');
  return { update,isBlocked,cameraPoint,colliders,dispose(){for(const c of loaded.values())c.dispose();loaded.clear();scene.remove(infrastructure,river,hill,beach,ocean,rain);waterMat.dispose();} };
}
