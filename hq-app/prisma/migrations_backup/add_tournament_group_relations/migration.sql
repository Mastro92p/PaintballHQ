-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "groupId" INTEGER;

-- CreateTable
CREATE TABLE "TournamentGroup" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentTeamGroup" (
    "tournamentId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "TournamentTeamGroup_pkey" PRIMARY KEY ("tournamentId","teamId","groupId")
);

-- CreateIndex
CREATE INDEX "TournamentGroup_tournamentId_order_idx" ON "TournamentGroup"("tournamentId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGroup_tournamentId_name_key" ON "TournamentGroup"("tournamentId", "name");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGroup" ADD CONSTRAINT "TournamentGroup_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeamGroup" ADD CONSTRAINT "TournamentTeamGroup_tournamentId_teamId_fkey" FOREIGN KEY ("tournamentId", "teamId") REFERENCES "TournamentTeam"("tournamentId", "teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeamGroup" ADD CONSTRAINT "TournamentTeamGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
