-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "householdId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "labelFilter" TEXT,
    CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMember_userId_householdId_key" ON "HouseholdMember"("userId", "householdId");
