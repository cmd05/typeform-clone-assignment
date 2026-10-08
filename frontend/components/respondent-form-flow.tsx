"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Clock, Search, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type RespondentQuestionType =
  | "group"
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "multiple_choice"
  | "dropdown"
  | "number"
  | "yes_no"
  | "rating"
  | "statement"
  | "welcome";

export type RespondentQuestion = {
  id: string;
  number: string;
  title: string;
  type: RespondentQuestionType;
  description?: string;
  placeholder?: string;
  choices?: string[];
  phoneCountry?: string;
  ratingCount?: number;
  required?: boolean;
  children?: RespondentQuestion[];
};

export type RespondentEnding = {
  id: string;
  letter: string;
  title: string;
  description: string;
  buttonText: string;
  imageUrl?: string;
};

export type AnswerValue = string | Record<string, string>;

export const FORM_FLOW_STORAGE_KEY = "typeform-clone-current-form";

const phoneCountries = [
  { code: "+91", flag: "🇮🇳", label: "India" },
  { code: "+1", flag: "🇺🇸", label: "United States" },
  { code: "+44", flag: "🇬🇧", label: "United Kingdom" },
  { code: "+61", flag: "🇦🇺", label: "Australia" },
  { code: "+971", flag: "🇦🇪", label: "United Arab Emirates" }
];

export const demoFlowQuestions: RespondentQuestion[] = [
  {
    id: "details",
    number: "1",
    title: "Your details",
    type: "group",
    description: "Description (optional)",
    children: [
      {
        id: "name",
        number: "A",
        title: "What's your name?",
        type: "short_text",
        placeholder: "Your full name"
      },
      {
        id: "email",
        number: "B",
        title: "What's your email address?",
        type: "email",
        placeholder: "you@example.com"
      }
    ]
  },
  {
    id: "audience",
    number: "2",
    title: "Who is this laptop for?",
    type: "multiple_choice",
    description: "Description (optional)",
    choices: ["For me", "For a student", "For work or my business", "As a gift"]
  },
  {
    id: "budget",
    number: "3",
    title: "What's your budget in INR?",
    type: "multiple_choice",
    description: "Description (optional)",
    choices: ["Under 40000", "40000-60000", "60000-80000", "Above 80000"]
  },
  {
    id: "certified",
    number: "4",
    title: "Would you consider a certified refurbished laptop?",
    type: "yes_no",
    choices: ["Yes", "No"]
  },
  {
    id: "brand",
    number: "5",
    title: "Do you have a preferred brand?",
    type: "dropdown",
    choices: [
      "Lenovo",
      "ASUS",
      "HP",
      "Dell",
      "Acer",
      "Apple",
      "MSI",
      "Samsung",
      "No preference"
    ]
  }
];

export const demoFlowEndings: RespondentEnding[] = [
  {
    id: "ending-a",
    letter: "A",
    title: "Your match: Lenovo IdeaPad Slim 3",
    description:
      "A reliable 15.6-inch everyday laptop for study, browsing and office tasks. Suggested configuration: Ryzen 5, 16 GB RAM and 512 GB SSD. InfiniLaptops will confirm the best discounted price in your budget.",
    buttonText: "Explore more deals",
    imageUrl: ""
  },
  {
    id: "ending-b",
    letter: "B",
    title: "Your match: ASUS Vivobook 16",
    description:
      "A larger-screen everyday laptop for multitasking, study, and comfortable office work. Suggested configuration: Ryzen 5 or Intel i5, 16 GB RAM and 512 GB SSD. InfiniLaptops will confirm the best discounted price in your budget.",
    buttonText: "Explore more deals",
    imageUrl: ""
  },
  {
    id: "ending-c",
    letter: "C",
    title: "Your match: Lenovo LOQ 15",
    description:
      "A performance-focused laptop for gaming, creator tools, and heavier workloads. Suggested configuration: RTX graphics, 16 GB RAM and 512 GB SSD. InfiniLaptops will confirm the best discounted price in your budget.",
    buttonText: "Explore more deals",
    imageUrl: ""
  },
  {
    id: "ending-d",
    letter: "D",
    title: "Your match: ASUS TUF Gaming F15",
    description:
      "A durable high-performance pick for gaming and demanding work. Suggested configuration: Intel i7 or Ryzen 7, RTX graphics, 16 GB RAM and 1 TB SSD. InfiniLaptops will confirm the best discounted price in your budget.",
    buttonText: "Explore more deals",
    imageUrl: ""
  }
];

