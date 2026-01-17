'use client'

/**
 * Simple Math Captcha Component
 * Einfaches Math-Captcha ohne externe Dependencies
 */

import { useState, useEffect } from 'react'

interface SimpleCaptchaProps {
  onVerify: (success: boolean) => void
}

export default function SimpleCaptcha({ onVerify }: SimpleCaptchaProps) {
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    generateNewChallenge()
  }, [])

  const generateNewChallenge = () => {
    setNum1(Math.floor(Math.random() * 10) + 1)
    setNum2(Math.floor(Math.random() * 10) + 1)
    setUserAnswer('')
    setError(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const correctAnswer = num1 + num2
    const isCorrect = parseInt(userAnswer) === correctAnswer

    if (isCorrect) {
      setError(false)
      onVerify(true)
    } else {
      setError(true)
      generateNewChallenge()
      onVerify(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sicherheitsüberprüfung
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Bitte lösen Sie die folgende Aufgabe:
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {num1} + {num2} = ?
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded text-xs">
            Falsche Antwort. Bitte versuchen Sie es erneut.
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Ihre Antwort"
            required
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
          >
            Prüfen
          </button>
        </div>
      </form>
    </div>
  )
}
