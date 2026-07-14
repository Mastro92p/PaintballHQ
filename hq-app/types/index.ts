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
  formatConfig: FormatConfig | null;
  type:           string;
  teamsToAdvance: number;
  leagueId:       number | null;
  //division for the tournament
}

export interface Team {
  id: number
  name: string
  contact?: string | null
  logoUrl: string | null;
  createdAt: Date
  tournaments?: TournamentTeam[]
  //add division
}

export interface TournamentTeam {
  tournamentId: number
  teamId: number
  tournament?: Tournament
  team?: Team
}

export interface Match {
  id: number
  tournamentId: number
  teamAId?: number | null
  teamBId?: number | null
  scoreA?: number | null
  scoreB?: number | null
  round: number
  field?: string | null
  status: MatchStatus
  createdAt: Date
  tournament?: Tournament
  teamA?: Team | null
  teamB?: Team | null
  phase: string
  group?: string | null

  nextMatchId?: number | null
  bracketOrder?: number | null
  nextMatchOrder?: number | null
  nextSlot?: string | null

  loserNextMatchId?: number | null
  loserNextSlot?: string | null

  manualOverride?: boolean
  label?: string | null

  bodyCountA?: number | null;
  bodyCountB?: number | null;

}

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
  type?: string           // ← new
  teamsToAdvance?: number // ← new
  leagueId?: number       // ← new
  teamIds?: number[]
  formatConfig?: FormatConfig;
}

export interface UpdateTournamentBody {
  name?: string
  date?: string
  location?: string
  status?: string
  type?: string           // ← new
  teamsToAdvance?: number // ← new
  leagueId?: number | null // ← new
  teamIds?: number[]
  formatConfig?: FormatConfig;
}

export interface CreateTeamBody {
  name: string
  contact?: string
}

export interface UpdateTeamBody {
  name?: string
  contact?: string
}

export interface CreateMatchBody {
  tournamentId: number
  teamAId: number
  teamBId: number
  scoreA?: number
  scoreB?: number
  bodyCountA?: number
  bodyCountB?: number
  round?: number | null
  label?: string | null
  field?: string | null
}

export type UpdateMatchBody = {
  teamAId?: number
  teamBId?: number
  scoreA?: number | null
  scoreB?: number | null
  bodyCountA?: number | null
  bodyCountB?: number | null
  round?: number | null
  label?: string | null
  field?: string | null
}

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
  id:          number;
  name:        string;
  description: string | null;
  logoUrl:     string | null;
  createdAt:   string;
  tournaments?: Tournament[];
  teams?:      { teamId: number; team: Team }[];
}

// Update Tournament type:

export type FormatConfig = {
  groupCount?:         number;
  teamsPerGroup?:      number;
  qualifiersPerGroup?: number;
  wildCardCount?: number;
  bracketSeedingRule?: "crossover" | "sequential";
  thirdPlaceMatch?: boolean;
};

export type EnrolledTeam = {
  teamId: number;
  team: Team;
};

export type TournamentDetail = Tournament & {
  id: number;
  name: string;
  status?: string;
  type?: string;
  date?: string;
  location?: string | null;
  teams: EnrolledTeam[];
  matches: Match[];
};