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
            <p className="text-base font-normal text-ink">
              {questionIndex + 1}. {question.question}
            </p>
            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const isCorrectOption = optionIndex === question.answerIndex;
                const isSelectedOption = optionIndex === selected;

                let stateClasses =
                  "border-line bg-paper text-ink hover:border-ink/50 hover:bg-line/30";
                let marker = "";
                if (isAnswered && isCorrectOption) {
                  stateClasses = "border-ink bg-sky text-ink font-bold";
                  marker = "✓ ";
                } else if (isAnswered && isSelectedOption) {
                  stateClasses = "border-ink bg-paper text-ink line-through";
                  marker = "✗ ";
                } else if (isAnswered) {
                  stateClasses = "border-line bg-paper text-muted opacity-70";
                }

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelect(questionIndex, optionIndex)}
                    className={`rounded-2xl border-2 px-4 py-2.5 text-left text-base transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky ${stateClasses}`}
                  >
                    {marker}
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {allAnswered && (
        <p className="w-fit self-center rounded-full bg-sky px-5 py-2 text-center text-lg font-bold text-ink">
          {score} / {questions.length} correct
        </p>
      )}
    </div>
  );
}
