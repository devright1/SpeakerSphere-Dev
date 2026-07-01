import { db } from "./db";
import { disciplines, categories, speakers } from "../shared/schema";
import { eq, isNull, or, and, inArray, sql } from "drizzle-orm";
import { DISCIPLINE_SOURCE_DATA } from "./discipline-source-data";

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
      "AI & Innovation",
      "Complications & Risk Management",
      "Dental Trauma Management",
      "Diagnosis & Treatment Planning",
      "Digital Workflows",
      "Education, Training & Hands-On/Workshops",
      "Endodontic Retreatment",
      "Evidence-Based Endodontics",
      "Foundational / Core Science Topics",
      "Interdisciplinary Topics",
      "Microscope Dentistry",
      "Nonsurgical Root Canal Therapy",
      "Oral Pathology",
      "Pain Management, Anesthesia & Sedation",
      "Practice Management & Professional Development",
      "Regenerative Endodontics",
      "Restorative-Endodontic Interface",
      "Surgical Endodontics (Apical Surgery)",
      "Technology & Innovation",
    ],
  },
  {
    name: "General Dentistry",
    categories: [
      "AI & Innovation",
      "Hard & Soft Tissue Grafting Principles & Techniques",
      "Diagnosis, Prevention & Patient Care",
      "Digital Dentistry & Workflows",
      "Education, Training & Hands-On/Workshops",
      "Emerging Technology & Advanced Topics",
      "Esthetic Procedures",
      "Geriatric Dentistry",
      "Implant Dentistry",
      "Interdisciplinary & Systemic Topics",
      "Laboratory Procedures",
      "Laser Procedures",
      "Microscope Dentistry",
      "Minimally Invasive Procedures",
      "Oral Pathology",
      "Pain Management, Anesthesia & Sedation",
      "Practice Management & Professional Development",
      "Regulatory & Compliance Topics",
      "Research, Evidence-Based & Public Health",
      "Restorative/Adhesive Dentistry",
      "Sleep Disorders",
    ],
  },
  {
    name: "Oral Surgery",
    categories: [
      "Anesthesia, Pain Management and Sedation",
      "Core Clinical Oral Surgery",
      "Digital Technologies & Innovation",
      "Education and Training and Hands-On Workshops",
      "Emerging and Future Topics",
      "Evidence-Based Practice and Research",
      "Facial Aesthetics and Cosmetic Procedures",
      "Implant Surgery and Bone/Tissue Regeneration",
      "Interdisciplinary Care",
      "Laser Procedures",
      "Medically Complex Patient Management",
      "Oral Pathology and Oncology",
      "Orthognathic and Craniofacial Surgery",
      "Peri-implantitis",
      "Practice Management and Risk Mitigation",
      "Professional Development",
      "Sleep Disorders",
      "Temporomandibular Joint (TMJ) Disorders",
      "Trauma and Reconstruction",
    ],
  },
  {
    name: "Periodontics",
    categories: [
      "Anesthesia & Sedation",
      "Hard and Soft Tissue Grafting",
      "Diagnosis & Treatment Planning",
      "Digital Workflows",
      "Education, Training & Hands-On / Skills-Based Workshops",
      "Esthetic Periodontics",
      "Evidence-Based Periodontology",
      "Foundational & Biological Sciences",
      "Implant Dentistry (Perio-Implant Interface)",
      "Interdisciplinary Treatment",
      "Laser Procedures",
      "Non-Surgical Periodontal Therapy",
      "Oral Pathology",
      "Peri-implantitis",
      "Practice Management & Clinical Efficiency",
      "Professional Development",
      "Regenerative Periodontics",
      "Surgical Periodontics",
      "Systemic Health & Periodontal Medicine",
      "Technology & Innovation",
      "Tissue Regeneration",
    ],
  },
  {
    name: "Orthodontics",
    categories: [
      "Aligner Therapy",
      "Case-based & Interactive Learning",
      "Clinical Complications & Risk Management",
      "Digital Orthodontics & Technology",
      "Education, Training & Hands-on Workshops",
      "Ethics, Wellness & Professional Responsibility",
      "Evidence-Based Dentistry",
      "Foundational & Update Lectures",
      "Growth, Development & Orthodontic Concepts",
      "Interdisciplinary Orthodontics",
      "Oral Pathology",
      "Practice Management & Professional Development",
      "Research & Academic-Oriented Lectures",
      "Sleep Disorders",
      "Subspecialty & Patient-Specific Care",
      "Technology & Innovation",
    ],
  },
  {
    name: "Pediatrics",
    categories: [
      "Behavior Guidance & Patient Management",
      "Clinical Pediatric Dentistry",
      "Emergency & Trauma Care",
      "Evidence-Based Dentistry & Research",
      "Growth, Development & Orthodontic Concepts",
      "Interdisciplinary and Collaborative Care",
      "Oral Medicine, Pathology & Systemic Health",
      "Practice Management & Ethics",
      "Preventive Dentistry & Public Health",
      "Professional Development & Wellness",
      "Sedation, Pain Control & Anesthesia",
      "Special Health Care Needs (SHCN)",
      "Technology & Innovation",
    ],
  },
  {
    name: "Prosthodontics",
    categories: [
      "AI & Innovation",
      "Hard & Soft Tissue Grafting Techniques",
      "Clinical Techniques",
      "Complications, Failures & Risk Management",
      "Digital Dentistry & Emerging Technologies",
      "Education, Training & Hands-On/Workshops",
      "Esthetic Dentistry",
      "Foundational / Core Knowledge Updates",
      "Full Mouth Rehabilitation & Complex Cases",
      "Implant Prosthodontics",
      "Interdisciplinary Treatment",
      "Laboratory Communication & Workflows",
      "Minimally Invasive Procedures",
      "Oral Pathology",
      "Patient-Centered Care & Treatment Planning",
      "Practice Management & Prosthodontics Economics",
      "Removable Prosthodontics (Advanced Topics)",
      "Research, Innovation & Evidence-Based Updates",
      "Sleep Disorders",
      "Special Populations & Niche Areas",
      "Tissue Regeneration",
    ],
  },
  {
    name: "Dental Laboratory – Technician",
    categories: [
      "Articulators & Jaw Motion Simulation",
      "Ceramic Layering & Finishing Techniques",
      "Dental Anatomy & Occlusion",
      "Dentist–Technician Communication & Collaboration",
      "Digital Dentistry & CAD/CAM Technologies",
      "Emerging Technologies & Innovations",
      "Esthetics & Smile Design",
      "Fixed Prosthodontics & Restorative Techniques",
      "Hands-On Training",
      "Implantology for Technicians",
      "Infection Control & Laboratory Safety",
      "Laboratory Management & Business Skills",
      "Laboratory Workflow & Case Management",
      "Materials Science & Biomaterials",
      "Professional Development & Career Growth",
      "Quality Control & Fit Accuracy",
      "Regulatory, Compliance & Quality Assurance",
      "Removable Prosthodontics",
      "Shade Matching/Communication",
    ],
  },
  {
    name: "Dental Hygiene",
    categories: [
      "Patient Assessment",
      "Anatomy",
      "Oral Pathology & Disease Recognition",
      "Radiology",
      "Clinical Techniques",
      "Pharmacology & Medical Considerations",
      "Oral-Systemic Health Connections",
      "Infection Control",
      "Medical Emergencies",
      "Expanded Function",
      "Digital Technologies",
      "Communication Skills",
      "Infection Control & Patient Safety",
      "Care for Special Needs or Medically Compromised",
      "Education, Research & Evidence-Based Practice",
      "Public Health & Community Dentistry",
      "Emerging Technologies & Innovations",
      "Wellness, Ergonomics & Professional Burnout",
    ],
  },
  {
    name: "Dental Assisting",
    categories: [
      "Clinical Procedures & Chairside Assisting",
      "Dental Instruments & Equipment",
      "Dental Materials",
      "Dental Procedure Workflows",
      "Dental Radiology & Imaging",
      "Dental Terminology & Oral Anatomy",
      "Infection Control & OSHA Standards",
      "Medical Emergencies & Basic Life Support",
      "Oral Surgery & Endodontic Assisting",
      "Pain Control & Anesthesia",
      "Patient Care & Communication",
      "Preventive Dentistry & Public Health",
      "Professional Development & Career Advancement",
      "Restorative & Prosthodontic Procedures",
      "Technology & Digital Dentistry",
      "Wellness, Ergonomics & Burnout Prevention",
    ],
  },
  {
    name: "Miscellaneous",
    categories: [
      "Cost-Benefit in New Devices",
      "Dental Practice Assessment",
      "Dental Practice Entrepreneurship",
      "Dental Practice Operations",
      "Dental Practice Partnerships",
      "Emergency Preparedness in Dental Practice",
      "Office Culture",
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

function normalizeSpeakerName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^dr\.?\s+/, "")
    .replace(/\s+/g, " ");
}

