/*
  Warnings:

  - You are about to drop the `Landlord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `landlordId` on the `SpotifyToken` table. All the data in the column will be lost.
  - Added the required column `householdId` to the `SpotifyToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SpotifyToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Landlord_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Landlord";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'LANDLORD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Household" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'SINGLE_HOUSEHOLD',
    "ownerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Household_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HomeAssistantInstance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "householdId" INTEGER NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HomeAssistantInstance_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SpotifyToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "householdId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpotifyToken_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SpotifyToken" ("accessToken", "expiresAt", "id", "refreshToken", "scope", "tokenType") SELECT "accessToken", "expiresAt", "id", "refreshToken", "scope", "tokenType" FROM "SpotifyToken";
DROP TABLE "SpotifyToken";
ALTER TABLE "new_SpotifyToken" RENAME TO "SpotifyToken";
CREATE UNIQUE INDEX "SpotifyToken_householdId_key" ON "SpotifyToken"("householdId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HomeAssistantInstance_householdId_key" ON "HomeAssistantInstance"("householdId");