export function RespondentFormFlow({
  questions,
  endings,
  preview = false,
  onClose,
  onSubmit,
  showRecommendation = false
}: {
  questions: RespondentQuestion[];
  endings: RespondentEnding[];
  preview?: boolean;
  onClose?: () => void;
  onSubmit?: (answers: Record<string, AnswerValue>) => Promise<void>;
  showRecommendation?: boolean;
}) {
  const steps = useMemo(() => questions.filter(Boolean), [questions]);
  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const answersRef = useRef<Record<string, AnswerValue>>({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const current = steps[activeIndex];
  const ending = selectEnding(steps, answers, endings);
  const progress = submitted
    ? 100
    : started
      ? Math.max(4, ((activeIndex + 1) / Math.max(steps.length, 1)) * 100)
      : 0;

  function answerFor(id: string) {
    return answers[id] ?? "";
  }

  function latestAnswerFor(id: string) {
    return answersRef.current[id] ?? "";
  }

  function setAnswer(id: string, value: AnswerValue) {
    setError("");
    answersRef.current = { ...answersRef.current, [id]: value };
    setAnswers(answersRef.current);
  }

  function validateQuestion(question: RespondentQuestion) {
    if (question.type === "statement" || question.type === "welcome") return "";
    if (question.type === "group") {
      const missing = question.children?.find((child) => {
        if (child.required === false) return false;
        return !String(latestAnswerFor(child.id)).trim();
      });
      if (missing) return "Please complete the required fields.";
      const badEmail = question.children?.find(
        (child) =>
          child.type === "email" &&
          String(latestAnswerFor(child.id)).trim() &&
          !isEmail(String(latestAnswerFor(child.id)))
      );
      if (badEmail) return "Please enter a valid email address.";
      return "";
    }

    const value = String(latestAnswerFor(question.id)).trim();
    if (question.required !== false && !value) return "Please answer this question.";
    if (question.type === "email" && value && !isEmail(value)) {
      return "Please enter a valid email address.";
    }
    if (question.type === "phone" && value && digitsOnly(value).length !== 10) {
      return "Please enter a 10 digit phone number.";
    }
    return "";
  }

  async function submitAnswers() {
    if (onSubmit) {
      await onSubmit(answersRef.current);
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 900));
  }

  async function goNext() {
    if (!started) {
      setStarted(true);
      return;
    }
    if (!current) return;
    const validation = validateQuestion(current);
    if (validation) {
      setError(validation);
      return;
    }
    if (activeIndex >= steps.length - 1) {
      if (submitting) return;
      setSubmitting(true);
      try {
        await submitAnswers();
        setSubmitted(true);
      } catch {
        setError("We couldn't submit your response. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setActiveIndex((index) => index + 1);
  }

  function goBack() {
    setError("");
    setSubmitting(false);
    if (submitted) {
      setSubmitted(false);
      return;
    }
    setActiveIndex((index) => Math.max(0, index - 1));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && !event.shiftKey) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === "TEXTAREA") return;
        event.preventDefault();
        void goNext();
      }
      if (event.key === "ArrowDown") void goNext();
      if (event.key === "ArrowUp") goBack();
      if (event.key === "Escape" && preview) onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fbfbfb] text-[#2f2633]">
      <TopProgress
        activeIndex={activeIndex}
        progress={progress}
        showStep={started && !submitted}
        reservePreviewAction={preview}
      />
      {preview ? (
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-20 rounded-lg border border-app-border bg-white px-4 py-2 font-bold text-app-muted shadow-sm"
        >
          Close preview
        </button>
      ) : null}
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.section
            key="start"
            className="flex min-h-screen items-center justify-center px-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.22 }}
          >
            <div className="text-center">
              <button
                onClick={goNext}
                className="h-10 min-w-[124px] rounded-lg bg-app-primary px-8 text-lg font-bold text-white"
              >
                Start
              </button>
              <p className="mt-2 flex items-center justify-center gap-1 text-[15px] text-app-muted">
                <Clock size={15} />
                Takes 2 minutes
              </p>
            </div>
          </motion.section>
        ) : submitting ? (
          <motion.section
            key="submitting"
            className="flex min-h-screen items-center justify-center px-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-app-border border-t-app-primary" />
              <p className="text-xl font-semibold text-app-primary">
                {showRecommendation ? "Finding your recommendation..." : "Submitting your response..."}
              </p>
            </div>
          </motion.section>
        ) : submitted ? (
          <EndingScreen ending={ending} showRecommendation={showRecommendation} />
        ) : current ? (
          <motion.section
            key={current.id}
            className="flex min-h-screen items-center justify-center px-8 py-16"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -22 }}
            transition={{ duration: 0.22 }}
          >
            <div className="w-full max-w-[720px]">
              <QuestionStep
                question={current}
                answerFor={answerFor}
                setAnswer={setAnswer}
                onAdvance={goNext}
              />
              {error ? (
                <p className="mt-5 rounded-md bg-[#fff0f0] px-4 py-3 font-semibold text-[#b42318]">
                  {error}
                </p>
              ) : null}
              <button
                onClick={goNext}
                className="mt-7 rounded-lg bg-app-primary px-5 py-3 text-lg font-bold text-white"
              >
                OK
              </button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
      {started ? (
        <div className="absolute bottom-4 right-6 flex items-center gap-2">
          <button
            onClick={goBack}
            disabled={activeIndex === 0 && !submitted}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#dddadd] text-app-muted disabled:opacity-45"
          >
            <ChevronUp size={18} />
          </button>
          <button
            onClick={goNext}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-app-primary text-white"
          >
            <ChevronDown size={18} />
          </button>
          <span className="rounded-md bg-app-primary px-3 py-2 text-xs font-bold text-white">
            Powered by Typeform
          </span>
        </div>
      ) : null}
    </main>
  );
}