function normalizeDisciplineName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\u2010-\u2015]/g, "-") // normalize hyphen/dash variants (-, –, —) to "-"
    .replace(/\s+/g, " ");
}

/**
 * Apply the client-provided authoritative speaker -> discipline mapping
 * (server/discipline-source-data.ts, sourced from their spreadsheet).
 *
 * This always wins over the best-effort auto-matcher: it runs first, on every
 * startup, and marks matched speakers "confirmed" so the auto-matcher and any
 * stale-record reset logic leave them alone afterward. This is what protects
 * this specific, client-approved distribution from being silently overwritten
 * by future re-migrations, checkpoint restores, or admin bulk actions.
 */
export async function applyAuthoritativeDisciplineAssignments(): Promise<void> {
  const allDisciplines = await db.select().from(disciplines);
  const allSpeakers = await db
    .select({ id: speakers.id, name: speakers.name, disciplineMigrationStatus: speakers.disciplineMigrationStatus })
    .from(speakers);

  const disciplineByNormalizedName = new Map(
    allDisciplines.map((d) => [normalizeDisciplineName(d.name), d])
  );

  const speakerIdsByNormalizedName = new Map<string, number[]>();
  const statusById = new Map<number, string | null>();
  for (const s of allSpeakers) {
    const key = normalizeSpeakerName(s.name);
    const arr = speakerIdsByNormalizedName.get(key) ?? [];
    arr.push(s.id);
    speakerIdsByNormalizedName.set(key, arr);
    statusById.set(s.id, s.disciplineMigrationStatus);
  }

  let matched = 0;
  let unmatched = 0;
  let skippedManual = 0;

  for (const row of DISCIPLINE_SOURCE_DATA) {
    const discipline = disciplineByNormalizedName.get(normalizeDisciplineName(row.discipline));
    const speakerIds = speakerIdsByNormalizedName.get(normalizeSpeakerName(row.name));
    if (!discipline || !speakerIds || speakerIds.length === 0) {
      unmatched++;
      continue;
    }

    for (const speakerId of speakerIds) {
      // Never clobber a speaker who has manually chosen their own topics —
      // the spreadsheet only carries a name -> discipline mapping and knows
      // nothing about topics a speaker picked themselves via their dashboard.
      if (statusById.get(speakerId) === "manual") {
        skippedManual++;
        continue;
      }
      await db
        .update(speakers)
        .set({
          disciplineId: discipline.id,
          speakerDisciplineIds: [discipline.id],
          // Topics/categories are only ever set by a speaker (or admin)
          // explicitly choosing them — never auto-derived from the full
          // list of categories under a discipline. Leave empty here so the
          // public profile only shows the discipline until someone
          // manually picks topics.
          speakerCategoryIds: [],
          disciplineMigrationStatus: "confirmed",
        })
        .where(eq(speakers.id, speakerId));
      matched++;
    }
  }

  console.log(
    `[seed-disciplines] Applied authoritative discipline mapping: ${matched} speakers matched, ${unmatched} rows had no matching speaker/discipline, ${skippedManual} speakers skipped (manually-set topics preserved).`
  );
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

  // Map discipline names (lowercase) → discipline object
  const disciplineByLowerName = new Map(
    allDisciplines.map((d) => [d.name.toLowerCase().trim(), d])
  );
  const miscDiscipline = allDisciplines.find((d) => d.name === "Miscellaneous");

  // Process speakers that haven't been migrated yet, are flagged,
  // OR were migrated by an old pass that left speakerDisciplineIds empty.
  const pending = await db
    .select()
    .from(speakers)
    .where(
      or(
        isNull(speakers.disciplineMigrationStatus),
        eq(speakers.disciplineMigrationStatus, "flagged"),
        and(
          eq(speakers.disciplineMigrationStatus, "auto"),
          sql`array_length(${speakers.speakerDisciplineIds}, 1) IS NULL`
        )
      )
    );

  let autoCount = 0;
  let stillFlagged = 0;

  for (const speaker of pending) {
    const legacyCats = speaker.categories || [];

    // Collect ALL disciplines this speaker belongs to via EXACT discipline-name match only.
    // Using exact matching prevents generic topics ("Practice Management") from
    // incorrectly associating a speaker with every discipline that has a similar category.
    const matchedDisciplineIds: number[] = [];
    const seenDisciplineIds = new Set<number>();

    for (const legacyCat of legacyCats) {
      const lower = legacyCat.toLowerCase().trim();
      const discMatch = disciplineByLowerName.get(lower);
      if (discMatch && !seenDisciplineIds.has(discMatch.id)) {
        matchedDisciplineIds.push(discMatch.id);
        seenDisciplineIds.add(discMatch.id);
      }
    }

    // If no exact discipline match found, fall back to Miscellaneous
    if (matchedDisciplineIds.length === 0 && miscDiscipline) {
      matchedDisciplineIds.push(miscDiscipline.id);
    }

    const primaryDisciplineId = matchedDisciplineIds[0] ?? null;
    const newStatus = primaryDisciplineId !== null ? "auto" : "flagged";
    if (newStatus === "auto") autoCount++;
    else stillFlagged++;

    await db
      .update(speakers)
      .set({
        disciplineId: primaryDisciplineId,
        speakerDisciplineIds: matchedDisciplineIds,
        // Topics/categories are a curated, speaker/admin-chosen selection —
        // never auto-derived from "every category under the discipline".
        // Leave empty so only the discipline badge shows until someone
        // manually picks topics.
        speakerCategoryIds: [],
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
  await applyAuthoritativeDisciplineAssignments();
  await migrateSpeakerDisciplines();
}
