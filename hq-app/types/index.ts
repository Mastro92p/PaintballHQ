export type TournamentStatus = 'upcoming' | 'active' | 'completed'
export type MatchStatus = 'pending' | 'completed'
export type UserRole = 'organizer' | 'admin'

export interface Tournament {
  id: number
  name: string
  date: string
  location: string
  status: TournamentStatus
  createdAt: Date
  teams?: TournamentTeam[]
  matches?: Match[]
  groups?: TournamentGroup[]
  formatConfig: FormatConfig | null
  type: string
  teamsToAdvance: number
  leagueId: number | null
  divisionId: number | null
  division?: Division | null
  managementMode: 'auto' | 'manual'
}

export interface Team {
  id: number
  name: string
  contact?: string | null
  logoUrl: string | null
  createdAt: Date
  tournaments?: TournamentTeam[]
  divisionId: number | null
  division?: Division | null
}

export interface TournamentTeam {
  tournamentId: number
  teamId: number
  tournament?: Tournament
  team?: Team
  groupLinks?: TournamentTeamGroup[]
}

export interface TournamentGroup {
  id: number
  tournamentId: number
  name: string
  order: number
  tournament?: Tournament
  teamGroups?: TournamentTeamGroup[]
  matches?: Match[]
}

export interface TournamentTeamGroup {
  tournamentId: number
  teamId: number
  groupId: number
  tournament?: Tournament
  tournamentTeam?: TournamentTeam
  group?: TournamentGroup
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
  phase: string;
  groupId?: number | null;
  group?: TournamentGroup | null;
  groupLegacy?: string | null;
  field: string | null;
  nextMatchId?: number | null;
  loserNextMatchId?: number | null;
  nextSlot?: string | null;
  loserNextSlot?: string | null;
  bracketOrder?: number | null;
  nextMatchOrder?: number | null;
  status: string;
  manualOverride?: boolean;
  createdAt?: string;
  bodyCountA?: number | null;
  bodyCountB?: number | null;
};

export interface User {
  id: number
  email: string
  password: string
  role: UserRole
  createdAt: Date
}

export interface CreateTournamentBody {
  name: string
  date: string
  location: string
  status?: string
  type?: string
  teamsToAdvance?: number
  leagueId?: number
  divisionId?: number | string | null
  teamIds?: number[]
  formatConfig?: FormatConfig
}

export interface UpdateTournamentBody {
  name?: string
  date?: string
  location?: string
  status?: string
  type?: string
  managementMode?: 'auto' | 'manual'
  teamsToAdvance?: number
  leagueId?: number | null
  divisionId?: number | string | null
  teamIds?: number[]
  formatConfig?: FormatConfig
}

export interface CreateTeamBody {
  name: string
  contact?: string
  divisionId?: number | string | null
}

export interface UpdateTeamBody {
  name?: string
  contact?: string
  divisionId?: number | string | null
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
  phase?: Match["phase"];
  groupId?: number | null;
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
  phase?: Match["phase"];
  groupId?: number | null;
};

export interface Standing {
  teamId: number
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

export interface CreateLeagueBody {
  name: string
  description?: string
  logoUrl?: string
  teamIds?: number[]
}

export interface UpdateLeagueBody {
  name?: string
  description?: string | null
  logoUrl?: string | null
  teamIds?: number[]
}

export interface League {
  id: number
  name: string
  description: string | null
  logoUrl: string | null
  createdAt: string
  tournaments?: Tournament[]
  teams?: { teamId: number; team: Team }[]
}

export type FormatConfig = {
  groupCount?: number
  teamsPerGroup?: number
  qualifiersPerGroup?: number
  wildCardCount?: number
  bracketSeedingRule?: 'crossover' | 'sequential'
  thirdPlaceMatch?: boolean
}

export type EnrolledTeam = {
  teamId: number
  team: Team
  groupLinks?: TournamentTeamGroup[]
}

export type TournamentDetail = Tournament & {
  id: number
  name: string
  status?: string
  type?: string
  date?: string
  location?: string | null
  teams: EnrolledTeam[]
  matches: Match[]
  groups?: TournamentGroup[]
}

export type Division = {
  id: number
  name: string
  isActive: boolean
  createdAt: string
}

export interface CreateDivisionBody {
  name: string
}

export type UpdateDivisionBody = {
  name?: string
  isActive?: boolean
}

export type MatchDetail = {
  id: number
  status: string
  round: number | null
  scoreA: number | null
  scoreB: number | null
  teamAId: number
  teamBId: number
  groupId?: number | null
  teamA?: { id: number; name: string }
  teamB?: { id: number; name: string }
  tournament?: { id: number; name: string }
}

export type TeamWithStats = Team & {
  tournamentCount?: number
  totalMatches?: number
  wins?: number
  matchesA?: MatchDetail[]
  matchesB?: MatchDetail[]
}

export type TeamDetail = Team & {
  matchesA: MatchDetail[]
  matchesB: MatchDetail[]
  tournaments: { tournament: { id: number; name: string } }[]
}

export type LeagueTeam = {
  teamId: number
  team: {
    id: number
    name: string
    divisionId?: number | null
    division?: { id: number; name: string } | null
  } | null
}

export type TournamentWithMatches = Tournament & {
  divisionId?: number | null
  division?: { id: number; name: string } | null
  teams: {
    teamId: number
    team: {
      id: number
      name: string
      divisionId?: number | null
    } | null
    groupLinks?: TournamentTeamGroup[]
  }[]
  matches: Match[]
  groups?: TournamentGroup[]
}

export type LeagueDetailResponse = Omit<League, 'tournaments' | 'teams'> & {
  tournaments: TournamentWithMatches[]
  teams: LeagueTeam[]
}

export interface AssignTeamGroupBody {
  teamId: number
  groupIds: number[]
}

