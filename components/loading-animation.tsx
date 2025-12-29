'use client';

// ============================================================================
// ### IMPORTS ###
// ============================================================================

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// ============================================================================
// ### CONSTANTS ###
// ============================================================================

import { BUILDING_STEPS } from '@/lib/constants';

// ============================================================================
// ### TYPES ###
// ============================================================================

interface LoadingAnimationProps {
  onComplete: () => void;
  prompt: string;
}

// ============================================================================
// ### CUSTOM ###
// ============================================================================

export function LoadingAnimation({ onComplete, prompt }: LoadingAnimationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const runStep = (index: number) => {
      if (index >= BUILDING_STEPS.length) {
        // Animation complete
        setTimeout(onComplete, 500);
        return;
      }

      setCurrentStepIndex(index);
      setProgress(0);

      const step = BUILDING_STEPS[index];
      const progressIncrement = 100 / (step.duration / 50);

      // Animate progress bar
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + progressIncrement;
          if (next >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return next;
        });
      }, 50);

      // Move to next step
      timeout = setTimeout(() => {
        clearInterval(progressInterval);
        runStep(index + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(timeout);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const currentStep = BUILDING_STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-midnight-950 flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-aurora-purple/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-aurora-cyan/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '-3s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-midnight-700/30 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full px-8">
        {/* User's prompt display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <p className="text-midnight-400 text-sm uppercase tracking-wider mb-4">
            Building your vision
          </p>
          <h1 className="text-2xl md:text-3xl font-display text-white leading-relaxed">
            &ldquo;{prompt}&rdquo;
          </h1>
        </motion.div>

        {/* Steps visualization */}
        <div className="space-y-6">
          {BUILDING_STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: index <= currentStepIndex ? 1 : 0.3,
                x: 0,
              }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div
                className={`
                  flex items-center gap-4 p-4 rounded-2xl transition-all duration-500
                  ${index === currentStepIndex
                    ? 'bg-midnight-900/80 border border-aurora-cyan/30'
                    : index < currentStepIndex
                    ? 'bg-midnight-900/40'
                    : 'bg-transparent'
                  }
                `}
              >
                {/* Step icon */}
                <div
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                    transition-all duration-500
                    ${index === currentStepIndex
                      ? 'bg-gradient-to-br from-aurora-cyan to-aurora-purple scale-110'
                      : index < currentStepIndex
                      ? 'bg-midnight-800'
                      : 'bg-midnight-900'
                    }
                  `}
                >
                  {index < currentStepIndex ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-aurora-cyan"
                    >
                      ✓
                    </motion.span>
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1">
                  <h3
                    className={`
                      font-display text-lg transition-colors duration-300
                      ${index === currentStepIndex
                        ? 'text-white'
                        : index < currentStepIndex
                        ? 'text-midnight-300'
                        : 'text-midnight-500'
                      }
                    `}
                  >
                    {step.label}
                  </h3>
                  <AnimatePresence mode="wait">
                    {index === currentStepIndex && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-midnight-400 text-sm mt-1"
                      >
                        {step.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Spinner for current step */}
                {index === currentStepIndex && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-aurora-cyan border-t-transparent rounded-full"
                  />
                )}
              </div>

              {/* Progress bar for current step */}
              {index === currentStepIndex && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-midnight-800 rounded-full overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-aurora-cyan to-aurora-purple"
                    style={{ width: `${progress}%` }}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Overall progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-midnight-900/60 rounded-full border border-midnight-700">
            <div className="flex gap-1">
              {BUILDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${index <= currentStepIndex
                      ? 'bg-aurora-cyan scale-100'
                      : 'bg-midnight-700 scale-75'
                    }
                  `}
                />
              ))}
            </div>
            <span className="text-midnight-400 text-sm">
              Step {currentStepIndex + 1} of {BUILDING_STEPS.length}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

