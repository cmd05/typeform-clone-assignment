"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignLeft,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  CircleHelp,
  Check,
  Copy,
  Download,
  FileText,
  Filter,
  Gem,
  GripVertical,
  Hash,
  Image,
  Inbox,
  Languages,
  Link2,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquareQuote,
  Mic,
  Monitor,
  MoreHorizontal,
  Palette,
  PanelRight,
  Phone,
  Play,
  Plus,
  Rows3,
  Search,
  SendHorizontal,
  Settings,
  SlidersHorizontal,
  Smartphone,
  Star,
  Table2,
  Text,
  ToggleLeft,
  Trash2,
  Upload,
  User,
  Video,
  WandSparkles,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiPrompt } from "@/components/ai-prompt";
import { UserAvatar } from "@/components/avatar";
import {
  FORM_FLOW_STORAGE_KEY,
  RespondentFormFlow
} from "@/components/respondent-form-flow";
import {
  createBuilderForm,
  fetchBuilderForm,
  publishBuilderForm,
  saveBuilderForm,
  updateBuilderFormTitle
} from "@/lib/builder-api";
import {
  fetchFormResults,
  type FormResults,
  type ResultResponse,
  type ResultSummary
} from "@/lib/results";
import { mockSession } from "@/lib/session";

export type QuestionType =
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

export type BuilderQuestion = {
  id: string;
  number: string;
  title: string;
  type: QuestionType;
  color: string;
  description?: string;
  placeholder?: string;
  choices?: string[];
  phoneCountry?: string;
  phoneValue?: string;
  ratingCount?: number;
  required?: boolean;
  validationEnabled?: boolean;
  maxCharactersEnabled?: boolean;
  maxCharacters?: number;
  children?: BuilderQuestion[];
};

export type BuilderEnding = {
  id: string;
  letter: string;
  title: string;
  description: string;
  buttonText: string;
  imageUrl?: string;
};

type Question = BuilderQuestion;
type Ending = BuilderEnding;

