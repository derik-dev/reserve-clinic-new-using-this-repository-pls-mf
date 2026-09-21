import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Configuracao_Key {
  perfilId: string;
  __typename?: 'Configuracao_Key';
}

export interface ConfirmarConsultaPagaData {
  consulta_update?: Consulta_Key | null;
}

export interface ConfirmarConsultaPagaVariables {
  consultaId: UUIDString;
  valorPago?: number | null;
}

export interface Consulta_Key {
  id: UUIDString;
  __typename?: 'Consulta_Key';
}

export interface CreateConsultaData {
  consulta_insert: Consulta_Key;
}

export interface CreateConsultaVariables {
  pacienteId?: UUIDString | null;
  pacienteNome: string;
  pacienteTelefone?: string | null;
  pacienteEmail?: string | null;
  dataHora: TimestampString;
  duracaoMin: number;
  servico?: string | null;
  profissional?: string | null;
  profissionalId?: UUIDString | null;
  valor?: number | null;
  status: string;
  pixId?: string | null;
  metodoPagamento?: string | null;
  observacoes?: string | null;
}

export interface CreatePacienteData {
  paciente_insert: Paciente_Key;
}

export interface CreatePacienteVariables {
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cpf?: string | null;
  dataNascimento?: DateString | null;
  observacoes?: string | null;
}

export interface CreateProfissionalData {
  profissional_insert: Profissional_Key;
}

export interface CreateProfissionalVariables {
  nome: string;
  especialidade?: string | null;
  whatsapp?: string | null;
  cpf?: string | null;
  anosExperiencia?: number | null;
  fotoUrl?: string | null;
  valorConsulta?: number | null;
}

export interface CreatePublicConsultaData {
  consulta_insert: Consulta_Key;
}

export interface CreatePublicConsultaVariables {
  perfilId: string;
  clienteNome: string;
  clienteTelefone?: string | null;
  clienteEmail?: string | null;
  dataHora: TimestampString;
  duracaoMin: number;
  servico?: string | null;
  profissional?: string | null;
  profissionalId?: UUIDString | null;
  valor?: number | null;
  observacoes?: string | null;
}

export interface DeleteConsultaData {
  consulta_delete?: Consulta_Key | null;
}

export interface DeleteConsultaVariables {
  id: UUIDString;
}

export interface DeletePacienteData {
  paciente_delete?: Paciente_Key | null;
}

export interface DeletePacienteVariables {
  id: UUIDString;
}

export interface DeleteProfissionalData {
  profissional_delete?: Profissional_Key | null;
}

export interface DeleteProfissionalVariables {
  id: UUIDString;
}

export interface DisponibilidadeSemanal_Key {
  id: UUIDString;
  __typename?: 'DisponibilidadeSemanal_Key';
}

export interface Excecao_Key {
  id: UUIDString;
  __typename?: 'Excecao_Key';
}

export interface GetMeuPerfilData {
  perfil?: {
    id: string;
    nome: string;
    slug: string;
    tipo?: string | null;
    logoUrl?: string | null;
    corPrimaria?: string | null;
    corSecundaria?: string | null;
    telefone?: string | null;
    emailContato?: string | null;
    onboardingConcluido: boolean;
    pixChave?: string | null;
    site?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    valorConsulta?: number | null;
    createdAt: TimestampString;
  } & Perfil_Key;
}

export interface GetMinhaConfiguracaoData {
  configuracao?: {
    perfilId: string;
    agendaConfig: unknown;
    duracaoAtendimentoMin?: number | null;
    tipoPagamento?: string | null;
    valorAtendimento?: number | null;
    valorSinal?: number | null;
    antecedenciaMinimaHoras?: number | null;
    qrCodeManualUrl?: string | null;
    chavePixManual?: string | null;
  } & Configuracao_Key;
}

export interface GetPublicConfiguracaoData {
  configuracao?: {
    agendaConfig: unknown;
    duracaoAtendimentoMin?: number | null;
    tipoPagamento?: string | null;
    valorAtendimento?: number | null;
    valorSinal?: number | null;
    antecedenciaMinimaHoras?: number | null;
  };
}

