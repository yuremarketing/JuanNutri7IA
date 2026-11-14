export type FonteAlimento = 'TACO' | 'USDA' | 'TABELA_PROPRIA_JUAN';

export type CategoriaAlimento =
  | 'proteina'
  | 'carboidrato'
  | 'gordura'
  | 'vegetal'
  | 'fruta'
  | 'suplemento';

export interface AlimentoDoc {
  nome: string;
  categoria: CategoriaAlimento;
  porcaoReferenciaG: number;
  proteinaG: number;
  carboidratoG: number;
  lipideosG: number;
  fibrasG?: number;
  caloriasKcal: number;
  fonte: FonteAlimento;
  observacoes?: string;
  atualizadoEm: unknown;
}

export type FormulaTmb = 'mifflin' | 'harris_benedict' | 'katch_mcardle';

export interface TmbConfigDoc {
  formulaPadrao: FormulaTmb;
  fatoresAtividade: {
    sedentario: number;
    leve: number;
    moderado: number;
    intenso: number;
    muitoIntenso: number;
  };
  ajusteObjetivo: {
    emagrecimentoKcal: number;
    hipertrofiaKcal: number;
  };
  atualizadoEm: unknown;
}

export interface MicronutrienteDoc {
  nutriente: string;
  dosagemReferencia?: string;
  alimentosFontes?: string[];
  condutaClinicaJuan: string;
  atualizadoEm: unknown;
}
