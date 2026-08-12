"use client";

import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Mail, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, Loader2, ShieldCheck, Zap,
  MapPin, Phone, User, Calendar, Camera, BookOpen,
  Pencil, Languages, Tag, X, Briefcase, GraduationCap,
  Award, ChevronDown, Droplets, Hammer,
  Brush, Flame, Car, Sparkles, Snowflake, Smartphone,
  Laptop, Scissors, Leaf, BrickWall, Search,
  FileText, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { uploadWorkerDocuments } from "@/services/storageService";
import { saveWorkerProfile } from "@/services/firestoreService";
import { createWorkerTrialSubscription } from "@/services/monetizationService";
import { WorkerDoc } from "@/types/firestore";

const steps = [
  { number: 1, label: "Personal Information" },
  { number: 2, label: "Professional Details" },
  { number: 3, label: "Verification & Documents" },
  { number: 4, label: "Availability & Service Area" },
  { number: 5, label: "Review & Submit" },
];

const PROFESSIONS = [
  "Electrician", "Plumber", "Carpenter", "Painter", "Welder",
  "Mason", "Driver", "House Cleaner", "AC Repair",
  "Mobile Repair", "Computer Repair", "Gardener", "Tailor",
];

const PROFESSION_ICONS: Record<string, ReactNode> = {
  Electrician: <Zap className="w-5 h-5 text-warning" />,
  Plumber: <Droplets className="w-5 h-5 text-primary" />,
  Carpenter: <Hammer className="w-5 h-5 text-amber-600" />,
  Painter: <Brush className="w-5 h-5 text-purple-600" />,
  Welder: <Flame className="w-5 h-5 text-orange-600" />,
  Mason: <BrickWall className="w-5 h-5 text-slate-600" />,
  Driver: <Car className="w-5 h-5 text-blue-600" />,
  "House Cleaner": <Sparkles className="w-5 h-5 text-green-600" />,
  "AC Repair": <Snowflake className="w-5 h-5 text-cyan-600" />,
  "Mobile Repair": <Smartphone className="w-5 h-5 text-indigo-600" />,
  "Computer Repair": <Laptop className="w-5 h-5 text-gray-600" />,
  Gardener: <Leaf className="w-5 h-5 text-emerald-600" />,
  Tailor: <Scissors className="w-5 h-5 text-pink-600" />,
};

const SKILLS_BY_PROFESSION: Record<string, string[]> = {
  Electrician: ["House Wiring", "MCB Installation"],
  Plumber: ["Pipe Fitting", "Water Heater"],
  Carpenter: ["Furniture Making", "Kitchen Installation"],
  Painter: ["Interior Painting", "Exterior Painting"],
  Welder: ["MIG Welding", "TIG Welding"],
  "AC Repair": ["Split AC", "Window AC"],
  Mechanic: ["Car Repair", "Bike Repair"],
  Mason: ["Brick Work", "Plastering"],
  "House Cleaner": ["Home Cleaning", "Office Cleaning"],
  Driver: ["Local Driving", "Long Distance"],
  Gardener: ["Lawn Care", "Pruning"],
  Tailor: ["Stitching", "Alterations"],
  "Mobile Repair": ["Screen Replacement", "Battery Replacement"],
  "Computer Repair": ["Hardware Repair", "Software Installation"],
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

type Gender = "" | "male" | "female" | "other";

type UploadCardProps = {
  label: string;
  icon: ReactNode;
  file: File | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemove: () => void;
  required?: boolean;
};

function UploadCard({ label, icon, file, onUpload, onDrop, onRemove, required }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onDrop(e);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const isImage = file?.type.startsWith("image/");
  const fileName = file?.name || "";
  const fileSize = file ? (file.size / 1024 / 1024).toFixed(1) + "MB" : "";

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
        isDragging ? "border-primary bg-primary-50 dark:bg-primary-950" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input type="file" ref={inputRef} accept="image/*,application/pdf" onChange={onUpload} className="hidden" />
      {file ? (
        <div className="flex flex-col items-center gap-3">
          {isImage ? (
            <Image src={URL.createObjectURL(file)} alt="preview" width={64} height={64} className="w-16 h-16 object-cover rounded-lg" />
          ) : (
            <FileText className="w-12 h-12 text-primary" />
          )}
          <div>
            <p className="font-medium text-sm text-text">{fileName}</p>
            <p className="text-xs text-text-muted">{fileSize}</p>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute top-2 right-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-danger transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {icon}
          <div>
            <span className="font-medium text-sm text-text">{label}</span>
            {required && <span className="text-danger"> *</span>}
          </div>
          <p className="text-xs text-text-muted">Drag & drop or click to upload</p>
          <p className="text-xs text-text-muted">Max size: 5MB (JPG, PNG, PDF)</p>
        </div>
      )}
    </div>
  );
}