export interface GetPublicConfiguracaoVariables {
  perfilId: string;
}

export interface GetPublicPerfilBySlugData {
  perfis: ({
    id: string;
    nome: string;
    slug: string;
    logoUrl?: string | null;
    corPrimaria?: string | null;
    corSecundaria?: string | null;
    telefone?: string | null;
    emailContato?: string | null;
    enderecoRua?: string | null;
    enderecoNumero?: string | null;
    enderecoCidade?: string | null;
    enderecoUf?: string | null;
    pixChave?: string | null;
    valorConsulta?: number | null;
  } & Perfil_Key)[];
}

export interface GetPublicPerfilBySlugVariables {
  slug: string;
}

export interface ListMeusPacientesData {
  pacientes: ({
    id: UUIDString;
    perfilId: string;
    nome: string;
    telefone?: string | null;
    email?: string | null;
    cpf?: string | null;
    dataNascimento?: DateString | null;
    observacoes?: string | null;
    status: string;
    createdAt: TimestampString;
  } & Paciente_Key)[];
}

export interface ListMeusProfissionaisData {
  profissionais: ({
    id: UUIDString;
    perfilId: string;
    nome: string;
    especialidade?: string | null;
    whatsapp?: string | null;
    cpf?: string | null;
    anosExperiencia?: number | null;
    fotoUrl?: string | null;
    ativo: boolean;
    valorConsulta?: number | null;
    createdAt: TimestampString;
  } & Profissional_Key)[];
}

export interface ListMinhasConsultasData {
  consultas: ({
    id: UUIDString;
    perfilId: string;
    pacienteId?: UUIDString | null;
    pacienteNome: string;
    pacienteTelefone?: string | null;
    pacienteEmail?: string | null;
    dataHora: TimestampString;
    duracaoMin: number;
    servico?: string | null;
    profissional?: string | null;
    profissionalId?: UUIDString | null;
    valor?: number | null;
    status: string;
    pixId?: string | null;
    metodoPagamento?: string | null;
    observacoes?: string | null;
    origem: string;
    createdAt: TimestampString;
  } & Consulta_Key)[];
}

export interface ListMinhasConsultasVariables {
  from?: TimestampString | null;
  to?: TimestampString | null;
}

export interface ListPublicBusyConsultasData {
  consultas: ({
    id: UUIDString;
    dataHora: TimestampString;
    duracaoMin: number;
    profissionalId?: UUIDString | null;
  } & Consulta_Key)[];
}

export interface ListPublicBusyConsultasVariables {
  perfilId: string;
  from: TimestampString;
  to: TimestampString;
}

export interface ListPublicProfissionaisData {
  profissionais: ({
    id: UUIDString;
    nome: string;
    especialidade?: string | null;
    fotoUrl?: string | null;
    valorConsulta?: number | null;
  } & Profissional_Key)[];
}

export interface ListPublicProfissionaisVariables {
  perfilId: string;
}

export interface Paciente_Key {
  id: UUIDString;
  __typename?: 'Paciente_Key';
}

export interface Perfil_Key {
  id: string;
  __typename?: 'Perfil_Key';
}

export interface Profissional_Key {
  id: UUIDString;
  __typename?: 'Profissional_Key';
}

export interface SetConsultaPixIdData {
  consulta_update?: Consulta_Key | null;
}

export interface SetConsultaPixIdVariables {
  consultaId: UUIDString;
  pixId: string;
}

export interface SetConsultaStatusData {
  consulta_update?: Consulta_Key | null;
}

export interface SetConsultaStatusVariables {
  id: UUIDString;
  status: string;
  pacienteId?: UUIDString | null;
}

export interface SetPacienteStatusData {
  paciente_update?: Paciente_Key | null;
}

export interface SetPacienteStatusVariables {
  id: UUIDString;
  status: string;
}

export interface UpdateConsultaData {
  consulta_update?: Consulta_Key | null;
}

