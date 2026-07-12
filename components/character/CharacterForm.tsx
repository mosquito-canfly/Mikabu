"use client";

import { useState } from "react";
import type { Character } from "@/lib/types";

type CharacterFormData = Omit<Character, "id" | "createdAt">;

interface CharacterFormProps {
  onSubmit: (data: CharacterFormData) => void;
}

const GENDER_OPTIONS: { label: string; value: Character["gender"] }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const PERSONALITY_OPTIONS = [
  "Caring",
  "Cold",
  "Funny",
  "Flirty",
  "Tsundere",
  "Confident",
  "Shy",
  "Smart",
  "Protective",
  "Playful",
  "Calm",
  "Emotional",
  "Optimistic",
  "Sarcastic",
  "Mysterious",
  "Loyal",
  "Dominant",
  "Gentle",
  "Chaotic",
];

const SPEAKING_STYLE_OPTIONS = [
  "Formal",
  "Casual",
  "Cute",
  "Teasing",
  "Romantic",
  "Short replies",
  "Long replies",
  "Emoji lover",
  "Dry humor",
  "Elegant",
];

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function RequiredMark() {
  return (
    <span className="text-red-500" aria-hidden="true">
      *
    </span>
  );
}

function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-300 bg-transparent text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
      }`}
    >
      {label}
    </button>
  );
}

const inputClasses =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900";

export default function CharacterForm({ onSubmit }: CharacterFormProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"" | Character["gender"]>("");
  const [genderOther, setGenderOther] = useState("");
  const [age, setAge] = useState("");
  const [personality, setPersonality] = useState<string[]>([]);
  const [personalityOtherActive, setPersonalityOtherActive] = useState(false);
  const [personalityOther, setPersonalityOther] = useState("");
  const [occupation, setOccupation] = useState("");
  const [relationship, setRelationship] = useState("");
  const [setting, setSetting] = useState("");
  const [speakingStyle, setSpeakingStyle] = useState<string[]>([]);
  const [speakingStyleOtherActive, setSpeakingStyleOtherActive] = useState(false);
  const [speakingStyleOther, setSpeakingStyleOther] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const trimmedName = name.trim();
  const ageNumber = Number(age);
  const isAgeValid =
    age.trim() !== "" && Number.isInteger(ageNumber) && ageNumber >= 1;
  const isGenderValid =
    gender !== "" && (gender !== "other" || genderOther.trim().length > 0);
  const isPersonalityValid =
    personality.length > 0 &&
    (!personalityOtherActive || personalityOther.trim().length > 0);
  const isSpeakingStyleValid =
    speakingStyle.length > 0 &&
    (!speakingStyleOtherActive || speakingStyleOther.trim().length > 0);

  const isFormValid =
    trimmedName.length > 0 &&
    isGenderValid &&
    isAgeValid &&
    isPersonalityValid &&
    occupation.trim().length > 0 &&
    relationship.trim().length > 0 &&
    setting.trim().length > 0 &&
    isSpeakingStyleValid;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) return;

    const data: CharacterFormData = {
      name: trimmedName,
      gender: gender as Character["gender"],
      genderOther: gender === "other" ? genderOther.trim() : undefined,
      age: ageNumber,
      personality,
      personalityOther: personalityOtherActive
        ? personalityOther.trim()
        : undefined,
      occupation: occupation.trim(),
      relationship: relationship.trim(),
      setting: setting.trim(),
      speakingStyle,
      speakingStyleOther: speakingStyleOtherActive
        ? speakingStyleOther.trim()
        : undefined,
      additionalInfo: additionalInfo.trim() ? additionalInfo.trim() : undefined,
    };

    onSubmit(data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-6"
    >
      {/* Name */}
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-lg font-semibold">
          Name <RequiredMark />
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-2">
        <label className="text-lg font-semibold">
          Gender <RequiredMark />
        </label>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={gender === option.value}
              onClick={() => setGender(option.value)}
            />
          ))}
        </div>
        {gender === "other" && (
          <input
            type="text"
            placeholder="Please specify"
            value={genderOther}
            onChange={(e) => setGenderOther(e.target.value)}
            className={inputClasses}
          />
        )}
      </div>

      {/* Age */}
      <div className="flex flex-col gap-2">
        <label htmlFor="age" className="text-lg font-semibold">
          Age <RequiredMark />
        </label>
        <input
          id="age"
          type="number"
          min={1}
          step={1}
          required
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* Personality */}
      <div className="flex flex-col gap-2">
        <label className="text-lg font-semibold">
          Personality <RequiredMark />
        </label>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={personality.includes(option)}
              onClick={() => setPersonality((prev) => toggleInList(prev, option))}
            />
          ))}
          <Chip
            label="Other"
            selected={personalityOtherActive}
            onClick={() => setPersonalityOtherActive((prev) => !prev)}
          />
        </div>
        {personalityOtherActive && (
          <input
            type="text"
            placeholder="Describe other traits"
            value={personalityOther}
            onChange={(e) => setPersonalityOther(e.target.value)}
            className={inputClasses}
          />
        )}
      </div>

      {/* Occupation */}
      <div className="flex flex-col gap-2">
        <label htmlFor="occupation" className="text-lg font-semibold">
          Occupation <RequiredMark />
        </label>
        <input
          id="occupation"
          type="text"
          required
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* Relationship */}
      <div className="flex flex-col gap-2">
        <label htmlFor="relationship" className="text-lg font-semibold">
          Relationship <RequiredMark />
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Who is this character to you?
        </p>
        <input
          id="relationship"
          type="text"
          required
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* Setting World */}
      <div className="flex flex-col gap-2">
        <label htmlFor="setting" className="text-lg font-semibold">
          Setting World <RequiredMark />
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Where does the character usually live in?
        </p>
        <input
          id="setting"
          type="text"
          required
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* Speaking Style */}
      <div className="flex flex-col gap-2">
        <label className="text-lg font-semibold">
          Speaking Style <RequiredMark />
        </label>
        <div className="flex flex-wrap gap-2">
          {SPEAKING_STYLE_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={speakingStyle.includes(option)}
              onClick={() =>
                setSpeakingStyle((prev) => toggleInList(prev, option))
              }
            />
          ))}
          <Chip
            label="Other"
            selected={speakingStyleOtherActive}
            onClick={() => setSpeakingStyleOtherActive((prev) => !prev)}
          />
        </div>
        {speakingStyleOtherActive && (
          <input
            type="text"
            placeholder="Describe other speaking style"
            value={speakingStyleOther}
            onChange={(e) => setSpeakingStyleOther(e.target.value)}
            className={inputClasses}
          />
        )}
      </div>

      {/* Additional Information */}
      <div className="flex flex-col gap-2">
        <label htmlFor="additionalInfo" className="text-lg font-semibold">
          Additional Information
        </label>
        <textarea
          id="additionalInfo"
          rows={5}
          placeholder="Anything else worth knowing (optional)"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          className={inputClasses}
        />
      </div>

      <button
        type="submit"
        disabled={!isFormValid}
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        Create Character
      </button>
    </form>
  );
}
