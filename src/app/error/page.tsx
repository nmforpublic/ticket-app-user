'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || '認証処理中に問題が発生しました'
  const code = searchParams.get('code') || 'unknown'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
      <div className="mb-6 max-w-md">
        <p className="mb-2">{message}</p>
        {code !== 'unknown' && (
          <p className="text-sm text-gray-500">エラーコード: {code}</p>
        )}
      </div>
      <div className="flex gap-4">
        <Link 
          href="/login" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ログインページに戻る
        </Link>
        <Link 
          href="/" 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">読み込み中...</h1>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
} 