export interface UpdateConsultaVariables {
  id: UUIDString;
  pacienteId?: UUIDString | null;
  pacienteNome: string;
  pacienteTelefone?: string | null;
  pacienteEmail?: string | null;
  dataHora: TimestampString;
  duracaoMin: number;
  servico?: string | null;
  profissional?: string | null;
  profissionalId?: UUIDString | null;
  valor?: number | null;
  status: string;
  pixId?: string | null;
  metodoPagamento?: string | null;
  observacoes?: string | null;
}

export interface UpdatePacienteData {
  paciente_update?: Paciente_Key | null;
}

export interface UpdatePacienteVariables {
  id: UUIDString;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cpf?: string | null;
  dataNascimento?: DateString | null;
  observacoes?: string | null;
}

export interface UpdateProfissionalData {
  profissional_update?: Profissional_Key | null;
}

export interface UpdateProfissionalVariables {
  id: UUIDString;
  nome: string;
  especialidade?: string | null;
  whatsapp?: string | null;
  cpf?: string | null;
  anosExperiencia?: number | null;
  fotoUrl?: string | null;
  valorConsulta?: number | null;
  ativo?: boolean | null;
}

export interface UpsertMeuPerfilData {
  perfil_upsert: Perfil_Key;
}

export interface UpsertMeuPerfilVariables {
  nome: string;
  slug: string;
  tipo?: string | null;
  telefone?: string | null;
  emailContato?: string | null;
  logoUrl?: string | null;
  corPrimaria?: string | null;
  corSecundaria?: string | null;
  cpfCnpj?: string | null;
  enderecoCep?: string | null;
  enderecoRua?: string | null;
  enderecoNumero?: string | null;
  enderecoBairro?: string | null;
  enderecoCidade?: string | null;
  enderecoUf?: string | null;
  pixChave?: string | null;
  site?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  valorConsulta?: number | null;
}

export interface UpsertMinhaConfiguracaoData {
  configuracao_upsert: Configuracao_Key;
}

export interface UpsertMinhaConfiguracaoVariables {
  agendaConfig: unknown;
  duracaoAtendimentoMin?: number | null;
  tipoPagamento?: string | null;
  valorAtendimento?: number | null;
  valorSinal?: number | null;
  antecedenciaMinimaHoras?: number | null;
  qrCodeManualUrl?: string | null;
  chavePixManual?: string | null;
}

interface UpsertMeuPerfilRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertMeuPerfilVariables): MutationRef<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertMeuPerfilVariables): MutationRef<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;
  operationName: string;
}
export const upsertMeuPerfilRef: UpsertMeuPerfilRef;

export function upsertMeuPerfil(vars: UpsertMeuPerfilVariables): MutationPromise<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;
export function upsertMeuPerfil(dc: DataConnect, vars: UpsertMeuPerfilVariables): MutationPromise<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;

interface UpsertMinhaConfiguracaoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertMinhaConfiguracaoVariables): MutationRef<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertMinhaConfiguracaoVariables): MutationRef<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;
  operationName: string;
}
export const upsertMinhaConfiguracaoRef: UpsertMinhaConfiguracaoRef;

export function upsertMinhaConfiguracao(vars: UpsertMinhaConfiguracaoVariables): MutationPromise<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;
export function upsertMinhaConfiguracao(dc: DataConnect, vars: UpsertMinhaConfiguracaoVariables): MutationPromise<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;

interface CreatePacienteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePacienteVariables): MutationRef<CreatePacienteData, CreatePacienteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePacienteVariables): MutationRef<CreatePacienteData, CreatePacienteVariables>;
  operationName: string;
}
export const createPacienteRef: CreatePacienteRef;

export function createPaciente(vars: CreatePacienteVariables): MutationPromise<CreatePacienteData, CreatePacienteVariables>;
export function createPaciente(dc: DataConnect, vars: CreatePacienteVariables): MutationPromise<CreatePacienteData, CreatePacienteVariables>;

interface UpdatePacienteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePacienteVariables): MutationRef<UpdatePacienteData, UpdatePacienteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePacienteVariables): MutationRef<UpdatePacienteData, UpdatePacienteVariables>;
  operationName: string;
}
export const updatePacienteRef: UpdatePacienteRef;

