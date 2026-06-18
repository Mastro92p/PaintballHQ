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
  status?: TournamentStatus
  teamIds?: number[]
}

export interface UpdateTournamentBody {
  name?: string
  date?: string
  location?: string
  status?: TournamentStatus
  teamIds?: number[]
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