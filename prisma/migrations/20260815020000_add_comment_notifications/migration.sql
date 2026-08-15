ALTER TABLE "StudentComment" ADD COLUMN "teacherUnread" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TeacherRemark" ADD COLUMN "studentUnread" BOOLEAN NOT NULL DEFAULT true;
