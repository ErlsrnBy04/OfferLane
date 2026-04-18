-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "city" TEXT,
    "channel" TEXT,
    "channelDetail" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'APPLIED',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "jdSnapshot" TEXT,
    "resumeVersion" TEXT,
    "notes" TEXT,
    "appliedAt" DATETIME NOT NULL,
    "lastActionAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StageEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "StageEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "interviewer" TEXT,
    "durationMin" INTEGER,
    "questions" TEXT,
    "selfRating" INTEGER,
    "mood" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Application_stage_idx" ON "Application"("stage");

-- CreateIndex
CREATE INDEX "Application_deadline_idx" ON "Application"("deadline");

-- CreateIndex
CREATE INDEX "StageEvent_applicationId_occurredAt_idx" ON "StageEvent"("applicationId", "occurredAt");

-- CreateIndex
CREATE INDEX "Interview_applicationId_occurredAt_idx" ON "Interview"("applicationId", "occurredAt");
