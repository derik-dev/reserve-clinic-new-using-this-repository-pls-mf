# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `reserve_clinic`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`dataconnect-generated/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMeuPerfil*](#getmeuperfil)
  - [*GetPublicPerfilBySlug*](#getpublicperfilbyslug)
  - [*GetPublicConfiguracao*](#getpublicconfiguracao)
  - [*ListPublicProfissionais*](#listpublicprofissionais)
  - [*ListPublicBusyConsultas*](#listpublicbusyconsultas)
  - [*GetMinhaConfiguracao*](#getminhaconfiguracao)
  - [*ListMeusPacientes*](#listmeuspacientes)
  - [*ListMinhasConsultas*](#listminhasconsultas)
  - [*ListMeusProfissionais*](#listmeusprofissionais)
- [**Mutations**](#mutations)
  - [*UpsertMeuPerfil*](#upsertmeuperfil)
  - [*UpsertMinhaConfiguracao*](#upsertminhaconfiguracao)
  - [*CreatePaciente*](#createpaciente)
  - [*UpdatePaciente*](#updatepaciente)
  - [*SetPacienteStatus*](#setpacientestatus)
  - [*DeletePaciente*](#deletepaciente)
  - [*CreateProfissional*](#createprofissional)
  - [*UpdateProfissional*](#updateprofissional)
  - [*DeleteProfissional*](#deleteprofissional)
  - [*CreateConsulta*](#createconsulta)
  - [*UpdateConsulta*](#updateconsulta)
  - [*SetConsultaStatus*](#setconsultastatus)
  - [*DeleteConsulta*](#deleteconsulta)
  - [*CreatePublicConsulta*](#createpublicconsulta)
  - [*SetConsultaPixId*](#setconsultapixid)
  - [*ConfirmarConsultaPaga*](#confirmarconsultapaga)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `reserve_clinic`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

***You do not need to be familiar with Tanstack Query or Tanstack Query Firebase to use this SDK.*** However, you may find it useful to learn more about them, as they will empower you as a user of this Generated React SDK.

## Installing TanStack Query Firebase and TanStack React Query Packages
In order to use the React generated SDK, you must install the `TanStack React Query` and `TanStack Query Firebase` packages.
```bash
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```
```bash
npm i --save firebase@latest # Note: React has a peer dependency on ^11.3.0
```

You can also follow the installation instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#tanstack-install), or the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react) and [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/installation).

## Configuring TanStack Query
In order to use the React generated SDK in your application, you must wrap your application's component tree in a `QueryClientProvider` component from TanStack React Query. None of your generated React SDK hooks will work without this provider.

```javascript
import { QueryClientProvider } from '@tanstack/react-query';

// Create a TanStack Query client instance
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <MyApplication />
    </QueryClientProvider>
  )
}
```

To learn more about `QueryClientProvider`, see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start) and the [TanStack Query Firebase documentation](https://invertase.docs.page/tanstack-query-firebase/react#usage).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `reserve_clinic`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) using the hooks provided from your generated React SDK.

# Queries

The React generated SDK provides Query hook functions that call and return [`useDataConnectQuery`](https://react-query-firebase.invertase.dev/react/data-connect/querying) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and the most recent data returned by the Query, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/querying).

TanStack React Query caches the results of your Queries, so using the same Query hook function in multiple places in your application allows the entire application to automatically see updates to that Query's data.

Query hooks execute their Queries automatically when called, and periodically refresh, unless you change the `queryOptions` for the Query. To learn how to stop a Query from automatically executing, including how to make a query "lazy", see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).

To learn more about TanStack React Query's Queries, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/queries).

## Using Query Hooks
Here's a general overview of how to use the generated Query hooks in your code:

- If the Query has no variables, the Query hook function does not require arguments.
- If the Query has any required variables, the Query hook function will require at least one argument: an object that contains all the required variables for the Query.
- If the Query has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Query's variables are optional, the Query hook function does not require any arguments.
- Query hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Query hooks functions can be called with or without passing in an `options` argument of type `useDataConnectQueryOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).
  - ***Special case:***  If the Query has all optional variables and you would like to provide an `options` argument to the Query hook function without providing any variables, you must pass `undefined` where you would normally pass the Query's variables, and then may provide the `options` argument.

Below are examples of how to use the `reserve_clinic` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetMeuPerfil
You can execute the `GetMeuPerfil` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMeuPerfil(dc: DataConnect, options?: useDataConnectQueryOptions<GetMeuPerfilData>): UseDataConnectQueryResult<GetMeuPerfilData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMeuPerfil(options?: useDataConnectQueryOptions<GetMeuPerfilData>): UseDataConnectQueryResult<GetMeuPerfilData, undefined>;
```

### Variables
The `GetMeuPerfil` Query has no variables.
### Return Type
Recall that calling the `GetMeuPerfil` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMeuPerfil` Query is of type `GetMeuPerfilData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMeuPerfil`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetMeuPerfil } from '@dataconnect/generated/react'

export default function GetMeuPerfilComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMeuPerfil();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMeuPerfil(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMeuPerfil(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMeuPerfil(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.perfil);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetPublicPerfilBySlug
You can execute the `GetPublicPerfilBySlug` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetPublicPerfilBySlug(dc: DataConnect, vars: GetPublicPerfilBySlugVariables, options?: useDataConnectQueryOptions<GetPublicPerfilBySlugData>): UseDataConnectQueryResult<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetPublicPerfilBySlug(vars: GetPublicPerfilBySlugVariables, options?: useDataConnectQueryOptions<GetPublicPerfilBySlugData>): UseDataConnectQueryResult<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;
```

### Variables
The `GetPublicPerfilBySlug` Query requires an argument of type `GetPublicPerfilBySlugVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetPublicPerfilBySlugVariables {
  slug: string;
}
```
### Return Type
Recall that calling the `GetPublicPerfilBySlug` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetPublicPerfilBySlug` Query is of type `GetPublicPerfilBySlugData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetPublicPerfilBySlug`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetPublicPerfilBySlugVariables } from '@dataconnect/generated';
import { useGetPublicPerfilBySlug } from '@dataconnect/generated/react'

export default function GetPublicPerfilBySlugComponent() {
  // The `useGetPublicPerfilBySlug` Query hook requires an argument of type `GetPublicPerfilBySlugVariables`:
  const getPublicPerfilBySlugVars: GetPublicPerfilBySlugVariables = {
    slug: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetPublicPerfilBySlug(getPublicPerfilBySlugVars);
  // Variables can be defined inline as well.
  const query = useGetPublicPerfilBySlug({ slug: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetPublicPerfilBySlug(dataConnect, getPublicPerfilBySlugVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetPublicPerfilBySlug(getPublicPerfilBySlugVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetPublicPerfilBySlug(dataConnect, getPublicPerfilBySlugVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.perfis);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetPublicConfiguracao
You can execute the `GetPublicConfiguracao` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetPublicConfiguracao(dc: DataConnect, vars: GetPublicConfiguracaoVariables, options?: useDataConnectQueryOptions<GetPublicConfiguracaoData>): UseDataConnectQueryResult<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetPublicConfiguracao(vars: GetPublicConfiguracaoVariables, options?: useDataConnectQueryOptions<GetPublicConfiguracaoData>): UseDataConnectQueryResult<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;
```

### Variables
The `GetPublicConfiguracao` Query requires an argument of type `GetPublicConfiguracaoVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetPublicConfiguracaoVariables {
  perfilId: string;
}
```
### Return Type
Recall that calling the `GetPublicConfiguracao` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetPublicConfiguracao` Query is of type `GetPublicConfiguracaoData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetPublicConfiguracao`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetPublicConfiguracaoVariables } from '@dataconnect/generated';
import { useGetPublicConfiguracao } from '@dataconnect/generated/react'

export default function GetPublicConfiguracaoComponent() {
  // The `useGetPublicConfiguracao` Query hook requires an argument of type `GetPublicConfiguracaoVariables`:
  const getPublicConfiguracaoVars: GetPublicConfiguracaoVariables = {
    perfilId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetPublicConfiguracao(getPublicConfiguracaoVars);
  // Variables can be defined inline as well.
  const query = useGetPublicConfiguracao({ perfilId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetPublicConfiguracao(dataConnect, getPublicConfiguracaoVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetPublicConfiguracao(getPublicConfiguracaoVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetPublicConfiguracao(dataConnect, getPublicConfiguracaoVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.configuracao);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListPublicProfissionais
You can execute the `ListPublicProfissionais` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListPublicProfissionais(dc: DataConnect, vars: ListPublicProfissionaisVariables, options?: useDataConnectQueryOptions<ListPublicProfissionaisData>): UseDataConnectQueryResult<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListPublicProfissionais(vars: ListPublicProfissionaisVariables, options?: useDataConnectQueryOptions<ListPublicProfissionaisData>): UseDataConnectQueryResult<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;
```

### Variables
The `ListPublicProfissionais` Query requires an argument of type `ListPublicProfissionaisVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListPublicProfissionaisVariables {
  perfilId: string;
}
```
### Return Type
Recall that calling the `ListPublicProfissionais` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListPublicProfissionais` Query is of type `ListPublicProfissionaisData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListPublicProfissionaisData {
  profissionais: ({
    id: UUIDString;
    nome: string;
    especialidade?: string | null;
    fotoUrl?: string | null;
    valorConsulta?: number | null;
  } & Profissional_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListPublicProfissionais`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListPublicProfissionaisVariables } from '@dataconnect/generated';
import { useListPublicProfissionais } from '@dataconnect/generated/react'

export default function ListPublicProfissionaisComponent() {
  // The `useListPublicProfissionais` Query hook requires an argument of type `ListPublicProfissionaisVariables`:
  const listPublicProfissionaisVars: ListPublicProfissionaisVariables = {
    perfilId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListPublicProfissionais(listPublicProfissionaisVars);
  // Variables can be defined inline as well.
  const query = useListPublicProfissionais({ perfilId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListPublicProfissionais(dataConnect, listPublicProfissionaisVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListPublicProfissionais(listPublicProfissionaisVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListPublicProfissionais(dataConnect, listPublicProfissionaisVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.profissionais);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListPublicBusyConsultas
You can execute the `ListPublicBusyConsultas` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListPublicBusyConsultas(dc: DataConnect, vars: ListPublicBusyConsultasVariables, options?: useDataConnectQueryOptions<ListPublicBusyConsultasData>): UseDataConnectQueryResult<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListPublicBusyConsultas(vars: ListPublicBusyConsultasVariables, options?: useDataConnectQueryOptions<ListPublicBusyConsultasData>): UseDataConnectQueryResult<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;
```

### Variables
The `ListPublicBusyConsultas` Query requires an argument of type `ListPublicBusyConsultasVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListPublicBusyConsultasVariables {
  perfilId: string;
  from: TimestampString;
  to: TimestampString;
}
```
### Return Type
Recall that calling the `ListPublicBusyConsultas` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListPublicBusyConsultas` Query is of type `ListPublicBusyConsultasData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListPublicBusyConsultasData {
  consultas: ({
    id: UUIDString;
    dataHora: TimestampString;
    duracaoMin: number;
    profissionalId?: UUIDString | null;
  } & Consulta_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListPublicBusyConsultas`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListPublicBusyConsultasVariables } from '@dataconnect/generated';
import { useListPublicBusyConsultas } from '@dataconnect/generated/react'

export default function ListPublicBusyConsultasComponent() {
  // The `useListPublicBusyConsultas` Query hook requires an argument of type `ListPublicBusyConsultasVariables`:
  const listPublicBusyConsultasVars: ListPublicBusyConsultasVariables = {
    perfilId: ..., 
    from: ..., 
    to: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListPublicBusyConsultas(listPublicBusyConsultasVars);
  // Variables can be defined inline as well.
  const query = useListPublicBusyConsultas({ perfilId: ..., from: ..., to: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListPublicBusyConsultas(dataConnect, listPublicBusyConsultasVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListPublicBusyConsultas(listPublicBusyConsultasVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListPublicBusyConsultas(dataConnect, listPublicBusyConsultasVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.consultas);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetMinhaConfiguracao
You can execute the `GetMinhaConfiguracao` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMinhaConfiguracao(dc: DataConnect, options?: useDataConnectQueryOptions<GetMinhaConfiguracaoData>): UseDataConnectQueryResult<GetMinhaConfiguracaoData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMinhaConfiguracao(options?: useDataConnectQueryOptions<GetMinhaConfiguracaoData>): UseDataConnectQueryResult<GetMinhaConfiguracaoData, undefined>;
```

### Variables
The `GetMinhaConfiguracao` Query has no variables.
### Return Type
Recall that calling the `GetMinhaConfiguracao` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMinhaConfiguracao` Query is of type `GetMinhaConfiguracaoData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMinhaConfiguracao`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetMinhaConfiguracao } from '@dataconnect/generated/react'

export default function GetMinhaConfiguracaoComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMinhaConfiguracao();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMinhaConfiguracao(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMinhaConfiguracao(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMinhaConfiguracao(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.configuracao);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMeusPacientes
You can execute the `ListMeusPacientes` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMeusPacientes(dc: DataConnect, options?: useDataConnectQueryOptions<ListMeusPacientesData>): UseDataConnectQueryResult<ListMeusPacientesData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMeusPacientes(options?: useDataConnectQueryOptions<ListMeusPacientesData>): UseDataConnectQueryResult<ListMeusPacientesData, undefined>;
```

### Variables
The `ListMeusPacientes` Query has no variables.
### Return Type
Recall that calling the `ListMeusPacientes` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMeusPacientes` Query is of type `ListMeusPacientesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMeusPacientes`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListMeusPacientes } from '@dataconnect/generated/react'

export default function ListMeusPacientesComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMeusPacientes();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMeusPacientes(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMeusPacientes(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMeusPacientes(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.pacientes);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMinhasConsultas
You can execute the `ListMinhasConsultas` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMinhasConsultas(dc: DataConnect, vars?: ListMinhasConsultasVariables, options?: useDataConnectQueryOptions<ListMinhasConsultasData>): UseDataConnectQueryResult<ListMinhasConsultasData, ListMinhasConsultasVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMinhasConsultas(vars?: ListMinhasConsultasVariables, options?: useDataConnectQueryOptions<ListMinhasConsultasData>): UseDataConnectQueryResult<ListMinhasConsultasData, ListMinhasConsultasVariables>;
```

### Variables
The `ListMinhasConsultas` Query has an optional argument of type `ListMinhasConsultasVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListMinhasConsultasVariables {
  from?: TimestampString | null;
  to?: TimestampString | null;
}
```
### Return Type
Recall that calling the `ListMinhasConsultas` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMinhasConsultas` Query is of type `ListMinhasConsultasData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMinhasConsultas`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListMinhasConsultasVariables } from '@dataconnect/generated';
import { useListMinhasConsultas } from '@dataconnect/generated/react'

export default function ListMinhasConsultasComponent() {
  // The `useListMinhasConsultas` Query hook has an optional argument of type `ListMinhasConsultasVariables`:
  const listMinhasConsultasVars: ListMinhasConsultasVariables = {
    from: ..., // optional
    to: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMinhasConsultas(listMinhasConsultasVars);
  // Variables can be defined inline as well.
  const query = useListMinhasConsultas({ from: ..., to: ..., });
  // Since all variables are optional for this Query, you can omit the `ListMinhasConsultasVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListMinhasConsultas();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMinhasConsultas(dataConnect, listMinhasConsultasVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMinhasConsultas(listMinhasConsultasVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListMinhasConsultas(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMinhasConsultas(dataConnect, listMinhasConsultasVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.consultas);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMeusProfissionais
You can execute the `ListMeusProfissionais` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMeusProfissionais(dc: DataConnect, options?: useDataConnectQueryOptions<ListMeusProfissionaisData>): UseDataConnectQueryResult<ListMeusProfissionaisData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMeusProfissionais(options?: useDataConnectQueryOptions<ListMeusProfissionaisData>): UseDataConnectQueryResult<ListMeusProfissionaisData, undefined>;
```

### Variables
The `ListMeusProfissionais` Query has no variables.
### Return Type
Recall that calling the `ListMeusProfissionais` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMeusProfissionais` Query is of type `ListMeusProfissionaisData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMeusProfissionais`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListMeusProfissionais } from '@dataconnect/generated/react'

export default function ListMeusProfissionaisComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMeusProfissionais();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMeusProfissionais(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMeusProfissionais(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMeusProfissionais(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.profissionais);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

# Mutations

The React generated SDK provides Mutations hook functions that call and return [`useDataConnectMutation`](https://react-query-firebase.invertase.dev/react/data-connect/mutations) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, and the most recent data returned by the Mutation, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/mutations).

Mutation hooks do not execute their Mutations automatically when called. Rather, after calling the Mutation hook function and getting a `UseMutationResult` object, you must call the `UseMutationResult.mutate()` function to execute the Mutation.

To learn more about TanStack React Query's Mutations, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).

## Using Mutation Hooks
Here's a general overview of how to use the generated Mutation hooks in your code:

- Mutation hook functions are not called with the arguments to the Mutation. Instead, arguments are passed to `UseMutationResult.mutate()`.
- If the Mutation has no variables, the `mutate()` function does not require arguments.
- If the Mutation has any required variables, the `mutate()` function will require at least one argument: an object that contains all the required variables for the Mutation.
- If the Mutation has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Mutation's variables are optional, the Mutation hook function does not require any arguments.
- Mutation hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Mutation hooks also accept an `options` argument of type `useDataConnectMutationOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations#mutation-side-effects).
  - `UseMutationResult.mutate()` also accepts an `options` argument of type `useDataConnectMutationOptions`.
  - ***Special case:*** If the Mutation has no arguments (or all optional arguments and you wish to provide none), and you want to pass `options` to `UseMutationResult.mutate()`, you must pass `undefined` where you would normally pass the Mutation's arguments, and then may provide the options argument.

Below are examples of how to use the `reserve_clinic` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## UpsertMeuPerfil
You can execute the `UpsertMeuPerfil` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertMeuPerfil(options?: useDataConnectMutationOptions<UpsertMeuPerfilData, FirebaseError, UpsertMeuPerfilVariables>): UseDataConnectMutationResult<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertMeuPerfil(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertMeuPerfilData, FirebaseError, UpsertMeuPerfilVariables>): UseDataConnectMutationResult<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;
```

### Variables
The `UpsertMeuPerfil` Mutation requires an argument of type `UpsertMeuPerfilVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `UpsertMeuPerfil` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertMeuPerfil` Mutation is of type `UpsertMeuPerfilData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertMeuPerfilData {
  perfil_upsert: Perfil_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertMeuPerfil`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertMeuPerfilVariables } from '@dataconnect/generated';
import { useUpsertMeuPerfil } from '@dataconnect/generated/react'

export default function UpsertMeuPerfilComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertMeuPerfil();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertMeuPerfil(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertMeuPerfil(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertMeuPerfil(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertMeuPerfil` Mutation requires an argument of type `UpsertMeuPerfilVariables`:
  const upsertMeuPerfilVars: UpsertMeuPerfilVariables = {
    nome: ..., 
    slug: ..., 
    tipo: ..., // optional
    telefone: ..., // optional
    emailContato: ..., // optional
    logoUrl: ..., // optional
    corPrimaria: ..., // optional
    corSecundaria: ..., // optional
    cpfCnpj: ..., // optional
    enderecoCep: ..., // optional
    enderecoRua: ..., // optional
    enderecoNumero: ..., // optional
    enderecoBairro: ..., // optional
    enderecoCidade: ..., // optional
    enderecoUf: ..., // optional
    pixChave: ..., // optional
    site: ..., // optional
    instagram: ..., // optional
    tiktok: ..., // optional
    valorConsulta: ..., // optional
  };
  mutation.mutate(upsertMeuPerfilVars);
  // Variables can be defined inline as well.
  mutation.mutate({ nome: ..., slug: ..., tipo: ..., telefone: ..., emailContato: ..., logoUrl: ..., corPrimaria: ..., corSecundaria: ..., cpfCnpj: ..., enderecoCep: ..., enderecoRua: ..., enderecoNumero: ..., enderecoBairro: ..., enderecoCidade: ..., enderecoUf: ..., pixChave: ..., site: ..., instagram: ..., tiktok: ..., valorConsulta: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertMeuPerfilVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.perfil_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertMinhaConfiguracao
You can execute the `UpsertMinhaConfiguracao` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertMinhaConfiguracao(options?: useDataConnectMutationOptions<UpsertMinhaConfiguracaoData, FirebaseError, UpsertMinhaConfiguracaoVariables>): UseDataConnectMutationResult<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertMinhaConfiguracao(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertMinhaConfiguracaoData, FirebaseError, UpsertMinhaConfiguracaoVariables>): UseDataConnectMutationResult<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;
```

### Variables
The `UpsertMinhaConfiguracao` Mutation requires an argument of type `UpsertMinhaConfiguracaoVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `UpsertMinhaConfiguracao` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertMinhaConfiguracao` Mutation is of type `UpsertMinhaConfiguracaoData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertMinhaConfiguracaoData {
  configuracao_upsert: Configuracao_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertMinhaConfiguracao`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertMinhaConfiguracaoVariables } from '@dataconnect/generated';
import { useUpsertMinhaConfiguracao } from '@dataconnect/generated/react'

export default function UpsertMinhaConfiguracaoComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertMinhaConfiguracao();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertMinhaConfiguracao(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertMinhaConfiguracao(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertMinhaConfiguracao(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertMinhaConfiguracao` Mutation requires an argument of type `UpsertMinhaConfiguracaoVariables`:
  const upsertMinhaConfiguracaoVars: UpsertMinhaConfiguracaoVariables = {
    agendaConfig: ..., 
    duracaoAtendimentoMin: ..., // optional
    tipoPagamento: ..., // optional
    valorAtendimento: ..., // optional
    valorSinal: ..., // optional
    antecedenciaMinimaHoras: ..., // optional
    qrCodeManualUrl: ..., // optional
    chavePixManual: ..., // optional
  };
  mutation.mutate(upsertMinhaConfiguracaoVars);
  // Variables can be defined inline as well.
  mutation.mutate({ agendaConfig: ..., duracaoAtendimentoMin: ..., tipoPagamento: ..., valorAtendimento: ..., valorSinal: ..., antecedenciaMinimaHoras: ..., qrCodeManualUrl: ..., chavePixManual: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertMinhaConfiguracaoVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.configuracao_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreatePaciente
You can execute the `CreatePaciente` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreatePaciente(options?: useDataConnectMutationOptions<CreatePacienteData, FirebaseError, CreatePacienteVariables>): UseDataConnectMutationResult<CreatePacienteData, CreatePacienteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreatePaciente(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePacienteData, FirebaseError, CreatePacienteVariables>): UseDataConnectMutationResult<CreatePacienteData, CreatePacienteVariables>;
```

### Variables
The `CreatePaciente` Mutation requires an argument of type `CreatePacienteVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreatePacienteVariables {
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cpf?: string | null;
  dataNascimento?: DateString | null;
  observacoes?: string | null;
}
```
### Return Type
Recall that calling the `CreatePaciente` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreatePaciente` Mutation is of type `CreatePacienteData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreatePacienteData {
  paciente_insert: Paciente_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreatePaciente`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreatePacienteVariables } from '@dataconnect/generated';
import { useCreatePaciente } from '@dataconnect/generated/react'

export default function CreatePacienteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreatePaciente();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreatePaciente(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreatePaciente(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreatePaciente(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreatePaciente` Mutation requires an argument of type `CreatePacienteVariables`:
  const createPacienteVars: CreatePacienteVariables = {
    nome: ..., 
    telefone: ..., // optional
    email: ..., // optional
    cpf: ..., // optional
    dataNascimento: ..., // optional
    observacoes: ..., // optional
  };
  mutation.mutate(createPacienteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ nome: ..., telefone: ..., email: ..., cpf: ..., dataNascimento: ..., observacoes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createPacienteVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.paciente_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdatePaciente
You can execute the `UpdatePaciente` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdatePaciente(options?: useDataConnectMutationOptions<UpdatePacienteData, FirebaseError, UpdatePacienteVariables>): UseDataConnectMutationResult<UpdatePacienteData, UpdatePacienteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdatePaciente(dc: DataConnect, options?: useDataConnectMutationOptions<UpdatePacienteData, FirebaseError, UpdatePacienteVariables>): UseDataConnectMutationResult<UpdatePacienteData, UpdatePacienteVariables>;
```

### Variables
The `UpdatePaciente` Mutation requires an argument of type `UpdatePacienteVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdatePacienteVariables {
  id: UUIDString;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cpf?: string | null;
  dataNascimento?: DateString | null;
  observacoes?: string | null;
}
```
### Return Type
Recall that calling the `UpdatePaciente` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdatePaciente` Mutation is of type `UpdatePacienteData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdatePacienteData {
  paciente_update?: Paciente_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdatePaciente`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdatePacienteVariables } from '@dataconnect/generated';
import { useUpdatePaciente } from '@dataconnect/generated/react'

export default function UpdatePacienteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdatePaciente();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdatePaciente(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdatePaciente(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdatePaciente(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdatePaciente` Mutation requires an argument of type `UpdatePacienteVariables`:
  const updatePacienteVars: UpdatePacienteVariables = {
    id: ..., 
    nome: ..., 
    telefone: ..., // optional
    email: ..., // optional
    cpf: ..., // optional
    dataNascimento: ..., // optional
    observacoes: ..., // optional
  };
  mutation.mutate(updatePacienteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., nome: ..., telefone: ..., email: ..., cpf: ..., dataNascimento: ..., observacoes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updatePacienteVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.paciente_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetPacienteStatus
You can execute the `SetPacienteStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetPacienteStatus(options?: useDataConnectMutationOptions<SetPacienteStatusData, FirebaseError, SetPacienteStatusVariables>): UseDataConnectMutationResult<SetPacienteStatusData, SetPacienteStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetPacienteStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetPacienteStatusData, FirebaseError, SetPacienteStatusVariables>): UseDataConnectMutationResult<SetPacienteStatusData, SetPacienteStatusVariables>;
```

### Variables
The `SetPacienteStatus` Mutation requires an argument of type `SetPacienteStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetPacienteStatusVariables {
  id: UUIDString;
  status: string;
}
```
### Return Type
Recall that calling the `SetPacienteStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetPacienteStatus` Mutation is of type `SetPacienteStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetPacienteStatusData {
  paciente_update?: Paciente_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetPacienteStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetPacienteStatusVariables } from '@dataconnect/generated';
import { useSetPacienteStatus } from '@dataconnect/generated/react'

export default function SetPacienteStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetPacienteStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetPacienteStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPacienteStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPacienteStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetPacienteStatus` Mutation requires an argument of type `SetPacienteStatusVariables`:
  const setPacienteStatusVars: SetPacienteStatusVariables = {
    id: ..., 
    status: ..., 
  };
  mutation.mutate(setPacienteStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setPacienteStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.paciente_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeletePaciente
You can execute the `DeletePaciente` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeletePaciente(options?: useDataConnectMutationOptions<DeletePacienteData, FirebaseError, DeletePacienteVariables>): UseDataConnectMutationResult<DeletePacienteData, DeletePacienteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeletePaciente(dc: DataConnect, options?: useDataConnectMutationOptions<DeletePacienteData, FirebaseError, DeletePacienteVariables>): UseDataConnectMutationResult<DeletePacienteData, DeletePacienteVariables>;
```

### Variables
The `DeletePaciente` Mutation requires an argument of type `DeletePacienteVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeletePacienteVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `DeletePaciente` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeletePaciente` Mutation is of type `DeletePacienteData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeletePacienteData {
  paciente_delete?: Paciente_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeletePaciente`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeletePacienteVariables } from '@dataconnect/generated';
import { useDeletePaciente } from '@dataconnect/generated/react'

export default function DeletePacienteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeletePaciente();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeletePaciente(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeletePaciente(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeletePaciente(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeletePaciente` Mutation requires an argument of type `DeletePacienteVariables`:
  const deletePacienteVars: DeletePacienteVariables = {
    id: ..., 
  };
  mutation.mutate(deletePacienteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deletePacienteVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.paciente_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateProfissional
You can execute the `CreateProfissional` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateProfissional(options?: useDataConnectMutationOptions<CreateProfissionalData, FirebaseError, CreateProfissionalVariables>): UseDataConnectMutationResult<CreateProfissionalData, CreateProfissionalVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateProfissional(dc: DataConnect, options?: useDataConnectMutationOptions<CreateProfissionalData, FirebaseError, CreateProfissionalVariables>): UseDataConnectMutationResult<CreateProfissionalData, CreateProfissionalVariables>;
```

### Variables
The `CreateProfissional` Mutation requires an argument of type `CreateProfissionalVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateProfissionalVariables {
  nome: string;
  especialidade?: string | null;
  whatsapp?: string | null;
  cpf?: string | null;
  anosExperiencia?: number | null;
  fotoUrl?: string | null;
  valorConsulta?: number | null;
}
```
### Return Type
Recall that calling the `CreateProfissional` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateProfissional` Mutation is of type `CreateProfissionalData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateProfissionalData {
  profissional_insert: Profissional_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateProfissional`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateProfissionalVariables } from '@dataconnect/generated';
import { useCreateProfissional } from '@dataconnect/generated/react'

export default function CreateProfissionalComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateProfissional();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateProfissional(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateProfissional(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateProfissional(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateProfissional` Mutation requires an argument of type `CreateProfissionalVariables`:
  const createProfissionalVars: CreateProfissionalVariables = {
    nome: ..., 
    especialidade: ..., // optional
    whatsapp: ..., // optional
    cpf: ..., // optional
    anosExperiencia: ..., // optional
    fotoUrl: ..., // optional
    valorConsulta: ..., // optional
  };
  mutation.mutate(createProfissionalVars);
  // Variables can be defined inline as well.
  mutation.mutate({ nome: ..., especialidade: ..., whatsapp: ..., cpf: ..., anosExperiencia: ..., fotoUrl: ..., valorConsulta: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createProfissionalVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.profissional_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateProfissional
You can execute the `UpdateProfissional` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateProfissional(options?: useDataConnectMutationOptions<UpdateProfissionalData, FirebaseError, UpdateProfissionalVariables>): UseDataConnectMutationResult<UpdateProfissionalData, UpdateProfissionalVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateProfissional(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateProfissionalData, FirebaseError, UpdateProfissionalVariables>): UseDataConnectMutationResult<UpdateProfissionalData, UpdateProfissionalVariables>;
```

### Variables
The `UpdateProfissional` Mutation requires an argument of type `UpdateProfissionalVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `UpdateProfissional` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateProfissional` Mutation is of type `UpdateProfissionalData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateProfissionalData {
  profissional_update?: Profissional_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateProfissional`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateProfissionalVariables } from '@dataconnect/generated';
import { useUpdateProfissional } from '@dataconnect/generated/react'

export default function UpdateProfissionalComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateProfissional();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateProfissional(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateProfissional(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateProfissional(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateProfissional` Mutation requires an argument of type `UpdateProfissionalVariables`:
  const updateProfissionalVars: UpdateProfissionalVariables = {
    id: ..., 
    nome: ..., 
    especialidade: ..., // optional
    whatsapp: ..., // optional
    cpf: ..., // optional
    anosExperiencia: ..., // optional
    fotoUrl: ..., // optional
    valorConsulta: ..., // optional
    ativo: ..., // optional
  };
  mutation.mutate(updateProfissionalVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., nome: ..., especialidade: ..., whatsapp: ..., cpf: ..., anosExperiencia: ..., fotoUrl: ..., valorConsulta: ..., ativo: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateProfissionalVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.profissional_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteProfissional
You can execute the `DeleteProfissional` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteProfissional(options?: useDataConnectMutationOptions<DeleteProfissionalData, FirebaseError, DeleteProfissionalVariables>): UseDataConnectMutationResult<DeleteProfissionalData, DeleteProfissionalVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteProfissional(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteProfissionalData, FirebaseError, DeleteProfissionalVariables>): UseDataConnectMutationResult<DeleteProfissionalData, DeleteProfissionalVariables>;
```

### Variables
The `DeleteProfissional` Mutation requires an argument of type `DeleteProfissionalVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteProfissionalVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `DeleteProfissional` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteProfissional` Mutation is of type `DeleteProfissionalData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteProfissionalData {
  profissional_delete?: Profissional_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteProfissional`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteProfissionalVariables } from '@dataconnect/generated';
import { useDeleteProfissional } from '@dataconnect/generated/react'

export default function DeleteProfissionalComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteProfissional();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteProfissional(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteProfissional(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteProfissional(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteProfissional` Mutation requires an argument of type `DeleteProfissionalVariables`:
  const deleteProfissionalVars: DeleteProfissionalVariables = {
    id: ..., 
  };
  mutation.mutate(deleteProfissionalVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteProfissionalVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.profissional_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateConsulta
You can execute the `CreateConsulta` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateConsulta(options?: useDataConnectMutationOptions<CreateConsultaData, FirebaseError, CreateConsultaVariables>): UseDataConnectMutationResult<CreateConsultaData, CreateConsultaVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateConsulta(dc: DataConnect, options?: useDataConnectMutationOptions<CreateConsultaData, FirebaseError, CreateConsultaVariables>): UseDataConnectMutationResult<CreateConsultaData, CreateConsultaVariables>;
```

### Variables
The `CreateConsulta` Mutation requires an argument of type `CreateConsultaVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `CreateConsulta` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateConsulta` Mutation is of type `CreateConsultaData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateConsultaData {
  consulta_insert: Consulta_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateConsulta`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateConsultaVariables } from '@dataconnect/generated';
import { useCreateConsulta } from '@dataconnect/generated/react'

export default function CreateConsultaComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateConsulta();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateConsulta(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateConsulta(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateConsulta(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateConsulta` Mutation requires an argument of type `CreateConsultaVariables`:
  const createConsultaVars: CreateConsultaVariables = {
    pacienteId: ..., // optional
    pacienteNome: ..., 
    pacienteTelefone: ..., // optional
    pacienteEmail: ..., // optional
    dataHora: ..., 
    duracaoMin: ..., 
    servico: ..., // optional
    profissional: ..., // optional
    profissionalId: ..., // optional
    valor: ..., // optional
    status: ..., 
    pixId: ..., // optional
    metodoPagamento: ..., // optional
    observacoes: ..., // optional
  };
  mutation.mutate(createConsultaVars);
  // Variables can be defined inline as well.
  mutation.mutate({ pacienteId: ..., pacienteNome: ..., pacienteTelefone: ..., pacienteEmail: ..., dataHora: ..., duracaoMin: ..., servico: ..., profissional: ..., profissionalId: ..., valor: ..., status: ..., pixId: ..., metodoPagamento: ..., observacoes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createConsultaVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.consulta_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateConsulta
You can execute the `UpdateConsulta` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateConsulta(options?: useDataConnectMutationOptions<UpdateConsultaData, FirebaseError, UpdateConsultaVariables>): UseDataConnectMutationResult<UpdateConsultaData, UpdateConsultaVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateConsulta(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateConsultaData, FirebaseError, UpdateConsultaVariables>): UseDataConnectMutationResult<UpdateConsultaData, UpdateConsultaVariables>;
```

### Variables
The `UpdateConsulta` Mutation requires an argument of type `UpdateConsultaVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `UpdateConsulta` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateConsulta` Mutation is of type `UpdateConsultaData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateConsultaData {
  consulta_update?: Consulta_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateConsulta`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateConsultaVariables } from '@dataconnect/generated';
import { useUpdateConsulta } from '@dataconnect/generated/react'

export default function UpdateConsultaComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateConsulta();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateConsulta(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateConsulta(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateConsulta(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateConsulta` Mutation requires an argument of type `UpdateConsultaVariables`:
  const updateConsultaVars: UpdateConsultaVariables = {
    id: ..., 
    pacienteId: ..., // optional
    pacienteNome: ..., 
    pacienteTelefone: ..., // optional
    pacienteEmail: ..., // optional
    dataHora: ..., 
    duracaoMin: ..., 
    servico: ..., // optional
    profissional: ..., // optional
    profissionalId: ..., // optional
    valor: ..., // optional
    status: ..., 
    pixId: ..., // optional
    metodoPagamento: ..., // optional
    observacoes: ..., // optional
  };
  mutation.mutate(updateConsultaVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., pacienteId: ..., pacienteNome: ..., pacienteTelefone: ..., pacienteEmail: ..., dataHora: ..., duracaoMin: ..., servico: ..., profissional: ..., profissionalId: ..., valor: ..., status: ..., pixId: ..., metodoPagamento: ..., observacoes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateConsultaVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.consulta_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetConsultaStatus
You can execute the `SetConsultaStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetConsultaStatus(options?: useDataConnectMutationOptions<SetConsultaStatusData, FirebaseError, SetConsultaStatusVariables>): UseDataConnectMutationResult<SetConsultaStatusData, SetConsultaStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetConsultaStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetConsultaStatusData, FirebaseError, SetConsultaStatusVariables>): UseDataConnectMutationResult<SetConsultaStatusData, SetConsultaStatusVariables>;
```

### Variables
The `SetConsultaStatus` Mutation requires an argument of type `SetConsultaStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetConsultaStatusVariables {
  id: UUIDString;
  status: string;
  pacienteId?: UUIDString | null;
}
```
### Return Type
Recall that calling the `SetConsultaStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetConsultaStatus` Mutation is of type `SetConsultaStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetConsultaStatusData {
  consulta_update?: Consulta_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetConsultaStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetConsultaStatusVariables } from '@dataconnect/generated';
import { useSetConsultaStatus } from '@dataconnect/generated/react'

export default function SetConsultaStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetConsultaStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetConsultaStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetConsultaStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetConsultaStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetConsultaStatus` Mutation requires an argument of type `SetConsultaStatusVariables`:
  const setConsultaStatusVars: SetConsultaStatusVariables = {
    id: ..., 
    status: ..., 
    pacienteId: ..., // optional
  };
  mutation.mutate(setConsultaStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., pacienteId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setConsultaStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.consulta_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteConsulta
You can execute the `DeleteConsulta` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteConsulta(options?: useDataConnectMutationOptions<DeleteConsultaData, FirebaseError, DeleteConsultaVariables>): UseDataConnectMutationResult<DeleteConsultaData, DeleteConsultaVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteConsulta(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteConsultaData, FirebaseError, DeleteConsultaVariables>): UseDataConnectMutationResult<DeleteConsultaData, DeleteConsultaVariables>;
```

### Variables
The `DeleteConsulta` Mutation requires an argument of type `DeleteConsultaVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteConsultaVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `DeleteConsulta` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteConsulta` Mutation is of type `DeleteConsultaData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteConsultaData {
  consulta_delete?: Consulta_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteConsulta`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteConsultaVariables } from '@dataconnect/generated';
import { useDeleteConsulta } from '@dataconnect/generated/react'

export default function DeleteConsultaComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteConsulta();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteConsulta(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteConsulta(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteConsulta(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteConsulta` Mutation requires an argument of type `DeleteConsultaVariables`:
  const deleteConsultaVars: DeleteConsultaVariables = {
    id: ..., 
  };
  mutation.mutate(deleteConsultaVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteConsultaVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.consulta_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreatePublicConsulta
You can execute the `CreatePublicConsulta` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreatePublicConsulta(options?: useDataConnectMutationOptions<CreatePublicConsultaData, FirebaseError, CreatePublicConsultaVariables>): UseDataConnectMutationResult<CreatePublicConsultaData, CreatePublicConsultaVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreatePublicConsulta(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePublicConsultaData, FirebaseError, CreatePublicConsultaVariables>): UseDataConnectMutationResult<CreatePublicConsultaData, CreatePublicConsultaVariables>;
```

### Variables
The `CreatePublicConsulta` Mutation requires an argument of type `CreatePublicConsultaVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `CreatePublicConsulta` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreatePublicConsulta` Mutation is of type `CreatePublicConsultaData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreatePublicConsultaData {
  consulta_insert: Consulta_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreatePublicConsulta`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreatePublicConsultaVariables } from '@dataconnect/generated';
import { useCreatePublicConsulta } from '@dataconnect/generated/react'

export default function CreatePublicConsultaComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreatePublicConsulta();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreatePublicConsulta(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreatePublicConsulta(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreatePublicConsulta(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreatePublicConsulta` Mutation requires an argument of type `CreatePublicConsultaVariables`:
  const createPublicConsultaVars: CreatePublicConsultaVariables = {
    perfilId: ..., 
    clienteNome: ..., 
    clienteTelefone: ..., // optional
    clienteEmail: ..., // optional
    dataHora: ..., 
    duracaoMin: ..., 
    servico: ..., // optional
    profissional: ..., // optional
    profissionalId: ..., // optional
    valor: ..., // optional
    observacoes: ..., // optional
  };
  mutation.mutate(createPublicConsultaVars);
  // Variables can be defined inline as well.
  mutation.mutate({ perfilId: ..., clienteNome: ..., clienteTelefone: ..., clienteEmail: ..., dataHora: ..., duracaoMin: ..., servico: ..., profissional: ..., profissionalId: ..., valor: ..., observacoes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createPublicConsultaVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.consulta_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetConsultaPixId
You can execute the `SetConsultaPixId` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetConsultaPixId(options?: useDataConnectMutationOptions<SetConsultaPixIdData, FirebaseError, SetConsultaPixIdVariables>): UseDataConnectMutationResult<SetConsultaPixIdData, SetConsultaPixIdVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetConsultaPixId(dc: DataConnect, options?: useDataConnectMutationOptions<SetConsultaPixIdData, FirebaseError, SetConsultaPixIdVariables>): UseDataConnectMutationResult<SetConsultaPixIdData, SetConsultaPixIdVariables>;
```

### Variables
The `SetConsultaPixId` Mutation requires an argument of type `SetConsultaPixIdVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetConsultaPixIdVariables {
  consultaId: UUIDString;
  pixId: string;
}
```
### Return Type
Recall that calling the `SetConsultaPixId` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetConsultaPixId` Mutation is of type `SetConsultaPixIdData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetConsultaPixIdData {
  consulta_update?: Consulta_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetConsultaPixId`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetConsultaPixIdVariables } from '@dataconnect/generated';
import { useSetConsultaPixId } from '@dataconnect/generated/react'

export default function SetConsultaPixIdComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetConsultaPixId();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetConsultaPixId(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetConsultaPixId(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetConsultaPixId(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetConsultaPixId` Mutation requires an argument of type `SetConsultaPixIdVariables`:
  const setConsultaPixIdVars: SetConsultaPixIdVariables = {
    consultaId: ..., 
    pixId: ..., 
  };
  mutation.mutate(setConsultaPixIdVars);
  // Variables can be defined inline as well.
  mutation.mutate({ consultaId: ..., pixId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setConsultaPixIdVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.consulta_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ConfirmarConsultaPaga
You can execute the `ConfirmarConsultaPaga` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useConfirmarConsultaPaga(options?: useDataConnectMutationOptions<ConfirmarConsultaPagaData, FirebaseError, ConfirmarConsultaPagaVariables>): UseDataConnectMutationResult<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useConfirmarConsultaPaga(dc: DataConnect, options?: useDataConnectMutationOptions<ConfirmarConsultaPagaData, FirebaseError, ConfirmarConsultaPagaVariables>): UseDataConnectMutationResult<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;
```

### Variables
The `ConfirmarConsultaPaga` Mutation requires an argument of type `ConfirmarConsultaPagaVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ConfirmarConsultaPagaVariables {
  consultaId: UUIDString;
  valorPago?: number | null;
}
```
### Return Type
Recall that calling the `ConfirmarConsultaPaga` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ConfirmarConsultaPaga` Mutation is of type `ConfirmarConsultaPagaData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ConfirmarConsultaPagaData {
  consulta_update?: Consulta_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ConfirmarConsultaPaga`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ConfirmarConsultaPagaVariables } from '@dataconnect/generated';
import { useConfirmarConsultaPaga } from '@dataconnect/generated/react'

export default function ConfirmarConsultaPagaComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useConfirmarConsultaPaga();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useConfirmarConsultaPaga(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useConfirmarConsultaPaga(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useConfirmarConsultaPaga(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useConfirmarConsultaPaga` Mutation requires an argument of type `ConfirmarConsultaPagaVariables`:
  const confirmarConsultaPagaVars: ConfirmarConsultaPagaVariables = {
    consultaId: ..., 
    valorPago: ..., // optional
  };
  mutation.mutate(confirmarConsultaPagaVars);
  // Variables can be defined inline as well.
  mutation.mutate({ consultaId: ..., valorPago: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(confirmarConsultaPagaVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.consulta_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

