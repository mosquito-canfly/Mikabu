"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { Character } from "@/lib/types";

type CharacterFormData = Omit<Character, "id" | "createdAt">;

interface CharacterFormProps {
  onSubmit: (data: CharacterFormData) => void;
  initialValues?: CharacterFormData;
  submitLabel?: string;
}

// Values stored on the Character (and sent to the AI prompt builder) are
// always these canonical English words, regardless of UI language — only
// the displayed chip label is translated. Changing the stored value with
// locale would alter what the AI prompt describes and break matching
// against previously saved characters.
const GENDER_OPTIONS: { labelKey: string; value: Character["gender"] }[] = [
  { labelKey: "characterForm.genderMale", value: "male" },
  { labelKey: "characterForm.genderFemale", value: "female" },
  { labelKey: "characterForm.genderOther", value: "other" },
];

const PERSONALITY_OPTIONS = [
  "Caring",
  "Cute",
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

const PERSONALITY_MAX = 5;
const SPEAKING_STYLE_MAX = 3;

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function RequiredMark() {
  return (
    <span className="text-red-500" aria-hidden="true">
      *
    </span>
  );
}

function Chip({ label, selected, onClick, disabled = false }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95 ${
        selected
          ? "border-ink bg-ink text-paper shadow-sm"
          : disabled
            ? "cursor-not-allowed border-line bg-paper text-muted opacity-50"
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

export default function CharacterForm({ onSubmit, initialValues, submitLabel }: CharacterFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [gender, setGender] = useState<"" | Character["gender"]>(initialValues?.gender ?? "");
  const [genderOther, setGenderOther] = useState(initialValues?.genderOther ?? "");
  const [age, setAge] = useState(initialValues ? String(initialValues.age) : "");
  const [personality, setPersonality] = useState<string[]>(initialValues?.personality ?? []);
  const [personalityOtherActive, setPersonalityOtherActive] = useState(
    Boolean(initialValues?.personalityOther)
  );
  const [personalityOther, setPersonalityOther] = useState(initialValues?.personalityOther ?? "");
  const [occupation, setOccupation] = useState(initialValues?.occupation ?? "");
  const [relationship, setRelationship] = useState(initialValues?.relationship ?? "");
  const [setting, setSetting] = useState(initialValues?.setting ?? "");
  const [speakingStyle, setSpeakingStyle] = useState<string[]>(initialValues?.speakingStyle ?? []);
  const [speakingStyleOtherActive, setSpeakingStyleOtherActive] = useState(
    Boolean(initialValues?.speakingStyleOther)
  );
  const [speakingStyleOther, setSpeakingStyleOther] = useState(
    initialValues?.speakingStyleOther ?? ""
  );
  const [additionalInfo, setAdditionalInfo] = useState(initialValues?.additionalInfo ?? "");

  const personalityCount = personality.length + (personalityOtherActive ? 1 : 0);
  const speakingStyleCount = speakingStyle.length + (speakingStyleOtherActive ? 1 : 0);

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
          {t("characterForm.nameLabel")} <RequiredMark />
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
          {t("characterForm.genderLabel")} <RequiredMark />
        </label>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={t(option.labelKey)}
              selected={gender === option.value}
              onClick={() => setGender(option.value)}
            />
          ))}
        </div>
        {gender === "other" && (
          <input
            type="text"
            placeholder={t("characterForm.pleaseSpecify")}
            value={genderOther}
            onChange={(e) => setGenderOther(e.target.value)}
            className={inputClasses}
          />
        )}
      </div>

      {/* Age */}
      <div className="flex flex-col gap-2">
        <label htmlFor="age" className={labelClasses}>
          {t("characterForm.ageLabel")} <RequiredMark />
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
          {t("characterForm.personalityLabel")} <RequiredMark />
        </label>
        <p className="text-sm text-muted">
          {t("characterForm.personalityHelper", { max: PERSONALITY_MAX })}
        </p>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_OPTIONS.map((option) => {
            const isSelected = personality.includes(option);
            return (
              <Chip
                key={option}
                label={t(`characterForm.personality.${option}`)}
                selected={isSelected}
                disabled={!isSelected && personalityCount >= PERSONALITY_MAX}
                onClick={() => setPersonality((prev) => toggleInList(prev, option))}
              />
            );
          })}
          <Chip
            label={t("characterForm.otherOption")}
            selected={personalityOtherActive}
            disabled={!personalityOtherActive && personalityCount >= PERSONALITY_MAX}
            onClick={() => setPersonalityOtherActive((prev) => !prev)}
          />
        </div>
        {personalityOtherActive && (
          <input
            type="text"
            placeholder={t("characterForm.personalityOtherPlaceholder")}
            value={personalityOther}
            onChange={(e) => setPersonalityOther(e.target.value)}
            className={inputClasses}
          />
        )}
      </div>

      {/* Occupation */}
      <div className="flex flex-col gap-2">
        <label htmlFor="occupation" className={labelClasses}>
          {t("characterForm.occupationLabel")} <RequiredMark />
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
          {t("characterForm.relationshipLabel")} <RequiredMark />
        </label>
        <p className="text-sm text-muted">{t("characterForm.relationshipHelper")}</p>
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
          {t("characterForm.settingLabel")} <RequiredMark />
        </label>
        <p className="text-sm text-muted">{t("characterForm.settingHelper")}</p>
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
          {t("characterForm.speakingStyleLabel")} <RequiredMark />
        </label>
        <p className="text-sm text-muted">
          {t("characterForm.speakingStyleHelper", { max: SPEAKING_STYLE_MAX })}
        </p>
        <div className="flex flex-wrap gap-2">
          {SPEAKING_STYLE_OPTIONS.map((option) => {
            const isSelected = speakingStyle.includes(option);
            return (
              <Chip
                key={option}
                label={t(`characterForm.speakingStyle.${option}`)}
                selected={isSelected}
                disabled={!isSelected && speakingStyleCount >= SPEAKING_STYLE_MAX}
                onClick={() =>
                  setSpeakingStyle((prev) => toggleInList(prev, option))
                }
              />
            );
          })}
          <Chip
            label={t("characterForm.otherOption")}
            selected={speakingStyleOtherActive}
            disabled={!speakingStyleOtherActive && speakingStyleCount >= SPEAKING_STYLE_MAX}
            onClick={() => setSpeakingStyleOtherActive((prev) => !prev)}
          />
        </div>
        {speakingStyleOtherActive && (
          <input
            type="text"
            placeholder={t("characterForm.speakingStyleOtherPlaceholder")}
            value={speakingStyleOther}
            onChange={(e) => setSpeakingStyleOther(e.target.value)}
            className={inputClasses}
          />
        )}
      </div>

      {/* Additional Information */}
      <div className="flex flex-col gap-2">
        <label htmlFor="additionalInfo" className={labelClasses}>
          {t("characterForm.additionalInfoLabel")}
        </label>
        <textarea
          id="additionalInfo"
          rows={5}
          placeholder={t("characterForm.additionalInfoPlaceholder")}
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
        {submitLabel ?? t("characterForm.submit")}
      </button>
    </form>
  );
}
