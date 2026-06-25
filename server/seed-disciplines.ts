import { db } from "./db";
import { disciplines, categories, speakers } from "../shared/schema";
import { eq, isNull, or } from "drizzle-orm";

// Two-level taxonomy seed data: discipline -> its categories
const DISCIPLINE_DATA: { name: string; categories: string[] }[] = [
  {
    name: "Endodontics",
    categories: [
      "Public Health & Community Dentistry",
      "Wellness & Ergonomics",
      "Practice Management & Risk Mitigation",
      "Digital Workflows",
      "Dental Radiology & Imaging",
      "Infection Control & Safety",
      "Foundational / Core Science",
      "Microscope Dentistry",
      "Emerging Technologies",
      "Oral Pathology",
      "Dental Materials",
      "Dental Anatomy & Occlusion",
      "Technology & Innovation",
    ],
  },
  {
    name: "General Dentistry",
    categories: [
      "Public Health & Community Dentistry",
      "Medical Emergencies & Basic Life Support",
      "Dental Trauma Management",
      "Clinical Procedures",
      "Dental Radiology & Imaging",
      "Esthetic Procedures",
      "Implant Dentistry",
      "Laser Procedures",
      "Microscope Dentistry",
      "Minimally Invasive Procedures",
      "Oral Pathology",
      "Dental Materials",
      "Pain Management",
      "Anesthesia & Sedation",
      "Sleep Disorders",
    ],
  },
  {
    name: "Oral Surgery",
    categories: [
      "Core Clinical Oral Surgery",
      "Orthognathic & Craniofacial Surgery",
      "Trauma & Reconstruction",
      "Facial Aesthetics & Cosmetic Procedures",
      "Oral Pathology & Oncology",
      "Anesthesia & Sedation",
      "Implant Surgery & Bone/Tissue Regeneration",
      "Laser Procedures",
      "Medically Complex Patient Management",
      "Patient Care & Communication",
      "Interdisciplinary Treatment",
      "Emerging Technology",
      "Diagnosis, Prevention & Patient Care",
      "Regulatory & Compliance",
    ],
  },
  {
    name: "Periodontics",
    categories: [
      "Non-Surgical Periodontal Therapy",
      "Surgical Periodontics",
      "Hard & Soft Tissue Grafting",
      "Implant Dentistry (Perio-Implant Interface)",
      "Peri-implantitis",
      "Regenerative Periodontics",
      "Esthetic Periodontics",
      "Systemic Health & Periodontal Medicine",
      "Digital Dentistry & Workflows",
      "Laser Procedures",
      "Anesthesia & Sedation",
      "Practice Management & Clinical Efficiency",
      "Evidence-Based Periodontology",
      "Oral Pathology",
    ],
  },
  {
    name: "Orthodontics",
    categories: [
      "Aligner Therapy",
      "Diagnosis & Treatment Planning",
      "Digital Orthodontics & Technology",
      "Interdisciplinary Orthodontics",
      "Growth, Development & Orthodontic Concepts",
      "Esthetic Orthodontics",
      "Complications & Risk Management",
      "Evidence-Based Dentistry",
      "Foundational & Biological Sciences",
      "Practice Management & Ethics",
      "Professional Development & Career Advancement",
      "Wellness & Burnout Prevention",
    ],
  },
  {
    name: "Prosthodontics",
    categories: [
      "Fixed Prosthodontics & Restorative Techniques",
      "Removable Prosthodontics",
      "Implant Prosthodontics",
      "Full Mouth Rehabilitation & Complex Cases",
      "Esthetic Dentistry & Smile Design",
      "Digital Dentistry & CAD/CAM Technologies",
      "Dental Materials",
      "Occlusion & Temporomandibular Disorders",
      "Complications & Risk Management",
      "Practice Management & Economics",
      "Evidence-Based Dentistry & Research",
      "Oral Pathology",
    ],
  },
  {
    name: "Dental Laboratory – Technician",
    categories: [
      "Digital Technologies & CAD/CAM",
      "Materials Science & Biomaterials",
      "Esthetics & Smile Design",
      "Ceramic Layering & Finishing",
      "Implantology for Technicians",
      "Dentist–Technician Communication",
      "Laboratory Workflow & Case Management",
      "Quality Control & Fit Accuracy",
      "Regulatory & Compliance",
      "Professional Development",
    ],
  },
  {
    name: "Dental Hygiene",
    categories: [
      "Preventive Dentistry & Public Health",
      "Oral-Systemic Health Connections",
      "Infection Control & Patient Safety",
      "Periodontal Care",
      "Dental Radiology & Imaging",
      "Patient Care & Communication",
      "Pharmacology & Medical Considerations",
      "Special Populations & Niche Areas",
      "Practice Management & Clinical Efficiency",
      "Professional Development & Career Growth",
      "Ethics & Wellness",
    ],
  },
  {
    name: "Dental Assisting",
    categories: [
      "Clinical Procedures & Chairside Assisting",
      "Expanded Function",
      "Infection Control & Patient Safety",
      "Dental Radiology & Imaging",
      "Behavior Guidance & Patient Management",
      "Emergency & Trauma Care",
      "Pharmacology & Medical Considerations",
      "Regulatory & Compliance",
      "Office Culture & Practice Management",
      "Professional Development & Career Growth",
    ],
  },
  {
    name: "Miscellaneous",
    categories: [
      "Practice Management & Operations",
      "Dental Practice Entrepreneurship",
      "Office Culture & Leadership",
      "AI & Innovation",
      "Education",
      "Research & Evidence-Based Practice",
      "Wellness, Ergonomics & Burnout Prevention",
      "Ethics & Professional Responsibility",
      "Interdisciplinary & Systemic Topics",
    ],
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Idempotently seed the disciplines table and per-discipline categories.
 * Safe to run on every startup.
 */
export async function seedDisciplines(): Promise<void> {
  const existingDisciplines = await db.select().from(disciplines);
  const disciplineByName = new Map(existingDisciplines.map((d) => [d.name, d]));

  for (let i = 0; i < DISCIPLINE_DATA.length; i++) {
    const { name, categories: catNames } = DISCIPLINE_DATA[i];
    let discipline = disciplineByName.get(name);

    if (!discipline) {
      const inserted = await db
        .insert(disciplines)
        .values({ name, slug: slugify(name), description: null, sortOrder: i })
        .returning();
      discipline = inserted[0];
      disciplineByName.set(name, discipline);
    }

    // Seed categories for this discipline (idempotent by name + disciplineId)
    const existingCats = await db
      .select()
      .from(categories)
      .where(eq(categories.disciplineId, discipline.id));
    const existingCatNames = new Set(existingCats.map((c) => c.name));

    const toInsert = catNames
      .map((catName, idx) => ({ catName, idx }))
      .filter(({ catName }) => !existingCatNames.has(catName))
      .map(({ catName, idx }) => ({
        name: catName,
        description: "",
        disciplineId: discipline!.id,
        sortOrder: idx,
        speakerCount: 0,
      }));

    if (toInsert.length > 0) {
      await db.insert(categories).values(toInsert);
    }
  }

  console.log(`[seed-disciplines] Seeded ${DISCIPLINE_DATA.length} disciplines and their categories.`);
}

// Keyword rules for known legacy category strings.
// Keys are lowercased legacy values; values are substrings to match against
// new category names (case-insensitive).
const LEGACY_KEYWORDS: Record<string, string[]> = {
  "practice management": ["practice management"],
  "education & training": ["education"],
  "implant dentistry": ["implant"],
  "leadership": ["leadership"],
  "digital dentistry": ["digital"],
  "esthetic dentistry": ["esthetic"],
  "ai & innovation": ["ai &", "innovation"],
  "full arch rehabilitation": ["rehabilitation", "full mouth"],
  "technology & innovation": ["technology & innovation"],
  "anesthesia & sedation": ["anesthesia", "sedation"],
  "research": ["research", "evidence-based"],
  "bone grafting & regeneration": ["graft", "regenerat"],
};

// Words too common to use as fallback keywords when matching category names
const GENERIC_WORDS = new Set([
  "dental", "dentistry", "oral", "health", "patient", "clinical", "procedures",
  "care", "based", "management", "practice",
]);

/**
 * Auto-map existing speakers to a discipline based on their legacy `categories`
 * array.  Processes both NULL (never migrated) and "flagged" speakers, so
 * admins can click "Re-run Migration" and see the list shrink.
 *
 * Logic per speaker:
 *  1. If a legacy category string is a discipline name → vote for that discipline
 *  2. Otherwise match against new category rows via curated keywords or fallback
 *     word matching → collect category IDs + vote for each matched category's discipline
 *  3. Discipline with most votes wins.  Tie / no match → Miscellaneous.
 *  4. Write disciplineId, speakerCategoryIds, disciplineMigrationStatus="auto".
 */
export async function migrateSpeakerDisciplines(): Promise<void> {
  const allDisciplines = await db.select().from(disciplines);
  if (allDisciplines.length === 0) return;

  const allCategories = await db.select().from(categories);

  const disciplineByLowerName = new Map(
    allDisciplines.map((d) => [d.name.toLowerCase().trim(), d])
  );
  const miscDiscipline = allDisciplines.find((d) => d.name === "Miscellaneous");

  /** Return new category IDs that match a single legacy category string. */
  function matchCategoryIds(legacyCat: string): number[] {
    const lower = legacyCat.toLowerCase().trim();

    // 1. Curated keyword rules first — these intentionally capture all related
    //    categories across disciplines (e.g. "Implant Dentistry" → every
    //    implant-type category, not just the first exact name match).
    const keywords = LEGACY_KEYWORDS[lower];
    if (keywords) {
      return allCategories
        .filter((c) => keywords.some((kw) => c.name.toLowerCase().includes(kw)))
        .map((c) => c.id);
    }

    // 2. Exact match (for strings not in LEGACY_KEYWORDS)
    const exact = allCategories.find((c) => c.name.toLowerCase().trim() === lower);
    if (exact) return [exact.id];

    // 3. Fallback: use significant words from the legacy string
    const words = lower
      .split(/[\s&,/]+/)
      .filter((w) => w.length >= 5 && !GENERIC_WORDS.has(w));
    if (words.length > 0) {
      return allCategories
        .filter((c) => words.some((w) => c.name.toLowerCase().includes(w)))
        .map((c) => c.id);
    }

    return [];
  }

  // Process both NULL and "flagged" speakers
  const pending = await db
    .select()
    .from(speakers)
    .where(
      or(
        isNull(speakers.disciplineMigrationStatus),
        eq(speakers.disciplineMigrationStatus, "flagged")
      )
    );

  let autoCount = 0;
  let stillFlagged = 0;

  for (const speaker of pending) {
    const legacyCats = speaker.categories || [];
    const matchedCategoryIds = new Set<number>();
    const disciplineVotes = new Map<number, number>(); // disciplineId → votes

    for (const legacyCat of legacyCats) {
      const lower = legacyCat.toLowerCase().trim();

      // Check if the legacy value IS a discipline name
      const discMatch = disciplineByLowerName.get(lower);
      if (discMatch) {
        // Weight discipline-name matches more heavily
        disciplineVotes.set(
          discMatch.id,
          (disciplineVotes.get(discMatch.id) || 0) + 2
        );
        continue;
      }

      // Translate to category IDs
      const catIds = matchCategoryIds(legacyCat);
      for (const catId of catIds) {
        matchedCategoryIds.add(catId);
        const cat = allCategories.find((c) => c.id === catId);
        if (cat?.disciplineId) {
          disciplineVotes.set(
            cat.disciplineId,
            (disciplineVotes.get(cat.disciplineId) || 0) + 1
          );
        }
      }
    }

    // Pick the discipline with the most votes
    let winningDisciplineId: number | null = null;
    let maxVotes = 0;
    for (const [dId, votes] of disciplineVotes) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winningDisciplineId = dId;
      }
    }

    // Fall back to Miscellaneous if nothing matched
    if (winningDisciplineId === null && miscDiscipline) {
      winningDisciplineId = miscDiscipline.id;
    }

    const newStatus = winningDisciplineId !== null ? "auto" : "flagged";
    if (newStatus === "auto") autoCount++;
    else stillFlagged++;

    await db
      .update(speakers)
      .set({
        disciplineId: winningDisciplineId,
        speakerCategoryIds: Array.from(matchedCategoryIds),
        disciplineMigrationStatus: newStatus,
      })
      .where(eq(speakers.id, speaker.id));
  }

  if (pending.length > 0) {
    console.log(
      `[migrate-disciplines] Processed ${pending.length} speakers: ${autoCount} auto-mapped, ${stillFlagged} still flagged.`
    );
  }
}

export async function seedAndMigrateDisciplines(): Promise<void> {
  await seedDisciplines();
  await migrateSpeakerDisciplines();
}
