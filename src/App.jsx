import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createCityMap, MAP_LANDMARKS, MAP_SIZE } from './world/CityMap.js';

const qualityScale = Math.min(window.devicePixelRatio || 1, 1.5);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function App() {
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const [fps, setFps] = useState(60);
  const [mapOpen, setMapOpen] = useState(false);
  const [waypoints, setWaypoints] = useState([]);
  const [weather, setWeather] = useState('clear');
  const [mapPos, setMapPos] = useState({ x: 0, z: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(qualityScale);
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ac7e8);
    scene.fog = new THREE.Fog(0x9ac7e8, 180, 640);
    const camera = new THREE.PerspectiveCamera(60, host.clientWidth / host.clientHeight, 0.1, 1200);
    const hemi = new THREE.HemisphereLight(0xc9e7ff, 0x3c453e, 2.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe6bf, 2.2);
    sun.position.set(-80, 140, 50);
    scene.add(sun);

    const world = createCityMap(scene);
    const player = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.35, 0.5), new THREE.MeshStandardMaterial({ color: 0x18dff3, roughness: 0.7 }));
    body.position.y = 1.05;
    player.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd7a27b }));
    head.position.y = 2.0;
    player.add(head);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.9, 0.42), new THREE.MeshStandardMaterial({ color: 0x313d6d }));
    legs.position.y = 0.35;
    player.add(legs);
    player.position.set(0, 0, 0);
    scene.add(player);

    const input = { x: 0, y: 0, yaw: Math.PI, sprint: false, jump: false };
    let pointer = null;
    let lastX = 0;
    let velY = 0;
    let grounded = true;
    let accumulator = 0;
    let last = performance.now();
    let fpsFrames = 0;
    let fpsStart = last;
    let alive = true;
    const step = 1 / 60;
    const mapUpdate = () => setMapPos({ x: player.position.x, z: player.position.z });

    const down = (e) => {
      const target = e.target.closest('[data-control]');
      if (target) return;
      if (e.clientX < innerWidth * 0.42) {
        pointer = 'move';
        lastX = e.clientX;
        input.x = 0;
        input.y = 0;
      } else {
        pointer = 'look';
        lastX = e.clientX;
      }
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!pointer) return;
      if (pointer === 'look') input.yaw -= (e.clientX - lastX) * 0.006;
      else {
        input.x = clamp((e.clientX - lastX) / 55, -1, 1);
        input.y = clamp((e.clientY - innerHeight * 0.72) / 55, -1, 1);
      }
      lastX = e.clientX;
    };
    const up = () => { pointer = null; input.x = 0; input.y = 0; };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointercancel', up);
    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener('resize', resize);

    const animate = (now) => {
      if (!alive) return;
      accumulator += Math.min((now - last) / 1000, 0.1);
      last = now;
      while (accumulator >= step) {
        const forward = new THREE.Vector3(-Math.sin(input.yaw), 0, -Math.cos(input.yaw));
        const right = new THREE.Vector3(forward.z, 0, -forward.x);
        const moveVec = forward.multiplyScalar(-input.y).add(right.multiplyScalar(input.x));
        if (moveVec.lengthSq() > 1) moveVec.normalize();
        const speed = input.sprint ? 8.5 : 4.4;
        const oldX = player.position.x;
        const oldZ = player.position.z;
        player.position.addScaledVector(moveVec, speed * step);
        if (world.isBlocked(player.position.x, player.position.z, 0.42)) {
          player.position.x = oldX;
          player.position.z = oldZ;
        }
        if (input.jump && grounded) { velY = 6.4; grounded = false; }
        input.jump = false;
        if (!grounded) {
          velY -= 17 * step;
          player.position.y += velY * step;
          if (player.position.y <= 0) { player.position.y = 0; velY = 0; grounded = true; }
        }
        if (moveVec.lengthSq() > 0.001) player.rotation.y = Math.atan2(moveVec.x, moveVec.z);
        world.update(player.position, step, now / 1000, weather);
        accumulator -= step;
      }

      const desired = player.position.clone().add(new THREE.Vector3(Math.sin(input.yaw) * 8, 4.2, Math.cos(input.yaw) * 8));
      const safe = world.cameraPoint(player.position, desired);
      camera.position.lerp(safe, 0.13);
      camera.lookAt(player.position.x, player.position.y + 1.15, player.position.z);
      renderer.render(scene, camera);
      fpsFrames += 1;
      if (now - fpsStart >= 1000) { setFps(Math.round(fpsFrames * 1000 / (now - fpsStart))); fpsFrames = 0; fpsStart = now; }
      mapUpdate();
      requestAnimationFrame(animate);
    };
    gameRef.current = { input, world, player, scene, renderer };
    requestAnimationFrame(animate);

    return () => {
      alive = false;
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointercancel', up);
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      gameRef.current = null;
    };
  }, [weather]);

  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('touchmove', prevent);
    };
  }, []);

  const button = (label, action, extra = '') => <button data-control="true" className={`control-button ${extra}`} onPointerDown={(e) => { e.preventDefault(); action(); }}>{label}</button>;

  return <main className="game-shell" ref={hostRef}>
    <div className="hud-top"><div className="hud-logo">NEON CITY <span>OPEN WORLD / {fps} FPS</span></div><div className="hud-menu"><button data-control="true" onClick={() => setWeather((w) => w === 'clear' ? 'rain' : w === 'rain' ? 'fog' : 'clear')}>Weather: {weather}</button><button data-control="true" onClick={() => setMapOpen(true)}>MAP</button></div></div>
    <div className="district-tag">{worldDistrict(mapPos.x, mapPos.z)}</div>
    <div className="minimap" data-control="true" onClick={() => setMapOpen(true)}><div className="minimap-ring"><div className="mini-road mini-road-h"/><div className="mini-road mini-road-v"/><div className="mini-river"/><div className="mini-player" style={{ left: `${50 + mapPos.x / MAP_SIZE * 45}%`, top: `${50 + mapPos.z / MAP_SIZE * 45}%` }}/>{MAP_LANDMARKS.filter((m) => Math.hypot(m.x - mapPos.x, m.z - mapPos.z) < 70).map((m) => <i key={m.id} className="mini-icon" style={{ left: `${50 + (m.x-mapPos.x) / 140 * 100}%`, top: `${50 + (m.z-mapPos.z) / 140 * 100}%` }} />)}</div><small>OPEN MAP</small></div>
    <div className="status-bars"><label>HEALTH <i><b style={{ width: '100%' }}/></i></label><label>ARMOR <i><b className="armor-fill" style={{ width: '60%' }}/></i></label><label>STAMINA <i><b className="stamina-fill" style={{ width: '82%' }}/></i></label></div>
    <div className="mobile-controls"><div className="joystick-hint">MOVE</div><div className="swipe-hint">SWIPE TO LOOK</div><div className="action-cluster">{button('JUMP', () => { if (gameRef.current) gameRef.current.input.jump = true; })}{button('SPRINT', () => { if (gameRef.current) gameRef.current.input.sprint = !gameRef.current.input.sprint; })}{button('ACTION', () => { if (navigator.vibrate) navigator.vibrate(15); }, 'action-control')}</div></div>
    {mapOpen && <div className="map-overlay"><section className="full-map"><header><div><h1>NEON CITY</h1><p>WORLD ATLAS · TAP A LANDMARK TO SET A WAYPOINT</p></div><button data-control="true" onClick={() => setMapOpen(false)}>CLOSE ✕</button></header><div className="map-viewport" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX-r.left)/r.width*MAP_SIZE-MAP_SIZE/2; const z = (e.clientY-r.top)/r.height*MAP_SIZE-MAP_SIZE/2; setWaypoints((w) => [...w, { x, z, name: 'Custom waypoint' }]); }}><div className="atlas-map">{MAP_LANDMARKS.map((m) => <button data-control="true" key={m.id} className="map-landmark" title={m.name} style={{ left: `${50 + m.x / MAP_SIZE * 100}%`, top: `${50 + m.z / MAP_SIZE * 100}%` }} onClick={(e) => { e.stopPropagation(); setWaypoints((w) => [...w, { x: m.x, z: m.z, name: m.name }]); }}>{m.icon}<span>{m.name}</span></button>)}{waypoints.map((w, i) => <b key={`${w.name}-${i}`} className="waypoint" style={{ left: `${50 + w.x / MAP_SIZE * 100}%`, top: `${50 + w.z / MAP_SIZE * 100}%` }}>✦</b>)}</div></div><footer><span>Player: {Math.round(mapPos.x)}, {Math.round(mapPos.z)}</span><span>{waypoints.length ? `Waypoint: ${waypoints.at(-1).name}` : 'Tap map to place waypoint'}</span><button data-control="true" onClick={() => setWaypoints([])}>CLEAR WAYPOINTS</button></footer></section></div>}
    <div className="orientation-notice">Rotate your phone to landscape for the best view.</div>
  </main>;
}

function worldDistrict(x, z) {
  if (z < -90) return 'AIRPORT · INDUSTRIAL NORTH';
  if (z > 90) return 'SUBURBS · SOUTH';
  if (x < -90) return 'OLD TOWN · WEST';
  if (x > 90) return 'BEACHFRONT · EAST';
  if (Math.abs(x) < 45 && Math.abs(z) < 45) return 'DOWNTOWN · CIVIC CENTER';
  return 'NEON CITY · CENTRAL DISTRICT';
}

export default App;
