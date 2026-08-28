'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  alpha: number
  maxAlpha: number
  alphaSpeed: number
  vx: number
  vy: number
  type: 'sparkle' | 'dot' | 'star'
  rotation: number
  rotationSpeed: number
  color: string
}

export default function SparkleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const colors = [
      'rgba(255, 255, 255,',     // Crisp white sparkle
      'rgba(209, 250, 229,',     // Mint sparkle
      'rgba(167, 243, 208,',     // Soft emerald sparkle
      'rgba(110, 231, 183,',     // Radiant jade sparkle
      'rgba(240, 253, 250,',     // Frosted ice-teal
    ]

    const particleCount = Math.min(65, Math.floor((width * height) / 22000))
    const particles: Particle[] = []

    function createParticle(): Particle {
      const isSparkle = Math.random() > 0.4
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: isSparkle ? Math.random() * 2.5 + 1.2 : Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.1,
        maxAlpha: Math.random() * 0.7 + 0.3,
        alphaSpeed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.35 - 0.05, // Gentle upward float
        type: isSparkle ? (Math.random() > 0.5 ? 'sparkle' : 'star') : 'dot',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle())
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    function drawSparkleStar(
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number,
      color: string,
      alpha: number,
      rotation: number
    ) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotation)
      ctx.beginPath()

      let rot = (Math.PI / 2) * 3
      let x = 0
      let y = 0
      const step = Math.PI / spikes

      ctx.moveTo(0, -outerRadius)
      for (let i = 0; i < spikes; i++) {
        x = Math.cos(rot) * outerRadius
        y = Math.sin(rot) * outerRadius
        ctx.lineTo(x, y)
        rot += step

        x = Math.cos(rot) * innerRadius
        y = Math.sin(rot) * innerRadius
        ctx.lineTo(x, y)
        rot += step
      }
      ctx.lineTo(0, -outerRadius)
      ctx.closePath()

      // Star gradient aura
      ctx.fillStyle = `${color}${alpha})`
      ctx.shadowBlur = 12
      ctx.shadowColor = 'rgba(16, 185, 129, 0.8)'
      ctx.fill()
      ctx.restore()
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Animate alpha (twinkle)
        p.alpha += p.alphaSpeed
        if (p.alpha > p.maxAlpha) {
          p.alpha = p.maxAlpha
          p.alphaSpeed = -Math.abs(p.alphaSpeed)
        } else if (p.alpha < 0.05) {
          p.alpha = 0.05
          p.alphaSpeed = Math.abs(p.alphaSpeed)
        }

        // Animate position
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed

        // Wrap around screen
        if (p.y < -20) {
          p.y = height + 20
          p.x = Math.random() * width
        }
        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20

        // Render particle
        if (p.type === 'sparkle') {
          drawSparkleStar(ctx, p.x, p.y, 4, p.size * 3.2, p.size * 0.7, p.color, p.alpha, p.rotation)
        } else if (p.type === 'star') {
          // Cross flare sparkle
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.strokeStyle = `${p.color}${p.alpha})`
          ctx.lineWidth = 0.75
          ctx.shadowBlur = 8
          ctx.shadowColor = 'rgba(52, 211, 153, 0.8)'

          const len = p.size * 3.5
          ctx.beginPath()
          ctx.moveTo(-len, 0)
          ctx.lineTo(len, 0)
          ctx.moveTo(0, -len)
          ctx.lineTo(0, len)
          ctx.stroke()

          // Center bright spot
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.alpha * 1.5)})`
          ctx.fill()

          ctx.restore()
        } else {
          // Soft glowing dot
          ctx.save()
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `${p.color}${p.alpha})`
          ctx.shadowBlur = 10
          ctx.shadowColor = 'rgba(16, 185, 129, 0.6)'
          ctx.fill()
          ctx.restore()
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* ── 1. Base Dark Emerald Slate Layer ────────────────────────────── */}
      <div className="absolute inset-0 bg-[#030705]" />

      {/* ── 2. Real Cosmic Emerald Eye Background Artwork ───────────────── */}
      <div
        className="absolute inset-0 opacity-40 bg-center bg-cover bg-no-repeat pointer-events-none scale-105"
        style={{
          backgroundImage: 'url(/eye-bg.png)',
          filter: 'contrast(115%) saturate(120%)',
        }}
      />

      {/* ── 3. Atmospheric Radiant Emerald & Jade Glows ─────────────────── */}
      {/* Center radiant emerald bloom around the eye */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] opacity-45 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(5, 150, 105, 0.25) 45%, transparent 75%)',
        }}
      />

      {/* Bottom atmospheric teal/emerald horizon */}
      <div
        className="absolute -bottom-32 -left-20 -right-20 h-[650px] opacity-75 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 100%, #059669 0%, #064e3b 40%, #022c22 75%, transparent 100%)',
        }}
      />

      {/* Vignette overlay for rich contrast & Apple glass focus */}
      <div
        className="absolute inset-0 opacity-75 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 95% 85% at 50% 45%, transparent 35%, rgba(2, 6, 4, 0.92) 100%)',
        }}
      />

      {/* Subtle modern geometric fine grid lines */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── 4. Sparkling Particle Canvas Layer ───────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  )
}
