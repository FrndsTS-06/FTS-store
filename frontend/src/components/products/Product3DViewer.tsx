import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, RefreshCw, AlertCircle, Sparkles, Image as ImageIcon, ZoomIn, FileCode } from 'lucide-react';
import { usePrefersReducedMotion } from '../../motion';
import { getModelUrlForCategory } from '../../utils/product3d';

export { getModelUrlForCategory };

export interface Product3DViewerProps {
  productName: string;
  categorySlug?: string;
  fallbackImage: string;
  modelUrl?: string;
  className?: string;
  onSwitchToPhoto?: () => void;
  onActiveChange?: (isActive: boolean) => void;
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

export const Product3DViewer: React.FC<Product3DViewerProps> = ({
  productName,
  categorySlug,
  fallbackImage,
  modelUrl,
  className = '',
  onSwitchToPhoto,
  onActiveChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  const isSupported = checkWebGLSupport();
  const [webGlSupported, setWebGlSupported] = useState(isSupported);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(!shouldReduceMotion);
  const [fps, setFps] = useState<number>(60);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Maintain stable reference to onActiveChange to prevent unnecessary scene re-mounts
  const onActiveChangeRef = useRef(onActiveChange);
  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);

  // References for Three.js instance management
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);

  const activeModelUrl = modelUrl || getModelUrlForCategory(categorySlug, productName);

  // Reset view to original default angle
  const handleResetView = useCallback(() => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.set(0, 1.2, 6.5);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, []);

