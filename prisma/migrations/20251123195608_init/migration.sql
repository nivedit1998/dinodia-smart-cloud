-- CreateTable
CREATE TABLE "Landlord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT
);

-- CreateTable
CREATE TABLE "SpotifyToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "landlordId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "SpotifyToken_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Landlord_email_key" ON "Landlord"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyToken_landlordId_key" ON "SpotifyToken"("landlordId");