const initialQuestions: BuilderQuestion[] = [
  {
    id: "details",
    number: "1",
    title: "Your details",
    type: "group",
    color: "bg-[#e7e5e8]",
    description: "Description (optional)",
    children: [
      {
        id: "name",
        number: "A",
        title: "What's your name?",
        type: "short_text",
        color: "bg-[#c9e7ff]",
        placeholder: "Your full name"
      },
      {
        id: "email",
        number: "B",
        title: "What's your email address?",
        type: "email",
        color: "bg-[#ffd5e5]",
        placeholder: "you@example.com"
      }
    ]
  },
  {
    id: "audience",
    number: "2",
    title: "Who is this laptop for?",
    type: "multiple_choice",
    color: "bg-[#e2d6ff]",
    description: "Description (optional)",
    choices: ["For me", "For a student", "For work or my business", "As a gift"]
  },
  {
    id: "budget",
    number: "3",
    title: "What's your budget in INR?",
    type: "multiple_choice",
    color: "bg-[#e2d6ff]",
    description: "Description (optional)",
    choices: ["Under 40000", "40000-60000", "60000-80000", "Above 80000"]
  },
  {
    id: "certified",
    number: "4",
    title: "Would you consider a certified refurbished laptop?",
    type: "yes_no",
    color: "bg-[#e2d6ff]",
    choices: ["Yes", "No"]
  },
  {
    id: "brand",
    number: "5",
    title: "Do you have a preferred brand?",
    type: "dropdown",
    color: "bg-[#e2d6ff]",
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

const initialEndings: BuilderEnding[] = [
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

const elementGroups = [
  {
    title: "Contact info",
    items: [
      ["Contact Info", User, "bg-[#ffd5e5]"],
      ["Email", Mail, "bg-[#ffd5e5]"],
      ["Phone Number", Phone, "bg-[#ffd5e5]"],
      ["Address", MapPin, "bg-[#ffd5e5]"]
    ]
  },
  {
    title: "Choice",
    items: [
      ["Multiple Choice", Rows3, "bg-[#e2d6ff]"],
      ["Dropdown", ChevronDown, "bg-[#e2d6ff]"],
      ["Yes/No", ToggleLeft, "bg-[#e2d6ff]"],
      ["Checkbox", CheckSquare, "bg-[#e2d6ff]"]
    ]
  },
  {
    title: "Rating & ranking",
    items: [
      ["Net Promoter Score", Star, "bg-[#d7efcf]"],
      ["Opinion Scale", AlignLeft, "bg-[#d7efcf]"],
      ["Rating", Star, "bg-[#d7efcf]"],
      ["Ranking", Rows3, "bg-[#d7efcf]"]
    ]
  },
  {
    title: "Text & Video",
    items: [
      ["Long Text", AlignLeft, "bg-[#c9e7ff]"],
      ["Short Text", Text, "bg-[#c9e7ff]"],
      ["Video and Audio", Video, "bg-[#c9e7ff]"],
      ["Clarify with AI", WandSparkles, "bg-[#c9e7ff]"]
    ]
  },
  {
    title: "Other",
    items: [
      ["Number", Hash, "bg-[#ffe08f]"],
      ["Date", CalendarDays, "bg-[#ffe08f]"],
      ["File Upload", Upload, "bg-[#ffe08f]"],
      ["End Screen", PanelRight, "bg-[#e7e5e8]"]
    ]
  }
] as const;

const themes = [
  ["Inky Black", "#2a202b", "#fff", "#fff"],
  ["Classic Blue", "#fff", "#0f172a", "#0f4ea8"],
  ["Pearl White", "#fff", "#241924", "#2a202b"],
  ["Plain Blue", "#fff", "#1f2937", "#55b7ad"],
  ["Sand Curve", "#f4c060", "#241924", "#2a202b"]
];

const phoneCountries = [
  { code: "+91", flag: "🇮🇳", label: "India" },
  { code: "+1", flag: "🇺🇸", label: "United States" },
  { code: "+44", flag: "🇬🇧", label: "United Kingdom" },
  { code: "+61", flag: "🇦🇺", label: "Australia" },
  { code: "+971", flag: "🇦🇪", label: "United Arab Emirates" }
];

function questionIcon(type: QuestionType) {
  if (type === "email") return Mail;
  if (type === "phone") return Phone;
  if (type === "short_text") return Text;
  if (type === "long_text") return AlignLeft;
  if (type === "number") return Hash;
  if (type === "yes_no") return ToggleLeft;
  if (type === "rating") return Star;
  if (type === "statement") return MessageSquareQuote;
  if (type === "welcome") return PanelRight;
  if (type === "multiple_choice") return Rows3;
  if (type === "dropdown") return ChevronDown;
  return LayoutDashboard;
}

function questionTypeLabel(type: QuestionType) {
  if (type === "email") return "Email";
  if (type === "phone") return "Phone Number";
  if (type === "short_text") return "Short Text";
  if (type === "long_text") return "Long Text";
  if (type === "number") return "Number";
  if (type === "yes_no") return "Yes/No";
  if (type === "rating") return "Rating";
  if (type === "statement") return "Statement";
  if (type === "welcome") return "Welcome Screen";
  if (type === "multiple_choice") return "Multiple Choice";
  if (type === "dropdown") return "Dropdown";
  return "Question";
}

function colorForQuestionType(type: QuestionType) {
  if (type === "email" || type === "phone") return "bg-[#ffd5e5]";
  if (type === "short_text" || type === "long_text") return "bg-[#c9e7ff]";
  if (type === "number") return "bg-[#ffe08f]";
  if (type === "rating") return "bg-[#d7efcf]";
  if (type === "welcome" || type === "statement") return "bg-[#e7e5e8]";
  return "bg-[#e2d6ff]";
}

function updateQuestionInTree(
  question: Question,
  id: string,
  patch: Partial<Question>
): Question {
  if (question.id === id) {
    return { ...question, ...patch };
  }

  if (!question.children) {
    return question;
  }

  return {
    ...question,
    children: question.children.map((child) =>
      updateQuestionInTree(child, id, patch)
    )
  };
}

function findQuestionInTree(question: Question, id: string): Question | null {
  if (question.id === id) {
    return question;
  }

  for (const child of question.children ?? []) {
    const found = findQuestionInTree(child, id);
    if (found) return found;
  }

  return null;
}

function stripRequiredMark(value: string) {
  return value.replace(/\*+$/g, "");
}

function requiredTitle(question: Question) {
  return `${question.title}${question.required === false ? "" : "*"}`;
}

function renumberTopLevel(questions: Question[]) {
  return questions.map((question, index) => ({
    ...question,
    number: String(index + 1)
  }));
}

function reletterChildren(question: Question) {
  if (!question.children) return question;
  return {
    ...question,
    children: question.children.map((child, index) => ({
      ...child,
      number: String.fromCharCode(65 + index)
    }))
  };
}

function defaultQuestionForType(
  type: QuestionType,
  nextNumber: string
): Question {
  const base = {
    id: `${type}-${Date.now()}`,
    number: nextNumber,
    type,
    color: colorForQuestionType(type),
    description: "Description (optional)",
    required: true,
    validationEnabled: false
  };

  if (type === "group") {
    return {
      ...base,
      title: "New page",
      children: []
    };
  }

  if (type === "email") {
    return {
      ...base,
      title: "What's your email address?",
      placeholder: "you@example.com"
    };
  }

  if (type === "phone") {
    return {
      ...base,
      title: "What is your phone number?",
      placeholder: "5550000000",
      phoneCountry: "+91",
      phoneValue: ""
    };
  }

  if (type === "long_text") {
    return {
      ...base,
      title: "Tell us a little more",
      placeholder: "Type your answer here..."
    };
  }

  if (type === "number") {
    return {
      ...base,
      title: "Enter a number",
      placeholder: "123"
    };
  }

  if (type === "multiple_choice" || type === "dropdown") {
    return {
      ...base,
      title: type === "dropdown" ? "Choose an option" : "Pick one",
      choices: ["Option 1", "Option 2", "Option 3"]
    };
  }

  if (type === "yes_no") {
    return {
      ...base,
      title: "Do you agree?",
      choices: ["Yes", "No"]
    };
  }

  if (type === "rating") {
    return {
      ...base,
      title: "How would you rate this?",
      choices: ["1", "2", "3"],
      ratingCount: 3
    };
  }

  if (type === "statement") {
    return {
      ...base,
      title: "Statement",
      description: "Add supporting text here."
    };
  }

  if (type === "welcome") {
    return {
      ...base,
      title: "Welcome",
      description: "Start your form with a short introduction."
    };
  }

  return {
    ...base,
    title: "New question",
    placeholder: "Your answer"
  };
}

function elementLabelToQuestionType(label: string): QuestionType {
  const normalized = label.toLowerCase();
  if (normalized.includes("email")) return "email";
  if (normalized.includes("phone")) return "phone";
  if (normalized.includes("long text")) return "long_text";
  if (normalized.includes("short text")) return "short_text";
  if (normalized.includes("number")) return "number";
  if (normalized.includes("dropdown")) return "dropdown";
  if (normalized.includes("yes/no")) return "yes_no";
  if (normalized.includes("rating")) return "rating";
  if (normalized.includes("statement")) return "statement";
  if (normalized.includes("welcome")) return "welcome";
  return "multiple_choice";
}

function EditableText({
  value,
  onChange,
  className,
  multiline = false,
  as = "textarea"
}: {
  value: string;
  onChange: (value: string) => void;
  className: string;
  multiline?: boolean;
  as?: "input" | "textarea";
}) {
  if (as === "input" || !multiline) {
    return (
      <input
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <textarea
      className={`${className} resize-none overflow-hidden`}
      value={value}
      rows={3}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function digitsOnly(value: string, maxLength = 10) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function BuilderPage({ formId }: { formId?: string }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"content" | "results">("content");
  const [formQuestions, setFormQuestions] = useState<Question[]>(() =>
    formId ? initialQuestions : []
  );
  const [formEndings, setFormEndings] = useState<Ending[]>(() =>
    formId ? initialEndings : []
  );
  const [formTitle, setFormTitle] = useState("New form");
  const [formSlug, setFormSlug] = useState(formId ? "laptop-finder" : "new-form");
  const [formStatus, setFormStatus] = useState<"draft" | "published">("draft");
  const [selectedId, setSelectedId] = useState(formId ? "details" : "");
  const [selectedEndingId, setSelectedEndingId] = useState<string | null>(null);
  const [loadingForm, setLoadingForm] = useState(!!formId);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    formId ? "saved" : "idle"
  );
  const hasLoadedBackendForm = useRef(!formId);
  const saveTimer = useRef<number | null>(null);
  const titleSaveTimer = useRef<number | null>(null);
  const [contentOpen, setContentOpen] = useState(!formId);
  const [contentTab, setContentTab] = useState<"elements" | "import" | "ai">(
    "elements"
  );
  const [designOpen, setDesignOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [creatingForm, setCreatingForm] = useState(false);
  const [publishingForm, setPublishingForm] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [resultsRefreshKey, setResultsRefreshKey] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    })
  );

  const flatQuestions = useMemo(
    () =>
      formQuestions.flatMap((question) => [
        question,
        ...(question.children ?? [])
      ]),
    [formQuestions]
  );
  const selected = flatQuestions.find((question) => question.id === selectedId);
  const selectedEnding =
    formEndings.find((item) => item.id === selectedEndingId) ?? null;

  useEffect(() => {
    if (!formId) return;

    let cancelled = false;
    setLoadingForm(true);
    fetchBuilderForm(formId)
      .then((form) => {
        if (cancelled) return;
        setFormTitle(form.title);
        setFormSlug(form.slug);
        setFormStatus(form.status);
        setFormQuestions(form.questions);
        setFormEndings(form.endings);
        setSelectedId(form.questions[0]?.id ?? "");
        setSelectedEndingId(null);
        hasLoadedBackendForm.current = true;
        setLoadError("");
        setSaveStatus("saved");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("Unable to load this form. Check that the backend is running.");
      })
      .finally(() => {
        if (!cancelled) setLoadingForm(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formId]);

  useEffect(() => {
    window.localStorage.setItem(
      FORM_FLOW_STORAGE_KEY,
      JSON.stringify({
        questions: formQuestions,
        endings: formEndings,
        savedAt: new Date().toISOString()
      })
    );
  }, [formQuestions, formEndings]);

  useEffect(() => {
    if (!formId || !hasLoadedBackendForm.current || loadingForm) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    setSaveStatus("saving");
    saveTimer.current = window.setTimeout(() => {
      saveBuilderForm({
        formId,
        questions: formQuestions,
        endings: formEndings
      })
        .then(() => {
          setSaveStatus("saved");
          if (activeSection === "results") {
            setResultsRefreshKey((key) => key + 1);
          }
        })
        .catch(() => setSaveStatus("error"));
    }, 650);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [activeSection, formId, formQuestions, formEndings, loadingForm]);

  useEffect(() => {
    if (!formId || !hasLoadedBackendForm.current || loadingForm) return;
    if (titleSaveTimer.current) window.clearTimeout(titleSaveTimer.current);

    setSaveStatus("saving");
    titleSaveTimer.current = window.setTimeout(() => {
      updateBuilderFormTitle(formId, formTitle)
        .then(() => {
          setSaveStatus("saved");
          if (activeSection === "results") {
            setResultsRefreshKey((key) => key + 1);
          }
        })
        .catch(() => setSaveStatus("error"));
    }, 650);

    return () => {
      if (titleSaveTimer.current) window.clearTimeout(titleSaveTimer.current);
    };
  }, [activeSection, formId, formTitle, loadingForm]);

  useEffect(() => {
    if (formStatus !== "published" && activeSection === "results") {
      setActiveSection("content");
    }
  }, [activeSection, formStatus]);

  if (loadingForm) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f8] text-app-muted">
        Loading builder...
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f8] px-6 text-center">
        <div className="max-w-md rounded-xl border border-app-border bg-white p-8 shadow-soft">
          <h1 className="mb-3 text-2xl text-app-text">Could not open form</h1>
          <p className="mb-6 text-app-muted">{loadError}</p>
          <Link href="/" className="rounded-lg bg-app-primary px-5 py-3 font-bold text-white">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setFormQuestions((current) =>
      current.map((question) => updateQuestionInTree(question, id, patch))
    );
  }

  function updateChoice(id: string, index: number, value: string) {
    setFormQuestions((current) =>
      current.map((question) =>
        updateQuestionInTree(question, id, {
          choices:
            findQuestionInTree(question, id)?.choices?.map((choice, choiceIndex) =>
              choiceIndex === index ? value : choice
            ) ?? []
        })
      )
    );
  }

  function addChoice(id: string) {
    setFormQuestions((current) =>
      current.map((question) => {
        const target = findQuestionInTree(question, id);
        return updateQuestionInTree(question, id, {
          choices: [...(target?.choices ?? []), "New choice"]
        });
      })
    );
  }

  function updateEnding(id: string, patch: Partial<Ending>) {
    setFormEndings((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function deleteQuestion(id: string) {
    setFormQuestions((current) => {
      const next = renumberTopLevel(
        current
          .filter((question) => question.id !== id)
          .map((question) =>
            reletterChildren({
              ...question,
              children: question.children?.filter((child) => child.id !== id)
            })
          )
      );
      const nextFlat = next.flatMap((question) => [
        question,
        ...(question.children ?? [])
      ]);
      if (selectedId === id) {
        setSelectedId(nextFlat[0]?.id ?? "");
        setSelectedEndingId(null);
      }
      return next.length ? next : current;
    });
  }

  function reorderQuestions(activeId: string, overId: string) {
    if (activeId === overId) return;
    setFormQuestions((current) => {
      const topActive = current.findIndex((question) => question.id === activeId);
      const topOver = current.findIndex((question) => question.id === overId);

      if (topActive >= 0 && topOver >= 0) {
        return renumberTopLevel(arrayMove(current, topActive, topOver));
      }

      return current.map((question) => {
        const activeIndex =
          question.children?.findIndex((child) => child.id === activeId) ?? -1;
        const overIndex =
          question.children?.findIndex((child) => child.id === overId) ?? -1;

        if (!question.children || activeIndex < 0 || overIndex < 0) {
          return question;
        }

        return reletterChildren({
          ...question,
          children: arrayMove(question.children, activeIndex, overIndex)
        });
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    reorderQuestions(String(active.id), String(over.id));
  }

  async function addQuestion(type: QuestionType) {
    const nextNumber = String(formQuestions.length + 1);
    const question = defaultQuestionForType(type, nextNumber);

    if (!formId && formQuestions.length === 0) {
      setCreatingForm(true);
      setContentOpen(false);
      setFormQuestions([question]);
      setSelectedEndingId(null);
      setSelectedId(question.id);

      try {
        const created = await createBuilderForm(formTitle);
        await saveBuilderForm({
          formId: created.id,
          questions: [question],
          endings: []
        });
        router.replace(`/forms/${created.id}/edit`);
      } catch {
        setSaveStatus("error");
        setContentOpen(true);
      } finally {
        setCreatingForm(false);
      }
      return;
    }

    setFormQuestions((current) => [...current, question]);
    setSelectedEndingId(null);
    setSelectedId(question.id);
    setContentOpen(false);
  }

  async function createEmptyDraft() {
    if (creatingForm) return;
    setCreatingForm(true);
    setContentOpen(false);

    try {
      const created = await createBuilderForm(formTitle, true);
      router.replace(`/forms/${created.id}/edit`);
    } catch {
      setSaveStatus("error");
      setContentOpen(true);
    } finally {
      setCreatingForm(false);
    }
  }

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 1800);
  }

  function handleSectionChange(section: "content" | "results") {
    if (section === "results") {
      setResultsRefreshKey((key) => key + 1);
    }
    setActiveSection(section);
  }

  async function handlePublish() {
    if (!formId || publishingForm) return;
    setPublishingForm(true);
    setSaveStatus("saving");

    try {
      await saveBuilderForm({
        formId,
        questions: formQuestions,
        endings: formEndings
      });
      await updateBuilderFormTitle(formId, formTitle);
      const published = await publishBuilderForm(formId);
      setFormSlug(published.slug);
      setFormStatus("published");
      setSaveStatus("saved");
      setShareModalOpen(true);
    } catch {
      setSaveStatus("error");
    } finally {
      setPublishingForm(false);
    }
  }

  function addPage() {
    addQuestion("group");
  }

  function addEnding() {
    const nextIndex = formEndings.length;
    const endingItem: Ending = {
      id: `ending-${Date.now()}`,
      letter: String.fromCharCode(65 + nextIndex),
      title: "New ending",
      description: "Write a closing message for this ending.",
      buttonText: "Continue",
      imageUrl: ""
    };
    setFormEndings((current) => [...current, endingItem]);
    setSelectedEndingId(endingItem.id);
  }

  return (
    <main className="h-screen overflow-hidden bg-white text-app-text">
      <BuilderHeader
        formTitle={formTitle}
        formSlug={formSlug}
        formStatus={formStatus}
        saveStatus={creatingForm || publishingForm ? "saving" : saveStatus}
        activeSection={activeSection}
        onTitleChange={setFormTitle}
        onSectionChange={handleSectionChange}
        onPublish={handlePublish}
        onCopied={() => showToast("Link copied")}
      />
      {activeSection === "results" && formId ? (
        <BuilderResultsWorkspace
          formId={formId}
          refreshKey={resultsRefreshKey}
          onEditContent={() => setActiveSection("content")}
        />
      ) : (
        <div className="grid h-[calc(100vh-72px)] grid-cols-[320px_minmax(520px,1fr)_320px] gap-5 px-4 pb-4">
          <LeftPanel
            questions={formQuestions}
            endings={formEndings}
            selectedId={selectedId}
            selectedEndingId={selectedEndingId}
            onSelect={(id) => {
              setSelectedEndingId(null);
              setSelectedId(id);
            }}
            onEnding={(id) => setSelectedEndingId(id)}
            onCreatePage={addPage}
            onCreateEnding={addEnding}
            onDeleteQuestion={deleteQuestion}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            onOpenContent={() => {
              setContentTab("elements");
              setContentOpen(true);
            }}
          />
          <section className="min-w-0 overflow-hidden">
            <Toolbar
              onOpenContent={() => {
                setContentTab("elements");
                setContentOpen(true);
              }}
              onOpenDesign={() => setDesignOpen(true)}
              onOpenPreview={() => setPreviewOpen(true)}
            />
            <Canvas
              question={selected}
              ending={selectedEnding}
              onUpdateQuestion={updateQuestion}
              onUpdateChoice={updateChoice}
              onAddChoice={addChoice}
              onUpdateEnding={updateEnding}
            />
          </section>
          <RightSettings
            question={selected}
            ending={selectedEnding}
            onUpdateQuestion={updateQuestion}
            onUpdateEnding={updateEnding}
          />
        </div>
      )}
      {contentOpen ? (
        <ContentModal
          tab={contentTab}
          onTab={setContentTab}
          onClose={() => {
            if (!formId && formQuestions.length === 0) {
              void createEmptyDraft();
              return;
            }
            setContentOpen(false);
          }}
          onAddElement={(label) => addQuestion(elementLabelToQuestionType(label))}
        />
      ) : null}
      {creatingForm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="rounded-xl border border-app-border bg-white px-6 py-5 font-bold text-app-muted shadow-xl">
            Creating form...
          </div>
        </div>
      ) : null}
      {designOpen ? <DesignOverlay onClose={() => setDesignOpen(false)} /> : null}
      {previewOpen ? (
        <div className="fixed inset-0 z-[70] bg-white">
          <RespondentFormFlow
            questions={formQuestions}
            endings={formEndings}
            preview
            onClose={() => setPreviewOpen(false)}
            showRecommendation={formSlug === "laptop-finder"}
          />
        </div>
      ) : null}
      <ShareModal
        open={shareModalOpen}
        title={formTitle}
        url={`/to/${formSlug}`}
        onClose={() => setShareModalOpen(false)}
        onCopied={() => showToast("Link copied")}
      />
      <CopyToast message={toastMessage} />
    </main>
  );
}

function BuilderHeader({
  formTitle,
  formSlug,
  formStatus,
  saveStatus,
  activeSection,
  onTitleChange,
  onSectionChange,
  onPublish,
  onCopied
}: {
  formTitle: string;
  formSlug: string;
  formStatus: "draft" | "published";
  saveStatus: "idle" | "saving" | "saved" | "error";
  activeSection: "content" | "results";
  onTitleChange: (title: string) => void;
  onSectionChange: (section: "content" | "results") => void;
  onPublish: () => void;
  onCopied: () => void;
}) {
  const publicPath = `/to/${formSlug}`;

  async function copyPublicLink() {
    const url = `${window.location.origin}${publicPath}`;
    await navigator.clipboard.writeText(url);
    onCopied();
  }

  return (
    <header className="grid h-[72px] grid-cols-[320px_minmax(0,1fr)_430px] items-center border-b border-[#f0eef2] px-8">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-app-muted">
        <Link href="/" className="flex items-center gap-2 hover:text-app-text">
          <FileText size={18} />
          Forms
        </Link>
        <span>›</span>
        <input
          className="max-w-[180px] truncate border-b border-transparent bg-transparent text-app-text outline-none hover:border-app-border focus:border-app-primary"
          value={formTitle}
          onChange={(event) => onTitleChange(event.target.value)}
          aria-label="Form title"
        />
      </div>
      <nav className="flex h-full items-center justify-center gap-8 text-[16px] font-semibold">
        <button
          onClick={() => onSectionChange("content")}
          className={[
            "relative flex h-full items-center",
            activeSection === "content" ? "text-app-text" : "text-app-muted"
          ].join(" ")}
        >
          Content
          {activeSection === "content" ? (
            <span className="absolute left-0 right-0 top-0 h-1 rounded-b-full bg-app-primary" />
          ) : null}
        </button>
        <button className="text-app-muted">Workflow</button>
        <button className="text-app-muted">Connect</button>
        {formStatus === "published" ? (
          <button
            onClick={() => onSectionChange("results")}
            className={[
              "relative flex h-9 items-center rounded-lg px-3",
              activeSection === "results"
                ? "bg-[#f1eff2] text-app-text"
                : "text-app-muted hover:bg-[#f6f5f6]"
            ].join(" ")}
          >
            Results
          </button>
        ) : null}
      </nav>
      <div className="flex items-center justify-end gap-3">
        <span
          className={[
            "inline-flex w-[58px] shrink-0 justify-end text-xs font-bold",
            saveStatus === "error" ? "text-[#b42318]" : "text-app-muted"
          ].join(" ")}
        >
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "error"
              ? "Save failed"
              : saveStatus === "saved"
                ? "Saved"
                : ""}
        </span>
        {formStatus === "published" ? (
          <button
            onClick={copyPublicLink}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-app-border bg-white text-app-muted transition hover:-translate-y-0.5 hover:border-app-primary hover:text-app-primary hover:shadow-sm active:translate-y-0 active:scale-95"
            aria-label="Copy public form link"
            title="Copy public form link"
          >
            <Link2 size={17} />
          </button>
        ) : null}
        {formStatus !== "published" ? (
          <button
            onClick={onPublish}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-app-border bg-white px-5 font-bold text-app-muted transition hover:-translate-y-0.5 hover:border-app-primary hover:text-app-primary hover:shadow-sm active:translate-y-0 active:scale-[0.98]"
          >
            <SendHorizontal size={17} />
            Share
          </button>
        ) : null}
        <button className="h-10 shrink-0 whitespace-nowrap rounded-lg bg-app-teal px-5 font-normal text-white">
          View plans
        </button>
        <button className="icon-button" aria-label="Help">
          <CircleHelp size={19} />
        </button>
        <UserAvatar initial={mockSession.userInitial} />
      </div>
    </header>
  );
}

function BuilderResultsWorkspace({
  formId,
  refreshKey,
  onEditContent
}: {
  formId: string;
  refreshKey: number;
  onEditContent: () => void;
}) {
  const [results, setResults] = useState<FormResults | null>(null);
  const [activeTab, setActiveTab] = useState<"performance" | "summary" | "responses">(
    "performance"
  );
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResults = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const data = await fetchFormResults(formId);
        setResults(data);
        setSelectedResponseId((current) => {
          if (current && data.responses.some((response) => response.id === current)) {
            return current;
          }
          return data.responses[0]?.id ?? null;
        });
        setError("");
      } catch {
        setError("Unable to load results.");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [formId]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadResults()
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadResults, refreshKey]);

  useEffect(() => {
    const refresh = () => void loadResults(false);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refresh, 5000);

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadResults]);

  const selectedResponse =
    results?.responses.find((response) => response.id === selectedResponseId) ?? null;
  const filteredResponses = useMemo(() => {
    if (!results) return [];
    const query = searchValue.trim().toLowerCase();
    if (!query) return results.responses;
    return results.responses.filter((response) =>
      response.answers.some((answer) =>
        String(answer.value ?? "").toLowerCase().includes(query)
      )
    );
  }, [results, searchValue]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-72px)] items-center justify-center bg-[#f7f7f8] text-app-muted">
        Loading results...
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="flex h-[calc(100vh-72px)] items-center justify-center bg-[#f7f7f8] text-[#b42318]">
        {error || "Unable to load results."}
      </div>
    );
  }

  return (
    <section className="h-[calc(100vh-72px)] overflow-y-auto bg-[#f6f6f5]">
      <div className="sticky top-0 z-20 flex h-[58px] items-center gap-8 border-b border-app-border bg-[#f3f2f1] px-5 text-[15px] font-semibold text-app-muted">
        <button className="flex items-center gap-2">
          Smart Insights
          <span className="rounded-md border border-[#dec7ea] bg-white px-2 py-0.5 text-xs text-[#7b4a8d]">
            Beta
          </span>
        </button>
        <ResultsTabButton
          active={activeTab === "performance"}
          onClick={() => setActiveTab("performance")}
        >
          Form performance
        </ResultsTabButton>
        <ResultsTabButton
          active={activeTab === "summary"}
          onClick={() => setActiveTab("summary")}
        >
          Response summary
        </ResultsTabButton>
        <ResultsTabButton
          active={activeTab === "responses"}
          onClick={() => setActiveTab("responses")}
        >
          Responses [{results.response_count}]
        </ResultsTabButton>
      </div>

      {!results.response_count ? (
        <div className="flex min-h-[520px] items-center justify-center px-6 text-center">
          <div className="rounded-2xl border border-app-border bg-white px-12 py-14 shadow-soft">
            <Inbox className="mx-auto mb-4 text-app-muted" size={42} />
            <h2 className="mb-2 text-2xl font-bold text-app-text">No responses yet</h2>
            <p className="mb-6 max-w-sm text-app-muted">
              Once people submit this form, their answers and summaries will appear here.
            </p>
            <button
              onClick={onEditContent}
              className="rounded-lg bg-app-primary px-5 py-3 font-bold text-white"
            >
              Back to content
            </button>
          </div>
        </div>
      ) : activeTab === "performance" ? (
        <ResultsPerformance results={results} />
      ) : activeTab === "summary" ? (
        <ResultsSummary results={results} />
      ) : (
        <ResultsResponses
          results={results}
          responses={filteredResponses}
          selectedResponse={selectedResponse}
          selectedResponseId={selectedResponseId}
          searchValue={searchValue}
          filterOpen={filterOpen}
          onSearch={setSearchValue}
          onSelect={setSelectedResponseId}
          onFilterOpen={setFilterOpen}
        />
      )}
    </section>
  );
}

function ResultsTabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative flex h-full items-center",
        active ? "text-app-text" : "hover:text-app-text"
      ].join(" ")}
    >
      {children}
      {active ? (
        <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-app-text" />
      ) : null}
    </button>
  );
}

