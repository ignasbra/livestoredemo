import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { events, tables } from '../livestore/schema.js'

const solarPanels$ = queryDb(
  tables.solarPanels.where({ deletedAt: null }),
  { label: 'solarPanels' }
)

export const Canvas: React.FC = () => {
  const { store } = useStore()
  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const solarPanelsRef = useRef<Map<string, THREE.Group>>(new Map())

  const solarPanelsData = store.useQuery(solarPanels$)

  useEffect(() => {
    if (!canvasRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    canvasRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add lighting to simulate sun
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 1)
    sunLight.position.set(10, 20, 10)
    sunLight.castShadow = true
    scene.add(sunLight)

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50)
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3a5f3a,
      roughness: 0.8 
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.5
    ground.receiveShadow = true
    scene.add(ground)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      
      // Slight rotation of solar panels to track "sun"
      solarPanelsRef.current.forEach((panelGroup) => {
        const panel = panelGroup.children[0]
        if (panel) {
          panel.rotation.y += 0.002
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current || !camera || !renderer) return
      
      const width = canvasRef.current.clientWidth
      const height = canvasRef.current.clientHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // Handle canvas click to add solar panels
    const handleClick = (event: MouseEvent) => {
      if (!canvasRef.current || !camera || !scene) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Raycast to find ground intersection
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.5)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(groundPlane, intersectPoint)

      if (intersectPoint) {
        // Save to LiveStore
        store.commit(events.solarPanelCreated({
          id: crypto.randomUUID(),
          x: intersectPoint.x,
          y: intersectPoint.y,
          z: intersectPoint.z,
        }))
      }
    }

    renderer.domElement.addEventListener('click', handleClick)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('click', handleClick)
      
      solarPanelsRef.current.forEach((solarPanel) => {
        solarPanel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (child.material instanceof THREE.Material) {
              child.material.dispose()
            }
          }
        })
        scene.remove(solarPanel)
      })
      solarPanelsRef.current.clear()
      
      renderer.dispose()
      canvasRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  // Sync solar panels from LiveStore to Three.js scene
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Remove panels that no longer exist in data
    solarPanelsRef.current.forEach((panelGroup, id) => {
      if (!solarPanelsData.find(p => p.id === id)) {
        panelGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (child.material instanceof THREE.Material) {
              child.material.dispose()
            }
          }
        })
        scene.remove(panelGroup)
        solarPanelsRef.current.delete(id)
      }
    })

    // Add new panels from data
    solarPanelsData.forEach((panelData) => {
      if (!solarPanelsRef.current.has(panelData.id)) {
        const solarPanelGroup = new THREE.Group()
        
        // Create base/pole
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8)
        const poleMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x444444,
          metalness: 0.8,
          roughness: 0.2
        })
        const pole = new THREE.Mesh(poleGeometry, poleMaterial)
        pole.position.y = 0.75
        pole.castShadow = true
        solarPanelGroup.add(pole)
        
        // Create solar panel frame
        const panelWidth = 1.5
        const panelHeight = 1.0
        const panelThickness = 0.05
        
        const panelGeometry = new THREE.BoxGeometry(panelWidth, panelThickness, panelHeight)
        
        // Create grid pattern for solar cells
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')!
        
        // Dark blue background
        ctx.fillStyle = '#001a33'
        ctx.fillRect(0, 0, 512, 512)
        
        // Draw grid of solar cells
        const cellSize = 64
        const gap = 4
        ctx.fillStyle = '#003d66'
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            ctx.fillRect(
              i * cellSize + gap, 
              j * cellSize + gap, 
              cellSize - gap * 2, 
              cellSize - gap * 2
            )
          }
        }
        
        const texture = new THREE.CanvasTexture(canvas)
        
        const panelMaterial = new THREE.MeshStandardMaterial({ 
          map: texture,
          metalness: 0.6,
          roughness: 0.3,
          emissive: 0x001a33,
          emissiveIntensity: 0.2
        })
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial)
        panel.position.y = 1.5
        panel.rotation.x = -Math.PI / 6
        panel.castShadow = true
        panel.receiveShadow = true
        solarPanelGroup.add(panel)
        
        // Add frame edges
        const frameGeometry = new THREE.BoxGeometry(panelWidth + 0.05, 0.03, panelHeight + 0.05)
        const frameMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x888888,
          metalness: 0.9,
          roughness: 0.1
        })
        const frame = new THREE.Mesh(frameGeometry, frameMaterial)
        frame.position.y = 1.5
        frame.rotation.x = -Math.PI / 6
        solarPanelGroup.add(frame)
        
        solarPanelGroup.position.set(panelData.x, panelData.y, panelData.z)
        scene.add(solarPanelGroup)
        solarPanelsRef.current.set(panelData.id, solarPanelGroup)
      }
    })
  }, [solarPanelsData])

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100%',
        height: '500px',
        margin: '20px auto',
        maxWidth: '1200px',
        border: '2px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    />
  )
}
