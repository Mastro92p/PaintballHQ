import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";
import type { FormatConfig } from "@/types";

function buildTeamGroupsMap(
  teams: Array<{
    teamId: number;
    groupLinks?: Array<{ groupId: number | null }>;
  }>
) {
  return Object.fromEntries(
    teams.map((t) => [
      t.teamId,
      (t.groupLinks ?? [])
        .map((link) => link.groupId)
        .filter((groupId): groupId is number => typeof groupId === "number"),
    ])
  );
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: [{ order: "asc" }, { id: "asc" }],
        },
        teams: {
          include: {
            team: true,
            groupLinks: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });

    if (!tournament) return apiError("Tournament not found", 404);

    if (tournament.type !== "group_and_bracket") {
      return apiError("Tournament is not group_and_bracket type", 400);
    }

    if (!tournament.formatConfig) {
      return apiError("Tournament has no formatConfig", 400);
    }

    const fc = tournament.formatConfig as FormatConfig;
    const enrolledTeams = tournament.teams.map((tt) => tt.team);

    if (fc.groupCount == null || fc.teamsPerGroup == null) {
      return apiError(
        "Missing group configuration (groupCount or teamsPerGroup)",
        400
      );
    }

    const groupCount = fc.groupCount;
    const teamsPerGroup = fc.teamsPerGroup;
    const totalExpected = groupCount * teamsPerGroup;

    if (enrolledTeams.length < 2) {
      return apiError("Not enough teams enrolled (minimum 2)", 400);
    }

    const shuffled = [...enrolledTeams].sort(() => Math.random() - 0.5);

    const buckets: (typeof enrolledTeams)[] = Array.from(
      { length: groupCount },
      () => []
    );

    shuffled.forEach((team, i) => {
      buckets[i % groupCount].push(team);
    });

    const groupLabels = "ABCDEFGH".split("").slice(0, groupCount);

    await prisma.$transaction(async (tx) => {
      await tx.match.deleteMany({
        where: { tournamentId: id, phase: "group" },
      });

      await tx.tournamentTeamGroup.deleteMany({
        where: { tournamentId: id },
      });

      await tx.tournamentGroup.deleteMany({
        where: { tournamentId: id },
      });

      const createdGroups = [];

      for (let i = 0; i < groupCount; i++) {
        const created = await tx.tournamentGroup.create({
          data: {
            tournamentId: id,
            name: groupLabels[i] ?? `Group ${i + 1}`,
            order: i,
          },
        });

        createdGroups.push(created);
      }

      for (let g = 0; g < buckets.length; g++) {
        const group = createdGroups[g];
        const groupTeams = buckets[g];

        if (!group) continue;

        for (const team of groupTeams) {
          await tx.tournamentTeamGroup.create({
            data: {
              tournamentId: id,
              teamId: team.id,
              groupId: group.id,
            },
          });
        }

        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            await tx.match.create({
              data: {
                tournamentId: id,
                teamAId: groupTeams[i].id,
                teamBId: groupTeams[j].id,
                phase: "group",
                groupId: group.id,
                round: 1,
                status: "pending",
              },
            });
          }
        }
      }

      await tx.tournament.update({
        where: { id },
        data: { status: "active" },
      });
    });

    const refreshedTournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: [{ order: "asc" }, { id: "asc" }],
        },
        matches: {
          orderBy: [{ round: "asc" }, { id: "asc" }],
        },
        teams: {
          include: {
            team: true,
            groupLinks: true,
          },
        },
      },
    });

    if (!refreshedTournament) {
      return apiError("Tournament not found after generation", 404);
    }

    return Response.json({
      success: true,
      groups: refreshedTournament.groups.map((group) => ({
        id: group.id,
        name: group.name,
        order: group.order,
      })),
      matches: refreshedTournament.matches,
      teamGroups: buildTeamGroupsMap(refreshedTournament.teams),
      status: refreshedTournament.status,
      totalTeams: enrolledTeams.length,
      expectedTeams: totalExpected,
      warning:
        enrolledTeams.length !== totalExpected
          ? `Expected ${totalExpected} teams but found ${enrolledTeams.length}. Groups were distributed evenly.`
          : undefined,
    });
  } catch (error) {
    console.error(error);
    return apiError("Failed to generate groups", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const tournamentId = parseInt(rawId, 10);

    await prisma.$transaction([
      prisma.match.deleteMany({
        where: { tournamentId, phase: "group" },
      }),
      prisma.tournamentTeamGroup.deleteMany({
        where: { tournamentId },
      }),
      prisma.tournamentGroup.deleteMany({
        where: { tournamentId },
      }),
    ]);

    const refreshedTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        groups: {
          orderBy: [{ order: "asc" }, { id: "asc" }],
        },
        matches: {
          orderBy: [{ round: "asc" }, { id: "asc" }],
        },
        teams: {
          include: {
            team: true,
            groupLinks: true,
          },
        },
      },
    });

    if (!refreshedTournament) {
      return apiError("Tournament not found after reset", 404);
    }

    return Response.json({
      success: true,
      groups: refreshedTournament.groups.map((group) => ({
        id: group.id,
        name: group.name,
        order: group.order,
      })),
      matches: refreshedTournament.matches,
      teamGroups: buildTeamGroupsMap(refreshedTournament.teams),
      status: refreshedTournament.status,
    });
  } catch (error) {
    console.error(error);
    return apiError("Failed to reset group stage", 500);
  }
}