function ResultsPerformance({ results }: { results: FormResults }) {
  const completionRate = results.response_count ? "100%" : "0%";
  return (
    <div className="mx-auto max-w-[1180px] px-10 py-10">
      <h1 className="text-[28px] font-normal text-app-text">Form performance</h1>
      <p className="mt-2 text-app-muted">Key metrics that show how your form is doing.</p>
      <div className="my-8 h-px bg-app-border" />
      <ResultsFilters />
      <h2 className="mb-5 mt-10 text-2xl font-normal text-app-text">At a glance</h2>
      <div className="grid gap-3 md:grid-cols-5">
        {[
          ["Views", String(Math.max(results.response_count * 2 + 1, results.response_count))],
          ["Starts", String(results.response_count)],
          ["Submissions", String(results.response_count)],
          ["Completion rate", completionRate],
          ["Time to complete", "01:25"]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-soft">
            <p className="mb-10 font-semibold text-app-muted">{label}</p>
            <p className="text-[34px] text-app-text">{value}</p>
          </div>
        ))}
      </div>
      <h2 className="mb-5 mt-10 text-2xl font-normal text-app-text">Trends</h2>
      <div className="rounded-xl bg-white p-6 shadow-soft">
        <div className="mb-12 flex justify-between">
          <div className="flex gap-2">
            <SmallControl>Starts</SmallControl>
            <SmallControl>Weekly</SmallControl>
          </div>
          <div className="flex gap-1">
            <IconControl icon={<Table2 size={16} />} />
            <IconControl icon={<BarChart3 size={16} />} active />
          </div>
        </div>
        <div className="relative h-[190px]">
          <div className="absolute left-0 right-0 top-4 h-px bg-app-border" />
          <div className="absolute left-0 right-0 top-24 h-px bg-app-border" />
          <div className="absolute bottom-8 left-8 right-8 h-[3px] origin-left -rotate-6 rounded-full bg-[#9b4db3]" />
        </div>
      </div>
      <h2 className="mb-5 mt-10 text-2xl font-normal text-app-text">Question by question</h2>
      <div className="overflow-hidden rounded-xl bg-white shadow-soft">
        <div className="grid grid-cols-[1fr_100px_120px_80px] border-b border-app-border px-5 py-4 font-semibold text-app-muted">
          <span>Questions ↑</span>
          <span className="text-right">Views</span>
          <span className="text-right">Drop-off</span>
          <span />
        </div>
        {results.questions.map((question, index) => (
          <div
            key={question.id}
            className="grid grid-cols-[1fr_100px_120px_80px] items-center border-b border-app-border px-5 py-4 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <QuestionBadge type={question.type} number={index + 1} />
              <span className="truncate">{question.title}</span>
            </div>
            <span className="text-right">{Math.max(results.response_count - index, 0)}</span>
            <span className="text-right text-app-muted">0</span>
            <button className="justify-self-end rounded-md border border-app-border px-3 py-1 text-sm font-semibold text-app-muted">
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsSummary({ results }: { results: FormResults }) {
  return (
    <div className="mx-auto max-w-[1180px] px-10 py-10">
      <h1 className="text-[28px] font-normal text-app-text">Response summary</h1>
      <p className="mt-2 text-app-muted">
        A breakdown of form responses and key takeaways for each question.
      </p>
      <div className="my-8 h-px bg-app-border" />
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <SmallControl icon={<SlidersHorizontalIcon />}>Default Summary</SmallControl>
        <SmallControl icon={<CalendarDays size={16} />}>All time</SmallControl>
        <SmallControl icon={<Filter size={16} />}>Filters</SmallControl>
      </div>
      <div className="space-y-6">
        {results.summaries.length ? (
          results.summaries.map((summary) => (
            <SummaryAnalysisCard
              key={summary.question_id}
              summary={summary}
              responseCount={results.response_count}
            />
          ))
        ) : (
          <div className="rounded-xl bg-white p-8 text-app-muted shadow-soft">
            No response summary is available yet.
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryAnalysisCard({
  summary,
  responseCount
}: {
  summary: ResultSummary;
  responseCount: number;
}) {
  const entries = Object.entries(summary.counts);
  const max = Math.max(...entries.map(([, count]) => count), 1);
  const answered = entries.reduce((sum, [, count]) => sum + count, 0);
  return (
    <div className="rounded-2xl bg-white p-7 shadow-soft">
      <div className="mb-7 flex items-start gap-4">
        <QuestionBadge type={summary.type} number={3} />
        <div>
          <h2 className="text-2xl font-normal text-app-text">{summary.title}</h2>
          <p className="mt-1 text-app-muted">
            {answered} out of {responseCount} people answered this question.
          </p>
        </div>
      </div>
      <div className="mb-7 rounded-lg border-2 border-[#e7b8ff] px-5 py-4">
        <span className="mr-3 font-semibold text-app-text">Analysis</span>
        <span className="rounded-full border border-[#dec7ea] bg-[#fcf7ff] px-3 py-1 text-sm font-bold text-[#7b4a8d]">
          AI-powered
        </span>
      </div>
      <div className="mb-8 flex gap-2">
        <button className="rounded-lg border border-app-border bg-white px-4 py-2 font-semibold">
          Overview
        </button>
        <button className="rounded-lg bg-[#f0eff1] px-4 py-2 font-semibold text-app-muted">
          Trends
        </button>
      </div>
      <div className="flex h-[230px] items-end gap-8 border-b border-app-border px-8">
        {entries.map(([label, count]) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-3">
            <span className="font-bold text-[#7b4a8d]">{count}</span>
            <div
              className="w-full rounded-t bg-[#9b4db3]"
              style={{ height: `${Math.max(12, (count / max) * 160)}px` }}
            />
            <span className="max-w-[150px] truncate text-sm text-app-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsResponses({
  results,
  responses,
  selectedResponse,
  selectedResponseId,
  searchValue,
  filterOpen,
  onSearch,
  onSelect,
  onFilterOpen
}: {
  results: FormResults;
  responses: ResultResponse[];
  selectedResponse: ResultResponse | null;
  selectedResponseId: number | null;
  searchValue: string;
  filterOpen: boolean;
  onSearch: (value: string) => void;
  onSelect: (id: number) => void;
  onFilterOpen: (open: boolean) => void;
}) {
  return (
    <div className="relative p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button className="rounded-lg border border-app-border bg-white px-4 py-2 font-bold">
          Responses
        </button>
        <button className="rounded-lg bg-[#efedef] px-4 py-2 font-bold text-app-muted">
          Spam [0]
        </button>
        <div className="flex h-10 min-w-[260px] items-center gap-2 rounded-lg border border-app-border bg-white px-3">
          <Search size={17} className="text-app-muted" />
          <input
            value={searchValue}
            onChange={(event) => onSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none"
            placeholder="Search responses"
          />
        </div>
        <SmallControl icon={<CalendarDays size={16} />}>All time</SmallControl>
        <button
          onClick={() => onFilterOpen(true)}
          className="flex h-10 items-center gap-2 rounded-lg border border-app-border bg-white px-4 font-semibold text-app-muted"
        >
          <Filter size={16} />
          Filters
        </button>
        <div className="ml-auto flex items-center gap-2">
          <IconControl icon={<SlidersHorizontal size={16} />} />
          <IconControl icon={<Download size={16} />} />
          <button className="h-10 rounded-lg border border-app-border bg-white px-4 font-bold text-app-muted">
            Generate test response
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl bg-white shadow-soft">
        <table className="min-w-[1100px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-app-border text-sm text-app-muted">
              <th className="w-12 px-4 py-3">
                <input type="checkbox" className="h-5 w-5 rounded border-app-border" />
              </th>
              <th className="min-w-[170px] px-4 py-3">Response time</th>
              <th className="min-w-[150px] px-4 py-3">Response type</th>
              {results.questions.map((question) => (
                <th key={question.id} className="min-w-[210px] px-4 py-3">
                  <span className="line-clamp-2">{question.title}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr
                key={response.id}
                onClick={() => onSelect(response.id)}
                className={[
                  "cursor-pointer border-b border-app-border last:border-b-0",
                  selectedResponseId === response.id ? "bg-[#f4f2f5]" : "hover:bg-[#fafafa]"
                ].join(" ")}
              >
                <td className="px-4 py-4">
                  <input type="checkbox" className="h-5 w-5 rounded border-app-border" />
                </td>
                <td className="px-4 py-4 text-app-muted">{formatResultDate(response.submitted_at)}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full border border-[#cce9c9] bg-[#f4fff2] px-3 py-1 text-sm font-semibold text-[#35763c]">
                    Completed
                  </span>
                </td>
                {results.questions.map((question) => (
                  <td key={question.id} className="max-w-[280px] px-4 py-4 align-top text-app-text">
                    <ExpandableCell value={findAnswer(response, question.id)?.value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filterOpen ? (
        <FilterModal
          results={results}
          onClose={() => onFilterOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ExpandableCell({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const text = formatResultValue(value);
  const isLong = text.length > 90;
  const shown = !isLong || expanded ? text : `${text.slice(0, 90).trim()}...`;

  return (
    <div>
      <span className="whitespace-pre-wrap">{shown}</span>
      {isLong ? (
        <button
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
          className="ml-1 font-bold text-app-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

function FilterModal({ results, onClose }: { results: FormResults; onClose: () => void }) {
  const choiceQuestion =
    results.summaries[0] ??
    results.questions.find((question) => question.options.length);
  return (
    <div className="absolute left-1/2 top-16 z-30 w-[620px] -translate-x-1/2 rounded-2xl border border-app-border bg-white p-5 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-bold text-app-text">Filter responses</h3>
        <button onClick={onClose} className="icon-button">
          <X size={18} />
        </button>
      </div>
      <div className="rounded-xl bg-[#f6f5f6] p-6">
        <div className="rounded-xl bg-white p-5">
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-app-border px-3 py-2">
            <QuestionBadge type={choiceQuestion?.type ?? "multiple_choice"} number={3} />
            <span className="min-w-0 flex-1 truncate">
              {choiceQuestion?.title ?? "Choose a question"}
            </span>
            <ChevronDown size={16} />
          </div>
          <div className="flex gap-3">
            <button className="rounded-lg border border-app-border px-3 py-2">Is any of</button>
            <button className="flex-1 rounded-lg border border-app-border px-3 py-2 text-left">
              {Object.keys(choiceQuestion?.counts ?? {})[0] ?? "Select answer"}
            </button>
          </div>
          <button className="mt-5 flex items-center gap-2 font-semibold text-app-muted">
            <Plus size={16} />
            Add filter
          </button>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <button className="font-semibold text-app-muted">Clear all</button>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 font-semibold text-app-muted">
            Cancel
          </button>
          <button onClick={onClose} className="rounded-lg bg-app-primary px-5 py-2 font-bold text-white">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultsFilters() {
  return (
    <div className="flex flex-wrap gap-3">
      <SmallControl icon={<CalendarDays size={16} />}>All time</SmallControl>
      <SmallControl icon={<Monitor size={16} />}>All devices</SmallControl>
    </div>
  );
}

function SmallControl({
  children,
  icon
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button className="flex h-10 items-center gap-2 rounded-lg border border-app-border bg-white px-4 font-semibold text-app-muted shadow-sm">
      {icon}
      {children}
      <ChevronDown size={15} />
    </button>
  );
}

function IconControl({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={[
        "flex h-9 w-9 items-center justify-center rounded-lg border border-app-border",
        active ? "bg-white text-app-text shadow-sm" : "bg-[#f6f5f6] text-app-muted"
      ].join(" ")}
    >
      {icon}
    </button>
  );
}

function QuestionBadge({ type, number }: { type: string; number: number }) {
  const Icon = questionIcon(type as QuestionType);
  return (
    <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-[#e7dcff] px-2 text-xs font-bold text-app-primary">
      <Icon size={15} />
      <span className="ml-1">{number}</span>
    </span>
  );
}

function SlidersHorizontalIcon() {
  return <SlidersHorizontal size={16} />;
}

function findAnswer(response: ResultResponse, questionId: number) {
  return response.answers.find((answer) => answer.question_id === questionId);
}

function formatResultValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatResultDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function ShareModal({
  open,
  title,
  url,
  onClose,
  onCopied
}: {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
  onCopied: () => void;
}) {
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    onCopied();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#2f2633]/28 px-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[480px] rounded-2xl border border-app-border bg-white p-6 shadow-[0_24px_80px_rgba(47,38,51,0.24)]"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9fbf6] text-app-teal">
                  <Check size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-app-text">Shared form</h2>
                  <p className="mt-1 text-sm font-medium text-app-muted">
                    {title} is live and ready to send.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="icon-button shrink-0"
                aria-label="Close share modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl border border-app-border bg-[#f7f7f8] p-3">
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-app-muted">
                <Link2 size={14} />
                Public link
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-app-border bg-white px-3 text-sm font-semibold text-app-text outline-none"
                  aria-label="Published form link"
                />
                <button
                  onClick={copyLink}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-app-primary px-4 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CopyToast({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="fixed right-6 top-6 z-[110] flex items-center gap-3 rounded-xl border border-[#bfe4dc] bg-white px-4 py-3 font-bold text-app-text shadow-[0_16px_50px_rgba(47,38,51,0.18)]"
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.18 }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9fbf6] text-app-teal">
            <Check size={16} />
          </span>
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Toolbar({
  onOpenContent,
  onOpenDesign,
  onOpenPreview
}: {
  onOpenContent: () => void;
  onOpenDesign: () => void;
  onOpenPreview: () => void;
}) {
  const toolbarActions = [
    { icon: Smartphone, label: "Mobile preview" },
    { icon: Play, label: "Live preview", onClick: onOpenPreview },
    { icon: CircleHelp, label: "Help" },
    { icon: Languages, label: "Language" },
    { icon: Settings, label: "Settings" }
  ];

  return (
    <div className="mb-5 flex h-[58px] items-center rounded-xl bg-[#f6f5f6] px-3">
      <button
        onClick={onOpenContent}
        className="mr-5 flex h-10 items-center gap-2 rounded-lg bg-app-primary px-5 text-[15px] font-normal text-white"
      >
        <Plus size={18} />
        Add content
      </button>
      <button
        onClick={onOpenDesign}
        className="flex h-10 items-center gap-2 rounded-lg px-4 text-[15px] font-semibold text-app-muted hover:bg-white"
      >
        <Palette size={18} />
        Design
      </button>
      <div className="mx-3 h-7 w-px bg-app-border" />
      {toolbarActions.map(({ icon: Icon, label, onClick }) => (
        <button
          key={label}
          className="icon-button mx-1"
          onClick={onClick}
          aria-label={label}
        >
          <Icon size={18} />
        </button>
      ))}
      <button className="icon-button ml-auto">
        <PanelRight size={18} />
      </button>
    </div>
  );
}

function LeftPanel({
  questions,
  endings,
  selectedId,
  selectedEndingId,
  onSelect,
  onEnding,
  onCreatePage,
  onCreateEnding,
  onDeleteQuestion,
  onDragEnd,
  sensors,
  onOpenContent
}: {
  questions: Question[];
  endings: Ending[];
  selectedId: string;
  selectedEndingId: string | null;
  onSelect: (id: string) => void;
  onEnding: (id: string) => void;
  onCreatePage: () => void;
  onCreateEnding: () => void;
  onDeleteQuestion: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
  onOpenContent: () => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col gap-5 overflow-hidden">
      <button className="flex h-[58px] items-center justify-between rounded-xl bg-[#f6f5f6] px-5 text-[16px]">
        <span className="flex items-center gap-3">
          <Rows3 size={20} />
          Universal mode
        </span>
        <ChevronDown size={18} />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-[#f6f5f6] p-5 scrollbar-subtle">
        <h2 className="mb-8 text-lg font-normal">Pages</h2>
        <DndContext
          id="builder-top-level-questions"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={questions.map((question) => question.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {questions.map((question) =>
                question.type === "group" ? (
                  <SortableGroupCard
                    key={question.id}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    question={question}
                    onDeleteQuestion={onDeleteQuestion}
                    onDragEnd={onDragEnd}
                    sensors={sensors}
                    onOpenContent={onOpenContent}
                  />
                ) : (
                  <SortableQuestionCard
                    key={question.id}
                    question={question}
                    selected={selectedId === question.id && !selectedEndingId}
                    onClick={() => onSelect(question.id)}
                    onDelete={() => onDeleteQuestion(question.id)}
                  />
                )
              )}
            </div>
          </SortableContext>
        </DndContext>
        <button
          className="mt-4 flex h-[60px] w-full items-center justify-between rounded-xl border border-dashed border-app-border bg-white px-4 font-bold text-app-muted"
          onClick={onCreatePage}
        >
          <span className="flex items-center gap-3">
            <WandSparkles size={18} />
            Create new page
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border">
            <Plus size={18} />
          </span>
        </button>
        <div className="mx-auto my-4 h-1 w-12 rounded-full bg-app-primary" />
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-normal">Endings</h2>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-app-border bg-white"
              onClick={onCreateEnding}
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-2">
            {endings.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onEnding(item.id)}
                className={[
                  "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-app-muted",
                  selectedEndingId === item.id ? "bg-[#e9e8ea]" : "bg-white/60"
                ].join(" ")}
              >
                <span className="flex h-8 w-14 shrink-0 items-center justify-center gap-2 rounded-md bg-[#e2e0e4] font-bold text-app-text">
                  <PanelRight size={15} />
                  {item.letter}
                </span>
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>
      <AiPrompt compact />
    </aside>
  );
}

function GroupCard({
  question,
  selectedId,
  onSelect,
  onDeleteQuestion,
  onDragEnd,
  sensors,
  dragHandle,
  onOpenContent
}: {
  question: Question;
  selectedId: string;
  onSelect: (id: string) => void;
  onDeleteQuestion: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
  dragHandle?: React.ReactNode;
  onOpenContent: () => void;
}) {
  return (
    <div className="rounded-xl border border-app-border bg-[#fafafa] p-2">
      <div
        className={[
          "flex h-[62px] w-full items-center gap-2 rounded-lg px-2",
          selectedId === question.id ? "bg-[#e9e8ea]" : ""
        ].join(" ")}
      >
        {dragHandle}
        <button
          onClick={() => onSelect(question.id)}
          className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-left"
        >
          <span className="flex h-8 w-[66px] items-center justify-center rounded-md bg-[#e7e5e8] font-bold">
            {question.number}
          </span>
          <span className="block min-w-0 flex-1 truncate whitespace-nowrap font-medium">
            {question.title}
          </span>
        </button>
        <MoreHorizontal size={18} className="text-app-muted" />
      </div>
      <DndContext
        id={`builder-group-${question.id}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={(question.children ?? []).map((child) => child.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="mt-2 space-y-2 border-b border-app-border pb-2">
            {question.children?.map((child) => (
              <SortableQuestionCard
                key={child.id}
                question={child}
                selected={selectedId === child.id}
                onClick={() => onSelect(child.id)}
                onDelete={() => onDeleteQuestion(child.id)}
                compact
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={onOpenContent}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg border-t border-app-border text-[15px] font-normal text-app-muted"
      >
        <Plus size={18} />
        Add content
      </button>
    </div>
  );
}

function SortableGroupCard({
  question,
  selectedId,
  onSelect,
  onDeleteQuestion,
  onDragEnd,
  sensors,
  onOpenContent
}: {
  question: Question;
  selectedId: string;
  onSelect: (id: string) => void;
  onDeleteQuestion: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
  onOpenContent: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: question.id });

  return (
    <div
      ref={setNodeRef}
      className="w-full min-w-0"
      style={{
        transform: CSS.Translate.toString(transform),
        transition
      }}
    >
      <GroupCard
        question={question}
        selectedId={selectedId}
        onSelect={onSelect}
        onDeleteQuestion={onDeleteQuestion}
        onDragEnd={onDragEnd}
        sensors={sensors}
        onOpenContent={onOpenContent}
        dragHandle={
          <button
            className="cursor-grab text-app-muted active:cursor-grabbing"
            aria-label={`Reorder ${question.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
        }
      />
    </div>
  );
}

function QuestionCard({
  question,
  selected,
  onClick,
  onDelete,
  dragHandle,
  compact = false
}: {
  question: Question;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
  dragHandle?: React.ReactNode;
  compact?: boolean;
}) {
  const Icon = questionIcon(question.type);
  return (
    <div
      className={[
        "group flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg transition hover:bg-[#eeecef]",
        compact
          ? "min-h-12 px-2"
          : "min-h-[72px] border border-app-border bg-white px-3",
        selected ? "bg-[#e9e8ea]" : ""
      ].join(" ")}
    >
      {dragHandle}
      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-left"
      >
      <span
        className={[
          "flex h-8 w-[66px] shrink-0 items-center justify-center gap-2 rounded-md font-bold",
          question.color
        ].join(" ")}
      >
        <Icon size={16} />
        {question.number}
      </span>
      <span className="block min-w-0 flex-1 truncate whitespace-nowrap text-[15px]">
        {question.title}
      </span>
      </button>
      <button
        className="icon-button h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onDelete}
        aria-label={`Delete ${question.title}`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function SortableQuestionCard({
  question,
  selected,
  onClick,
  onDelete,
  compact = false
}: {
  question: Question;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: question.id });

  return (
    <div
      ref={setNodeRef}
      className="w-full min-w-0"
      style={{
        transform: CSS.Translate.toString(transform),
        transition
      }}
    >
      <QuestionCard
        question={question}
        selected={selected}
        onClick={onClick}
        onDelete={onDelete}
        compact={compact}
        dragHandle={
          <button
            className="cursor-grab text-app-muted active:cursor-grabbing"
            aria-label={`Reorder ${question.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
        }
      />
    </div>
  );
}

function Canvas({
  question,
  ending,
  onUpdateQuestion,
  onUpdateChoice,
  onAddChoice,
  onUpdateEnding
}: {
  question: Question | undefined;
  ending: Ending | null;
  onUpdateQuestion: (id: string, patch: Partial<Question>) => void;
  onUpdateChoice: (id: string, index: number, value: string) => void;
  onAddChoice: (id: string) => void;
  onUpdateEnding: (id: string, patch: Partial<Ending>) => void;
}) {
  return (
    <div className="flex h-[calc(100%-78px)] items-center justify-center overflow-auto">
      <div className="relative flex h-[70vh] min-h-[520px] w-full max-w-[1160px] items-center justify-center border border-app-border bg-white">
        {ending ? (
          <EndingCanvas ending={ending} onUpdateEnding={onUpdateEnding} />
        ) : question ? (
          <QuestionCanvas
            question={question}
            onUpdateQuestion={onUpdateQuestion}
            onUpdateChoice={onUpdateChoice}
            onAddChoice={onAddChoice}
          />
        ) : (
          <div className="text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-app-muted">
              Start from scratch
            </p>
            <h2 className="text-[32px] text-app-text">Choose your first form element</h2>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCanvas({
  question,
  onUpdateQuestion,
  onUpdateChoice,
  onAddChoice
}: {
  question: Question;
  onUpdateQuestion: (id: string, patch: Partial<Question>) => void;
  onUpdateChoice: (id: string, index: number, value: string) => void;
  onAddChoice: (id: string) => void;
}) {
  const [editingChoices, setEditingChoices] = useState(false);
  const [choiceDraft, setChoiceDraft] = useState(
    (question.choices ?? []).join("\n")
  );

  function saveChoiceDraft() {
    const choices = choiceDraft
      .split("\n")
      .map((choice) => choice.trim())
      .filter(Boolean);
    onUpdateQuestion(question.id, { choices });
    setEditingChoices(false);
  }

  if (question.type === "dropdown") {
    return (
      <div className="w-[760px]">
        <Title
          number={question.number}
          title={requiredTitle(question)}
          onTitleChange={(title) =>
            onUpdateQuestion(question.id, { title: stripRequiredMark(title) })
          }
        />
        <EditableText
          className="mb-9 block w-full bg-transparent text-xl italic text-app-muted outline-none"
          value={question.description ?? "Description (optional)"}
          onChange={(description) => onUpdateQuestion(question.id, { description })}
        />
        <div className="flex items-end gap-4">
          <div className="min-w-0 flex-1 border-b border-[#8a858d] pb-3">
            <span className="text-[28px] text-[#aaa5ad]">
              Type or select an option
            </span>
          </div>
          <ChevronDown size={26} className="mb-3 text-[#9c96a0]" />
        </div>
        <div className="mt-3 flex items-center justify-between text-[15px] text-app-muted">
          <button
            className="border-b border-app-muted"
            onClick={() => {
              setChoiceDraft((question.choices ?? []).join("\n"));
              setEditingChoices(true);
            }}
          >
            Edit choices
          </button>
          <span>{question.choices?.length ?? 0} options in list</span>
        </div>
        {editingChoices ? (
          <EditChoicesModal
            value={choiceDraft}
            onChange={setChoiceDraft}
            onCancel={() => setEditingChoices(false)}
            onSave={saveChoiceDraft}
          />
        ) : null}
      </div>
    );
  }

  if (question.type === "yes_no") {
    return (
      <div className="w-[760px]">
        <Title
          number={question.number}
          title={requiredTitle(question)}
          onTitleChange={(title) =>
            onUpdateQuestion(question.id, { title: stripRequiredMark(title) })
          }
        />
        <EditableText
          className="mb-8 block w-full bg-transparent text-xl italic text-app-muted outline-none"
          value={question.description ?? "Description (optional)"}
          onChange={(description) => onUpdateQuestion(question.id, { description })}
        />
        <div className="space-y-2">
          {(question.choices ?? ["Yes", "No"]).slice(0, 2).map((choice, index) => (
            <div
              key={`${question.id}-${index}`}
              className="flex h-11 w-[235px] items-center gap-3 rounded-lg bg-[#ecebed] px-3 text-xl text-app-muted"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded border border-app-border bg-white text-sm font-bold text-app-text">
                {index === 0 ? "Y" : "N"}
              </span>
              <EditableText
                className="min-w-0 flex-1 bg-transparent outline-none"
                value={choice}
                onChange={(value) => onUpdateChoice(question.id, index, value)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "rating") {
    const count = question.ratingCount ?? question.choices?.length ?? 3;
    return (
      <div className="w-[760px]">
        <Title
          number={question.number}
          title={requiredTitle(question)}
          onTitleChange={(title) =>
            onUpdateQuestion(question.id, { title: stripRequiredMark(title) })
          }
        />
        <EditableText
          className="mb-8 block w-full bg-transparent text-xl italic text-app-muted outline-none"
          value={question.description ?? "Description (optional)"}
          onChange={(description) => onUpdateQuestion(question.id, { description })}
        />
        <div className="flex gap-6">
          {Array.from({ length: count }, (_, index) => (
            <div key={index} className="text-center text-app-muted">
              <Star size={54} strokeWidth={1.7} className="mb-4" />
              <span className="text-[16px]">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (
    question.type === "multiple_choice"
  ) {
    return (
      <div className="w-[620px]">
        <Title
          number={question.number}
          title={requiredTitle(question)}
          onTitleChange={(title) =>
            onUpdateQuestion(question.id, { title: stripRequiredMark(title) })
          }
        />
        <EditableText
          className="mb-8 block w-full bg-transparent text-xl italic text-app-muted outline-none"
          value={question.description ?? "Description (optional)"}
          onChange={(description) => onUpdateQuestion(question.id, { description })}
        />
        <div className="space-y-3">
          {question.choices?.map((choice, index) => (
            <div
              key={`${question.id}-${index}`}
              className="flex h-11 w-[250px] items-center gap-3 rounded-lg bg-[#ecebed] px-3 text-xl text-app-muted"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded border border-app-border bg-white text-sm font-bold text-app-text">
                {String.fromCharCode(65 + index)}
              </span>
              <EditableText
                className="min-w-0 flex-1 bg-transparent outline-none"
                value={choice}
                onChange={(value) => onUpdateChoice(question.id, index, value)}
              />
            </div>
          ))}
        </div>
        <button
          className="mt-8 border-b border-app-text text-[16px] text-app-muted"
          onClick={() => onAddChoice(question.id)}
        >
          Add choice
        </button>
      </div>
    );
  }
  if (
    question.type === "short_text" ||
    question.type === "long_text" ||
    question.type === "email" ||
    question.type === "number"
  ) {
    return (
      <div className="w-[760px]">
        <div className="mb-10 opacity-20">
          <Title number="1" title="Your details*" />
        </div>
        <Field
          label={requiredTitle(question)}
          placeholder={question.placeholder ?? ""}
          onLabelChange={(title) =>
            onUpdateQuestion(question.id, { title: stripRequiredMark(title) })
          }
          onPlaceholderChange={(placeholder) =>
            onUpdateQuestion(question.id, { placeholder })
          }
        />
      </div>
    );
  }
  if (question.type === "phone") {
    return (
      <div className="w-[760px]">
        <div className="mb-10 opacity-20">
          <Title number="1" title="Your details*" />
        </div>
        <EditableText
          className="mb-5 block w-full bg-transparent text-lg outline-none"
          value={requiredTitle(question)}
          onChange={(title) =>
            onUpdateQuestion(question.id, { title: stripRequiredMark(title) })
          }
        />
        <div className="flex items-center border-b border-[#8a858d] pb-3">
          <div className="mr-4 flex items-center gap-2">
            {phoneCountries.map((country) => (
              <button
                key={country.code}
                title={country.label}
                className={[
                  "flex h-9 items-center gap-1 rounded-md border px-2 text-sm",
                  question.phoneCountry === country.code
                    ? "border-app-primary bg-[#ecebed]"
                    : "border-app-border bg-white"
                ].join(" ")}
                onClick={() =>
                  onUpdateQuestion(question.id, { phoneCountry: country.code })
                }
              >
                <span>{country.flag}</span>
                <span>{country.code}</span>
              </button>
            ))}
          </div>
          <input
            className="min-w-0 flex-1 bg-transparent text-[28px] text-[#aaa5ad] outline-none"
            value={question.phoneValue ?? ""}
            placeholder="10 digit phone number"
            maxLength={10}
            inputMode="numeric"
            onChange={(event) =>
              onUpdateQuestion(question.id, {
                phoneValue: digitsOnly(event.target.value)
              })
            }
          />
        </div>
        <p className="mt-3 text-sm text-app-muted">
          {question.phoneValue?.length ?? 0}/10 digits
        </p>
      </div>
    );
  }
  if (question.type === "statement" || question.type === "welcome") {
    return (
      <div className="w-[760px] text-center">
        <Title
          number={question.number}
          title={requiredTitle(question)}
          onTitleChange={(title) =>
            onUpdateQuestion(question.id, { title: stripRequiredMark(title) })
          }
        />
        <EditableText
          className="mx-auto mt-8 block max-w-[680px] bg-transparent text-center text-xl leading-7 text-app-muted outline-none"
          value={question.description ?? "Add supporting text here."}
          onChange={(description) => onUpdateQuestion(question.id, { description })}
          multiline
        />
      </div>
    );
  }
  return (
    <div className="w-[760px]">
      <Title
        number="1"
        title={requiredTitle(question)}
        onTitleChange={(title) =>
          onUpdateQuestion(question.id, { title: stripRequiredMark(title) })
        }
      />
      <EditableText
        className="mb-10 block w-full bg-transparent text-xl italic text-app-muted outline-none"
        value={question.description ?? "Description (optional)"}
        onChange={(description) => onUpdateQuestion(question.id, { description })}
      />
      {question.children?.map((child) => (
        <Field
          key={child.id}
          label={requiredTitle(child)}
          placeholder={child.placeholder ?? ""}
          onLabelChange={(title) =>
            onUpdateQuestion(child.id, { title: stripRequiredMark(title) })
          }
          onPlaceholderChange={(placeholder) =>
            onUpdateQuestion(child.id, { placeholder })
          }
        />
      ))}
    </div>
  );
}

function Title({
  number,
  title,
  onTitleChange
}: {
  number: string;
  title: string;
  onTitleChange?: (title: string) => void;
}) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-app-primary text-sm font-bold text-white">
        {number}
      </span>
      <EditableText
        className="min-w-0 flex-1 bg-transparent text-[32px] outline-none"
        value={title}
        onChange={(value) => onTitleChange?.(value)}
        as="input"
      />
    </div>
  );
}

function Field({
  label,
  placeholder,
  onLabelChange,
  onPlaceholderChange
}: {
  label: string;
  placeholder: string;
  onLabelChange?: (label: string) => void;
  onPlaceholderChange?: (placeholder: string) => void;
}) {
  return (
    <div className="mb-10">
      <EditableText
        className="mb-5 block w-full bg-transparent text-lg outline-none"
        value={label}
        onChange={(value) => onLabelChange?.(value)}
      />
      <EditableText
        className="block w-full border-b border-[#8a858d] bg-transparent pb-3 text-[28px] text-[#aaa5ad] outline-none focus:border-app-primary"
        value={placeholder}
        onChange={(value) => onPlaceholderChange?.(value)}
      />
    </div>
  );
}

function EditChoicesModal({
  value,
  onChange,
  onCancel,
  onSave
}: {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
      <div className="w-[430px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-[22px]">Edit choices</h3>
          <button className="icon-button" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-5">
          <p className="mb-4 text-[15px] leading-6 text-app-muted">
            Write or paste your choices below. Each choice must be on a separate
            line.
          </p>
          <textarea
            className="h-[138px] w-full resize-none rounded-xl border border-[#6f6872] p-3 text-[15px] leading-6 outline-none"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-4 rounded-b-xl bg-[#f7f7f8] px-6 py-4">
          <button className="font-bold text-app-muted" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="rounded-lg bg-app-primary px-5 py-2.5 font-bold text-white"
            onClick={onSave}
          >
            Save choices
          </button>
        </div>
      </div>
    </div>
  );
}

function EndingCanvas({
  ending,
  onUpdateEnding
}: {
  ending: Ending;
  onUpdateEnding: (id: string, patch: Partial<Ending>) => void;
}) {
  return (
    <div className="w-full max-w-[940px] px-8 text-center">
      <EditableText
        className="mb-4 block w-full bg-transparent text-center text-[32px] outline-none"
        value={ending.title}
        onChange={(title) => onUpdateEnding(ending.id, { title })}
      />
      <EditableText
        className="mx-auto mb-8 block min-h-[84px] w-full max-w-[900px] bg-transparent text-center text-xl leading-7 text-app-muted outline-none"
        value={ending.description}
        onChange={(description) => onUpdateEnding(ending.id, { description })}
        multiline
      />
      <EditableText
        className="mx-auto block rounded-lg bg-app-primary px-6 py-3 text-center text-lg font-bold text-white outline-none"
        value={ending.buttonText}
        onChange={(buttonText) => onUpdateEnding(ending.id, { buttonText })}
      />
    </div>
  );
}

function RightSettings({
  question,
  ending,
  onUpdateQuestion,
  onUpdateEnding
}: {
  question: Question | undefined;
  ending: Ending | null;
  onUpdateQuestion: (id: string, patch: Partial<Question>) => void;
  onUpdateEnding: (id: string, patch: Partial<Ending>) => void;
}) {
  if (!question && !ending) {
    return (
      <aside className="min-h-0 overflow-y-auto rounded-xl bg-[#f6f5f6] p-5 text-app-muted scrollbar-subtle">
        <div className="rounded-xl bg-white/70 p-5">
          Pick an element to create the first page.
        </div>
      </aside>
    );
  }

  const Icon = ending ? PanelRight : questionIcon(question!.type);
  const title = ending ? "End Screen" : questionTypeLabel(question!.type);

  return (
    <aside className="min-h-0 overflow-y-auto rounded-xl bg-[#f6f5f6] p-5 scrollbar-subtle">
      <div className="mb-6 flex h-10 items-center justify-between rounded-lg border border-app-border bg-white px-3">
        <span className="flex items-center gap-3 text-[16px]">
          <span
            className={[
              "flex h-7 w-8 items-center justify-center rounded-md",
              ending ? "bg-[#e7e5e8]" : question!.color
            ].join(" ")}
          >
            <Icon size={16} />
          </span>
          {title}
        </span>
        <ChevronDown size={18} />
      </div>
      {ending ? (
        <EndingSettings ending={ending} onUpdateEnding={onUpdateEnding} />
      ) : (
        <QuestionSettings question={question!} onUpdateQuestion={onUpdateQuestion} />
      )}
      <SettingsBlock title="Logic" plus />
      <SettingsBlock title="Comments" gem />
    </aside>
  );
}

function QuestionSettings({
  question,
  onUpdateQuestion
}: {
  question: Question;
  onUpdateQuestion: (id: string, patch: Partial<Question>) => void;
}) {
  if (question.type === "group") {
    return (
      <>
        <SettingsBlock title="Question">
          <div className="grid grid-cols-2 rounded-lg bg-[#ecebed] p-1">
            <button className="rounded-md bg-white px-4 py-2 font-semibold">Text</button>
            <button className="px-4 py-2 font-semibold text-app-muted">Video</button>
          </div>
        </SettingsBlock>
        <SettingsBlock title="Answer">
          <SettingsRow label="Image or video" />
        </SettingsBlock>
      </>
    );
  }
  const hasPlaceholder =
    question.type === "short_text" ||
    question.type === "long_text" ||
    question.type === "email" ||
    question.type === "number";

  return (
    <SettingsBlock title="">
      <Toggle label="Map to contacts" />
      <Toggle
        label="Required"
        enabled={question.required !== false}
        onChange={(required) => onUpdateQuestion(question.id, { required })}
      />
      {question.type === "short_text" ? (
        <>
          <Toggle
            label="Max characters"
            enabled={!!question.maxCharactersEnabled}
            onChange={(maxCharactersEnabled) =>
              onUpdateQuestion(question.id, { maxCharactersEnabled })
            }
          />
          {question.maxCharactersEnabled ? (
            <label className="block border-b border-app-border py-4 text-sm font-bold text-app-muted">
              Character limit
              <input
                className="mt-2 h-10 w-full rounded-lg border border-app-border bg-white px-3 text-base font-normal text-app-text outline-none"
                min={1}
                type="number"
                value={question.maxCharacters ?? 100}
                onChange={(event) =>
                  onUpdateQuestion(question.id, {
                    maxCharacters: Math.max(1, Number(event.target.value) || 1)
                  })
                }
              />
            </label>
          ) : null}
        </>
      ) : null}
      <Toggle
        label="Answer validation"
        enabled={!!question.validationEnabled}
        onChange={(validationEnabled) =>
          onUpdateQuestion(question.id, { validationEnabled })
        }
      />
      {question.type === "rating" ? (
        <div className="grid grid-cols-2 gap-3 border-b border-app-border py-4">
          {[3, 5].map((count) => (
            <button
              key={count}
              className={[
                "h-10 rounded-lg border text-sm font-bold",
                (question.ratingCount ?? 3) === count
                  ? "border-app-primary bg-white text-app-text"
                  : "border-app-border bg-[#f7f7f8] text-app-muted"
              ].join(" ")}
              onClick={() =>
                onUpdateQuestion(question.id, {
                  ratingCount: count,
                  choices: Array.from({ length: count }, (_, index) =>
                    String(index + 1)
                  )
                })
              }
            >
              {count} stars
            </button>
          ))}
        </div>
      ) : null}
      {question.type === "phone" ? (
        <div className="border-b border-app-border py-4 text-sm leading-6 text-app-muted">
          Phone input is limited to 10 digits. Country selector supports India,
          US, UK, Australia, and UAE.
        </div>
      ) : null}
      {hasPlaceholder ? (
        <>
          <Toggle label="Custom placeholder text" enabled />
          <input
            className="mt-4 h-11 w-full rounded-lg border border-app-border bg-white px-4 outline-none"
            value={question.placeholder ?? "Your answer"}
            onChange={(event) =>
              onUpdateQuestion(question.id, { placeholder: event.target.value })
            }
          />
        </>
      ) : null}
    </SettingsBlock>
  );
}

function EndingSettings({
  ending,
  onUpdateEnding
}: {
  ending: Ending;
  onUpdateEnding: (id: string, patch: Partial<Ending>) => void;
}) {
  return (
    <>
      <SettingsBlock title="Button">
        <Toggle label="" enabled />
        <div className="mt-4 grid grid-cols-2 rounded-lg bg-[#ecebed] p-1">
          <button className="rounded-md bg-white px-4 py-2 font-semibold">Page</button>
          <button className="px-4 py-2 font-semibold text-app-muted">URL</button>
        </div>
        <div className="mt-5 rounded-lg border border-dashed border-app-border bg-white p-4">
          <p className="mb-2 font-bold">Typeform Pages</p>
          <p className="text-sm leading-5 text-app-muted">
            Link your button to a Typeform Page.
          </p>
          <input
            className="mt-4 h-10 w-full rounded-lg border border-app-border px-3 outline-none"
            value={ending.buttonText}
            onChange={(event) =>
              onUpdateEnding(ending.id, { buttonText: event.target.value })
            }
          />
        </div>
      </SettingsBlock>
      <SettingsBlock title="Social share icons">
        <Toggle label="" />
      </SettingsBlock>
      <SettingsBlock title="Image or video">
        <div className="flex gap-3 text-app-muted">
          <Image size={18} />
          <Settings size={18} />
          <X size={18} />
        </div>
      </SettingsBlock>
      <SettingsBlock title="Layout">
        <div className="space-y-3 text-app-muted">
          <div className="flex items-center justify-between">
            Mobile <Smartphone size={18} />
          </div>
          <div className="flex items-center justify-between">
            Desktop <Monitor size={18} />
          </div>
        </div>
      </SettingsBlock>
    </>
  );
}

function SettingsBlock({
  title,
  children,
  plus,
  gem
}: {
  title: string;
  children?: React.ReactNode;
  plus?: boolean;
  gem?: boolean;
}) {
  return (
    <section className="mb-4 rounded-xl bg-white/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        {title ? <h3 className="text-[17px] font-bold">{title}</h3> : <span />}
        {plus ? (
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-app-border bg-white">
            <Plus size={20} />
          </button>
        ) : null}
        {gem ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8ed6cb] bg-[#e8fbf8] text-app-teal">
            <Gem size={15} />
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SettingsRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-app-border py-4">
      <span className="font-bold">{label}</span>
      <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-app-border bg-white">
        <Plus size={20} />
      </button>
    </div>
  );
}

function Toggle({
  label,
  enabled = false,
  onChange
}: {
  label: string;
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-app-border py-4">
      {label ? <span className="text-[16px]">{label}</span> : <span />}
      <button
        type="button"
        aria-pressed={enabled}
        aria-label={label || "Toggle setting"}
        onClick={() => onChange?.(!enabled)}
        className={[
          "flex h-5 w-9 items-center rounded-full p-0.5",
          enabled ? "justify-end bg-[#6f6273]" : "justify-start bg-[#e0dde2]"
        ].join(" ")}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}

function ContentModal({
  tab,
  onTab,
  onClose,
  onAddElement
}: {
  tab: "elements" | "import" | "ai";
  onTab: (tab: "elements" | "import" | "ai") => void;
  onClose: () => void;
  onAddElement: (label: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2e2933]/70 p-6">
      <div className="h-[690px] w-full max-w-[960px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-app-border px-10">
          <div className="flex h-full gap-9 font-bold text-app-muted">
            {[
              ["elements", "Add form elements"],
              ["import", "Import questions"],
              ["ai", "Create with AI"]
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => onTab(key as "elements" | "import" | "ai")}
                className={["relative h-full", tab === key ? "text-app-text" : ""].join(" ")}
              >
                {label}
                {tab === key ? (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-app-primary" />
                ) : null}
              </button>
            ))}
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {tab === "elements" ? <ElementsTab onAddElement={onAddElement} /> : null}
        {tab === "import" ? <ImportTab /> : null}
        {tab === "ai" ? <AiTab /> : null}
      </div>
    </div>
  );
}

function ElementsTab({
  onAddElement
}: {
  onAddElement: (label: string) => void;
}) {
  return (
    <div className="grid h-[636px] grid-cols-[230px_1fr] gap-10 p-8">
      <aside>
        <div className="mb-8 flex h-9 items-center gap-2 rounded-lg border border-app-border px-3 text-app-muted">
          <Search size={16} />
          Search form elements
        </div>
        <p className="mb-3 font-bold text-app-muted">Recommended</p>
        <button
          className="mb-4 flex h-10 w-full items-center gap-3 rounded-lg border border-app-border px-3 text-app-muted"
          onClick={() => onAddElement("Welcome Screen")}
        >
          <PanelRight size={17} />
          Welcome Screen
        </button>
        <p className="mb-3 font-bold text-app-muted">Connect to apps</p>
        {["Hubspot", "Salesforce", "Browse all apps"].map((app) => (
          <button
            key={app}
            className="mb-1 flex h-10 w-full items-center gap-3 rounded-lg border border-app-border px-3 text-app-muted"
          >
            <Plus size={17} />
            {app}
          </button>
        ))}
      </aside>
      <div className="grid grid-cols-3 gap-x-12 gap-y-7 overflow-y-auto pr-3 scrollbar-subtle">
        {elementGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 font-bold text-app-text">{group.title}</h3>
            <div className="space-y-4">
              {group.items.map(([label, Icon, color]) => (
                <button
                  key={label}
                  onClick={() => onAddElement(label)}
                  className="flex items-center gap-3 text-left text-[15px] text-app-muted hover:text-app-text"
                >
                  <span
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded-md text-app-text",
                      color
                    ].join(" ")}
                  >
                    <Icon size={16} />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportTab() {
  return (
    <div className="grid h-[636px] grid-cols-[1fr_240px] gap-8 p-8">
      <div>
        <label className="mb-3 block text-[15px] text-app-muted">
          Form questions
        </label>
        <textarea
          className="h-[390px] w-full resize-none rounded-xl border border-app-border p-4 text-[15px] outline-none"
          placeholder="Copy and paste or type in your questions, and press enter after each one."
        />
      </div>
      <aside className="pt-11">
        <div className="rounded-lg border border-[#95c7ff] bg-[#fbfdff] p-5 text-app-muted">
          <CircleHelp size={22} className="mb-4 text-[#2c7bd0]" />
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-6">
            <li>Paste or type your questions in the text field</li>
            <li>Or try Create with AI to build your form from a description</li>
          </ul>
        </div>
        <button className="mt-8 h-10 w-full rounded-lg border border-app-border font-bold text-app-muted">
          Create with AI
        </button>
      </aside>
      <div className="col-span-2 flex justify-end border-t border-app-border pt-4">
        <button className="rounded-lg bg-[#efeff0] px-6 py-2.5 font-bold text-[#b8b1bc]">
          Import questions
        </button>
      </div>
    </div>
  );
}

function AiTab() {
  return (
    <div className="flex h-[636px] items-center justify-center bg-[#f7f7f8]">
      <div className="w-full max-w-[500px]">
        <h2 className="mb-6 text-center text-2xl">What would you like to create?</h2>
        <div className="rounded-xl border border-[#c48ddc] bg-white p-3 shadow-focus">
          <textarea className="h-32 w-full resize-none outline-none" />
          <div className="flex items-center justify-between text-app-muted">
            <div className="flex gap-4">
              <Mic size={18} />
              <Plus size={18} />
              <MoreHorizontal size={18} />
            </div>
            <SendHorizontal size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DesignOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="pointer-events-auto absolute left-[28%] top-[122px] h-[690px] w-[690px] overflow-hidden rounded-xl border border-app-border bg-white shadow-2xl">
        <div className="flex h-16 items-center justify-between px-8">
          <div className="flex items-center gap-4 text-xl font-bold">
            <GripVertical size={18} className="text-app-muted" />
            Design
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="mx-4 h-[610px] overflow-y-auto rounded-xl bg-[#f6f5f6] px-6 py-5 scrollbar-subtle">
          <div className="mb-6 flex gap-8 text-lg font-bold text-app-muted">
            <button>My themes</button>
            <button className="relative text-app-text">
              Gallery
              <span className="absolute -bottom-3 left-0 right-0 h-[3px] rounded-full bg-app-primary" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {themes.map(([name, bg, text, accent]) => (
              <button
                key={name}
                className="overflow-hidden rounded-xl border border-app-border bg-white text-left shadow-soft hover:border-app-primary"
              >
                <div className="h-[138px] p-6" style={{ background: bg, color: text }}>
                  <p className="text-lg font-bold">Question</p>
                  <p className="text-lg">Answer</p>
                  <div className="mt-5 h-6 w-14 rounded" style={{ background: accent }} />
                </div>
                <div className="flex h-16 items-center justify-between px-5 text-lg font-bold">
                  {name}
                  <MoreHorizontal size={18} className="text-app-muted" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
