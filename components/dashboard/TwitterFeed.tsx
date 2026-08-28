'use client'

import { useState } from 'react'
import { useSniper } from '@/hooks/useSniper'
import { activeChain } from '@/lib/chains'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

interface TwitterFeedProps {
  onOpenSwap?: (tokenCa: string) => void
  onOpenTelegram?: () => void
}

export default function TwitterFeed({ onOpenSwap, onOpenTelegram }: TwitterFeedProps) {
  const {
    targets,
    feed,
    addTarget,
    removeTarget,
    toggleTarget,
    clearFeed,
  } = useSniper()

  // Modal State
  const [addTargetOpen, setAddTargetOpen] = useState(false)

  // Form Add Target
  const [usernameInput, setUsernameInput] = useState('')
  const [buyAmountInput, setBuyAmountInput] = useState('0.005')

  function handleAddTargetSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!usernameInput.trim()) return
    addTarget(usernameInput, buyAmountInput)
    setUsernameInput('')
    setAddTargetOpen(false)
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    toast.success('Contract address copied!')
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full">
      {/* Header & Target Management Bar */}
      <div className="flex flex-col gap-4 bg-[#09090b]/90 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-7 rounded-3xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2.5">
              <span>🎯 Monitored Target Accounts</span>
              <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 font-mono">
                {targets.length} {targets.length === 1 ? 'Target' : 'Targets'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Target lists, auto-snipe parameters, and execution history are 100% private to your wallet.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {onOpenTelegram && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onOpenTelegram}
                className="flex-1 sm:flex-none gap-2 text-xs sm:text-sm font-semibold py-2.5 px-3 border-white/[0.12] hover:border-blue-500/40"
              >
                <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
                </svg>
                <span>Telegram Bot</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="primary"
              onClick={() => setAddTargetOpen(true)}
              className="flex-1 sm:flex-none gap-2 text-xs sm:text-sm font-semibold py-2.5 px-3.5 sm:px-4"
            >
              + Add Target
            </Button>
          </div>
        </div>

        {/* Chips list of targets */}
        {targets.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.06]">
            {targets.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 bg-zinc-950 border border-white/[0.08] rounded-xl px-2.5 sm:px-3 py-1.5 text-xs shadow-sm"
              >
                {/* Target Avatar / Profile Image */}
                <div className="relative flex-shrink-0">
                  {t.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.profileImageUrl}
                      alt={t.username}
                      className="w-5 h-5 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold">
                      {t.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => toggleTarget(t.id)}
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black transition-all cursor-pointer ${
                      t.enabled
                        ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                        : 'bg-zinc-700'
                    }`}
                    title={t.enabled ? 'Target Active' : 'Target Paused'}
                  />
                </div>

                <span className="font-bold text-zinc-100 font-mono text-xs sm:text-sm">@{t.username}</span>
                <span className="text-xs text-red-400 font-mono font-semibold">
                  ({t.buyAmountEth} ETH)
                </span>
                <button
                  onClick={() => removeTarget(t.id)}
                  className="text-zinc-500 hover:text-red-400 transition-colors ml-0.5 p-1 cursor-pointer"
                  title="Remove target"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tweet Feed Section - Mobile Responsive Frame */}
      <div className="flex flex-col bg-[#09090b]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden h-[540px] sm:h-[660px] xl:h-[760px] w-full flex-shrink-0">
        {/* Frame Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.07] bg-zinc-950/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>📡 Live Post Feed</span>
              {feed.length > 0 && (
                <span className="text-[11px] sm:text-xs text-zinc-500 font-normal font-mono bg-zinc-900 border border-white/[0.06] px-2 py-0.5 rounded-full">
                  {feed.length} {feed.length === 1 ? 'post' : 'posts'}
                </span>
              )}
            </h3>
          </div>
          {feed.length > 0 && (
            <button
              onClick={clearFeed}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer font-medium"
            >
              Clear Feed
            </button>
          )}
        </div>

        {/* Scrollable Viewport Frame */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 flex flex-col gap-3">
          {feed.length === 0 ? (
            /* Empty Feed State centered within frame */
            <div className="flex flex-col items-center justify-center flex-1 my-auto p-6 sm:p-8 text-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950 border border-white/[0.08] flex items-center justify-center text-2xl sm:text-3xl shadow-xl">
                🎯
              </div>
              <div className="max-w-md">
                <p className="text-sm sm:text-lg font-bold text-zinc-100">
                  {targets.length === 0
                    ? 'No target accounts monitored yet'
                    : 'Awaiting new posts from targets...'}
                </p>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {targets.length === 0
                    ? 'Add Twitter accounts to monitor their posts in real-time and execute automated buys when contract addresses are posted.'
                    : 'The engine is actively listening for new posts. Once a target posts a tweet containing a token Contract Address (0x...), auto-buy triggers on Robinhood Chain.'}
                </p>
              </div>
              {targets.length === 0 && (
                <Button
                  size="sm"
                  onClick={() => setAddTargetOpen(true)}
                  variant="primary"
                  className="gap-2 mt-1 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold"
                >
                  + Add First Target Account
                </Button>
              )}
            </div>
          ) : (
            /* Feed Items inside scrollable frame */
            feed.map((item) => {
              const hasCa = item.detectedCas.length > 0
              const firstCa = hasCa ? item.detectedCas[0] : null
              const target = targets.find(
                (t) => t.username.toLowerCase() === item.username.toLowerCase()
              )
              const authorAvatar = item.profileImageUrl || target?.profileImageUrl || `https://unavatar.io/twitter/${item.username}`
              const authorName = item.displayName || target?.displayName || item.username

              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 p-3.5 sm:p-5 rounded-2xl border transition-all ${
                    hasCa
                      ? 'bg-zinc-950/90 border-red-500/30 shadow-xl'
                      : 'bg-zinc-950/60 border-white/[0.06] hover:border-white/[0.10]'
                  }`}
                >
                  {/* Author Info & Date */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                      {/* Real Twitter Profile Photo Avatar */}
                      <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-white/[0.12] bg-zinc-900 shadow-md flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={authorAvatar}
                          alt={item.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs sm:text-base font-bold text-zinc-100 truncate">
                            {authorName}
                          </span>
                          <span className="text-[11px] sm:text-xs text-zinc-400 font-mono">@{item.username}</span>
                          {hasCa && (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider font-mono">
                              🎯 CA DETECTED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs text-zinc-500 font-mono">
                          {new Date(item.createdAt).toLocaleTimeString()} &bull;{' '}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* View Tweet on X Button */}
                    <a
                      href={`https://x.com/${item.username}/status/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-400 hover:text-white transition-all text-[11px] font-medium self-end sm:self-auto cursor-pointer shadow-sm"
                      title="Open post on X (Twitter)"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.859L1.506 2.25h6.953l4.256 5.625 5.529-5.625Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>View Post</span>
                      <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Tweet Content */}
                  <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans pl-0 sm:pl-13 pr-0 sm:pr-2">
                    <p className="whitespace-pre-wrap">{item.text}</p>
                  </div>

                  {/* CA Detection & Auto-Buy Action Box */}
                  {hasCa && firstCa && (
                    <div className="ml-0 sm:ml-13 mt-1 bg-black/80 border border-red-500/20 rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] sm:text-xs font-semibold text-zinc-400">Token CA:</span>
                          <code className="text-[11px] sm:text-xs font-mono font-bold text-zinc-200 bg-zinc-950 border border-white/[0.08] px-2 py-0.5 rounded-lg break-all">
                            {firstCa.slice(0, 8)}...{firstCa.slice(-6)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(firstCa)}
                            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Copy CA"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>

                        {/* Quick Swap Action */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => onOpenSwap?.(firstCa)}
                            className="w-full sm:w-auto text-xs sm:text-sm gap-1.5 font-semibold px-4 py-2"
                          >
                            🚀 Swap / Buy Token
                          </Button>
                        </div>
                      </div>

                      {/* Tx Hash Link */}
                      {item.txHash && (
                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] sm:text-xs font-mono">
                          <span className="text-zinc-500">Receipt:</span>
                          <a
                            href={`${activeChain.blockExplorers.default.url}/tx/${item.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300 font-medium underline flex items-center gap-1 truncate max-w-[220px] sm:max-w-none"
                          >
                            View on Blockscout →
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal: Add Target */}
      <Modal open={addTargetOpen} onClose={() => setAddTargetOpen(false)} title="Add Target Account">
        <form onSubmit={handleAddTargetSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            The system will poll this Twitter / X account in real-time. Whenever a new token Contract Address (0x...) is posted, auto-buy executes immediately via your Robinhood Chain wallet.
          </p>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">X / Twitter Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="elonmusk"
                className="w-full bg-zinc-950 border border-white/[0.08] rounded-xl pl-8 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">Auto-Buy Amount (ETH)</label>
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              value={buyAmountInput}
              onChange={(e) => setBuyAmountInput(e.target.value)}
              placeholder="0.005"
              className="w-full bg-zinc-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 font-mono"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              The amount of Native ETH automatically allocated when a new CA is published.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAddTargetOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Target
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