export function updatePaciente(vars: UpdatePacienteVariables): MutationPromise<UpdatePacienteData, UpdatePacienteVariables>;
export function updatePaciente(dc: DataConnect, vars: UpdatePacienteVariables): MutationPromise<UpdatePacienteData, UpdatePacienteVariables>;

interface SetPacienteStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPacienteStatusVariables): MutationRef<SetPacienteStatusData, SetPacienteStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetPacienteStatusVariables): MutationRef<SetPacienteStatusData, SetPacienteStatusVariables>;
  operationName: string;
}
export const setPacienteStatusRef: SetPacienteStatusRef;

export function setPacienteStatus(vars: SetPacienteStatusVariables): MutationPromise<SetPacienteStatusData, SetPacienteStatusVariables>;
export function setPacienteStatus(dc: DataConnect, vars: SetPacienteStatusVariables): MutationPromise<SetPacienteStatusData, SetPacienteStatusVariables>;

interface DeletePacienteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePacienteVariables): MutationRef<DeletePacienteData, DeletePacienteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeletePacienteVariables): MutationRef<DeletePacienteData, DeletePacienteVariables>;
  operationName: string;
}
export const deletePacienteRef: DeletePacienteRef;

export function deletePaciente(vars: DeletePacienteVariables): MutationPromise<DeletePacienteData, DeletePacienteVariables>;
export function deletePaciente(dc: DataConnect, vars: DeletePacienteVariables): MutationPromise<DeletePacienteData, DeletePacienteVariables>;

interface CreateProfissionalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProfissionalVariables): MutationRef<CreateProfissionalData, CreateProfissionalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateProfissionalVariables): MutationRef<CreateProfissionalData, CreateProfissionalVariables>;
  operationName: string;
}
export const createProfissionalRef: CreateProfissionalRef;

export function createProfissional(vars: CreateProfissionalVariables): MutationPromise<CreateProfissionalData, CreateProfissionalVariables>;
export function createProfissional(dc: DataConnect, vars: CreateProfissionalVariables): MutationPromise<CreateProfissionalData, CreateProfissionalVariables>;

interface UpdateProfissionalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProfissionalVariables): MutationRef<UpdateProfissionalData, UpdateProfissionalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateProfissionalVariables): MutationRef<UpdateProfissionalData, UpdateProfissionalVariables>;
  operationName: string;
}
export const updateProfissionalRef: UpdateProfissionalRef;

export function updateProfissional(vars: UpdateProfissionalVariables): MutationPromise<UpdateProfissionalData, UpdateProfissionalVariables>;
export function updateProfissional(dc: DataConnect, vars: UpdateProfissionalVariables): MutationPromise<UpdateProfissionalData, UpdateProfissionalVariables>;

interface DeleteProfissionalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteProfissionalVariables): MutationRef<DeleteProfissionalData, DeleteProfissionalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteProfissionalVariables): MutationRef<DeleteProfissionalData, DeleteProfissionalVariables>;
  operationName: string;
}
export const deleteProfissionalRef: DeleteProfissionalRef;

export function deleteProfissional(vars: DeleteProfissionalVariables): MutationPromise<DeleteProfissionalData, DeleteProfissionalVariables>;
export function deleteProfissional(dc: DataConnect, vars: DeleteProfissionalVariables): MutationPromise<DeleteProfissionalData, DeleteProfissionalVariables>;

interface CreateConsultaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateConsultaVariables): MutationRef<CreateConsultaData, CreateConsultaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateConsultaVariables): MutationRef<CreateConsultaData, CreateConsultaVariables>;
  operationName: string;
}
export const createConsultaRef: CreateConsultaRef;

export function createConsulta(vars: CreateConsultaVariables): MutationPromise<CreateConsultaData, CreateConsultaVariables>;
export function createConsulta(dc: DataConnect, vars: CreateConsultaVariables): MutationPromise<CreateConsultaData, CreateConsultaVariables>;

