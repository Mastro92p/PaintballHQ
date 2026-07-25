export type TournamentStatus = "upcoming" | "active" | "completed" | "to_check";
export type MatchStatus = "pending" | "completed";
export type UserRole = "organizer" | "admin";

export type TournamentType =
  | "round_robin"
  | "round_robin_classic"
  | "bracket"
  | "groups"
  | "group_and_bracket";

export type ManagementMode = "auto" | "manual";

export type MatchPhase =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "final"
  | "third_place";

export type MatchSlot = "teamAId" | "teamBId";

export interface Tournament {
  id: number;
  name: string;
  date: string;
  location: string;
  status: TournamentStatus;
  createdAt: Date;
  teams?: TournamentTeam[];
  matches?: Match[];
  groups?: TournamentGroup[];
  brackets?: TournamentBracket[];
  formatConfig: FormatConfig | null;
  type: TournamentType;
  teamsToAdvance: number;
  leagueId: number | null;
  divisionId: number | null;
  division?: Division | null;
  managementMode: ManagementMode;
  isHidden: boolean;
}

export interface Team {
  id: number;
  name: string;
  contact?: string | null;
  logoUrl: string | null;
  createdAt: Date;
  tournaments?: TournamentTeam[];
  divisionId: number | null;
  division?: Division | null;
}

export interface TournamentTeam {
  tournamentId: number;
  teamId: number;
  tournament?: Tournament;
  team?: Team;
  groupLinks?: TournamentTeamGroup[];
}

export interface TournamentGroup {
  id: number;
  tournamentId: number;
  name: string;
  order: number;
  tournament?: Tournament;
  teamGroups?: TournamentTeamGroup[];
  matches?: Match[];
}

export interface TournamentBracket {
  id: number;
  tournamentId: number;
  name: string;
  sortOrder: number;
  createdAt?: string;
  tournament?: Tournament;
  matches?: Match[];
}

export interface TournamentTeamGroup {
  tournamentId: number;
  teamId: number;
  groupId: number;
  tournament?: Tournament;
  tournamentTeam?: TournamentTeam;
  group?: TournamentGroup;
}

export type Match = {
  id: number;
  tournamentId: number;
  teamAId: number | null;
  teamBId: number | null;
  teamA?: Team | null;
  teamB?: Team | null;
  scoreA: number | null;
  scoreB: number | null;
  round: number | null;
  label: string | null;
  phase: MatchPhase;
  groupId?: number | null;
  group?: TournamentGroup | null;
  bracketId?: number | null;
  bracket?: TournamentBracket | null;
  groupLegacy?: string | null;
  field: string | null;
  nextMatchId?: number | null;
  loserNextMatchId?: number | null;
  nextSlot?: MatchSlot | null;
  loserNextSlot?: MatchSlot | null;
  bracketOrder?: number | null;
  nextMatchOrder?: number | null;
  status: MatchStatus;
  manualOverride?: boolean;
  createdAt?: string;
  bodyCountA?: number | null;
  bodyCountB?: number | null;
};

