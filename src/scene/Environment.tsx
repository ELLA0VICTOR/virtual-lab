export function Environment() {
  return (
    <>
      <hemisphereLight args={["#ffffff", "#dbe4ee", 1.45]} />
      <directionalLight
        castShadow
        position={[4.5, 7, 3.5]}
        intensity={2.9}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={48}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <pointLight position={[-3, 3.2, -2]} color="#ffffff" intensity={0.55} distance={12} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]}>
        <planeGeometry args={[56, 56]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.82} metalness={0.02} />
      </mesh>
      <gridHelper args={[56, 112, "#6b0472", "#cbd5e1"]} position={[0, 0.002, 0]} />
    </>
  )
}