export default function BecomeWorkerPage() {
  const loadFromDraft = <T,>(key: string, fallback: T): T => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("kaamwalaWorkerDraft");
        if (saved) {
          const data = JSON.parse(saved);
          if (data[key]) return { ...fallback, ...data[key] };
        }
      } catch {}
    }
    return fallback;
  };

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [step1Data, setStep1Data] = useState(() =>
    loadFromDraft("step1Data", {
      fullName: "",
      mobile: "",
      email: "",
      gender: "" as Gender,
      dob: "",
      address: "",
      state: "",
      city: "",
      pinCode: "",
      profilePhoto: "",
    })
  );
  const [step2Data, setStep2Data] = useState(() =>
    loadFromDraft("step2Data", {
      profession: "",
      experience: "",
      education: "",
      hourlyRate: 0,
      minVisitCharge: 0,
      skills: [] as string[],
      languages: [] as string[],
      about: "",
    })
  );
  const [step3Data, setStep3Data] = useState({
    aadhaar: null as File | null,
    pan: null as File | null,
    profilePhoto: null as File | null,
    experienceCert: null as File | null,
    policeVerification: null as File | null,
  });
  const [step4Data, setStep4Data] = useState(() =>
    loadFromDraft("step4Data", {
      state: "",
      city: "",
      pinCode: "",
      serviceRadius: 10,
      availableDays: [] as string[],
      workingHours: { start: "09:00", end: "18:00" },
      emergencyService: false,
      homeVisit: true,
    })
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [professionSearch, setProfessionSearch] = useState("");
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success">("error");
  const { user } = useAuth();

  const professionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (professionDropdownRef.current && !professionDropdownRef.current.contains(event.target as Node)) {
        setShowProfessionDropdown(false);
        setProfessionSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProfessions = PROFESSIONS.filter((prof) =>
    prof.toLowerCase().includes(professionSearch.toLowerCase())
  );

  const toggleSkill = (skill: string) => {
    setStep2Data((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setStep2Data((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!step2Data.profession) errors.profession = "Primary profession is required";
    if (!step2Data.experience) errors.experience = "Years of experience is required";
    if (!step2Data.hourlyRate || step2Data.hourlyRate <= 0) errors.hourlyRate = "Hourly rate is required";
    if (step2Data.about.length > 0 && step2Data.about.length < 20)
      errors.about = "About must be at least 20 characters";
    return errors;
  };

  const step2Errors = touched.step2 ? validateStep2() : {};

  const isStep2Valid =
    !!step2Data.profession &&
    !!step2Data.experience &&
    step2Data.hourlyRate > 0 &&
    (step2Data.about.length === 0 || step2Data.about.length >= 20);

  const mobileRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pinRegex = /^\d{6}$/;

  const step1Errors = touched.step1
    ? {
        fullName: step1Data.fullName.trim() ? "" : "Full name is required",
        mobile: mobileRegex.test(step1Data.mobile) ? "" : "Enter a valid mobile number",
        email: emailRegex.test(step1Data.email) ? "" : "Enter a valid email address",
        gender: step1Data.gender ? "" : "Please select a gender",
        dob: step1Data.dob ? "" : "Date of birth is required",
        address: step1Data.address.trim() ? "" : "Address is required",
        state: step1Data.state ? "" : "Please select a state",
        city: step1Data.city.trim() ? "" : "City is required",
        pinCode: pinRegex.test(step1Data.pinCode) ? "" : "Enter a valid 6-digit PIN code",
      }
    : {};

  const isStep1Valid =
    !!step1Data.fullName.trim() &&
    mobileRegex.test(step1Data.mobile) &&
    emailRegex.test(step1Data.email) &&
    !!step1Data.gender &&
    !!step1Data.dob &&
    !!step1Data.address.trim() &&
    !!step1Data.state &&
    !!step1Data.city.trim() &&
    pinRegex.test(step1Data.pinCode);

  const handleNext = () => {
    if (currentStep === 1) {
      setTouched((prev) => ({ ...prev, step1: true }));
      if (!isStep1Valid) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setTouched((prev) => ({ ...prev, step2: true }));
      if (!isStep2Valid) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setTouched((prev) => ({ ...prev, step3: true }));
      if (!step3Valid()) return;
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setTouched((prev) => ({ ...prev, step4: true }));
      if (!step4Valid()) return;
      setCurrentStep(5);
    }
  };

  const handleSubmit = async () => {
    if (currentStep === 5) {
      if (!step3Valid() || !step4Valid()) return;
      if (!user) {
        setToastMessage("Please log in to continue.");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      setIsLoading(true);

      const documentsToUpload = {
        aadhaar: step3Data.aadhaar,
        pan: step3Data.pan,
        profilePhoto: step3Data.profilePhoto,
        experienceCert: step3Data.experienceCert,
        policeVerification: step3Data.policeVerification,
      };

      const { urls, error: uploadError } = await uploadWorkerDocuments(user.uid, documentsToUpload);

      if (uploadError) {
        setIsLoading(false);
        setToastMessage(uploadError);
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }

      const workerDoc: Omit<WorkerDoc, "createdAt" | "updatedAt"> = {
        uid: user.uid,
        email: step1Data.email,
        name: step1Data.fullName,
        phone: step1Data.mobile,
        photoURL: urls.profilePhoto,
        role: "worker",

        personalInfo: {
          fullName: step1Data.fullName,
          email: step1Data.email,
          phone: step1Data.mobile,
          address: step1Data.address,
        },

        professionalInfo: {
          profession: step2Data.profession,
          experience: parseInt(step2Data.experience, 10) || 0,
          hourlyRate: step2Data.hourlyRate || 0,
          minVisitCharge: step2Data.minVisitCharge || 0,
          description: step2Data.about,
          skills: step2Data.skills,
          languages: step2Data.languages,
          category: step2Data.profession,
        },

        documents: {
          ...(urls.aadhaar ? { aadhaar: { url: urls.aadhaar, uploadedAt: new Date() } } : {}),
          ...(urls.pan ? { pan: { url: urls.pan, uploadedAt: new Date() } } : {}),
          ...(urls.profilePhoto ? { profilePhoto: { url: urls.profilePhoto, uploadedAt: new Date() } } : {}),
          ...(urls.experienceCert ? { experienceCert: { url: urls.experienceCert, uploadedAt: new Date() } } : {}),
          ...(urls.policeVerification ? { policeVerification: { url: urls.policeVerification, uploadedAt: new Date() } } : {}),
        },

        availability: {
          serviceRadius: step4Data.serviceRadius,
          availableDays: step4Data.availableDays,
          workingHours: step4Data.workingHours,
          emergencyService: step4Data.emergencyService,
          homeVisit: step4Data.homeVisit,
        },

        serviceArea: {
          state: step4Data.state,
          city: step4Data.city,
          pincode: step4Data.pinCode,
          area: step4Data.city,
        },

        verificationStatus: "pending",
        rating: 0,
        reviewCount: 0,
        reviews: [],
        isAvailable: step4Data.availableDays.length > 0,
        isVerified: false,
        joinedDate: new Date().toISOString(),
      };

      const { error: saveError } = await saveWorkerProfile(workerDoc);

      if (saveError) {
        setIsLoading(false);
        setToastMessage(saveError);
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }

      const { error: trialError } = await createWorkerTrialSubscription(user.uid);
      if (trialError) {
        console.error("Failed to create trial subscription:", trialError);
      }

      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveDraft = () => {
    setIsDraftSaved(true);
    const allData = { step1Data, step2Data, step3Data: { aadhaar: step3Data.aadhaar?.name, pan: step3Data.pan?.name, profilePhoto: step3Data.profilePhoto?.name, experienceCert: step3Data.experienceCert?.name, policeVerification: step3Data.policeVerification?.name }, step4Data };
    localStorage.setItem("kaamwalaWorkerDraft", JSON.stringify(allData));
    setTimeout(() => setIsDraftSaved(false), 2000);
  };

  const handleFileUpload = (field: keyof typeof step3Data) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";
    if (!isImage && !isPDF) {
      alert("Only images and PDF files are allowed");
      return;
    }
    setStep3Data((prev) => ({ ...prev, [field]: file }));
  };

  const handleRemoveFile = (field: keyof typeof step3Data) => {
    setStep3Data((prev) => ({ ...prev, [field]: null }));
  };

  const handleDrop = (field: keyof typeof step3Data) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";
    if (!isImage && !isPDF) {
      alert("Only images and PDF files are allowed");
      return;
    }
     setStep3Data((prev) => ({ ...prev, [field]: file }));
  };

  const toggleDay = (day: string) => {
    setStep4Data((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day) ? prev.availableDays.filter((d) => d !== day) : [...prev.availableDays, day],
    }));
  };

  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const step3Valid = () => {
    return !!step3Data.aadhaar && !!step3Data.profilePhoto;
  };

  const step4Valid = () => {
    return step4Data.availableDays.length > 0 && step4Data.state !== "" && step4Data.city !== "" && /^\d{6}$/.test(step4Data.pinCode);
  };

  const maxAboutLength = 500;
  const aboutCharCount = step2Data.about.length;

  const professionSkills = SKILLS_BY_PROFESSION[step2Data.profession] ?? [];

  const isCurrentStep = (n: number) => currentStep === n;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (professionDropdownRef.current && !professionDropdownRef.current.contains(event.target as Node)) {
        setShowProfessionDropdown(false);
        setProfessionSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-2xl shadow-black/10 p-10 text-center max-w-md w-full mx-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-2xl font-bold font-heading text-text mb-3">
            Profile Submitted Successfully!
          </h1>

          <p className="text-text-secondary text-sm mb-6">
            We&apos;ll verify your profile within 24 hours.
          </p>

          <div className="flex flex-col gap-3">
            <Button variant="primary" className="w-full" leftIcon={<User className="w-4 h-4" />} onClick={() => {}}>
              Go to Dashboard
            </Button>
            <Button variant="outline" className="w-full" leftIcon={<BookOpen className="w-4 h-4" />} onClick={() => {}}>
              View Profile
            </Button>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary-700 to-primary-900 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col justify-center px-12 max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
                <BookOpen className="w-8 h-8 text-white" fill="white" />
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold font-heading text-white mb-4 leading-tight">
                {currentStep === 1 ? "Personal Information" : currentStep === 2 ? "Professional Details" : currentStep === 3 ? "Verification & Documents" : currentStep === 4 ? "Availability & Service Area" : "Review & Submit"}
              </h1>

              <p className="text-lg text-primary-100 max-w-md mb-8 leading-relaxed">
                Tell us about your profession, experience, and skills to get started.
              </p>

              <div className="space-y-4">
                {[
                  { icon: <Tag className="w-5 h-5" />, text: "Select your profession", color: "bg-success/20 text-success" },
                  { icon: <Zap className="w-5 h-5" />, text: "Add your skills", color: "bg-warning/20 text-warning" },
                  { icon: <Pencil className="w-5 h-5" />, text: "Write a professional summary", color: "bg-primary-50 text-primary" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm"
                  >
                    <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", item.color)}>
                      {item.icon}
                    </span>
                    <span className="text-sm text-white/90">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-lg"
          >
            <div className="lg:hidden mb-6 text-center">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/25">
                <BookOpen className="w-7 h-7 text-white" fill="white" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-text">
                {currentStep === 1 ? "Personal Information" : currentStep === 2 ? "Professional Details" : currentStep === 3 ? "Verification & Documents" : currentStep === 4 ? "Availability & Service Area" : "Review & Submit"}
              </h1>
              <p className="text-text-secondary text-sm mt-1.5">Step {currentStep} of {steps.length}</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-2xl shadow-black/10 p-6 sm:p-8"
            >
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold font-heading text-text">Step {currentStep}: {currentStep === 1 ? "Personal Information" : "Professional Details"}</h2>
                  <span className="text-sm text-text-muted">{currentStep} / {steps.length}</span>
                </div>
                <div className="flex items-center justify-between mb-6">
                  {steps.map((step, i) => (
                    <div key={step.number} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                          currentStep === step.number
                            ? "border-primary bg-primary text-white"
                            : currentStep > step.number
                              ? "border-success bg-success text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-text-muted"
                        )}>
                          {currentStep > step.number ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                        </div>
                        <span className={cn(
                          "text-[10px] mt-1.5 whitespace-nowrap hidden sm:block",
                          currentStep === step.number ? "text-primary font-semibold" : "text-text-muted"
                        )}>{step.label}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={cn(
                          "flex-1 h-0.5 mx-2 rounded-full transition-all duration-300",
                          currentStep > step.number ? "bg-success" : "bg-slate-200 dark:bg-slate-700"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isCurrentStep(1) && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="space-y-5">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-text mb-2">Full Name <span className="text-danger">*</span></label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                        <input id="fullName" type="text" value={step1Data.fullName} onChange={(e) => setStep1Data((prev) => ({ ...prev, fullName: e.target.value }))} onBlur={() => setTouched((prev) => ({ ...prev, step1: true }))} placeholder="Enter your full name" className={cn("w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted", step1Errors.fullName ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                      </div>
                      <AnimatePresence>
                        {step1Errors.fullName && (<motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step1Errors.fullName}</motion.p>)}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label htmlFor="mobile" className="block text-sm font-medium text-text mb-2">Mobile Number <span className="text-danger">*</span></label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                        <input id="mobile" type="tel" value={step1Data.mobile} onChange={(e) => setStep1Data((prev) => ({ ...prev, mobile: e.target.value }))} onBlur={() => setTouched((prev) => ({ ...prev, step1: true }))} placeholder="e.g. +91 98765 43210" className={cn("w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted", step1Errors.mobile ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                      </div>
                      <AnimatePresence>
                        {step1Errors.mobile && (<motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step1Errors.mobile}</motion.p>)}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text mb-2">Email Address <span className="text-danger">*</span></label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                        <input id="email" type="email" value={step1Data.email} onChange={(e) => setStep1Data((prev) => ({ ...prev, email: e.target.value }))} onBlur={() => setTouched((prev) => ({ ...prev, step1: true }))} placeholder="you@example.com" className={cn("w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted", step1Errors.email ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                      </div>
                      <AnimatePresence>
                        {step1Errors.email && (<motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step1Errors.email}</motion.p>)}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Gender <span className="text-danger">*</span></label>
                      <div className="grid grid-cols-3 gap-2">
                        {["male", "female", "other"].map((g) => (
                          <button key={g} type="button" onClick={() => { setStep1Data((prev) => ({ ...prev, gender: g as Gender })); setTouched((prev) => ({ ...prev, step1: true })); }} className={cn("flex flex-col items-center gap-1.5 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40", step1Data.gender === g ? "border-primary bg-primary-50 dark:bg-primary-950 text-primary" : "border-slate-200 dark:border-slate-700 text-text-muted hover:border-slate-300 dark:hover:border-slate-600")}>
                            <User className={cn("w-5 h-5", step1Data.gender === g ? "text-primary" : "text-text-muted")} />
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </button>
                        ))}
                      </div>
                      <AnimatePresence>
                        {step1Errors.gender && (<motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step1Errors.gender}</motion.p>)}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label htmlFor="dob" className="block text-sm font-medium text-text mb-2">Date of Birth <span className="text-danger">*</span></label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                        <input id="dob" type="date" value={step1Data.dob} onChange={(e) => setStep1Data((prev) => ({ ...prev, dob: e.target.value }))} onBlur={() => setTouched((prev) => ({ ...prev, step1: true }))} className={cn("w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm", step1Errors.dob ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                      </div>
                      <AnimatePresence>
                        {step1Errors.dob && (<motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step1Errors.dob}</motion.p>)}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-text mb-2">Current Address <span className="text-danger">*</span></label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                        <textarea id="address" value={step1Data.address} onChange={(e) => setStep1Data((prev) => ({ ...prev, address: e.target.value }))} onBlur={() => setTouched((prev) => ({ ...prev, step1: true }))} placeholder="Enter your current full address" rows={3} className={cn("w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted", step1Errors.address ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                      </div>
                      <AnimatePresence>
                        {step1Errors.address && (<motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step1Errors.address}</motion.p>)}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-text mb-2">State <span className="text-danger">*</span></label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                          <select id="state" value={step1Data.state} onChange={(e) => setStep1Data((prev) => ({ ...prev, state: e.target.value }))} onBlur={() => setTouched((prev) => ({ ...prev, step1: true }))} className={cn("w-full pl-11 pr-9 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm", step1Errors.state ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")}
                            >
                            <option value="">Select state</option>
                            {INDIAN_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                        <AnimatePresence>
                          {step1Errors.state && (<motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step1Errors.state}</motion.p>)}
                        </AnimatePresence>
                      </div>

                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-text mb-2">City <span className="text-danger">*</span></label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                          <input id="city" type="text" value={step1Data.city} onChange={(e) => setStep1Data((prev) => ({ ...prev, city: e.target.value }))} onBlur={() => setTouched((prev) => ({ ...prev, step1: true }))} placeholder="Enter city" className={cn("w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted", step1Errors.city ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                        </div>
                        <AnimatePresence>
                          {step1Errors.city && (<motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step1Errors.city}</motion.p>)}
                        </AnimatePresence>
                      </div>

                      <div>
                        <label htmlFor="pinCode" className="block text-sm font-medium text-text mb-2">PIN Code <span className="text-danger">*</span></label>
                        <div className="relative group">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                          <input id="pinCode" type="text" maxLength={6} value={step1Data.pinCode} onChange={(e) => setStep1Data((prev) => ({ ...prev, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} onBlur={() => setTouched((prev) => ({ ...prev, step1: true }))} placeholder="6 digits" className={cn("w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted", step1Errors.pinCode ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                        </div>
                        <AnimatePresence>
                          {step1Errors.pinCode && (<motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step1Errors.pinCode}</motion.p>)}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isCurrentStep(2) && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
                  <div>
                    <label htmlFor="profession" className="block text-sm font-medium text-text mb-2">Primary Profession <span className="text-danger">*</span></label>
                    <div className="relative group" ref={professionDropdownRef}>
                      <button type="button" id="profession" onClick={() => setShowProfessionDropdown(!showProfessionDropdown)} className={cn("w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm", step2Errors.profession ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")}>
                        <span className={cn("flex items-center gap-2", !step2Data.profession && "text-text-muted")}>
                          {step2Data.profession ? PROFESSION_ICONS[step2Data.profession] : <Briefcase className="w-5 h-5 text-text-muted" />}
                          {step2Data.profession || "Select your profession"}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform duration-200", showProfessionDropdown && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {showProfessionDropdown && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-64 overflow-hidden">
                            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input type="text" placeholder="Search professions..." value={professionSearch} onChange={(e) => setProfessionSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-text placeholder:text-text-muted" autoFocus />
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-48">
                              {filteredProfessions.length > 0 ? (
                                filteredProfessions.map((prof) => (
                                  <button key={prof} type="button" onClick={() => { setStep2Data((prev) => ({ ...prev, profession: prof, skills: [] })); setShowProfessionDropdown(false); setProfessionSearch(""); setTouched((prev) => ({ ...prev, step2: true })); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors">
                                    {PROFESSION_ICONS[prof]}
                                    <span className="text-sm text-text">{prof}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-text-muted text-center">No profession found</div>
                )}

                {isCurrentStep(3) && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Aadhaar Card Upload <span className="text-danger">*</span></label>
                      <UploadCard label="Upload Aadhaar" icon={<FileText className="w-6 h-6 text-primary" />} file={step3Data.aadhaar} onUpload={handleFileUpload("aadhaar")} onDrop={handleDrop("aadhaar")} onRemove={() => handleRemoveFile("aadhaar")} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">PAN Card Upload <span className="text-text-muted">(Optional)</span></label>
                      <UploadCard label="Upload PAN Card" icon={<FileText className="w-6 h-6 text-secondary" />} file={step3Data.pan} onUpload={handleFileUpload("pan")} onDrop={handleDrop("pan")} onRemove={() => handleRemoveFile("pan")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Profile Photo Upload <span className="text-danger">*</span></label>
                      <UploadCard label="Upload Profile Photo" icon={<Camera className="w-6 h-6 text-success" />} file={step3Data.profilePhoto} onUpload={handleFileUpload("profilePhoto")} onDrop={handleDrop("profilePhoto")} onRemove={() => handleRemoveFile("profilePhoto")} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Experience Certificate Upload <span className="text-text-muted">(Optional)</span></label>
                      <UploadCard label="Upload Experience Certificate" icon={<Award className="w-6 h-6 text-warning" />} file={step3Data.experienceCert} onUpload={handleFileUpload("experienceCert")} onDrop={handleDrop("experienceCert")} onRemove={() => handleRemoveFile("experienceCert")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Police Verification Upload <span className="text-text-muted">(Optional)</span></label>
                      <UploadCard label="Upload Police Verification" icon={<ShieldCheck className="w-6 h-6 text-info" />} file={step3Data.policeVerification} onUpload={handleFileUpload("policeVerification")} onDrop={handleDrop("policeVerification")} onRemove={() => handleRemoveFile("policeVerification")} />
                    </div>
                  </motion.div>
                )}

                {isCurrentStep(4) && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="step4-state" className="block text-sm font-medium text-text mb-2">State <span className="text-danger">*</span></label>
                        <div className="relative group">
                          <select id="step4-state" value={step4Data.state} onChange={(e) => setStep4Data((prev) => ({ ...prev, state: e.target.value }))} className={cn("w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm", touched.step4 && !step4Data.state ? "border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")}>
                            <option value="">Select state</option>
                            {INDIAN_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="step4-city" className="block text-sm font-medium text-text mb-2">City <span className="text-danger">*</span></label>
                        <input id="step4-city" type="text" value={step4Data.city} onChange={(e) => setStep4Data((prev) => ({ ...prev, city: e.target.value }))} placeholder="Enter city" className={cn("w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted", touched.step4 && !step4Data.city ? "border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                      </div>
                      <div>
                        <label htmlFor="step4-pinCode" className="block text-sm font-medium text-text mb-2">PIN Code <span className="text-danger">*</span></label>
                        <input id="step4-pinCode" type="text" maxLength={6} value={step4Data.pinCode} onChange={(e) => setStep4Data((prev) => ({ ...prev, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="6 digits" className={cn("w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted", touched.step4 && !/^\d{6}$/.test(step4Data.pinCode) ? "border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Service Radius: {step4Data.serviceRadius} km</label>
                      <input type="range" min="5" max="50" value={step4Data.serviceRadius} onChange={(e) => setStep4Data((prev) => ({ ...prev, serviceRadius: parseInt(e.target.value) }))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer slider" />
                      <div className="flex justify-between text-xs text-text-muted mt-1">
                        <span>5 km</span><span>50 km</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Available Days</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {WEEKDAYS.map((day) => (
                          <button key={day} type="button" onClick={() => toggleDay(day)} className={cn("py-2 px-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40", step4Data.availableDays.includes(day) ? "border-primary bg-primary-50 dark:bg-primary-950 text-primary" : "border-slate-200 dark:border-slate-700 text-text-muted hover:bg-slate-50 dark:hover:bg-slate-700")}>
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="work-start" className="block text-sm font-medium text-text mb-2">Working Hours Start</label>
                        <input id="work-start" type="time" value={step4Data.workingHours.start} onChange={(e) => setStep4Data((prev) => ({ ...prev, workingHours: { ...prev.workingHours, start: e.target.value } }))} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm text-text" />
                      </div>
                      <div>
                        <label htmlFor="work-end" className="block text-sm font-medium text-text mb-2">Working Hours End</label>
                        <input id="work-end" type="time" value={step4Data.workingHours.end} onChange={(e) => setStep4Data((prev) => ({ ...prev, workingHours: { ...prev.workingHours, end: e.target.value } }))} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm text-text" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-sm font-medium text-text">Emergency Service</span>
                        <p className="text-xs text-text-muted">Available for emergency calls</p>
                      </div>
                      <button type="button" onClick={() => setStep4Data((prev) => ({ ...prev, emergencyService: !prev.emergencyService }))} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", step4Data.emergencyService ? "bg-primary" : "bg-slate-300 dark:bg-slate-600")}>
                        <span className="sr-only">Emergency service</span>
                        <span className={cn("absolute inline-block w-5 h-5 transform rounded-full bg-white transition-transform", step4Data.emergencyService ? "translate-x-5" : "translate-x-1")}>
                          {step4Data.emergencyService ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-text-muted" />}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-sm font-medium text-text">Home Visit</span>
                        <p className="text-xs text-text-muted">Offer on-site service at customer location</p>
                      </div>
                      <button type="button" onClick={() => setStep4Data((prev) => ({ ...prev, homeVisit: !prev.homeVisit }))} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", step4Data.homeVisit ? "bg-primary" : "bg-slate-300 dark:bg-slate-600")}>
                        <span className="sr-only">Home visit</span>
                        <span className={cn("absolute inline-block w-5 h-5 transform rounded-full bg-white transition-transform", step4Data.homeVisit ? "translate-x-5" : "translate-x-1")}>
                          {step4Data.homeVisit ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-text-muted" />}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {isCurrentStep(5) && (
                  <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-text">Personal Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-text-muted">Name</span><span className="text-text font-medium">:</span> {step1Data.fullName}</div>
                        <div><span className="text-text-muted">Mobile</span><span className="text-text font-medium">:</span> {step1Data.mobile}</div>
                        <div><span className="text-text-muted">Email</span><span className="text-text font-medium">:</span> {step1Data.email}</div>
                        <div><span className="text-text-muted">Gender</span><span className="text-text font-medium">:</span> {step1Data.gender}</div>
                        <div><span className="text-text-muted">DOB</span><span className="text-text font-medium">:</span> {step1Data.dob}</div>
                        <div><span className="text-text-muted">State / City</span><span className="text-text font-medium">:</span> {step1Data.state} / {step1Data.city}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-text">Professional Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-text-muted">Profession</span><span className="text-text font-medium">:</span> {step2Data.profession}</div>
                        <div><span className="text-text-muted">Experience</span><span className="text-text font-medium">:</span> {step2Data.experience} years</div>
                        {step2Data.education && <div><span className="text-text-muted">Education</span><span className="text-text font-medium">:</span> {step2Data.education}</div>}
                        <div><span className="text-text-muted">Skills</span><span className="text-text font-medium">:</span> {step2Data.skills.join(", ") || "None selected"}</div>
                        <div><span className="text-text-muted">Languages</span><span className="text-text font-medium">:</span> {step2Data.languages.join(", ")}</div>
                        {step2Data.about && <div className="col-span-2"><span className="text-text-muted">About</span><span className="text-text font-medium">:</span> {step2Data.about}</div>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-text">Documents</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-text-muted">Aadhaar</span><span className="text-text font-medium">:</span> {step3Data.aadhaar?.name || "Not uploaded"}</div>
                        <div><span className="text-text-muted">PAN</span><span className="text-text font-medium">:</span> {step3Data.pan?.name || "Not uploaded"}</div>
                        <div><span className="text-text-muted">Profile Photo</span><span className="text-text font-medium">:</span> {step3Data.profilePhoto?.name || "Not uploaded"}</div>
                        <div><span className="text-text-muted">Experience Cert</span><span className="text-text font-medium">:</span> {step3Data.experienceCert?.name || "Not uploaded"}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-text">Service Area & Availability</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-text-muted">State</span><span className="text-text font-medium">:</span> {step4Data.state || "Not set"}</div>
                        <div><span className="text-text-muted">City</span><span className="text-text font-medium">:</span> {step4Data.city || "Not set"}</div>
                        <div><span className="text-text-muted">PIN Code</span><span className="text-text font-medium">:</span> {step4Data.pinCode || "Not set"}</div>
                        <div><span className="text-text-muted">Service Radius</span><span className="text-text font-medium">:</span> {step4Data.serviceRadius} km</div>
                        <div><span className="text-text-muted">Available Days</span><span className="text-text font-medium">:</span> {step4Data.availableDays.join(", ") || "None selected"}</div>
                        <div><span className="text-text-muted">Working Hours</span><span className="text-text font-medium">:</span> {step4Data.workingHours.start} - {step4Data.workingHours.end}</div>
                        <div><span className="text-text-muted">Emergency Service</span><span className="text-text font-medium">:</span> {step4Data.emergencyService ? "Yes" : "No"}</div>
                        <div><span className="text-text-muted">Home Visit</span><span className="text-text font-medium">:</span> {step4Data.homeVisit ? "Yes" : "No"}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <AnimatePresence>
                      {step2Errors.profession && (
                        <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step2Errors.profession}</motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-text mb-2">Years of Experience <span className="text-danger">*</span></label>
                    <div className="relative group">
                      <select id="experience" value={step2Data.experience} onChange={(e) => setStep2Data((prev) => ({ ...prev, experience: e.target.value }))} onBlur={() => setTouched((prev) => ({ ...prev, step2: true }))} className={cn("w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm", step2Errors.experience ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")}>
                        <option value="">Select experience</option>
                        <option value="0-1">0-1 years</option>
                        <option value="2-5">2-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    <AnimatePresence>
                      {step2Errors.experience && (
                        <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step2Errors.experience}</motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label htmlFor="education" className="block text-sm font-medium text-text mb-2">Education <span className="text-text-muted">(Optional)</span></label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                      <input id="education" type="text" value={step2Data.education} onChange={(e) => setStep2Data((prev) => ({ ...prev, education: e.target.value }))} placeholder="e.g. Diploma in Electrical Engineering" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-text text-sm placeholder:text-text-muted" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-text mb-2">Hourly Rate (₹) <span className="text-danger">*</span></label>
                    <div className="relative group">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                      <input
                        id="hourlyRate"
                        type="number"
                        min="0"
                        value={step2Data.hourlyRate || ""}
                        onChange={(e) => setStep2Data((prev) => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                        onBlur={() => setTouched((prev) => ({ ...prev, step2: true }))}
                        placeholder="e.g. 350"
                        className={cn("w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted", step2Errors.hourlyRate ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")}
                      />
                    </div>
                    <AnimatePresence>
                      {step2Errors.hourlyRate && (
                        <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step2Errors.hourlyRate}</motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label htmlFor="minVisitCharge" className="block text-sm font-medium text-text mb-2">Minimum Visit Charge (₹) <span className="text-text-muted">(Optional)</span></label>
                    <div className="relative group">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                      <input
                        id="minVisitCharge"
                        type="number"
                        min="0"
                        value={step2Data.minVisitCharge || ""}
                        onChange={(e) => setStep2Data((prev) => ({ ...prev, minVisitCharge: parseInt(e.target.value) || 0 }))}
                        placeholder="e.g. 200"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-text text-sm placeholder:text-text-muted"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Skills <span className="text-text-muted">(Select all that apply)</span></label>
                    <div className="relative">
                      <button type="button" onClick={() => setShowSkillPicker(!showSkillPicker)} className={cn("w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border text-left text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 flex items-center justify-between", step2Data.skills.length > 0 ? "border-primary/30 bg-primary-50 dark:bg-primary-950" : "border-slate-200 dark:border-slate-700")}>
                        <span className={cn(step2Data.skills.length === 0 && "text-text-muted")}>{step2Data.skills.length > 0 ? `${step2Data.skills.length} skill(s) selected` : "Select skills..."}</span>
                        <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform duration-200", showSkillPicker && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {showSkillPicker && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto scrollbar-hide">
                            {professionSkills.map((skill) => (
                              <label key={skill} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                <input type="checkbox" checked={step2Data.skills.includes(skill)} onChange={() => toggleSkill(skill)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/40" />
                                <span className="text-sm text-text">{skill}</span>
                              </label>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {step2Data.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {step2Data.skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-950 text-primary text-xs font-medium rounded-full">{skill}<button type="button" onClick={() => toggleSkill(skill)} className="hover:text-danger transition-colors"><X className="w-3 h-3" /></button></span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Languages <span className="text-text-muted">(Select all that apply)</span></label>
                    <div className="relative">
                      <button type="button" onClick={() => setShowLanguagePicker(!showLanguagePicker)} className={cn("w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border text-left text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 flex items-center justify-between", step2Data.languages.length > 0 ? "border-primary/30 bg-primary-50 dark:bg-primary-950" : "border-slate-200 dark:border-slate-700")}>
                        <span className={cn(step2Data.languages.length === 0 && "text-text-muted")}>{step2Data.languages.length > 0 ? `${step2Data.languages.length} language(s) selected` : "Select languages..."}</span>
                        <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform duration-200", showLanguagePicker && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {showLanguagePicker && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
                            {["Hindi", "English", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu", "Santali", "Other"].map((lang) => (
                              <label key={lang} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                <input type="checkbox" checked={step2Data.languages.includes(lang)} onChange={() => toggleLanguage(lang)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/40" />
                                <span className="text-sm text-text">{lang}</span>
                              </label>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {step2Data.languages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {step2Data.languages.map((lang) => (
                          <span key={lang} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-50 text-secondary text-xs font-medium rounded-full"><Languages className="w-3 h-3" />{lang}<button type="button" onClick={() => toggleLanguage(lang)} className="hover:text-danger transition-colors"><X className="w-3 h-3" /></button></span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="about" className="block text-sm font-medium text-text">About Yourself</label>
                      <span className={cn("text-xs font-medium", aboutCharCount < 20 && aboutCharCount > 0 ? "text-danger" : aboutCharCount >= 20 ? "text-success" : "text-text-muted")}>{aboutCharCount}/{maxAboutLength}{aboutCharCount > 0 && aboutCharCount < 20 && <span> {'-'} min 20 chars</span>}</span>
                    </div>
                    <textarea id="about" value={step2Data.about} onChange={(e) => setStep2Data((prev) => ({ ...prev, about: e.target.value.slice(0, maxAboutLength) }))} onBlur={() => setTouched((prev) => ({ ...prev, step2: true }))} placeholder="Write a brief professional summary describing your experience and expertise..." rows={4} className={cn("w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none", aboutCharCount > 0 && aboutCharCount < 20 ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary")} />
                    <AnimatePresence>
                      {step2Errors.about && (
                        <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden" role="alert"><AlertCircle className="w-3 h-3 flex-shrink-0" />{step2Errors.about}</motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={handleBack} disabled={currentStep === 1}>Back</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={handleSaveDraft}>{isDraftSaved ? "Draft Saved" : "Save Draft"}</Button>
                  {currentStep === 5 ? (
                    <Button type="button" variant="primary" className="flex-1" rightIcon={isLoading ? undefined : <ArrowRight className="w-4 h-4" />} onClick={handleSubmit} disabled={!(step3Valid() && step4Valid()) || isLoading}>
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving Profile...
                        </span>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                ) : (
                  <Button type="button" variant="primary" className="flex-1" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={handleNext} disabled={
                    (currentStep === 1 ? !isStep1Valid : currentStep === 2 ? !isStep2Valid : currentStep === 3 ? !step3Valid() : currentStep === 4 ? !step4Valid() : false) || isLoading
                  }>Next</Button>
                )}
              </div>

              <div className="mt-6 text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors duration-200">Already have an account? Login</Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`
         *:focus-visible { outline: 2px solid rgba(37, 99, 235, 0.5); outline-offset: 2px; border-radius: 4px; }
         select:focus-visible, textarea:focus-visible { outline: none; }
         .scrollbar-hide::-webkit-scrollbar { display: none; }
         .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
       `}</style>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            role="alert"
          >
            {toastType === "error" ? (
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
            )}
            <span className="text-text-secondary">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-2 text-text-muted hover:text-text transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}