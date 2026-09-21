import { UpsertMeuPerfilData, UpsertMeuPerfilVariables, UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables, CreatePacienteData, CreatePacienteVariables, UpdatePacienteData, UpdatePacienteVariables, SetPacienteStatusData, SetPacienteStatusVariables, DeletePacienteData, DeletePacienteVariables, CreateProfissionalData, CreateProfissionalVariables, UpdateProfissionalData, UpdateProfissionalVariables, DeleteProfissionalData, DeleteProfissionalVariables, CreateConsultaData, CreateConsultaVariables, UpdateConsultaData, UpdateConsultaVariables, SetConsultaStatusData, SetConsultaStatusVariables, DeleteConsultaData, DeleteConsultaVariables, CreatePublicConsultaData, CreatePublicConsultaVariables, SetConsultaPixIdData, SetConsultaPixIdVariables, ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables, GetMeuPerfilData, GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables, GetPublicConfiguracaoData, GetPublicConfiguracaoVariables, ListPublicProfissionaisData, ListPublicProfissionaisVariables, ListPublicBusyConsultasData, ListPublicBusyConsultasVariables, GetMinhaConfiguracaoData, ListMeusPacientesData, ListMinhasConsultasData, ListMinhasConsultasVariables, ListMeusProfissionaisData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useUpsertMeuPerfil(options?: useDataConnectMutationOptions<UpsertMeuPerfilData, FirebaseError, UpsertMeuPerfilVariables>): UseDataConnectMutationResult<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;
export function useUpsertMeuPerfil(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertMeuPerfilData, FirebaseError, UpsertMeuPerfilVariables>): UseDataConnectMutationResult<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;

export function useUpsertMinhaConfiguracao(options?: useDataConnectMutationOptions<UpsertMinhaConfiguracaoData, FirebaseError, UpsertMinhaConfiguracaoVariables>): UseDataConnectMutationResult<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;
export function useUpsertMinhaConfiguracao(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertMinhaConfiguracaoData, FirebaseError, UpsertMinhaConfiguracaoVariables>): UseDataConnectMutationResult<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;

export function useCreatePaciente(options?: useDataConnectMutationOptions<CreatePacienteData, FirebaseError, CreatePacienteVariables>): UseDataConnectMutationResult<CreatePacienteData, CreatePacienteVariables>;
export function useCreatePaciente(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePacienteData, FirebaseError, CreatePacienteVariables>): UseDataConnectMutationResult<CreatePacienteData, CreatePacienteVariables>;

export function useUpdatePaciente(options?: useDataConnectMutationOptions<UpdatePacienteData, FirebaseError, UpdatePacienteVariables>): UseDataConnectMutationResult<UpdatePacienteData, UpdatePacienteVariables>;
export function useUpdatePaciente(dc: DataConnect, options?: useDataConnectMutationOptions<UpdatePacienteData, FirebaseError, UpdatePacienteVariables>): UseDataConnectMutationResult<UpdatePacienteData, UpdatePacienteVariables>;

export function useSetPacienteStatus(options?: useDataConnectMutationOptions<SetPacienteStatusData, FirebaseError, SetPacienteStatusVariables>): UseDataConnectMutationResult<SetPacienteStatusData, SetPacienteStatusVariables>;
export function useSetPacienteStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetPacienteStatusData, FirebaseError, SetPacienteStatusVariables>): UseDataConnectMutationResult<SetPacienteStatusData, SetPacienteStatusVariables>;

export function useDeletePaciente(options?: useDataConnectMutationOptions<DeletePacienteData, FirebaseError, DeletePacienteVariables>): UseDataConnectMutationResult<DeletePacienteData, DeletePacienteVariables>;
export function useDeletePaciente(dc: DataConnect, options?: useDataConnectMutationOptions<DeletePacienteData, FirebaseError, DeletePacienteVariables>): UseDataConnectMutationResult<DeletePacienteData, DeletePacienteVariables>;

