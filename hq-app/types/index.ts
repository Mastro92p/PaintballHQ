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
}

export interface Team {
  id: number
  name: string
  contact?: string | null
  createdAt: Date
  tournaments?: TournamentTeam[]
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
  teamAId: number
  teamBId: number
  scoreA?: number | null
  scoreB?: number | null
  round: number
  field?: string | null
  status: MatchStatus
  createdAt: Date
  tournament?: Tournament
  teamA?: Team
  teamB?: Team
  phase: string
  group?: string | null
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
  round?: number
  field?: string
}

export type UpdateMatchBody = {
  teamAId?: number;
  teamBId?: number;
  scoreA?:  number | null;
  scoreB?:  number | null;
  round?:   number;
  field?:   string | null;
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
export interface Tournament {
  // ...existing fields...
  type:           string;
  teamsToAdvance: number;
  leagueId:       number | null;
}


export type FormatConfig = {
  groupCount:         number;
  teamsPerGroup:      number;
  qualifiersPerGroup: number;
  wildCardCount: number;
  bracketSeedingRule: "crossover" | "sequential";
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