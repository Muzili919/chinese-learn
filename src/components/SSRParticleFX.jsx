import React, { useRef, useEffect } from 'react'

/**
 * SSR 宠物粒子特效（Canvas）
 * 仅 SSR/XR 宠物激活，包含：星星环绕 + 上升粒子 + 底座光晕 + 呼吸柔光
 */
export default function SSRParticleFX({ width = 240, height = 280, intensity = 1 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cx = width / 2
    const cy = height / 2 - 10
    const gold = [255, 210, 60]
    const purple = [160, 100, 255]

    // 星星环绕粒子
    const stars = []
    const starCount = Math.round(12 * intensity)
    for (let i = 0; i < starCount; i++) {
      stars.push({
        angle: Math.random() * Math.PI * 2,
        dist: 50 + Math.random() * 40,
        speed: (0.2 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1),
        size: 1.5 + Math.random() * 2.5,
        spikes: Math.random() > 0.5 ? 4 : 6,
        color: Math.random() > 0.4 ? gold : purple,
        brightness: 0.4 + Math.random() * 0.6,
        twinkleSpeed: 1.5 + Math.random() * 3,
        twinklePhase: Math.random() * Math.PI * 2,
        yOffset: -15 + Math.random() * 30,
      })
    }

    // 上升粒子
    const risings = []
    const risingCount = Math.round(14 * intensity)
    const newRising = (randomY = false) => ({
      x: cx + (Math.random() - 0.5) * 120,
      y: randomY ? cy + Math.random() * 60 : cy + 40 + Math.random() * 20,
      vy: -(0.12 + Math.random() * 0.3),
      vx: (Math.random() - 0.5) * 0.25,
      size: 0.8 + Math.random() * 2,
      life: randomY ? Math.random() : 0,
      maxLife: 3 + Math.random() * 4,
      color: Math.random() > 0.5 ? gold : purple,
      twinkle: Math.random() * Math.PI * 2,
    })
    for (let i = 0; i < risingCount; i++) {
      risings.push(newRising(true))
    }

    // 画星形
    function drawStar(x, y, size, spikes, color, alpha) {
      ctx.save()
      ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},${alpha * 0.8})`
      ctx.shadowBlur = 10
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`
      ctx.beginPath()
      const outerR = size
      const innerR = size * 0.4
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const a = (Math.PI / spikes) * i - Math.PI / 2
        const px = x + Math.cos(a) * r
        const py = y + Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      const t = timeRef.current
      timeRef.current += 0.016

      // 底座光晕
      const glowR = width * 0.38
      const grad = ctx.createRadialGradient(cx, cy + 30, 0, cx, cy + 30, glowR)
      grad.addColorStop(0, 'rgba(255,210,60,0.07)')
      grad.addColorStop(0.5, 'rgba(160,100,255,0.025)')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(cx, cy + 30, glowR, glowR * 0.32, 0, 0, Math.PI * 2)
      ctx.fill()

      // 中心呼吸柔光
      const breath = 0.5 + 0.3 * Math.sin(t * 1.2)
      const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 55)
      cGrad.addColorStop(0, `rgba(255,210,60,${0.05 * breath})`)
      cGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = cGrad
      ctx.fillRect(0, 0, width, height)

      // 星星环绕
      for (const s of stars) {
        s.angle += s.speed * 0.016
        const x = cx + Math.cos(s.angle) * s.dist
        const y = cy + s.yOffset + Math.sin(s.angle) * s.dist * 0.4
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase)
        const alpha = s.brightness * twinkle
        drawStar(x, y, s.size, s.spikes, s.color, alpha)
      }

      // 上升粒子
      for (let i = 0; i < risings.length; i++) {
        const p = risings[i]
        p.life += 0.016
        p.x += p.vx + Math.sin(p.twinkle + t * 2) * 0.12
        p.y += p.vy

        if (p.life > p.maxLife || p.y < cy - 90) {
          risings[i] = newRising(false)
          continue
        }

        const progress = p.life / p.maxLife
        const alpha = Math.sin(progress * Math.PI) * 0.6
        const twAlpha = alpha * (0.6 + 0.4 * Math.sin(t * 4 + p.twinkle))
        const sz = p.size * (1 - progress * 0.4)

        ctx.save()
        ctx.shadowColor = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${twAlpha})`
        ctx.shadowBlur = 6
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${twAlpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [width, height, intensity])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        width,
        height,
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
