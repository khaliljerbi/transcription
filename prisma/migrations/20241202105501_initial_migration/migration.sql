-- CreateTable
CREATE TABLE "Transcription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "summary" TEXT,
    "topics" TEXT NOT NULL,
    "chapters" TEXT,
    "words" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "language" TEXT DEFAULT 'en',
    "duration" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Transcription_resourceId_key" ON "Transcription"("resourceId");
