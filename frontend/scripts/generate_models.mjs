import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../public/models');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function exportToGlb(scene, filename) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        const filePath = path.join(outputDir, filename);
        if (gltf instanceof ArrayBuffer) {
          fs.writeFileSync(filePath, Buffer.from(gltf));
        } else {
          fs.writeFileSync(filePath, JSON.stringify(gltf, null, 2));
        }
        console.log(`Saved ${filename} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
        resolve(filePath);
      },
      (error) => {
        console.error(`Error exporting ${filename}:`, error);
        reject(error);
      },
      { binary: true }
    );
  });
}

// 1. LAPTOP MODEL GENERATOR
function createLaptopModel() {
  const root = new THREE.Group();
  root.name = 'FTS_Laptop_Model';

  // Materials
  const chassisMat = new THREE.MeshStandardMaterial({
    name: 'Chassis_Aluminum',
    color: 0x1e222d,
    metalness: 0.85,
    roughness: 0.25,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    name: 'Chrome_Accent',
    color: 0x94a3b8,
    metalness: 0.95,
    roughness: 0.15,
  });

  const keyboardMat = new THREE.MeshStandardMaterial({
    name: 'Keycaps',
    color: 0x0f172a,
    metalness: 0.2,
    roughness: 0.5,
  });

  const keyGlowMat = new THREE.MeshStandardMaterial({
    name: 'Key_Backlight',
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.1,
  });

  const trackpadMat = new THREE.MeshStandardMaterial({
    name: 'Glass_Trackpad',
    color: 0x242b38,
    metalness: 0.4,
    roughness: 0.1,
  });

  const screenBezelMat = new THREE.MeshStandardMaterial({
    name: 'Screen_Bezel',
    color: 0x0a0f1d,
    metalness: 0.6,
    roughness: 0.3,
  });

  const screenGlassMat = new THREE.MeshStandardMaterial({
    name: 'OLED_Display',
    color: 0x0369a1,
    emissive: 0x0284c7,
    emissiveIntensity: 0.65,
    metalness: 0.8,
    roughness: 0.08,
  });

  // Base Deck (Bottom Chassis)
  const baseWidth = 3.6;
  const baseDepth = 2.4;
  const baseHeight = 0.14;

  const baseGeom = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
  const baseMesh = new THREE.Mesh(baseGeom, chassisMat);
  baseMesh.name = 'Base_Chassis';
  baseMesh.position.set(0, -baseHeight / 2, 0);
  root.add(baseMesh);

  // Keyboard Well Recess
  const wellGeom = new THREE.BoxGeometry(3.1, 0.02, 1.3);
  const wellMesh = new THREE.Mesh(wellGeom, keyboardMat);
  wellMesh.position.set(0, 0.01, -0.25);
  root.add(wellMesh);

  // Keyboard Keys Array (5 rows of key clusters)
  for (let r = 0; r < 5; r++) {
    const keyCols = r === 4 ? 6 : 10;
    const keyW = (2.9 / keyCols) * 0.82;
    const keyD = (1.1 / 5) * 0.75;
    for (let c = 0; c < keyCols; c++) {
      const kGeom = new THREE.BoxGeometry(keyW, 0.03, keyD);
      const kMesh = new THREE.Mesh(kGeom, keyGlowMat);
      const posX = -1.35 + c * (2.9 / (keyCols - 1));
      const posZ = -0.7 + r * 0.22;
      kMesh.position.set(posX, 0.03, posZ);
      root.add(kMesh);
    }
  }

  // Trackpad
  const trackpadGeom = new THREE.BoxGeometry(1.2, 0.01, 0.75);
  const trackpadMesh = new THREE.Mesh(trackpadGeom, trackpadMat);
  trackpadMesh.position.set(0, 0.005, 0.7);
  root.add(trackpadMesh);

  // Laptop Hinge
  const hingeGeom = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 16);
  const hingeMesh = new THREE.Mesh(hingeGeom, chromeMat);
  hingeMesh.rotation.z = Math.PI / 2;
  hingeMesh.position.set(0, 0.02, -baseDepth / 2);
  root.add(hingeMesh);

  // Screen Lid (Pivot at hinge, opened at ~115 degrees)
  const lidGroup = new THREE.Group();
  lidGroup.name = 'Lid_Assembly';
  lidGroup.position.set(0, 0.02, -baseDepth / 2);
  lidGroup.rotation.x = -Math.PI * 0.36; // ~115 degrees open

  // Lid Back Cover
  const lidThickness = 0.08;
  const lidHeight = 2.3;
  const lidGeom = new THREE.BoxGeometry(baseWidth, lidHeight, lidThickness);
  const lidMesh = new THREE.Mesh(lidGeom, chassisMat);
  lidMesh.position.set(0, lidHeight / 2, -lidThickness / 2);
  lidGroup.add(lidMesh);

  // Screen Bezel
  const bezelGeom = new THREE.BoxGeometry(baseWidth * 0.98, lidHeight * 0.98, 0.01);
  const bezelMesh = new THREE.Mesh(bezelGeom, screenBezelMat);
  bezelMesh.position.set(0, lidHeight / 2, 0.005);
  lidGroup.add(bezelMesh);

  // Active OLED Display Screen
  const screenGeom = new THREE.BoxGeometry(baseWidth * 0.92, lidHeight * 0.88, 0.01);
  const screenMesh = new THREE.Mesh(screenGeom, screenGlassMat);
  screenMesh.position.set(0, lidHeight / 2 + 0.02, 0.015);
  lidGroup.add(screenMesh);

  // Top Cyber Webcam Dot
  const camGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12);
  const camMesh = new THREE.Mesh(camGeom, keyGlowMat);
  camMesh.rotation.x = Math.PI / 2;
  camMesh.position.set(0, lidHeight - 0.06, 0.02);
  lidGroup.add(camMesh);

  root.add(lidGroup);

  // Center model at origin
  root.position.set(0, 0.4, 0.2);
  root.scale.set(1.1, 1.1, 1.1);
  return root;
}

// 2. HEADPHONES MODEL GENERATOR
function createHeadphonesModel() {
  const root = new THREE.Group();
  root.name = 'FTS_Headphones_Model';

  const metalMat = new THREE.MeshStandardMaterial({
    name: 'Metal_Chassis',
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    name: 'Brushed_Chrome',
    color: 0x94a3b8,
    metalness: 0.95,
    roughness: 0.15,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    name: 'Acoustic_Leather',
    color: 0x0f172a,
    roughness: 0.8,
    metalness: 0.1,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    name: 'AuraPulse_Cyan_Ring',
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.4,
  });

  // Headband Arc
  const bandGeom = new THREE.TorusGeometry(2.2, 0.16, 16, 48, Math.PI);
  const bandMesh = new THREE.Mesh(bandGeom, metalMat);
  bandMesh.rotation.z = Math.PI;
  root.add(bandMesh);

  // Headband Soft Top Cushion
  const cushionGeom = new THREE.TorusGeometry(2.18, 0.14, 16, 32, Math.PI * 0.6);
  const cushionMesh = new THREE.Mesh(cushionGeom, leatherMat);
  cushionMesh.rotation.z = Math.PI * 1.2;
  root.add(cushionMesh);

  // Left Earcup Assembly
  const leftGroup = new THREE.Group();
  const cupGeom = new THREE.CylinderGeometry(0.95, 1.0, 0.55, 32);
  const cupMesh = new THREE.Mesh(cupGeom, chromeMat);
  cupMesh.rotation.z = Math.PI / 2;
  leftGroup.add(cupMesh);

  const ringGeom = new THREE.TorusGeometry(0.92, 0.04, 16, 32);
  const ringMesh = new THREE.Mesh(ringGeom, glowMat);
  ringMesh.rotation.y = Math.PI / 2;
  ringMesh.position.set(0.28, 0, 0);
  leftGroup.add(ringMesh);

  const padGeom = new THREE.TorusGeometry(0.82, 0.26, 16, 32);
  const padMesh = new THREE.Mesh(padGeom, leatherMat);
  padMesh.rotation.y = Math.PI / 2;
  padMesh.position.set(-0.3, 0, 0);
  leftGroup.add(padMesh);

  leftGroup.position.set(-2.3, -0.6, 0);
  leftGroup.rotation.y = 0.18;
  root.add(leftGroup);

  // Right Earcup Assembly
  const rightGroup = new THREE.Group();
  const rightCup = new THREE.Mesh(cupGeom, chromeMat);
  rightCup.rotation.z = Math.PI / 2;
  rightGroup.add(rightCup);

  const rightRing = new THREE.Mesh(ringGeom, glowMat);
  rightRing.rotation.y = Math.PI / 2;
  rightRing.position.set(-0.28, 0, 0);
  rightGroup.add(rightRing);

  const rightPad = new THREE.Mesh(padGeom, leatherMat);
  rightPad.rotation.y = Math.PI / 2;
  rightPad.position.set(0.3, 0, 0);
  rightGroup.add(rightPad);

  rightGroup.position.set(2.3, -0.6, 0);
  rightGroup.rotation.y = -0.18;
  root.add(rightGroup);

  root.position.set(0, 0.3, 0);
  root.scale.set(0.95, 0.95, 0.95);
  return root;
}

// 3. SMARTWATCH MODEL GENERATOR
function createSmartwatchModel() {
  const root = new THREE.Group();
  root.name = 'FTS_Smartwatch_Model';

  const titaniumMat = new THREE.MeshStandardMaterial({
    name: 'Titanium_Case',
    color: 0x64748b,
    metalness: 0.92,
    roughness: 0.2,
  });

  const screenMat = new THREE.MeshStandardMaterial({
    name: 'AMOLED_Screen',
    color: 0x06b6d4,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.8,
  });

  const strapMat = new THREE.MeshStandardMaterial({
    name: 'Silicone_Strap',
    color: 0x0f172a,
    roughness: 0.7,
    metalness: 0.15,
  });

  // Watch Body (Cylinder)
  const caseGeom = new THREE.CylinderGeometry(1.6, 1.6, 0.45, 32);
  const caseMesh = new THREE.Mesh(caseGeom, titaniumMat);
  root.add(caseMesh);

  // Bezel Ring
  const bezelGeom = new THREE.TorusGeometry(1.58, 0.05, 16, 32);
  const bezelMesh = new THREE.Mesh(bezelGeom, titaniumMat);
  bezelMesh.rotation.x = Math.PI / 2;
  bezelMesh.position.y = 0.22;
  root.add(bezelMesh);

  // Screen Face
  const screenGeom = new THREE.CylinderGeometry(1.48, 1.48, 0.47, 32);
  const screenMesh = new THREE.Mesh(screenGeom, screenMat);
  root.add(screenMesh);

  // Digital Crown
  const crownGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 16);
  const crownMesh = new THREE.Mesh(crownGeom, titaniumMat);
  crownMesh.rotation.z = Math.PI / 2;
  crownMesh.position.set(1.72, 0.05, 0);
  root.add(crownMesh);

  // Top & Bottom Straps
  const topStrapGeom = new THREE.BoxGeometry(1.5, 0.22, 2.4);
  const topStrap = new THREE.Mesh(topStrapGeom, strapMat);
  topStrap.position.set(0, -0.05, 1.8);
  topStrap.rotation.x = 0.15;
  root.add(topStrap);

  const bottomStrap = new THREE.Mesh(topStrapGeom, strapMat);
  bottomStrap.position.set(0, -0.05, -1.8);
  bottomStrap.rotation.x = -0.15;
  root.add(bottomStrap);

  root.position.set(0, 0, 0);
  root.scale.set(1.1, 1.1, 1.1);
  return root;
}

// 4. SMARTPHONE MODEL GENERATOR
function createSmartphoneModel() {
  const root = new THREE.Group();
  root.name = 'FTS_Smartphone_Model';

  const metalMat = new THREE.MeshStandardMaterial({
    name: 'Frame_Titanium',
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.2,
  });

  const glassBackMat = new THREE.MeshStandardMaterial({
    name: 'Frosted_Glass_Back',
    color: 0x0f172a,
    metalness: 0.5,
    roughness: 0.15,
  });

  const screenMat = new THREE.MeshStandardMaterial({
    name: 'Super_Retina_Screen',
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.6,
    metalness: 0.85,
    roughness: 0.08,
  });

  const lensMat = new THREE.MeshStandardMaterial({
    name: 'Sapphire_Lens',
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.5,
    metalness: 0.9,
    roughness: 0.05,
  });

  // Chassis
  const bodyGeom = new THREE.BoxGeometry(2.1, 4.2, 0.28);
  const bodyMesh = new THREE.Mesh(bodyGeom, metalMat);
  root.add(bodyMesh);

  // Front Display
  const screenGeom = new THREE.BoxGeometry(2.0, 4.08, 0.3);
  const screenMesh = new THREE.Mesh(screenGeom, screenMat);
  root.add(screenMesh);

  // Back Glass Plate
  const backGeom = new THREE.BoxGeometry(2.02, 4.12, 0.04);
  const backMesh = new THREE.Mesh(backGeom, glassBackMat);
  backMesh.position.set(0, 0, -0.15);
  root.add(backMesh);

  // Camera Island
  const islandGeom = new THREE.BoxGeometry(0.85, 1.3, 0.12);
  const islandMesh = new THREE.Mesh(islandGeom, metalMat);
  islandMesh.position.set(-0.48, 1.25, -0.2);
  root.add(islandMesh);

  // Triple Camera Lenses
  for (let i = 0; i < 3; i++) {
    const lensGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.18, 20);
    const lensMesh = new THREE.Mesh(lensGeom, lensMat);
    lensMesh.rotation.x = Math.PI / 2;
    lensMesh.position.set(-0.48, 1.55 - i * 0.35, -0.24);
    root.add(lensMesh);
  }

  root.position.set(0, 0, 0);
  root.scale.set(0.9, 0.9, 0.9);
  return root;
}

async function buildAllModels() {
  console.log('Generating authentic Khronos glTF binary (.glb) product models...');
  await exportToGlb(createLaptopModel(), 'laptop.glb');
  await exportToGlb(createHeadphonesModel(), 'headphones.glb');
  await exportToGlb(createSmartwatchModel(), 'smartwatch.glb');
  await exportToGlb(createSmartphoneModel(), 'smartphone.glb');
  console.log('All 4 models successfully generated and saved to frontend/public/models/ !');
}

buildAllModels().catch(console.error);
