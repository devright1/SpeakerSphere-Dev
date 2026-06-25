import { db } from "./db";
import { disciplines, categories, speakers } from "../shared/schema";
import { eq, isNull, and, sql } from "drizzle-orm";

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

/**
 * Auto-map existing speakers to a discipline based on their legacy `categories`
 * array. Only runs for speakers that have not yet been assigned a migration
 * status (disciplineMigrationStatus IS NULL).
 *
 * - Exactly one discipline name matches -> set disciplineId, status "auto"
 * - No match or ambiguous -> status "flagged"
 */
export async function migrateSpeakerDisciplines(): Promise<void> {
  const allDisciplines = await db.select().from(disciplines);
  if (allDisciplines.length === 0) return;

  const disciplineByLowerName = new Map(
    allDisciplines.map((d) => [d.name.toLowerCase().trim(), d])
  );

  // Only process speakers that haven't been migrated yet
  const pending = await db
    .select()
    .from(speakers)
    .where(isNull(speakers.disciplineMigrationStatus));

  let autoCount = 0;
  let flaggedCount = 0;

  for (const speaker of pending) {
    const speakerCats = (speaker.categories || []).map((c) => c.toLowerCase().trim());
    const matched = new Set<number>();

    for (const cat of speakerCats) {
      const d = disciplineByLowerName.get(cat);
      if (d) matched.add(d.id);
    }

    if (matched.size === 1) {
      const disciplineId = Array.from(matched)[0];
      await db
        .update(speakers)
        .set({ disciplineId, disciplineMigrationStatus: "auto" })
        .where(eq(speakers.id, speaker.id));
      autoCount++;
    } else {
      await db
        .update(speakers)
        .set({ disciplineMigrationStatus: "flagged" })
        .where(eq(speakers.id, speaker.id));
      flaggedCount++;
    }
  }

  if (pending.length > 0) {
    console.log(
      `[migrate-disciplines] Processed ${pending.length} speakers: ${autoCount} auto-mapped, ${flaggedCount} flagged for review.`
    );
  }
}

export async function seedAndMigrateDisciplines(): Promise<void> {
  await seedDisciplines();
  await migrateSpeakerDisciplines();
}