export interface User {
  id: number;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

export interface CreateTournamentBody {
  name: string;
  date: string;
  location: string;
  status?: TournamentStatus;
  type?: TournamentType;
  teamsToAdvance?: number;
  leagueId?: number;
  divisionId?: number | string | null;
  teamIds?: number[];
  formatConfig?: FormatConfig;
  isHidden?: boolean;
}

export interface UpdateTournamentBody {
  name?: string;
  date?: string;
  location?: string;
  status?: TournamentStatus;
  type?: TournamentType;
  managementMode?: ManagementMode;
  teamsToAdvance?: number;
  leagueId?: number | null;
  divisionId?: number | string | null;
  teamIds?: number[];
  formatConfig?: FormatConfig;
  isHidden?: boolean;
}

export interface CreateTeamBody {
  name: string;
  contact?: string;
  divisionId?: number | string | null;
}

export interface UpdateTeamBody {
  name?: string;
  contact?: string;
  divisionId?: number | string | null;
}

export type CreateMatchBody = {
  tournamentId: number;
  teamAId: number;
  teamBId: number;
  scoreA?: number;
  scoreB?: number;
  bodyCountA?: number;
  bodyCountB?: number;
  round?: number | null;
  label?: string | null;
  field?: string | null;
  phase?: MatchPhase;
  groupId?: number | null;
  bracketId?: number | null;
  nextMatchId?: number | null;
  loserNextMatchId?: number | null;
  nextSlot?: MatchSlot | null;
  loserNextSlot?: MatchSlot | null;
  bracketOrder?: number | null;
  nextMatchOrder?: number | null;
  manualOverride?: boolean;
};

export type UpdateMatchBody = {
  teamAId?: number | null;
  teamBId?: number | null;
  scoreA?: number | null;
  scoreB?: number | null;
  bodyCountA?: number | null;
  bodyCountB?: number | null;
  round?: number | null;
  label?: string | null;
  field?: string | null;
  phase?: MatchPhase;
  groupId?: number | null;
  bracketId?: number | null;
  nextMatchId?: number | null;
  loserNextMatchId?: number | null;
  nextSlot?: MatchSlot | null;
  loserNextSlot?: MatchSlot | null;
  bracketOrder?: number | null;
  nextMatchOrder?: number | null;
  status?: MatchStatus;
  manualOverride?: boolean;
};

export interface Standing {
  teamId: number;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface CreateLeagueBody {
  name: string;
  description?: string;
  logoUrl?: string;
  teamIds?: number[];
  isHidden?: boolean;
}

export interface UpdateLeagueBody {
  name?: string;
  description?: string | null;
  logoUrl?: string | null;
  teamIds?: number[];
  isHidden?: boolean;
}

export interface League {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  isHidden: boolean;
  tournaments?: Tournament[];
  teams?: { teamId: number; team: Team }[];
}

export type FormatConfig = {
  groupCount?: number;
  teamsPerGroup?: number;
  qualifiersPerGroup?: number;
  wildCardCount?: number;
  bracketSeedingRule?: "crossover" | "sequential";
  thirdPlaceMatch?: boolean;
};

export type EnrolledTeam = {
  teamId: number;
  team: Team;
  groupLinks?: TournamentTeamGroup[];
};

export type TournamentDetail = Tournament & {
  id: number;
  name: string;
  status?: TournamentStatus;
  type?: TournamentType;
  date?: string;
  location?: string | null;
  teams: EnrolledTeam[];
  matches: Match[];
  groups?: TournamentGroup[];
  brackets?: TournamentBracket[];
};

export type Division = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
};

export interface CreateDivisionBody {
  name: string;
}

export type UpdateDivisionBody = {
  name?: string;
  isActive?: boolean;
};

export type MatchDetail = {
  id: number;
  status: MatchStatus;
  round: number | null;
  scoreA: number | null;
  scoreB: number | null;
  teamAId: number;
  teamBId: number;
  groupId?: number | null;
  bracketId?: number | null;
  teamA?: { id: number; name: string };
  teamB?: { id: number; name: string };
  tournament?: { id: number; name: string };
};

export type TeamWithStats = Team & {
  tournamentCount?: number;
  totalMatches?: number;
  wins?: number;
  matchesA?: MatchDetail[];
  matchesB?: MatchDetail[];
};

export type TeamDetail = Team & {
  matchesA: MatchDetail[];
  matchesB: MatchDetail[];
  tournaments: { tournament: { id: number; name: string } }[];
};

export type LeagueTeam = {
  teamId: number;
  team: {
    id: number;
    name: string;
    divisionId?: number | null;
    division?: { id: number; name: string } | null;
  } | null;
};

export type TournamentWithMatches = Tournament & {
  divisionId?: number | null;
  division?: { id: number; name: string } | null;
  teams: {
    teamId: number;
    team: {
      id: number;
      name: string;
      divisionId?: number | null;
    } | null;
    groupLinks?: TournamentTeamGroup[];
  }[];
  matches: Match[];
  groups?: TournamentGroup[];
  brackets?: TournamentBracket[];
};

export type LeagueDetailResponse = Omit<League, "tournaments" | "teams"> & {
  tournaments: TournamentWithMatches[];
  teams: LeagueTeam[];
  manualStandingTables: LeagueManualStandingTable[];
};

export interface AssignTeamGroupBody {
  teamId: number;
  groupIds: number[];
}

export type LeagueFormState = {
  name: string;
  description: string;
  logoUrl: string;
  isHidden: boolean;
};

export type LeagueDetail = League & {
  tournaments: TournamentWithDivision[];
  teams: EnrolledTeam[];
  manualStandingTables?: LeagueManualStandingTable[];
};

export type TournamentWithDivision = Tournament & {
  divisionId?: number | null;
  division?: { id: number; name: string } | null;
  brackets?: TournamentBracket[];
};

export type LeagueFormErrors = Partial<Record<keyof LeagueFormState, string>>;
export type LeagueDetailTab = "tournaments" | "teams" | "manual-standings" | "info";

export type LeagueManualStandingScore = {
  id: number;
  dayId: number;
  teamId: number;
  score: number | null;
  eventRank: number | null;
  createdAt: string;
  updatedAt: string;
  team?: Team;
};

export type LeagueManualStandingDay = {
  id: number;
  tableId: number;
  tournamentId: number;
  label: string;
  date: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  tournament?: Tournament;
  scores: LeagueManualStandingScore[];
};

export type LeagueManualStandingTable = {
  id: number;
  leagueId: number;
  divisionId: number;
  createdAt: string;
  updatedAt: string;
  division?: Division;
  days: LeagueManualStandingDay[];
};

export type LeagueManualStandingCellInput = {
  dayId: number;
  teamId: number;
  score: number | null;
  eventRank?: number | null;
};