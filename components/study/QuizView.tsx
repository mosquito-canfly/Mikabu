"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/types";

interface QuizViewProps {
  questions: QuizQuestion[];
}

export default function QuizView({ questions }: QuizViewProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  function handleSelect(questionIndex: number, optionIndex: number) {
    if (questionIndex in answers) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  const allAnswered = Object.keys(answers).length === questions.length;
  const score = questions.reduce(
    (total, question, index) =>
      answers[index] === question.answerIndex ? total + 1 : total,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question, questionIndex) => {
        const selected = answers[questionIndex];
        const isAnswered = selected !== undefined;

        return (
          <div key={questionIndex} className="flex flex-col gap-3">
            <p className="font-medium">
              {questionIndex + 1}. {question.question}
            </p>
            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const isCorrectOption = optionIndex === question.answerIndex;
                const isSelectedOption = optionIndex === selected;

                let stateClasses =
                  "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500";
                if (isAnswered && isCorrectOption) {
                  stateClasses =
                    "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300";
                } else if (isAnswered && isSelectedOption) {
                  stateClasses =
                    "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300";
                }

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelect(questionIndex, optionIndex)}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed ${stateClasses}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {allAnswered && (
        <p className="text-center text-lg font-semibold">
          {score} / {questions.length} correct
        </p>
      )}
    </div>
  );
}
