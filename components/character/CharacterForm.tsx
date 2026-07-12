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
      className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95 ${
        selected
          ? "border-ink bg-ink text-paper shadow-sm"
          : "border-line bg-paper text-ink hover:border-ink/50 hover:bg-line/40"
      }`}
    >
      {label}
    </button>
  );
}

const inputClasses =
  "rounded-2xl border-2 border-line bg-paper px-4 py-2.5 text-base text-ink placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:border-sky focus-visible:ring-2 focus-visible:ring-sky";

const labelClasses = "text-lg font-medium text-ink";

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
        <label htmlFor="name" className={labelClasses}>
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
        <label className={labelClasses}>
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
        <label htmlFor="age" className={labelClasses}>
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
        <label className={labelClasses}>
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
        <label htmlFor="occupation" className={labelClasses}>
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
        <label htmlFor="relationship" className={labelClasses}>
          Relationship <RequiredMark />
        </label>
        <p className="text-sm text-muted">Who is this character to you?</p>
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
        <label htmlFor="setting" className={labelClasses}>
          Setting World <RequiredMark />
        </label>
        <p className="text-sm text-muted">Where does the character usually live in?</p>
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
        <label className={labelClasses}>
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
        <label htmlFor="additionalInfo" className={labelClasses}>
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
        className="mt-2 rounded-full bg-ink px-4 py-2.5 text-base font-medium text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:opacity-100"
      >
        Create Character
      </button>
    </form>
  );
}