interface UpdateConsultaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateConsultaVariables): MutationRef<UpdateConsultaData, UpdateConsultaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateConsultaVariables): MutationRef<UpdateConsultaData, UpdateConsultaVariables>;
  operationName: string;
}
export const updateConsultaRef: UpdateConsultaRef;

export function updateConsulta(vars: UpdateConsultaVariables): MutationPromise<UpdateConsultaData, UpdateConsultaVariables>;
export function updateConsulta(dc: DataConnect, vars: UpdateConsultaVariables): MutationPromise<UpdateConsultaData, UpdateConsultaVariables>;

interface SetConsultaStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetConsultaStatusVariables): MutationRef<SetConsultaStatusData, SetConsultaStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetConsultaStatusVariables): MutationRef<SetConsultaStatusData, SetConsultaStatusVariables>;
  operationName: string;
}
export const setConsultaStatusRef: SetConsultaStatusRef;

export function setConsultaStatus(vars: SetConsultaStatusVariables): MutationPromise<SetConsultaStatusData, SetConsultaStatusVariables>;
export function setConsultaStatus(dc: DataConnect, vars: SetConsultaStatusVariables): MutationPromise<SetConsultaStatusData, SetConsultaStatusVariables>;

interface DeleteConsultaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteConsultaVariables): MutationRef<DeleteConsultaData, DeleteConsultaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteConsultaVariables): MutationRef<DeleteConsultaData, DeleteConsultaVariables>;
  operationName: string;
}
export const deleteConsultaRef: DeleteConsultaRef;

export function deleteConsulta(vars: DeleteConsultaVariables): MutationPromise<DeleteConsultaData, DeleteConsultaVariables>;
export function deleteConsulta(dc: DataConnect, vars: DeleteConsultaVariables): MutationPromise<DeleteConsultaData, DeleteConsultaVariables>;

interface CreatePublicConsultaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePublicConsultaVariables): MutationRef<CreatePublicConsultaData, CreatePublicConsultaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePublicConsultaVariables): MutationRef<CreatePublicConsultaData, CreatePublicConsultaVariables>;
  operationName: string;
}
export const createPublicConsultaRef: CreatePublicConsultaRef;

export function createPublicConsulta(vars: CreatePublicConsultaVariables): MutationPromise<CreatePublicConsultaData, CreatePublicConsultaVariables>;
export function createPublicConsulta(dc: DataConnect, vars: CreatePublicConsultaVariables): MutationPromise<CreatePublicConsultaData, CreatePublicConsultaVariables>;

interface SetConsultaPixIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetConsultaPixIdVariables): MutationRef<SetConsultaPixIdData, SetConsultaPixIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetConsultaPixIdVariables): MutationRef<SetConsultaPixIdData, SetConsultaPixIdVariables>;
  operationName: string;
}
export const setConsultaPixIdRef: SetConsultaPixIdRef;

export function setConsultaPixId(vars: SetConsultaPixIdVariables): MutationPromise<SetConsultaPixIdData, SetConsultaPixIdVariables>;
export function setConsultaPixId(dc: DataConnect, vars: SetConsultaPixIdVariables): MutationPromise<SetConsultaPixIdData, SetConsultaPixIdVariables>;

interface ConfirmarConsultaPagaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ConfirmarConsultaPagaVariables): MutationRef<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ConfirmarConsultaPagaVariables): MutationRef<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;
  operationName: string;
}
export const confirmarConsultaPagaRef: ConfirmarConsultaPagaRef;

export function confirmarConsultaPaga(vars: ConfirmarConsultaPagaVariables): MutationPromise<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;
export function confirmarConsultaPaga(dc: DataConnect, vars: ConfirmarConsultaPagaVariables): MutationPromise<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;

interface GetMeuPerfilRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMeuPerfilData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMeuPerfilData, undefined>;
  operationName: string;
}
export const getMeuPerfilRef: GetMeuPerfilRef;

export function getMeuPerfil(options?: ExecuteQueryOptions): QueryPromise<GetMeuPerfilData, undefined>;
export function getMeuPerfil(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMeuPerfilData, undefined>;

interface GetPublicPerfilBySlugRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPublicPerfilBySlugVariables): QueryRef<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetPublicPerfilBySlugVariables): QueryRef<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;
  operationName: string;
}
export const getPublicPerfilBySlugRef: GetPublicPerfilBySlugRef;

