-- Add the four educational programs without removing existing SM2 data.
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "assetType" TEXT NOT NULL DEFAULT 'page-3',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Program_code_key" ON "Program"("code");

INSERT INTO "Program" ("id", "code", "name", "shortName", "assetType") VALUES
    ('program_tcs', 'tcs', 'Tronc Commun Scientifique', 'TCS', 'page-2'),
    ('program_sm1', 'sm1', '1ère année Bac Sciences Mathématiques', '1BAC SM', 'page-3'),
    ('program_sm2', 'sm2', '2ème année Bac Sciences Mathématiques', '2BAC SM', 'page-3'),
    ('program_pc2', 'pc2', '2ème année Bac Sciences Physiques', '2BAC PC', 'exercise');

ALTER TABLE "Student" ADD COLUMN "programId" TEXT;
ALTER TABLE "Chapter" ADD COLUMN "programId" TEXT;

-- Wahamath's existing curriculum and accounts are the SM2 program.
UPDATE "Student" SET "programId" = 'program_sm2' WHERE "programId" IS NULL;
UPDATE "Chapter" SET "programId" = 'program_sm2' WHERE "programId" IS NULL;

ALTER TABLE "Student" ALTER COLUMN "programId" SET NOT NULL;
ALTER TABLE "Chapter" ALTER COLUMN "programId" SET NOT NULL;

DROP INDEX "Chapter_number_key";
CREATE UNIQUE INDEX "Chapter_programId_number_key" ON "Chapter"("programId", "number");

ALTER TABLE "Student" ADD CONSTRAINT "Student_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