export function useCreateProfissional(options?: useDataConnectMutationOptions<CreateProfissionalData, FirebaseError, CreateProfissionalVariables>): UseDataConnectMutationResult<CreateProfissionalData, CreateProfissionalVariables>;
export function useCreateProfissional(dc: DataConnect, options?: useDataConnectMutationOptions<CreateProfissionalData, FirebaseError, CreateProfissionalVariables>): UseDataConnectMutationResult<CreateProfissionalData, CreateProfissionalVariables>;

export function useUpdateProfissional(options?: useDataConnectMutationOptions<UpdateProfissionalData, FirebaseError, UpdateProfissionalVariables>): UseDataConnectMutationResult<UpdateProfissionalData, UpdateProfissionalVariables>;
export function useUpdateProfissional(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateProfissionalData, FirebaseError, UpdateProfissionalVariables>): UseDataConnectMutationResult<UpdateProfissionalData, UpdateProfissionalVariables>;

export function useDeleteProfissional(options?: useDataConnectMutationOptions<DeleteProfissionalData, FirebaseError, DeleteProfissionalVariables>): UseDataConnectMutationResult<DeleteProfissionalData, DeleteProfissionalVariables>;
export function useDeleteProfissional(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteProfissionalData, FirebaseError, DeleteProfissionalVariables>): UseDataConnectMutationResult<DeleteProfissionalData, DeleteProfissionalVariables>;

export function useCreateConsulta(options?: useDataConnectMutationOptions<CreateConsultaData, FirebaseError, CreateConsultaVariables>): UseDataConnectMutationResult<CreateConsultaData, CreateConsultaVariables>;
export function useCreateConsulta(dc: DataConnect, options?: useDataConnectMutationOptions<CreateConsultaData, FirebaseError, CreateConsultaVariables>): UseDataConnectMutationResult<CreateConsultaData, CreateConsultaVariables>;

export function useUpdateConsulta(options?: useDataConnectMutationOptions<UpdateConsultaData, FirebaseError, UpdateConsultaVariables>): UseDataConnectMutationResult<UpdateConsultaData, UpdateConsultaVariables>;
export function useUpdateConsulta(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateConsultaData, FirebaseError, UpdateConsultaVariables>): UseDataConnectMutationResult<UpdateConsultaData, UpdateConsultaVariables>;

export function useSetConsultaStatus(options?: useDataConnectMutationOptions<SetConsultaStatusData, FirebaseError, SetConsultaStatusVariables>): UseDataConnectMutationResult<SetConsultaStatusData, SetConsultaStatusVariables>;
export function useSetConsultaStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetConsultaStatusData, FirebaseError, SetConsultaStatusVariables>): UseDataConnectMutationResult<SetConsultaStatusData, SetConsultaStatusVariables>;

export function useDeleteConsulta(options?: useDataConnectMutationOptions<DeleteConsultaData, FirebaseError, DeleteConsultaVariables>): UseDataConnectMutationResult<DeleteConsultaData, DeleteConsultaVariables>;
export function useDeleteConsulta(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteConsultaData, FirebaseError, DeleteConsultaVariables>): UseDataConnectMutationResult<DeleteConsultaData, DeleteConsultaVariables>;

export function useCreatePublicConsulta(options?: useDataConnectMutationOptions<CreatePublicConsultaData, FirebaseError, CreatePublicConsultaVariables>): UseDataConnectMutationResult<CreatePublicConsultaData, CreatePublicConsultaVariables>;
export function useCreatePublicConsulta(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePublicConsultaData, FirebaseError, CreatePublicConsultaVariables>): UseDataConnectMutationResult<CreatePublicConsultaData, CreatePublicConsultaVariables>;

export function useSetConsultaPixId(options?: useDataConnectMutationOptions<SetConsultaPixIdData, FirebaseError, SetConsultaPixIdVariables>): UseDataConnectMutationResult<SetConsultaPixIdData, SetConsultaPixIdVariables>;
export function useSetConsultaPixId(dc: DataConnect, options?: useDataConnectMutationOptions<SetConsultaPixIdData, FirebaseError, SetConsultaPixIdVariables>): UseDataConnectMutationResult<SetConsultaPixIdData, SetConsultaPixIdVariables>;

