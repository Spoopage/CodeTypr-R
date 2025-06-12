"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, RotateCcw, Eye, EyeOff } from "lucide-react"

interface WordsData {
  easy: string[]
  medium: string[]
  hard: string[]
}

interface Achievement {
  name: string
  description: string
  condition: string
}

interface AchievementsData {
  achievements: Achievement[]
}

type Difficulty = "easy" | "medium" | "hard"

export default function CodeTypr() {
  const [wordsData, setWordsData] = useState<WordsData | null>(null)
  const [achievementsData, setAchievementsData] = useState<AchievementsData | null>(null)
  const [currentWords, setCurrentWords] = useState<string[]>([])
  const [currentWord, setCurrentWord] = useState("")
  const [userInput, setUserInput] = useState("")
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [totalCharactersTyped, setTotalCharactersTyped] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [showAchievements, setShowAchievements] = useState(false)
  const [achievementNotification, setAchievementNotification] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [wordsResponse, achievementsResponse] = await Promise.all([
          fetch("/data/words.json"),
          fetch("/data/achievements.json"),
        ])

        const words = await wordsResponse.json()
        const achievements = await achievementsResponse.json()

        setWordsData(words)
        setAchievementsData(achievements)
        setCurrentWords(words[difficulty])
        setCurrentWord(words[difficulty][Math.floor(Math.random() * words[difficulty].length)])
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [])

  // Update words when difficulty changes
  useEffect(() => {
    if (wordsData) {
      setCurrentWords(wordsData[difficulty])
      if (!gameStarted) {
        setCurrentWord(wordsData[difficulty][Math.floor(Math.random() * wordsData[difficulty].length)])
      }
    }
  }, [difficulty, wordsData, gameStarted])

  // Timer effect
  useEffect(() => {
    if (gameStarted) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          const newTimer = prev + 1
          // Update WPM
          setWpm(Math.floor(totalCharactersTyped / 5 / (newTimer / 60)) || 0)
          return newTimer
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameStarted, totalCharactersTyped])

  const startGame = () => {
    if (!gameStarted) {
      setGameStarted(true)
      inputRef.current?.focus()
    }
  }

  const restartGame = () => {
    setGameStarted(false)
    setScore(0)
    setTimer(0)
    setWpm(0)
    setTotalCharactersTyped(0)
    setUserInput("")
    setUnlockedAchievements([])
    setAchievementNotification("")
    if (wordsData) {
      setCurrentWord(wordsData[difficulty][Math.floor(Math.random() * wordsData[difficulty].length)])
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const checkAchievements = () => {
    if (!achievementsData) return

    achievementsData.achievements.forEach((achievement) => {
      if (!unlockedAchievements.includes(achievement.name)) {
        // Simple condition evaluation
        let conditionMet = false
        if (achievement.condition.includes("score >=")) {
          const requiredScore = Number.parseInt(achievement.condition.split(">=")[1].trim())
          conditionMet = score >= requiredScore
        } else if (achievement.condition.includes("timer >=")) {
          const requiredTime = Number.parseInt(achievement.condition.split(">=")[1].trim())
          conditionMet = timer >= requiredTime
        } else if (achievement.condition.includes("wpm >=")) {
          const requiredWpm = Number.parseInt(achievement.condition.split(">=")[1].trim())
          conditionMet = wpm >= requiredWpm
        }

        if (conditionMet) {
          setUnlockedAchievements((prev) => [...prev, achievement.name])
          setAchievementNotification(achievement.name)
          setTimeout(() => setAchievementNotification(""), 3000)
        }
      }
    })
  }

  const handleInputChange = (value: string) => {
    if (!gameStarted) {
      startGame()
    }

    setUserInput(value)

    if (value === currentWord) {
      const newScore = score + 1
      setScore(newScore)
      setTotalCharactersTyped((prev) => prev + currentWord.length)
      setUserInput("")

      if (currentWords.length > 0) {
        setCurrentWord(currentWords[Math.floor(Math.random() * currentWords.length)])
      }

      // Check achievements after updating score
      setTimeout(checkAchievements, 100)
    }
  }

  const renderWord = () => {
    return currentWord.split("").map((char, index) => {
      let className = "transition-colors duration-150"

      if (index < userInput.length) {
        if (userInput[index] === char) {
          className += " text-yellow-400"
        } else {
          className += " text-red-400 bg-red-400/20"
        }
      } else {
        className += " text-gray-500"
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      )
    })
  }

  const renderMistypedInput = () => {
    if (userInput.length <= currentWord.length) return null

    const extraChars = userInput.slice(currentWord.length)
    return (
      <div className="text-red-400 text-2xl font-mono mt-2">
        {extraChars.split("").map((char, index) => (
          <span key={index} className="bg-red-400/20">
            {char}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gray-900 text-gray-100 font-mono"
      style={{ fontFamily: 'Consola, "Courier New", monospace' }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">CodeTypr</h1>
            <p className="text-gray-400">Type the code snippet as fast as you can!</p>
            {!gameStarted && <p className="text-gray-500 text-sm mt-2">Type something to start!</p>}
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">Difficulty:</label>
              <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
                <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="easy" className="text-gray-100 focus:bg-gray-700">
                    Easy
                  </SelectItem>
                  <SelectItem value="medium" className="text-gray-100 focus:bg-gray-700">
                    Medium
                  </SelectItem>
                  <SelectItem value="hard" className="text-gray-100 focus:bg-gray-700">
                    Hard
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={restartGame}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>

            <Button
              onClick={() => setShowAchievements(!showAchievements)}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
            >
              <Trophy className="w-4 h-4 mr-2" />
              {showAchievements ? <EyeOff className="w-4 h-4 ml-1" /> : <Eye className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {/* Main Game Area */}
          <Card className="bg-gray-800 border-gray-700 p-8 mb-6">
            {/* Word Display */}
            <div className="text-center mb-6">
              <div className="text-3xl font-mono mb-4 min-h-[3rem] flex items-center justify-center">
                {renderWord()}
              </div>
              {renderMistypedInput()}
            </div>

            {/* Input */}
            <div className="flex justify-center mb-6">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Start typing..."
                className="w-full max-w-md px-4 py-3 bg-gray-900 border-2 border-gray-600 rounded-lg text-gray-100 text-center text-lg focus:border-yellow-400 focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 text-lg">
              <div className="text-center">
                <div className="text-gray-400 text-sm">Time</div>
                <div className="text-yellow-400 font-bold">{timer}s</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm">Score</div>
                <div className="text-yellow-400 font-bold">{score}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm">WPM</div>
                <div className="text-yellow-400 font-bold">{wpm}</div>
              </div>
            </div>
          </Card>

          {/* Achievement Notification */}
          {achievementNotification && (
            <div className="text-center mb-4">
              <div className="inline-block bg-green-900/50 border border-green-700 text-green-400 px-4 py-2 rounded-lg">
                🏆 Achievement unlocked: {achievementNotification}
              </div>
            </div>
          )}

          {/* Achievements Display */}
          {showAchievements && achievementsData && (
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Achievements
              </h3>
              <div className="grid gap-3">
                {achievementsData.achievements.map((achievement) => {
                  const isUnlocked = unlockedAchievements.includes(achievement.name)
                  return (
                    <div
                      key={achievement.name}
                      className={`p-3 rounded-lg border ${
                        isUnlocked
                          ? "bg-green-900/20 border-green-700 text-green-400"
                          : "bg-gray-900/50 border-gray-600 text-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{isUnlocked ? "🏆" : "🔒"}</span>
                        <div>
                          <div className="font-semibold">{achievement.name}</div>
                          <div className="text-sm opacity-75">{achievement.description}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
