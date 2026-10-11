'use client'
import { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, ChevronDown, Check } from 'lucide-react'
import showToast from '@/lib/storeToast'

export default function AIAssistantButton({ 
  context, 
  field, 
  onGenerate, 
  isSchema = false 
}) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [schemaType, setSchemaType] = useState('Product')
  const dropdownRef = useRef(null)

  const schemaOptions = ['Product', 'FAQPage', 'Article', 'LocalBusiness', 'Organization']

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // State for custom text prompt
  const [customPrompt, setCustomPrompt] = useState(context || '')
  const [isManuallyEdited, setIsManuallyEdited] = useState(false)

  // Update custom prompt if parent context changes, unless the user has manually edited it
  useEffect(() => {
    if (!isManuallyEdited) {
      setCustomPrompt(context || '')
    }
  }, [context, isManuallyEdited])

  async function handleGenerate(promptContext) {
    if (!promptContext || promptContext.trim() === '') {
      showToast.error('Please provide some instructions or a title for AI context!')
      return
    }

    setLoading(true)
    try {
      const prompt = isSchema 
        ? `Generate valid JSON-LD ${schemaType} schema for a page about: ${promptContext}. Return ONLY valid JSON, no markdown formatting, no backticks.`
        : `Write a high-quality ${field} based on the following context/instructions: "${promptContext}". Be concise and professional. Return only the raw text, no formatting or markdown.`

      const res = await fetch('/api/system/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate')

      let generated = data.text;
      if (isSchema) {
        generated = generated.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      }

      onGenerate(generated)
      showToast.success('AI generated content successfully!')
      setOpen(false)
    } catch (err) {
      showToast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (isSchema) {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button 
          type="button" 
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded border border-purple-200"
        >
          <Sparkles className="w-3 h-3" />
          AI Schema
          <ChevronDown className="w-3 h-3" />
        </button>

        {open && (
          <div className="absolute z-[100] right-0 mt-2 w-56 bg-background rounded-xl shadow-xl border border-border p-3 flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground">Select Schema Type</p>
            <div className="flex flex-col gap-1">
              {schemaOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSchemaType(opt)}
                  className={`text-left text-sm px-2 py-1.5 rounded-md flex items-center justify-between transition-colors ${schemaType === opt ? 'bg-purple-100 text-purple-700 font-medium dark:bg-purple-900/40 dark:text-purple-300' : 'hover:bg-muted text-foreground'}`}
                >
                  {opt}
                  {schemaType === opt && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleGenerate(context)}
              disabled={loading || !context}
              className="w-full h-8 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate {schemaType}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative inline-block ml-2" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => {
          if (!customPrompt && context) setCustomPrompt(context);
          setOpen(!open);
        }}
        title={`Auto-generate ${field}`}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded border border-purple-200"
      >
        <Sparkles className="w-3 h-3" />
        AI <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute z-[100] right-0 mt-2 w-72 bg-background rounded-xl shadow-xl border border-border p-3 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground">Instructions for {field}</p>
          <textarea
            value={customPrompt}
            onChange={(e) => {
              setIsManuallyEdited(true)
              setCustomPrompt(e.target.value)
            }}
            placeholder={`e.g. Write a compelling description about...`}
            className="w-full text-sm p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
            rows={3}
          />
          <button
            type="button"
            onClick={() => handleGenerate(customPrompt)}
            disabled={loading || !customPrompt.trim()}
            className="w-full h-9 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[13px] font-bold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Content
          </button>
        </div>
      )}
    </div>
  )
}