export function useConfirmarConsultaPaga(options?: useDataConnectMutationOptions<ConfirmarConsultaPagaData, FirebaseError, ConfirmarConsultaPagaVariables>): UseDataConnectMutationResult<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;
export function useConfirmarConsultaPaga(dc: DataConnect, options?: useDataConnectMutationOptions<ConfirmarConsultaPagaData, FirebaseError, ConfirmarConsultaPagaVariables>): UseDataConnectMutationResult<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;

export function useGetMeuPerfil(options?: useDataConnectQueryOptions<GetMeuPerfilData>): UseDataConnectQueryResult<GetMeuPerfilData, undefined>;
export function useGetMeuPerfil(dc: DataConnect, options?: useDataConnectQueryOptions<GetMeuPerfilData>): UseDataConnectQueryResult<GetMeuPerfilData, undefined>;

export function useGetPublicPerfilBySlug(vars: GetPublicPerfilBySlugVariables, options?: useDataConnectQueryOptions<GetPublicPerfilBySlugData>): UseDataConnectQueryResult<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;
export function useGetPublicPerfilBySlug(dc: DataConnect, vars: GetPublicPerfilBySlugVariables, options?: useDataConnectQueryOptions<GetPublicPerfilBySlugData>): UseDataConnectQueryResult<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;

export function useGetPublicConfiguracao(vars: GetPublicConfiguracaoVariables, options?: useDataConnectQueryOptions<GetPublicConfiguracaoData>): UseDataConnectQueryResult<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;
export function useGetPublicConfiguracao(dc: DataConnect, vars: GetPublicConfiguracaoVariables, options?: useDataConnectQueryOptions<GetPublicConfiguracaoData>): UseDataConnectQueryResult<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;

export function useListPublicProfissionais(vars: ListPublicProfissionaisVariables, options?: useDataConnectQueryOptions<ListPublicProfissionaisData>): UseDataConnectQueryResult<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;
export function useListPublicProfissionais(dc: DataConnect, vars: ListPublicProfissionaisVariables, options?: useDataConnectQueryOptions<ListPublicProfissionaisData>): UseDataConnectQueryResult<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;

export function useListPublicBusyConsultas(vars: ListPublicBusyConsultasVariables, options?: useDataConnectQueryOptions<ListPublicBusyConsultasData>): UseDataConnectQueryResult<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;
export function useListPublicBusyConsultas(dc: DataConnect, vars: ListPublicBusyConsultasVariables, options?: useDataConnectQueryOptions<ListPublicBusyConsultasData>): UseDataConnectQueryResult<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;

export function useGetMinhaConfiguracao(options?: useDataConnectQueryOptions<GetMinhaConfiguracaoData>): UseDataConnectQueryResult<GetMinhaConfiguracaoData, undefined>;
export function useGetMinhaConfiguracao(dc: DataConnect, options?: useDataConnectQueryOptions<GetMinhaConfiguracaoData>): UseDataConnectQueryResult<GetMinhaConfiguracaoData, undefined>;

export function useListMeusPacientes(options?: useDataConnectQueryOptions<ListMeusPacientesData>): UseDataConnectQueryResult<ListMeusPacientesData, undefined>;
export function useListMeusPacientes(dc: DataConnect, options?: useDataConnectQueryOptions<ListMeusPacientesData>): UseDataConnectQueryResult<ListMeusPacientesData, undefined>;

export function useListMinhasConsultas(vars?: ListMinhasConsultasVariables, options?: useDataConnectQueryOptions<ListMinhasConsultasData>): UseDataConnectQueryResult<ListMinhasConsultasData, ListMinhasConsultasVariables>;
export function useListMinhasConsultas(dc: DataConnect, vars?: ListMinhasConsultasVariables, options?: useDataConnectQueryOptions<ListMinhasConsultasData>): UseDataConnectQueryResult<ListMinhasConsultasData, ListMinhasConsultasVariables>;

export function useListMeusProfissionais(options?: useDataConnectQueryOptions<ListMeusProfissionaisData>): UseDataConnectQueryResult<ListMeusProfissionaisData, undefined>;
export function useListMeusProfissionais(dc: DataConnect, options?: useDataConnectQueryOptions<ListMeusProfissionaisData>): UseDataConnectQueryResult<ListMeusProfissionaisData, undefined>;
