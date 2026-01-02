"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

const MAX_CHAR_LIMIT = 400;

interface IdeaInputFormProps {
  className?: string;
}

export function IdeaInputForm({ className = "" }: IdeaInputFormProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = () => {
    if (inputValue.trim().length < 10) {
      return;
    }

    setIsSubmitting(true);
    // Navigate to evaluate page with the idea
    router.push(`/evaluate?idea=${encodeURIComponent(inputValue.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = inputValue.length;
  const isValid = inputValue.trim().length >= 10;
  const isAtLimit = charCount >= MAX_CHAR_LIMIT;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <label className="block text-center mb-6">
        <span className="flex items-center justify-center gap-2 text-xl font-display font-bold text-white">
          <Sparkles className="w-5 h-5 text-aurora-cyan" />
          What&apos;s your Startup Idea?
        </span>
      </label>

      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-aurora-cyan via-aurora-purple to-aurora-pink rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />

        <div className="relative bg-midnight-900 rounded-2xl border border-midnight-700 overflow-hidden">
          <textarea
            placeholder="Describe your startup idea in a few sentences..."
            maxLength={MAX_CHAR_LIMIT}
            value={inputValue}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setInputValue(e.target.value);
              const textarea = e.target as HTMLTextAreaElement;
              textarea.style.height = "auto";
              textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
            }}
            disabled={isSubmitting}
            className="
              w-full resize-none p-6 bg-transparent text-white text-lg
              placeholder-midnight-500 focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[120px]
            "
            rows={3}
          />

          <div className="flex items-center justify-between p-4 border-t border-midnight-700">
            <p
              className={`text-sm ${
                isAtLimit ? "text-red-400" : "text-midnight-500"
              }`}
            >
              {MAX_CHAR_LIMIT - charCount} characters left
            </p>

            <button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="
                px-6 py-3 rounded-xl font-display font-semibold
                bg-gradient-to-r from-aurora-cyan to-aurora-purple
                text-white transition-all duration-300
                hover:scale-105 hover:shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center gap-2
              "
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Evaluate My Idea
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-midnight-500 text-sm mt-4">
        Press Enter to submit, Shift+Enter for new line
      </p>
    </div>
  );
}


