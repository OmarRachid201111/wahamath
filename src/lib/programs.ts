export const PROGRAMS = [
  { code: 'tcs', name: 'Tronc Commun Scientifique', shortName: 'TCS', assetType: 'page-2' },
  { code: 'sm1', name: '1ère année Bac Sciences Mathématiques', shortName: '1BAC SM', assetType: 'page-3' },
  { code: 'sm2', name: '2ème année Bac Sciences Mathématiques', shortName: '2BAC SM', assetType: 'page-3' },
  { code: 'pc2', name: '2ème année Bac Sciences Physiques', shortName: '2BAC PC', assetType: 'exercise' },
] as const

export type ProgramCode = (typeof PROGRAMS)[number]['code']

export function getProgram(code: string) {
  return PROGRAMS.find((program) => program.code === code)
}
