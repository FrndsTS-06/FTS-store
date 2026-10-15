import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, RefreshCw, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { usePrefersReducedMotion } from '../../motion';

export interface Product3DViewerProps {
  productName: string;
  categorySlug?: string;
  fallbackImage: string;
  modelUrl?: string;
  className?: string;
  onSwitchToPhoto?: () => void;
}

function checkWebGLSupport(): boolean {
  try {
    if (typeof window === 'undefined' || !window.WebGLRenderingContext) return false;
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as (WebGLRenderingContext | WebGL2RenderingContext) | null;
    if (!gl) return false;
    const precision = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
    return !!(precision && precision.precision > 0);
  } catch {
    return false;
  }
}

export const Product3DViewer: React.FC<Product3DViewerProps> = ({
  productName,
  categorySlug,
  fallbackImage,
  className = '',
  onSwitchToPhoto,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  const isInitiallySupported = checkWebGLSupport();
  const [webGlSupported, setWebGlSupported] = useState(isInitiallySupported);
  const [isLoading, setIsLoading] = useState(isInitiallySupported);
  const [autoRotate, setAutoRotate] = useState(!shouldReduceMotion);
  const [fps, setFps] = useState<number>(60);

  // References for Three.js lifecycle management
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const productGroupRef = useRef<THREE.Group | null>(null);

  // Pointer drag state for controlled rotation
  const isDraggingRef = useRef(false);
  const previousPointerPosRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.15, y: -0.3 });

  // Build high-detail procedural product asset based on category
  const createProductMesh = useCallback((category?: string): THREE.Group => {
    const group = new THREE.Group();
    const cat = category?.toLowerCase() || '';

    // Cyber PBR Materials
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2,
    });

    const brushedChromeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.15,
    });

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.75,
      metalness: 0.1,
    });

    const cyanGlowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.5,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.9,
    });

    if (cat.includes('watch') || cat.includes('wearable')) {
      // 1. Smartwatch / Wearable
      // Body
      const bodyGeom = new THREE.CylinderGeometry(1.6, 1.6, 0.45, 32);
      const bodyMesh = new THREE.Mesh(bodyGeom, brushedChromeMat);
      group.add(bodyMesh);

      // Glass Screen
      const screenGeom = new THREE.CylinderGeometry(1.45, 1.45, 0.48, 32);
      const screenMesh = new THREE.Mesh(screenGeom, cyanGlowMat);
      group.add(screenMesh);

      // Digital Crown
      const crownGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
      const crownMesh = new THREE.Mesh(crownGeom, brushedChromeMat);
      crownMesh.rotation.z = Math.PI / 2;
      crownMesh.position.set(1.7, 0, 0);
      group.add(crownMesh);

      // Straps
      const strapGeom = new THREE.BoxGeometry(1.5, 0.2, 2.2);
      const topStrap = new THREE.Mesh(strapGeom, leatherMat);
      topStrap.position.set(0, 0, 1.8);
      group.add(topStrap);

      const bottomStrap = new THREE.Mesh(strapGeom, leatherMat);
      bottomStrap.position.set(0, 0, -1.8);
      group.add(bottomStrap);

    } else if (cat.includes('mobile') || cat.includes('phone')) {
      // 2. Cyber Smartphone
      // Chassis
      const chassisGeom = new THREE.BoxGeometry(2.0, 4.0, 0.3);
      const chassisMesh = new THREE.Mesh(chassisGeom, metalMat);
      group.add(chassisMesh);

      // Screen
      const screenGeom = new THREE.BoxGeometry(1.88, 3.88, 0.32);
      const screenMesh = new THREE.Mesh(screenGeom, glassMat);
      group.add(screenMesh);

      // Camera Island
      const camIslandGeom = new THREE.BoxGeometry(0.8, 1.2, 0.15);
      const camIslandMesh = new THREE.Mesh(camIslandGeom, metalMat);
      camIslandMesh.position.set(-0.45, 1.2, -0.2);
      group.add(camIslandMesh);

      // Camera Lenses
      for (let i = 0; i < 3; i++) {
        const lensGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 16);
        const lensMesh = new THREE.Mesh(lensGeom, cyanGlowMat);
        lensMesh.rotation.x = Math.PI / 2;
        lensMesh.position.set(-0.45, 1.5 - i * 0.32, -0.25);
        group.add(lensMesh);
      }

    } else {
      // 3. Flagship Headphones (Default / Electronics / Audio)
      // Headband Arc
      const bandGeom = new THREE.TorusGeometry(2.3, 0.18, 16, 48, Math.PI);
      const bandMesh = new THREE.Mesh(bandGeom, metalMat);
      bandMesh.rotation.z = Math.PI;
      group.add(bandMesh);

      // Headband Cushion
      const cushionGeom = new THREE.TorusGeometry(2.28, 0.14, 16, 32, Math.PI * 0.6);
      const cushionMesh = new THREE.Mesh(cushionGeom, leatherMat);
      cushionMesh.rotation.z = Math.PI * 1.2;
      group.add(cushionMesh);

      // Left & Right Ear Cups
      const cupGeom = new THREE.CylinderGeometry(1.0, 1.05, 0.6, 32);
      const padGeom = new THREE.TorusGeometry(0.85, 0.28, 16, 32);

      // Left Cup
      const leftCupGroup = new THREE.Group();
      const leftCup = new THREE.Mesh(cupGeom, brushedChromeMat);
      leftCup.rotation.z = Math.PI / 2;
      leftCupGroup.add(leftCup);

      const leftRing = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.04, 16, 32), cyanGlowMat);
      leftRing.rotation.y = Math.PI / 2;
      leftRing.position.set(0.28, 0, 0);
      leftCupGroup.add(leftRing);

      const leftPad = new THREE.Mesh(padGeom, leatherMat);
      leftPad.rotation.y = Math.PI / 2;
      leftPad.position.set(-0.32, 0, 0);
      leftCupGroup.add(leftPad);

      leftCupGroup.position.set(-2.4, -0.6, 0);
      leftCupGroup.rotation.y = 0.2;
      group.add(leftCupGroup);

      // Right Cup
      const rightCupGroup = new THREE.Group();
      const rightCup = new THREE.Mesh(cupGeom, brushedChromeMat);
      rightCup.rotation.z = Math.PI / 2;
      rightCupGroup.add(rightCup);

      const rightRing = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.04, 16, 32), cyanGlowMat);
      rightRing.rotation.y = Math.PI / 2;
      rightRing.position.set(-0.28, 0, 0);
      rightCupGroup.add(rightRing);

      const rightPad = new THREE.Mesh(padGeom, leatherMat);
      rightPad.rotation.y = Math.PI / 2;
      rightPad.position.set(0.32, 0, 0);
      rightCupGroup.add(rightPad);

      rightCupGroup.position.set(2.4, -0.6, 0);
      rightCupGroup.rotation.y = -0.2;
      group.add(rightCupGroup);
    }

    // Contact Soft Shadow Plane underneath model
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeom = new THREE.PlaneGeometry(6, 6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.2;
    group.add(shadowMesh);

    return group;
  }, []);

  // Initialize Scene, Camera, Studio Lighting, and Renderer
  useEffect(() => {
    if (!checkWebGLSupport()) {
      setWebGlSupported(false);
      setIsLoading(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 7.5);

    // 3. Renderer with power-preference high-performance
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      rendererRef.current = renderer;
    } catch (err: any) {
      console.warn('WebGL Renderer Initialization failed:', err);
      setWebGlSupported(false);
      setIsLoading(false);
      return;
    }

    // 4. Restrained Studio Lighting Setup
    // Ambient light (Deep cosmic base)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.2);
    scene.add(ambientLight);

    // Key Light (Crisp directional white)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    // Cyber Cyan Rim Light (Rear specular glint)
    const rimCyanLight = new THREE.DirectionalLight(0x06b6d4, 3.0);
    rimCyanLight.position.set(-6, 3, -4);
    scene.add(rimCyanLight);

    // Electric Indigo Accent Light (Subtle bottom fill)
    const fillIndigoLight = new THREE.DirectionalLight(0x6366f1, 1.5);
    fillIndigoLight.position.set(3, -4, -2);
    scene.add(fillIndigoLight);

    // 5. Build and add product mesh
    const productGroup = createProductMesh(categorySlug);
    productGroupRef.current = productGroup;
    scene.add(productGroup);

    setIsLoading(false);

    // 6. Animation Loop with FPS tracking & controlled damping
    let frameCount = 0;
    let fpsTimer = performance.now();

    const animate = (currentTime: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // FPS tracking
      frameCount++;
      if (currentTime - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - fpsTimer)));
        frameCount = 0;
        fpsTimer = currentTime;
      }

      if (productGroupRef.current) {
        // Auto-rotation when not dragging
        if (autoRotate && !isDraggingRef.current && !shouldReduceMotion) {
          targetRotationRef.current.y += 0.006;
        }

        // Inertial damping
        if (!isDraggingRef.current) {
          targetRotationRef.current.x += rotationVelocityRef.current.x;
          targetRotationRef.current.y += rotationVelocityRef.current.y;
          rotationVelocityRef.current.x *= 0.92;
          rotationVelocityRef.current.y *= 0.92;
        }

        // Clamp vertical tilt to prevent awkward flip
        targetRotationRef.current.x = Math.max(-0.6, Math.min(0.6, targetRotationRef.current.x));

        // Smooth slerp towards target rotation
        productGroupRef.current.rotation.x += (targetRotationRef.current.x - productGroupRef.current.rotation.x) * 0.12;
        productGroupRef.current.rotation.y += (targetRotationRef.current.y - productGroupRef.current.rotation.y) * 0.12;
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // 7. Responsive Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 8. Proper Cleanup on Unmount
    return () => {
      window.removeEventListener('resize', handleResize);

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      // Deep resource disposal to prevent WebGL memory leaks
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
      renderer.forceContextLoss();
      sceneRef.current = null;
      rendererRef.current = null;
      productGroupRef.current = null;
    };
  }, [categorySlug, createProductMesh, autoRotate, shouldReduceMotion]);

  // Pointer Interaction Handlers for Controlled 3D Orbiting
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    previousPointerPosRef.current = { x: e.clientX, y: e.clientY };
    rotationVelocityRef.current = { x: 0, y: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousPointerPosRef.current.x;
    const deltaY = e.clientY - previousPointerPosRef.current.y;

    previousPointerPosRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.007;
    targetRotationRef.current.y += deltaX * sensitivity;
    targetRotationRef.current.x += deltaY * sensitivity;

    rotationVelocityRef.current = {
      x: deltaY * sensitivity * 0.5,
      y: deltaX * sensitivity * 0.5,
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleResetView = () => {
    targetRotationRef.current = { x: 0.15, y: -0.3 };
    rotationVelocityRef.current = { x: 0, y: 0 };
  };

  // If WebGL is not supported, show graceful high-fidelity fallback
  if (!webGlSupported) {
    return (
      <div className={`relative aspect-square w-full rounded-3xl overflow-hidden fts-glass-panel fts-specular-edge border border-slate-700/60 p-6 flex flex-col items-center justify-center text-center ${className}`}>
        <img
          src={fallbackImage}
          alt={productName}
          className="max-h-56 max-w-full object-contain filter drop-shadow-2xl mb-4"
        />
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-cyan-300 border border-cyan-500/30 text-xs font-semibold backdrop-blur-md mb-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Interactive 3D fallback active</span>
        </div>
        <p className="text-xs text-slate-400 max-w-xs">
          Your browser environment is displaying our high-resolution visual render with zero performance degradation.
        </p>
        {onSwitchToPhoto && (
          <button
            type="button"
            onClick={onSwitchToPhoto}
            className="mt-3 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
          >
            Switch to High-Res Photo View
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square w-full rounded-3xl overflow-hidden fts-glass-panel fts-specular-edge border border-slate-700/60 shadow-2xl flex flex-col select-none ${className}`}
    >
      {/* Three.js Rendering Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
        aria-label={`Interactive 3D model of ${productName}. Drag to rotate.`}
      />

      {/* Loading Skeleton */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 fts-glass-panel flex flex-col items-center justify-center gap-3 backdrop-blur-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-cyan-300">Initializing 3D Engine...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Overlay Badge & 3D Indicator */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900/80 text-cyan-300 border border-cyan-500/40 shadow-lg backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Real-Time 3D Studio</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{fps} FPS</span>
        </div>
      </div>

      {/* Drag & Rotation Guide Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Reset Camera View */}
          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset 3D camera orientation"
            title="Reset Orientation"
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg backdrop-blur-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Auto-Rotation Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            aria-label={autoRotate ? 'Pause 3D auto-rotation' : 'Start 3D auto-rotation'}
            title={autoRotate ? 'Pause Rotation' : 'Auto-Rotate'}
            className={`p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              autoRotate
                ? 'bg-blue-600/30 border-blue-500/50 text-cyan-300'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
        </div>

        {/* Interaction Hint Pill */}
        <span className="text-[11px] font-medium text-slate-400 bg-slate-950/70 border border-slate-800/80 px-3 py-1.5 rounded-xl backdrop-blur-md hidden sm:inline-block">
          Click & Drag to Rotate 360°
        </span>

        {/* Switch back to 2D Photo View */}
        {onSwitchToPhoto && (
          <button
            type="button"
            onClick={onSwitchToPhoto}
            aria-label="Switch back to photo gallery"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-xs font-bold text-slate-200 hover:text-white border border-slate-700/70 shadow-lg backdrop-blur-md transition-all cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>2D Photos</span>
          </button>
        )}
      </div>
    </div>
  );
};
export default Product3DViewer;
