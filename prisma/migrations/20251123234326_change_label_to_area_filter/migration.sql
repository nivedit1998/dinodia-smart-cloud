/*
  Warnings:

  - You are about to drop the column `labelFilter` on the `HouseholdMember` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HouseholdMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "householdId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "areaFilter" TEXT,
    CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_HouseholdMember" ("householdId", "id", "role", "userId") SELECT "householdId", "id", "role", "userId" FROM "HouseholdMember";
DROP TABLE "HouseholdMember";
ALTER TABLE "new_HouseholdMember" RENAME TO "HouseholdMember";
CREATE UNIQUE INDEX "HouseholdMember_userId_householdId_key" ON "HouseholdMember"("userId", "householdId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
