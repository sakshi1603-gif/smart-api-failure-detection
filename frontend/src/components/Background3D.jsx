import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

/**
 * Generates a cloud of points scattered randomly inside a cube of `spread` size.
 */
function ParticleField({
  count = 1800,
  spread = 18,
  color = "#a8b8ff",
  size = 0.035,
}) {
  const pointsRef = useRef();

  // Build the random positions once
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return arr;
  }, [count, spread]);

  // Slow continuous drift/rotation so it feels alive, like floating through space
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.02;
    pointsRef.current.rotation.x += delta * 0.005;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Mount once near the root of your app (e.g. App.jsx), above your routes.
 * Renders a fixed, full-viewport 3D particle field that drifts slowly and
 * reacts subtly to mouse movement for a parallax feel.
 *
 * Usage:
 *   <Background3D theme="dark" />
 */
export default function Background3D() {
  const bg = "#05050a";
  const particleColor = "#a8b8ff";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        background: bg,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]} // cap pixel ratio for performance
        eventSource={document.body}
        eventPrefix="client"
      >
        <ParticleField color={particleColor} />
        <MouseParallax />
      </Canvas>
    </div>
  );
}

/**
 * Subtly rotates the camera based on mouse position for a parallax depth effect.
 */
function MouseParallax() {
  useFrame(({ camera, pointer }) => {
    camera.position.x += (pointer.x * 1.2 - camera.position.x) * 0.02;
    camera.position.y += (pointer.y * 1.2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });
  return null;
}
