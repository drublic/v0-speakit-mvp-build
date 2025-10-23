"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, SkipBack, SkipForward, Loader2, Square } from "lucide-react"

interface TTSReaderProps {
  content: string
  title: string
  autoPlay?: boolean
}

export function TTSReader({ content, title, autoPlay = false }: TTSReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [words, setWords] = useState<string[]>([])
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1.0)
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const currentWordRef = useRef<HTMLSpanElement | null>(null)
  const hasAutoPlayedRef = useRef(false)

  // Split content into words
  useEffect(() => {
    const wordArray = content.split(/(\s+)/).filter((w) => w.trim().length > 0)
    setWords(wordArray)

    // Estimate duration based on content length and rate
    const wordsPerMinute = 150 * rate
    const estimatedDuration = (wordArray.length / wordsPerMinute) * 60
    setDuration(estimatedDuration)
  }, [content, rate])

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)

      // Set default voice (prefer English voices)
      const defaultVoice = availableVoices.find((v) => v.lang.startsWith("en")) || availableVoices[0]
      setVoice(defaultVoice)
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.cancel()
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (autoPlay && !hasAutoPlayedRef.current && voice && words.length > 0) {
      hasAutoPlayedRef.current = true
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        handlePlay()
      }, 500)
    }
  }, [autoPlay, voice, words])

  useEffect(() => {
    if (currentWordRef.current && contentRef.current) {
      const wordElement = currentWordRef.current
      const containerElement = contentRef.current

      const wordRect = wordElement.getBoundingClientRect()
      const containerRect = containerElement.getBoundingClientRect()

      // Check if word is outside visible area
      if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
        wordElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [currentWordIndex])

  const startWordTracking = () => {
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current)
    }

    // Calculate words per second based on rate
    const wordsPerSecond = (150 * rate) / 60
    const millisecondsPerWord = 1000 / wordsPerSecond

    wordTimerRef.current = setInterval(() => {
      setCurrentWordIndex((prev) => {
        const next = prev + 1
        if (next >= words.length) {
          stopWordTracking()
          return prev
        }
        return next
      })
    }, millisecondsPerWord)
  }

  const stopWordTracking = () => {
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current)
      wordTimerRef.current = null
    }
  }

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
      startWordTracking()
      return
    }

    setIsLoading(true)
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = rate
    if (voice) {
      utterance.voice = voice
    }

    utterance.onstart = () => {
      setIsLoading(false)
      setIsPlaying(true)
      setCurrentWordIndex(0)
      startWordTracking()
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentWordIndex(words.length - 1)
      stopWordTracking()
    }

    utterance.onerror = () => {
      setIsLoading(false)
      setIsPlaying(false)
      setIsPaused(false)
      stopWordTracking()
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const handlePause = () => {
    window.speechSynthesis.pause()
    setIsPaused(true)
    setIsPlaying(false)
    stopWordTracking()
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentWordIndex(0)
    stopWordTracking()
  }

  const handleSkipForward = () => {
    const skipWords = Math.floor((150 * rate) / 6) // Skip ~10 seconds worth of words
    const newIndex = Math.min(currentWordIndex + skipWords, words.length - 1)
    setCurrentWordIndex(newIndex)

    if (isPlaying || isPaused) {
      handleStop()
    }
  }

  const handleSkipBackward = () => {
    const skipWords = Math.floor((150 * rate) / 6) // Skip back ~10 seconds worth of words
    const newIndex = Math.max(currentWordIndex - skipWords, 0)
    setCurrentWordIndex(newIndex)

    if (isPlaying || isPaused) {
      handleStop()
    }
  }

  const handleRateChange = (value: string) => {
    const newRate = Number.parseFloat(value)
    setRate(newRate)

    if (isPlaying) {
      handleStop()
    }
  }

  const handleVoiceChange = (voiceURI: string) => {
    const selectedVoice = voices.find((v) => v.voiceURI === voiceURI)
    if (selectedVoice) {
      setVoice(selectedVoice)
      if (isPlaying) {
        handleStop()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getCurrentTime = () => {
    if (words.length === 0) return 0
    const wordsPerSecond = (150 * rate) / 60
    return currentWordIndex / wordsPerSecond
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-balance text-2xl font-bold">{title}</h2>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentWordIndex]}
            max={words.length - 1}
            step={1}
            onValueChange={([value]) => {
              setCurrentWordIndex(value)
              if (isPlaying || isPaused) {
                handleStop()
              }
            }}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(getCurrentTime())}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={handleSkipBackward} disabled={isLoading}>
            <SkipBack className="h-4 w-4" />
          </Button>

          {isLoading ? (
            <Button size="icon" className="h-12 w-12" disabled>
              <Loader2 className="h-6 w-6 animate-spin" />
            </Button>
          ) : isPlaying ? (
            <Button size="icon" className="h-12 w-12" onClick={handlePause}>
              <Pause className="h-6 w-6" />
            </Button>
          ) : (
            <Button size="icon" className="h-12 w-12" onClick={handlePlay}>
              <Play className="h-6 w-6" />
            </Button>
          )}

          {(isPlaying || isPaused) && (
            <Button variant="outline" size="icon" onClick={handleStop}>
              <Square className="h-4 w-4" />
            </Button>
          )}

          <Button variant="outline" size="icon" onClick={handleSkipForward} disabled={isLoading}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Voice and Speed Controls */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Voice</label>
            <Select value={voice?.voiceURI} onValueChange={handleVoiceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Speed: {rate}x</label>
            <Select value={rate.toString()} onValueChange={handleRateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="0.75">0.75x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.25">1.25x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="1.75">1.75x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div ref={contentRef} className="max-h-96 overflow-y-auto rounded-lg border border-border bg-muted/50 p-4">
          <div className="text-pretty leading-relaxed">
            {words.map((word, index) => (
              <span
                key={index}
                ref={index === currentWordIndex ? currentWordRef : null}
                className={
                  index === currentWordIndex ? "bg-primary text-primary-foreground px-1 rounded transition-colors" : ""
                }
              >
                {word}{" "}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
