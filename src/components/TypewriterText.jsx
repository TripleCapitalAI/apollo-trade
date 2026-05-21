import { useState, useEffect } from 'react'

const WORDS = [
  { text: 'Earn',     color: '#b4fff3' },
  { text: 'Carry',    color: '#b4fff3' },
  { text: 'Neutral',  color: '#8899ff' },
  { text: 'Analyze',  color: '#8899ff' },
  { text: 'Yield',    color: '#b4fff3' },
  { text: 'Harvest',  color: '#b4fff3' },
]

export default function TypewriterText({ className = '' }) {
  const [idx,       setIdx]       = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting,  setDeleting]  = useState(false)
  const [paused,    setPaused]    = useState(false)

  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => { setPaused(false) }, 1600)
      return () => clearTimeout(t)
    }

    const word = WORDS[idx].text

    if (!deleting) {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 95)
        return () => clearTimeout(t)
      } else {
        setPaused(true)
        setDeleting(true)
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 55)
        return () => clearTimeout(t)
      } else {
        setDeleting(false)
        setIdx((idx + 1) % WORDS.length)
      }
    }
  }, [displayed, deleting, paused, idx])

  const { color } = WORDS[idx]

  return (
    <span className={`font-display italic ${className}`} style={{ color }}>
      {displayed}
      <span className="animate-blink" style={{ color: 'rgba(180,255,243,0.7)', marginLeft: 1 }}>|</span>
    </span>
  )
}