  // Initialize Three.js scene, camera, lights, controls, and load model
  useEffect(() => {
    let isMounted = true;

    // Case 1: No 3D model asset authored for this product
    if (!activeModelUrl) {
      setIsLoading(false);
      onActiveChangeRef.current?.(false);
      return;
    }

    // Case 2: WebGL unsupported in browser environment
    if (!checkWebGLSupport()) {
      setWebGlSupported(false);
      setIsLoading(false);
      onActiveChangeRef.current?.(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 6.5);
    cameraRef.current = camera;

    // 3. WebGLRenderer (Strictly avoid forceContextLoss on cleanup for React 18 compatibility)
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
      console.warn('WebGL Renderer initialization failed:', err);
      if (isMounted) {
        setWebGlSupported(false);
        setIsLoading(false);
        onActiveChangeRef.current?.(false);
      }
      return;
    }

    // 4. Smooth OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = autoRotate && !shouldReduceMotion;
    controls.autoRotateSpeed = 1.8;
    controls.minDistance = 2.8;
    controls.maxDistance = 11.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
    controls.enablePan = false; // Keep product centered
    controlsRef.current = controls;

    // 5. Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const cyanRimLight = new THREE.DirectionalLight(0x06b6d4, 2.8);
    cyanRimLight.position.set(-6, 4, -4);
    scene.add(cyanRimLight);

    const indigoFillLight = new THREE.DirectionalLight(0x6366f1, 1.4);
    indigoFillLight.position.set(4, -3, -2);
    scene.add(indigoFillLight);

    // Soft Contact Shadow Plane underneath product
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeom = new THREE.PlaneGeometry(6, 6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.8;
    scene.add(shadowMesh);

    // 6. Load authentic binary GLB model using GLTFLoader
    setIsLoading(true);
    setLoadError(null);

    const loader = new GLTFLoader();
    loader.load(
      activeModelUrl,
      (gltf) => {
        if (!isMounted) return;

        // Clean up previous model if re-loading
        if (currentModelRef.current) {
          scene.remove(currentModelRef.current);
        }

        const model = gltf.scene;
        currentModelRef.current = model;

        // Auto-center and normalize scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetScale = 3.6 / maxDim;

        model.scale.set(targetScale, targetScale, targetScale);
        model.position.set(-center.x * targetScale, -center.y * targetScale, -center.z * targetScale);

        scene.add(model);
        setIsLoading(false);
        setLoadError(null);
        onActiveChangeRef.current?.(true);
      },
      undefined,
      (err) => {
        if (!isMounted) return;
        console.warn('Failed to load 3D GLB model from:', activeModelUrl, err);
        setIsLoading(false);
        setLoadError(`Unable to load 3D model asset (${activeModelUrl.split('/').pop()}). Check network connection.`);
        onActiveChangeRef.current?.(false);
      }
    );

    // 7. Animation Loop with FPS tracking and OrbitControls update
    let frameCount = 0;
    let fpsTimer = performance.now();

    const animate = (currentTime: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Real-time FPS metric calculation
      frameCount++;
      if (currentTime - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - fpsTimer)));
        frameCount = 0;
        fpsTimer = currentTime;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // 8. Responsive ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 9. Component Unmount and Resource Disposal
    return () => {
      isMounted = false;
      onActiveChangeRef.current?.(false);
      resizeObserver.disconnect();

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      controls.dispose();

      // Deep disposal of scene objects to prevent WebGL memory leaks
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });

      shadowGeom.dispose();
      shadowMat.dispose();
      shadowTexture.dispose();

      renderer.dispose();
      // DO NOT call renderer.forceContextLoss() here, as React StrictMode mounts/unmounts
      // on the exact same canvas element, which causes context-loss precision errors.

      sceneRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      cameraRef.current = null;
      currentModelRef.current = null;
    };
  }, [activeModelUrl, retryCount]); // Only re-init when model or retryCount changes, NOT on autoRotate toggle

  // Sync autoRotate state with OrbitControls smoothly in-place without reloading the scene
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate && !shouldReduceMotion;
    }
  }, [autoRotate, shouldReduceMotion]);

  // Case A: Product has NO 3D model asset authored
  if (!activeModelUrl) {
    return (
      <div className={`relative aspect-square w-full rounded-3xl overflow-hidden fts-glass-panel fts-specular-edge border border-slate-700/60 p-6 flex flex-col items-center justify-center text-center ${className}`}>
        <div className="pointer-events-none absolute -top-20 -left-20 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative max-h-52 w-full flex items-center justify-center mb-4">
          <img
            src={fallbackImage}
            alt={productName}
            className="max-h-48 max-w-full object-contain filter drop-shadow-2xl"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 text-amber-300 border border-amber-500/40 text-xs font-semibold backdrop-blur-md mb-2">
          <FileCode className="w-3.5 h-3.5 text-amber-400" />
          <span>3D Asset Pending for this Category</span>
        </div>

        <p className="text-xs text-slate-200 max-w-sm mb-1 font-semibold">
          No dedicated 3D interactive model asset has been uploaded for this item.
        </p>

        <p className="text-[11px] text-slate-400 max-w-sm mb-4 leading-relaxed">
          <span className="text-cyan-300 font-semibold">Required Asset:</span> A binary GLB (<code className="text-cyan-300">.glb</code>) or GLTF (<code className="text-cyan-300">.gltf</code>) file with PBR textures authored in <code className="text-slate-300">frontend/public/models/</code>.
        </p>

        {onSwitchToPhoto && (
          <button
            id="switch-to-photo-fallback-btn"
            type="button"
            onClick={onSwitchToPhoto}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Switch to High-Res Photo Stage</span>
          </button>
        )}
      </div>
    );
  }

  // Case B: WebGL is unsupported or disabled in the browser environment
  if (!webGlSupported) {
    return (
      <div className={`relative aspect-square w-full rounded-3xl overflow-hidden fts-glass-panel fts-specular-edge border border-slate-700/60 p-6 flex flex-col items-center justify-center text-center ${className}`}>
        <img
          src={fallbackImage}
          alt={productName}
          className="max-h-56 max-w-full object-contain filter drop-shadow-2xl mb-4"
        />
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-amber-300 border border-amber-500/30 text-xs font-semibold backdrop-blur-md mb-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>WebGL Acceleration Unavailable</span>
        </div>
        <p className="text-xs text-slate-400 max-w-xs mb-3">
          Displaying high-resolution visual render with full color fidelity.
        </p>
        {onSwitchToPhoto && (
          <button
            id="switch-to-photo-btn-webgl-fail"
            type="button"
            onClick={onSwitchToPhoto}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
          >
            Switch to High-Res Photo View
          </button>
        )}
      </div>
    );
  }

  // Case C: Active 3D Studio Canvas with GLB Model
  return (
    <div
      ref={containerRef}
      className={`relative aspect-square w-full rounded-3xl overflow-hidden fts-glass-panel fts-specular-edge border border-slate-700/60 shadow-2xl flex flex-col select-none ${className}`}
    >
      {/* Three.js Rendering Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
        aria-label={`Interactive 3D model of ${productName}. Drag to rotate, scroll to zoom.`}
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
            <p className="text-xs font-bold text-cyan-300 font-mono tracking-wide">
              Loading 3D Model Asset...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay with Retry & Fallback option */}
      <AnimatePresence>
        {loadError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 fts-glass-panel flex flex-col items-center justify-center gap-3 p-6 text-center backdrop-blur-xl bg-slate-950/85"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-200 max-w-xs">{loadError}</p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry 3D Studio</span>
              </button>
              {onSwitchToPhoto && (
                <button
                  type="button"
                  onClick={onSwitchToPhoto}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>2D Photos</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Overlay Badge & Live FPS */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900/85 text-cyan-300 border border-cyan-500/40 shadow-lg backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Real-Time 3D Studio</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-slate-400 bg-slate-950/85 border border-slate-800 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{fps} FPS</span>
        </div>
      </div>

      {/* Controls and Interaction Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Reset Camera View */}
          <button
            type="button"
            id="reset-3d-view-btn"
            onClick={handleResetView}
            aria-label="Reset 3D camera orientation"
            title="Reset Orientation"
            className="p-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg backdrop-blur-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Auto-Rotation Toggle */}
          <button
            type="button"
            id="toggle-3d-autorotate-btn"
            onClick={() => setAutoRotate((prev) => !prev)}
            aria-label={autoRotate ? 'Pause 3D auto-rotation' : 'Start 3D auto-rotation'}
            title={autoRotate ? 'Pause Rotation' : 'Auto-Rotate'}
            className={`p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              autoRotate
                ? 'bg-blue-600/30 border-blue-500/50 text-cyan-300'
                : 'bg-slate-900/85 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
        </div>

        {/* Interaction Hint Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-xl backdrop-blur-md">
          <ZoomIn className="w-3 h-3 text-cyan-400" />
          <span>Drag to Rotate • Scroll to Zoom</span>
        </div>

        {/* Switch back to 2D Photo View */}
        {onSwitchToPhoto && (
          <button
            type="button"
            id="switch-to-photo-from-canvas-btn"
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