function TopProgress({
  activeIndex,
  progress,
  showStep,
  reservePreviewAction
}: {
  activeIndex: number;
  progress: number;
  showStep: boolean;
  reservePreviewAction?: boolean;
}) {
  return (
    <div
      className={`absolute left-0 right-0 top-0 z-10 px-6 pt-8 ${
        reservePreviewAction ? "pr-[188px]" : ""
      }`}
    >
      <div className="h-[3px] w-full bg-[#c9c6ca]">
        <div
          className="h-full bg-app-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showStep ? (
        <div className="mt-9 flex items-center gap-4 pl-[8%] text-app-primary">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-app-primary text-xs font-bold text-white">
            {activeIndex + 1}
          </span>
          <span className="text-2xl font-bold leading-none">...</span>
        </div>
      ) : null}
    </div>
  );
}

function selectEnding(
  questions: RespondentQuestion[],
  answers: Record<string, AnswerValue>,
  endings: RespondentEnding[]
) {
  const fallback = endings[0];
  const budgetQuestion = questions.find((question) =>
    question.title.toLowerCase().includes("budget")
  );
  const budget = budgetQuestion ? String(answers[budgetQuestion.id] ?? "") : "";

  if (!budget || endings.length < 2) return fallback;
  if (budget.includes("Under")) return endings[0] ?? fallback;
  if (budget.includes("40000-60000")) return endings[1] ?? fallback;
  if (budget.includes("60000-80000")) return endings[2] ?? fallback;
  if (budget.includes("Above")) return endings[3] ?? fallback;

  return fallback;
}