export function getPublicPerfilBySlug(vars: GetPublicPerfilBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;
export function getPublicPerfilBySlug(dc: DataConnect, vars: GetPublicPerfilBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;

interface GetPublicConfiguracaoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPublicConfiguracaoVariables): QueryRef<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetPublicConfiguracaoVariables): QueryRef<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;
  operationName: string;
}
export const getPublicConfiguracaoRef: GetPublicConfiguracaoRef;

export function getPublicConfiguracao(vars: GetPublicConfiguracaoVariables, options?: ExecuteQueryOptions): QueryPromise<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;
export function getPublicConfiguracao(dc: DataConnect, vars: GetPublicConfiguracaoVariables, options?: ExecuteQueryOptions): QueryPromise<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;

interface ListPublicProfissionaisRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListPublicProfissionaisVariables): QueryRef<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListPublicProfissionaisVariables): QueryRef<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;
  operationName: string;
}
export const listPublicProfissionaisRef: ListPublicProfissionaisRef;

export function listPublicProfissionais(vars: ListPublicProfissionaisVariables, options?: ExecuteQueryOptions): QueryPromise<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;
export function listPublicProfissionais(dc: DataConnect, vars: ListPublicProfissionaisVariables, options?: ExecuteQueryOptions): QueryPromise<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;

interface ListPublicBusyConsultasRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListPublicBusyConsultasVariables): QueryRef<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListPublicBusyConsultasVariables): QueryRef<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;
  operationName: string;
}
export const listPublicBusyConsultasRef: ListPublicBusyConsultasRef;

export function listPublicBusyConsultas(vars: ListPublicBusyConsultasVariables, options?: ExecuteQueryOptions): QueryPromise<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;
export function listPublicBusyConsultas(dc: DataConnect, vars: ListPublicBusyConsultasVariables, options?: ExecuteQueryOptions): QueryPromise<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;

interface GetMinhaConfiguracaoRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMinhaConfiguracaoData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMinhaConfiguracaoData, undefined>;
  operationName: string;
}
export const getMinhaConfiguracaoRef: GetMinhaConfiguracaoRef;

export function getMinhaConfiguracao(options?: ExecuteQueryOptions): QueryPromise<GetMinhaConfiguracaoData, undefined>;
export function getMinhaConfiguracao(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMinhaConfiguracaoData, undefined>;

interface ListMeusPacientesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMeusPacientesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMeusPacientesData, undefined>;
  operationName: string;
}
export const listMeusPacientesRef: ListMeusPacientesRef;

export function listMeusPacientes(options?: ExecuteQueryOptions): QueryPromise<ListMeusPacientesData, undefined>;
export function listMeusPacientes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMeusPacientesData, undefined>;

interface ListMinhasConsultasRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListMinhasConsultasVariables): QueryRef<ListMinhasConsultasData, ListMinhasConsultasVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListMinhasConsultasVariables): QueryRef<ListMinhasConsultasData, ListMinhasConsultasVariables>;
  operationName: string;
}
export const listMinhasConsultasRef: ListMinhasConsultasRef;

export function listMinhasConsultas(vars?: ListMinhasConsultasVariables, options?: ExecuteQueryOptions): QueryPromise<ListMinhasConsultasData, ListMinhasConsultasVariables>;
export function listMinhasConsultas(dc: DataConnect, vars?: ListMinhasConsultasVariables, options?: ExecuteQueryOptions): QueryPromise<ListMinhasConsultasData, ListMinhasConsultasVariables>;

interface ListMeusProfissionaisRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMeusProfissionaisData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMeusProfissionaisData, undefined>;
  operationName: string;
}
export const listMeusProfissionaisRef: ListMeusProfissionaisRef;

export function listMeusProfissionais(options?: ExecuteQueryOptions): QueryPromise<ListMeusProfissionaisData, undefined>;
export function listMeusProfissionais(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMeusProfissionaisData, undefined>;

