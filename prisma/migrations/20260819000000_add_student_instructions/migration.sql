CREATE TABLE "StudentInstruction" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentInstruction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StudentInstruction"
ADD CONSTRAINT "StudentInstruction_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