function EndingScreen({
  ending,
  showRecommendation
}: {
  ending: RespondentEnding | undefined;
  showRecommendation: boolean;
}) {
  if (!showRecommendation || !ending) {
    return (
      <motion.section
        key="ending"
        className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-app-text"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.32 }}
      >
        <h1 className="text-[48px] font-normal leading-tight sm:text-[68px]">
          Thank you
        </h1>
      </motion.section>
    );
  }

  return (
    <motion.section
      key="ending"
      className="flex min-h-screen items-center justify-center bg-white px-6 py-16 text-center text-app-text"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.32 }}
    >
      <div className="w-full max-w-[900px]">
        <h1 className="mb-4 text-[34px] font-normal leading-tight sm:text-[38px]">
          {ending.title}
        </h1>
        <p className="mx-auto max-w-[760px] text-xl leading-8 text-app-muted">
          {ending.description}
        </p>
      </div>
    </motion.section>
  );
}

function QuestionStep({
  question,
  answerFor,
  setAnswer,
  onAdvance
}: {
  question: RespondentQuestion;
  answerFor: (id: string) => AnswerValue;
  setAnswer: (id: string, value: AnswerValue) => void;
  onAdvance: () => void;
}) {
  if (question.type === "group") {
    return (
      <div>
        <QuestionTitle number={question.number} title={question.title} />
        <div className="mt-10 space-y-8">
          {question.children?.map((child) => (
            <FlowInput
              key={child.id}
              question={child}
              value={String(answerFor(child.id))}
              onChange={(value) => setAnswer(child.id, value)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "multiple_choice" || question.type === "yes_no") {
    const choices =
      question.type === "yes_no" ? question.choices ?? ["Yes", "No"] : question.choices ?? [];
    return (
      <div>
        <QuestionTitle number={question.number} title={question.title} />
        {question.description ? (
          <p className="mt-4 text-xl leading-7 text-app-muted">{question.description}</p>
        ) : null}
        <div className="mt-8 space-y-3">
          {choices.map((choice, index) => {
            const selected = answerFor(question.id) === choice;
            return (
              <button
                key={`${question.id}-${choice}`}
                onClick={() => {
                  setAnswer(question.id, choice);
                  window.setTimeout(onAdvance, 420);
                }}
                className={[
                  "flex min-h-12 w-full max-w-[360px] items-center gap-3 rounded-lg border px-3 text-left text-lg transition",
                  selected
                    ? "border-app-primary bg-[#ecebed]"
                    : "border-app-border bg-white hover:border-app-primary"
                ].join(" ")}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded border border-app-border bg-white text-sm font-bold">
                  {question.type === "yes_no"
                    ? index === 0
                      ? "Y"
                      : "N"
                    : String.fromCharCode(65 + index)}
                </span>
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "dropdown") {
    return (
      <div>
        <QuestionTitle number={question.number} title={question.title} />
        <TypeformDropdown
          choices={question.choices ?? []}
          value={String(answerFor(question.id))}
          onChange={(value) => setAnswer(question.id, value)}
        />
      </div>
    );
  }

  if (question.type === "rating") {
    const count = question.ratingCount ?? question.choices?.length ?? 3;
    const selectedRating = Number(answerFor(question.id) || 0);
    return (
      <div>
        <QuestionTitle number={question.number} title={question.title} />
        <div className="mt-9 flex gap-6">
          {Array.from({ length: count }, (_, index) => {
            const value = String(index + 1);
            const selected = index + 1 <= selectedRating;
            return (
              <button
                key={value}
                onClick={() => setAnswer(question.id, value)}
                className={selected ? "text-app-primary" : "text-app-muted"}
              >
                <Star size={54} strokeWidth={1.7} fill={selected ? "currentColor" : "none"} />
                <span className="mt-3 block text-[16px]">{value}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "statement" || question.type === "welcome") {
    return (
      <div className="text-center">
        <QuestionTitle number={question.number} title={question.title} centered />
        {question.description ? (
          <p className="mx-auto mt-8 max-w-[680px] text-xl leading-7 text-app-muted">
            {question.description}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <QuestionTitle number={question.number} title={question.title} />
      <div className="mt-10">
        <FlowInput
          question={question}
          value={String(answerFor(question.id))}
          onChange={(value) => setAnswer(question.id, value)}
        />
      </div>
    </div>
  );
}

function QuestionTitle({
  number,
  title,
  centered = false
}: {
  number: string;
  title: string;
  centered?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-4",
        centered ? "justify-center" : ""
      ].join(" ")}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded bg-app-primary text-xs font-bold text-white">
        {number}
      </span>
      <h1 className="text-[28px] leading-tight sm:text-[32px]">{title}</h1>
    </div>
  );
}

function TypeformDropdown({
  choices,
  value,
  onChange
}: {
  choices: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const filteredChoices = choices.filter((choice) =>
    choice.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setQuery(value);
  }, [value]);

  return (
    <div className="mt-10 rounded-xl border border-app-border bg-white p-6 shadow-[0_0_0_3px_rgba(63,51,67,0.04)]">
      <div className="flex items-center border-b-2 border-[#6f6872]">
        <input
          className="h-14 min-w-0 flex-1 bg-transparent text-[28px] text-app-text outline-none placeholder:text-[#b6b1b8]"
          placeholder="Type or select an option"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={open ? "Close options" : "Open options"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <ChevronUp size={22} className="text-app-primary" />
          ) : (
            <Search size={22} className="text-app-primary" />
          )}
        </button>
      </div>
      {open ? (
        <div className="mt-6 max-h-[300px] space-y-2 overflow-y-auto scrollbar-subtle">
          {filteredChoices.length ? (
            filteredChoices.map((choice) => (
              <button
                key={choice}
                onClick={() => {
                  onChange(choice);
                  setQuery(choice);
                  setOpen(false);
                }}
                className={[
                  "flex min-h-11 w-full items-center rounded-lg border px-4 text-left text-lg transition",
                  value === choice
                    ? "border-app-primary bg-[#e7e5e8]"
                    : "border-[#d7d4da] bg-[#f0eff1] hover:border-app-primary"
                ].join(" ")}
              >
                {choice}
              </button>
            ))
          ) : (
            <p className="rounded-lg bg-[#f0eff1] px-4 py-3 text-lg text-app-muted">
              No matching options
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FlowInput({
  question,
  value,
  onChange
}: {
  question: RespondentQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const placeholder =
    question.placeholder ??
    (question.type === "email"
      ? "name@example.com"
      : question.type === "phone"
        ? "(201) 555-0123"
        : "Type your answer here");

  if (question.type === "long_text") {
    return (
      <label className="block">
        <span className="mb-3 block text-xl">{question.title}</span>
        <textarea
          ref={(node) => {
            inputRef.current = node;
          }}
          className="min-h-[110px] w-full resize-none border-0 border-b-2 border-[#6f6872] bg-transparent text-[28px] text-app-text outline-none placeholder:text-[#aaa5ad]"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (question.type === "phone") {
    return (
      <label className="block">
        <span className="mb-3 block text-xl">{question.title}</span>
        <div className="flex items-center border-b-2 border-[#6f6872] pb-3">
          <select
            className="mr-3 w-[76px] bg-transparent text-lg outline-none"
            defaultValue={question.phoneCountry ?? "+91"}
          >
            {phoneCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.code}
              </option>
            ))}
          </select>
          <input
            className="min-w-0 flex-1 bg-transparent text-[28px] text-app-text outline-none placeholder:text-[#aaa5ad]"
            inputMode="numeric"
            maxLength={10}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(digitsOnly(event.target.value))}
          />
        </div>
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-3 block text-xl">{question.title}</span>
      <input
        ref={(node) => {
          inputRef.current = node;
        }}
        className="h-14 w-full border-0 border-b-2 border-[#6f6872] bg-transparent text-[28px] text-app-text outline-none placeholder:text-[#aaa5ad]"
        inputMode={question.type === "number" ? "numeric" : undefined}
        type={question.type === "email" ? "email" : "text"}
        placeholder={placeholder}
        value={value}
        onChange={(event) =>
          onChange(
            question.type === "number"
              ? event.target.value.replace(/[^\d.-]/g, "")
              : event.target.value
          )
        }
      />
    </label>
  );
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function digitsOnly(value: string, maxLength = 10) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}
