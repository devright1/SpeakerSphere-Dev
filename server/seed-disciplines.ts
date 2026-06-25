import { db } from "./db";
import { disciplines, categories, speakers } from "../shared/schema";
import { eq, isNull, or, and, inArray, sql } from "drizzle-orm";

/**
 * Two-level taxonomy — exact names taken from the Excel proposal.
 * Each discipline's category list is the authoritative source: on every
 * startup, categories that no longer appear here are removed from the DB
 * (and from speakers.speakerCategoryIds), and new ones are inserted.
 */
const DISCIPLINE_DATA: { name: string; categories: string[] }[] = [
  {
    name: "Endodontics",
    categories: [
      "Public Health & Community Dentistry",
      "Wellness, Ergonomics & Professional Burnout",
      "Articulators & Jaw Motion Simulation",
      "Practice Management and Risk Mitigation",
      "Digital Workflows",
      "Dental Radiology & Imaging",
      "Infection Control & Laboratory Safety",
      "Dental procedure workflows",
      "Care for Special Needs or Medically Compromised",
      "Foundational / Core Science Topics",
      "Microscope Dentistry",
      "Emerging Technologies & Innovations",
      "Oral Pathology",
      "Laboratory Workflow & Case Management",
      "Dental Materials",
      "Ceramic Layering & Finishing Techniques",
      "Dental Anatomy & Occlusion",
      "Quality Control & Fit Accuracy",
      "Technology & Innovation",
    ],
  },
  {
    name: "General Dentistry",
    categories: [
      "Public Health & Community Dentistry",
      "Medical Emergencies & Basic Life Support",
      "Dental Trauma Management",
      "Clinical Procedures & Chairside Assisting",
      "Dental Radiology & Imaging",
      "Regenerative Endodontics",
      "Esthetic Procedures",
      "Evidence-Based Endodontics",
      "Implant Dentistry",
      "Surgical Endodontics (Apical Surgery)",
      "Laboratory Procedures",
      "Laser Procedures",
      "Microscope Dentistry",
      "Minimally Invasive Procedures",
      "Oral Pathology",
      "Laboratory Workflow & Case Management",
      "Dental Materials",
      "Nonsurgical Root Canal Therapy",
      "Endodontic Retreatment",
      "Pain Management, Anesthesia & Sedation",
      "Sleep Disorders",
    ],
  },
  {
    name: "Oral Surgery",
    categories: [
      "Geriatric Dentistry",
      "Interdisciplinary Topics",
      "Education, Research & Evidence-Based Practice",
      "Research, Evidence-Based & Public Health",
      "Emerging Technology & Advanced Topics",
      "Interdisciplinary & Systemic Topics",
      "Evidence-Based Practice and Research",
      "Regulatory & Compliance Topics",
      "Laser Procedures",
      "Restorative/Adhesive Dentistry",
      "Interdisciplinary Care",
      "Education and Training and Hands-On Workshops",
      "Peri-implantitis",
      "Diagnosis, Prevention & Patient Care",
      "Patient Care & Communication",
      "Sleep Disorders",
      "Core Clinical Oral Surgery",
    ],
  },
  {
    name: "Periodontics",
    categories: [
      "Anesthesia & Sedation",
      "Technology & Digital Dentistry",
      "Practice Management and Risk Mitigation",
      "Digital Workflows",
      "Hard & Soft Tissue Grafting Principles & Techniques",
      "Temporomandibular Joint (TMJ) Disorders",
      "Implant Surgery and Bone/Tissue Regeneration",
      "Emerging and Future Topics",
      "Anesthesia, Pain Management and Sedation",
      "Interdisciplinary Treatment",
      "Laser Procedures",
      "Medically Complex Patient Management",
      "Oral Pathology",
      "Peri-implantitis",
      "Orthognathic and Craniofacial Surgery",
      "Patient Care & Communication",
      "Facial Aesthetics and Cosmetic Procedures",
      "Trauma and Reconstruction",
      "Oral Pathology and Oncology",
      "Technology & Innovation",
      "Tissue Regeneration",
    ],
  },
  {
    name: "Orthodontics",
    categories: [
      "Aligner Therapy",
      "Surgical Periodontics",
      "Professional Development & Career Advancement",
      "Diagnosis & Treatment Planning",
      "Wellness, Ergonomics & Burnout Prevention",
      "Digital Dentistry & Workflows",
      "Evidence-Based Dentistry",
      "Foundational & Biological Sciences",
      "Esthetic Periodontics",
      "Non-Surgical Periodontal Therapy",
      "Oral Pathology",
      "Dental Materials",
      "Complications & Risk Management",
      "Sleep Disorders",
      "Education, Training & Hands-On/Workshops",
      "Technology & Innovation",
    ],
  },
  {
    name: "Prosthodontics",
    categories: [
      "Public Health & Community Dentistry",
      "Professional Development",
      "Growth, Development & Orthodontic Concepts",
      "Practice Management & Ethics",
      "Sedation, Pain Control & Anesthesia",
      "Dental Radiology & Imaging",
      "Preventive Dentistry & Public Health",
      "Clinical Pediatric Dentistry",
      "Oral Medicine, Pathology & Systemic Health",
      "Special Health Care Needs (SHCN)",
      "Interdisciplinary Treatment",
      "Hard and Soft Tissue Grafting",
      "Minimally Invasive Procedures",
      "Oral Pathology",
      "Interdisciplinary and Collaborative Care",
      "Professional Development & Wellness",
      "Evidence-Based Dentistry & Research",
      "Foundational / Core Knowledge Updates",
      "Sleep Disorders",
      "Digital Dentistry & Emerging Technologies",
      "Tissue Regeneration",
      "Implant Prosthodontics",
      "Full Mouth Rehabilitation & Complex Cases",
      "Clinical Techniques",
      "Clinical Complications & Risk Management",
      "Removable Prosthodontics",
      "Patient-Centered Care & Treatment Planning",
      "Esthetic Dentistry",
      "Research, Innovation & Evidence-Based Updates",
      "Patient Assessment",
      "Practice Management & Prosthodontics Economics",
      "Education, Training & Hands-on Workshops",
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
      "Dentist–Technician Communication & Collaboration",
      "Laboratory Workflow & Case Management",
      "Quality Control & Fit Accuracy",
      "Regulatory & Compliance",
      "Professional Development",
      "Fixed Prosthodontics & Restorative Techniques",
      "Digital Dentistry & CAD/CAM Technologies",
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
      "Regulatory, Compliance & Quality Assurance",
      "Behavior Guidance & Patient Management",
      "Expanded Function",
      "Communication Skills",
      "Laboratory Management & Business Skills",
      "Emergency & Trauma Care",
      "Research & Academic-Oriented Lectures",
      "Professional Development & Career Growth",
      "Subspecialty & Patient-Specific Care",
      "Ethics, Wellness & Professional Responsibility",
      "Oral Pathology & Disease Recognition",
      "Practice Management & Clinical Efficiency",
      "Oral-Systemic Health Connections",
      "Education, Training & Hands-On / Skills-Based Workshops",
      "Pharmacology & Medical Considerations",
      "Infection Control & Patient Safety",
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
 * Idempotently seed disciplines and sync categories.
 * - New categories in DISCIPLINE_DATA are inserted.
 * - Categories removed from DISCIPLINE_DATA are deleted from the DB and
 *   stripped from speakers.speakerCategoryIds.
 * - When any category change is detected, all non-confirmed speakers are
 *   reset to "flagged" so the migration re-populates their speakerCategoryIds
 *   with the updated category IDs.
 */
export async function seedDisciplines(): Promise<void> {
  const existingDisciplines = await db.select().from(disciplines);
  const disciplineByName = new Map(existingDisciplines.map((d) => [d.name, d]));

  let anyChange = false;

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
      anyChange = true;
    } else {
      await db
        .update(disciplines)
        .set({ sortOrder: i })
        .where(eq(disciplines.id, discipline.id));
    }

    const existingCats = await db
      .select()
      .from(categories)
      .where(eq(categories.disciplineId, discipline.id));

    const existingCatNames = new Set(existingCats.map((c) => c.name));
    const newCatNames = new Set(catNames);

    // Delete categories removed from this discipline
    const toDelete = existingCats.filter((c) => !newCatNames.has(c.name));
    if (toDelete.length > 0) {
      const idsToDelete = toDelete.map((c) => c.id);
      await db.delete(categories).where(inArray(categories.id, idsToDelete));
      // Strip those IDs from speakers.speakerCategoryIds
      await db.execute(
        sql`UPDATE speakers
            SET speaker_category_ids = ARRAY(
              SELECT unnest(speaker_category_ids)
              EXCEPT ALL
              SELECT unnest(ARRAY[${sql.join(idsToDelete, sql`, `)}]::integer[])
            )
            WHERE speaker_category_ids && ARRAY[${sql.join(idsToDelete, sql`, `)}]::integer[]`
      );
      anyChange = true;
    }

    // Insert new categories
    const toInsert = catNames
      .filter((catName) => !existingCatNames.has(catName))
      .map((catName) => ({
        name: catName,
        description: "",
        disciplineId: discipline!.id,
        sortOrder: catNames.indexOf(catName),
        speakerCount: 0,
      }));

    if (toInsert.length > 0) {
      await db.insert(categories).values(toInsert);
      anyChange = true;
    }
  }

  // When the category list changed, mark all non-confirmed speakers as flagged
  // so the migration re-runs and repopulates speakerCategoryIds with the new IDs.
  if (anyChange) {
    await db.execute(
      sql`UPDATE speakers
          SET discipline_migration_status = 'flagged',
              speaker_category_ids = '{}'
          WHERE discipline_migration_status IS DISTINCT FROM 'confirmed'`
    );
    console.log("[seed-disciplines] Category changes detected — reset non-confirmed speakers for re-migration.");
  }

  console.log(`[seed-disciplines] Synced ${DISCIPLINE_DATA.length} disciplines and their categories.`);
}

// ---------------------------------------------------------------------------
// Legacy-category translation keywords
// Keys are lowercased legacy category strings; values are substrings to match
// against new category names (case-insensitive, curated before exact match).
// ---------------------------------------------------------------------------
const LEGACY_KEYWORDS: Record<string, string[]> = {
  "practice management": ["practice management"],
  "education & training": ["education"],
  "implant dentistry":   ["implant"],
  "leadership":          ["leadership"],
  "digital dentistry":   ["digital"],
  "esthetic dentistry":  ["esthetic"],
  "ai & innovation":     ["ai &"],
  "full arch rehabilitation": ["rehabilitation", "full mouth"],
  "technology & innovation":  ["technology & innovation"],
  "anesthesia & sedation":    ["anesthesia", "sedation"],
  "research":                 ["research & evidence-based"],
  "bone grafting & regeneration": ["graft", "regenerat"],
};

const GENERIC_WORDS = new Set([
  "dental", "dentistry", "oral", "health", "patient", "clinical", "procedures",
  "care", "based", "management", "practice",
]);

/**
 * Auto-map speakers to disciplines using their legacy `categories` array.
 *
 * Processes:
 *  - disciplineMigrationStatus IS NULL  (never migrated)
 *  - disciplineMigrationStatus = 'flagged'  (previous attempt failed)
 *  - disciplineMigrationStatus = 'auto' AND speakerCategoryIds is empty
 *    (first-pass migration set disciplineId but never populated the category IDs)
 *
 * Logic per speaker:
 *  1. Legacy value is a discipline name → vote for that discipline (weight 2)
 *  2. Otherwise match against category rows using curated keywords or fallback
 *     word search → collect category IDs + vote per matched category's discipline
 *  3. Most-voted discipline wins; ties → Miscellaneous; no match → Miscellaneous
 *  4. Write disciplineId, speakerCategoryIds, disciplineMigrationStatus = "auto"
 */
export async function migrateSpeakerDisciplines(): Promise<void> {
  const allDisciplines = await db.select().from(disciplines);
  if (allDisciplines.length === 0) return;

  const allCategories = await db.select().from(categories);

  const disciplineByLowerName = new Map(
    allDisciplines.map((d) => [d.name.toLowerCase().trim(), d])
  );
  const miscDiscipline = allDisciplines.find((d) => d.name === "Miscellaneous");

  function matchCategoryIds(legacyCat: string): number[] {
    const lower = legacyCat.toLowerCase().trim();

    // 1. Curated keywords first (intentionally matches ALL related categories
    //    across disciplines, e.g. "Implant Dentistry" → every implant category)
    const keywords = LEGACY_KEYWORDS[lower];
    if (keywords) {
      return allCategories
        .filter((c) => keywords.some((kw) => c.name.toLowerCase().includes(kw)))
        .map((c) => c.id);
    }

    // 2. Exact match
    const exact = allCategories.find(
      (c) => c.name.toLowerCase().trim() === lower
    );
    if (exact) return [exact.id];

    // 3. Fallback: significant words from the legacy string
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

  // Include speakers whose speakerCategoryIds is empty even if status = 'auto'
  // (these were migrated by an earlier pass that only set disciplineId)
  const pending = await db
    .select()
    .from(speakers)
    .where(
      or(
        isNull(speakers.disciplineMigrationStatus),
        eq(speakers.disciplineMigrationStatus, "flagged"),
        and(
          eq(speakers.disciplineMigrationStatus, "auto"),
          or(
            isNull(speakers.speakerCategoryIds),
            sql`array_length(${speakers.speakerCategoryIds}, 1) IS NULL`
          )
        )
      )
    );

  let autoCount = 0;
  let stillFlagged = 0;

  for (const speaker of pending) {
    const legacyCats = speaker.categories || [];
    const matchedCategoryIds = new Set<number>();
    const disciplineVotes = new Map<number, number>();

    for (const legacyCat of legacyCats) {
      const lower = legacyCat.toLowerCase().trim();

      const discMatch = disciplineByLowerName.get(lower);
      if (discMatch) {
        disciplineVotes.set(
          discMatch.id,
          (disciplineVotes.get(discMatch.id) || 0) + 2
        );
        // Add all categories from the matched discipline so the speaker
        // appears in multi-discipline searches (not just via disciplineId)
        const discCats = allCategories.filter(
          (c) => c.disciplineId === discMatch.id
        );
        for (const cat of discCats) {
          matchedCategoryIds.add(cat.id);
        }
        continue;
      }

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

    // Pick discipline with most votes; ties and no-matches → Miscellaneous
    let winningDisciplineId: number | null = null;
    let maxVotes = 0;
    let tieDetected = false;
    for (const [dId, votes] of disciplineVotes) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winningDisciplineId = dId;
        tieDetected = false;
      } else if (votes === maxVotes) {
        tieDetected = true;
      }
    }
    if ((tieDetected || winningDisciplineId === null) && miscDiscipline) {
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
