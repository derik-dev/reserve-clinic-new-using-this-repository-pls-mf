# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `reserve_clinic`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `reserve_clinic`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `reserve_clinic` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMeuPerfil
You can execute the `GetMeuPerfil` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMeuPerfil(options?: ExecuteQueryOptions): QueryPromise<GetMeuPerfilData, undefined>;

interface GetMeuPerfilRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMeuPerfilData, undefined>;
}
export const getMeuPerfilRef: GetMeuPerfilRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMeuPerfil(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMeuPerfilData, undefined>;

interface GetMeuPerfilRef {
  ...
  (dc: DataConnect): QueryRef<GetMeuPerfilData, undefined>;
}
export const getMeuPerfilRef: GetMeuPerfilRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMeuPerfilRef:
```typescript
const name = getMeuPerfilRef.operationName;
console.log(name);
```

### Variables
The `GetMeuPerfil` query has no variables.
### Return Type
Recall that executing the `GetMeuPerfil` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMeuPerfilData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetMeuPerfil`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMeuPerfil } from '@dataconnect/generated';


// Call the `getMeuPerfil()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMeuPerfil();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMeuPerfil(dataConnect);

console.log(data.perfil);

// Or, you can use the `Promise` API.
getMeuPerfil().then((response) => {
  const data = response.data;
  console.log(data.perfil);
});
```

### Using `GetMeuPerfil`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMeuPerfilRef } from '@dataconnect/generated';


// Call the `getMeuPerfilRef()` function to get a reference to the query.
const ref = getMeuPerfilRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMeuPerfilRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.perfil);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.perfil);
});
```

## GetPublicPerfilBySlug
You can execute the `GetPublicPerfilBySlug` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getPublicPerfilBySlug(vars: GetPublicPerfilBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;

interface GetPublicPerfilBySlugRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPublicPerfilBySlugVariables): QueryRef<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;
}
export const getPublicPerfilBySlugRef: GetPublicPerfilBySlugRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPublicPerfilBySlug(dc: DataConnect, vars: GetPublicPerfilBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;

interface GetPublicPerfilBySlugRef {
  ...
  (dc: DataConnect, vars: GetPublicPerfilBySlugVariables): QueryRef<GetPublicPerfilBySlugData, GetPublicPerfilBySlugVariables>;
}
export const getPublicPerfilBySlugRef: GetPublicPerfilBySlugRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPublicPerfilBySlugRef:
```typescript
const name = getPublicPerfilBySlugRef.operationName;
console.log(name);
```

### Variables
The `GetPublicPerfilBySlug` query requires an argument of type `GetPublicPerfilBySlugVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetPublicPerfilBySlugVariables {
  slug: string;
}
```
### Return Type
Recall that executing the `GetPublicPerfilBySlug` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPublicPerfilBySlugData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetPublicPerfilBySlug`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPublicPerfilBySlug, GetPublicPerfilBySlugVariables } from '@dataconnect/generated';

// The `GetPublicPerfilBySlug` query requires an argument of type `GetPublicPerfilBySlugVariables`:
const getPublicPerfilBySlugVars: GetPublicPerfilBySlugVariables = {
  slug: ..., 
};

// Call the `getPublicPerfilBySlug()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPublicPerfilBySlug(getPublicPerfilBySlugVars);
// Variables can be defined inline as well.
const { data } = await getPublicPerfilBySlug({ slug: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPublicPerfilBySlug(dataConnect, getPublicPerfilBySlugVars);

console.log(data.perfis);

// Or, you can use the `Promise` API.
getPublicPerfilBySlug(getPublicPerfilBySlugVars).then((response) => {
  const data = response.data;
  console.log(data.perfis);
});
```

### Using `GetPublicPerfilBySlug`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPublicPerfilBySlugRef, GetPublicPerfilBySlugVariables } from '@dataconnect/generated';

// The `GetPublicPerfilBySlug` query requires an argument of type `GetPublicPerfilBySlugVariables`:
const getPublicPerfilBySlugVars: GetPublicPerfilBySlugVariables = {
  slug: ..., 
};

// Call the `getPublicPerfilBySlugRef()` function to get a reference to the query.
const ref = getPublicPerfilBySlugRef(getPublicPerfilBySlugVars);
// Variables can be defined inline as well.
const ref = getPublicPerfilBySlugRef({ slug: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPublicPerfilBySlugRef(dataConnect, getPublicPerfilBySlugVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.perfis);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.perfis);
});
```

## GetPublicConfiguracao
You can execute the `GetPublicConfiguracao` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getPublicConfiguracao(vars: GetPublicConfiguracaoVariables, options?: ExecuteQueryOptions): QueryPromise<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;

interface GetPublicConfiguracaoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPublicConfiguracaoVariables): QueryRef<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;
}
export const getPublicConfiguracaoRef: GetPublicConfiguracaoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPublicConfiguracao(dc: DataConnect, vars: GetPublicConfiguracaoVariables, options?: ExecuteQueryOptions): QueryPromise<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;

interface GetPublicConfiguracaoRef {
  ...
  (dc: DataConnect, vars: GetPublicConfiguracaoVariables): QueryRef<GetPublicConfiguracaoData, GetPublicConfiguracaoVariables>;
}
export const getPublicConfiguracaoRef: GetPublicConfiguracaoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPublicConfiguracaoRef:
```typescript
const name = getPublicConfiguracaoRef.operationName;
console.log(name);
```

### Variables
The `GetPublicConfiguracao` query requires an argument of type `GetPublicConfiguracaoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetPublicConfiguracaoVariables {
  perfilId: string;
}
```
### Return Type
Recall that executing the `GetPublicConfiguracao` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPublicConfiguracaoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetPublicConfiguracao`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPublicConfiguracao, GetPublicConfiguracaoVariables } from '@dataconnect/generated';

// The `GetPublicConfiguracao` query requires an argument of type `GetPublicConfiguracaoVariables`:
const getPublicConfiguracaoVars: GetPublicConfiguracaoVariables = {
  perfilId: ..., 
};

// Call the `getPublicConfiguracao()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPublicConfiguracao(getPublicConfiguracaoVars);
// Variables can be defined inline as well.
const { data } = await getPublicConfiguracao({ perfilId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPublicConfiguracao(dataConnect, getPublicConfiguracaoVars);

console.log(data.configuracao);

// Or, you can use the `Promise` API.
getPublicConfiguracao(getPublicConfiguracaoVars).then((response) => {
  const data = response.data;
  console.log(data.configuracao);
});
```

### Using `GetPublicConfiguracao`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPublicConfiguracaoRef, GetPublicConfiguracaoVariables } from '@dataconnect/generated';

// The `GetPublicConfiguracao` query requires an argument of type `GetPublicConfiguracaoVariables`:
const getPublicConfiguracaoVars: GetPublicConfiguracaoVariables = {
  perfilId: ..., 
};

// Call the `getPublicConfiguracaoRef()` function to get a reference to the query.
const ref = getPublicConfiguracaoRef(getPublicConfiguracaoVars);
// Variables can be defined inline as well.
const ref = getPublicConfiguracaoRef({ perfilId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPublicConfiguracaoRef(dataConnect, getPublicConfiguracaoVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.configuracao);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.configuracao);
});
```

## ListPublicProfissionais
You can execute the `ListPublicProfissionais` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPublicProfissionais(vars: ListPublicProfissionaisVariables, options?: ExecuteQueryOptions): QueryPromise<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;

interface ListPublicProfissionaisRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListPublicProfissionaisVariables): QueryRef<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;
}
export const listPublicProfissionaisRef: ListPublicProfissionaisRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPublicProfissionais(dc: DataConnect, vars: ListPublicProfissionaisVariables, options?: ExecuteQueryOptions): QueryPromise<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;

interface ListPublicProfissionaisRef {
  ...
  (dc: DataConnect, vars: ListPublicProfissionaisVariables): QueryRef<ListPublicProfissionaisData, ListPublicProfissionaisVariables>;
}
export const listPublicProfissionaisRef: ListPublicProfissionaisRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPublicProfissionaisRef:
```typescript
const name = listPublicProfissionaisRef.operationName;
console.log(name);
```

### Variables
The `ListPublicProfissionais` query requires an argument of type `ListPublicProfissionaisVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListPublicProfissionaisVariables {
  perfilId: string;
}
```
### Return Type
Recall that executing the `ListPublicProfissionais` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPublicProfissionaisData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListPublicProfissionais`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPublicProfissionais, ListPublicProfissionaisVariables } from '@dataconnect/generated';

// The `ListPublicProfissionais` query requires an argument of type `ListPublicProfissionaisVariables`:
const listPublicProfissionaisVars: ListPublicProfissionaisVariables = {
  perfilId: ..., 
};

// Call the `listPublicProfissionais()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPublicProfissionais(listPublicProfissionaisVars);
// Variables can be defined inline as well.
const { data } = await listPublicProfissionais({ perfilId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPublicProfissionais(dataConnect, listPublicProfissionaisVars);

console.log(data.profissionais);

// Or, you can use the `Promise` API.
listPublicProfissionais(listPublicProfissionaisVars).then((response) => {
  const data = response.data;
  console.log(data.profissionais);
});
```

### Using `ListPublicProfissionais`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPublicProfissionaisRef, ListPublicProfissionaisVariables } from '@dataconnect/generated';

// The `ListPublicProfissionais` query requires an argument of type `ListPublicProfissionaisVariables`:
const listPublicProfissionaisVars: ListPublicProfissionaisVariables = {
  perfilId: ..., 
};

// Call the `listPublicProfissionaisRef()` function to get a reference to the query.
const ref = listPublicProfissionaisRef(listPublicProfissionaisVars);
// Variables can be defined inline as well.
const ref = listPublicProfissionaisRef({ perfilId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPublicProfissionaisRef(dataConnect, listPublicProfissionaisVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.profissionais);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.profissionais);
});
```

## ListPublicBusyConsultas
You can execute the `ListPublicBusyConsultas` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPublicBusyConsultas(vars: ListPublicBusyConsultasVariables, options?: ExecuteQueryOptions): QueryPromise<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;

interface ListPublicBusyConsultasRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListPublicBusyConsultasVariables): QueryRef<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;
}
export const listPublicBusyConsultasRef: ListPublicBusyConsultasRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPublicBusyConsultas(dc: DataConnect, vars: ListPublicBusyConsultasVariables, options?: ExecuteQueryOptions): QueryPromise<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;

interface ListPublicBusyConsultasRef {
  ...
  (dc: DataConnect, vars: ListPublicBusyConsultasVariables): QueryRef<ListPublicBusyConsultasData, ListPublicBusyConsultasVariables>;
}
export const listPublicBusyConsultasRef: ListPublicBusyConsultasRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPublicBusyConsultasRef:
```typescript
const name = listPublicBusyConsultasRef.operationName;
console.log(name);
```

### Variables
The `ListPublicBusyConsultas` query requires an argument of type `ListPublicBusyConsultasVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListPublicBusyConsultasVariables {
  perfilId: string;
  from: TimestampString;
  to: TimestampString;
}
```
### Return Type
Recall that executing the `ListPublicBusyConsultas` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPublicBusyConsultasData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPublicBusyConsultasData {
  consultas: ({
    id: UUIDString;
    dataHora: TimestampString;
    duracaoMin: number;
    profissionalId?: UUIDString | null;
  } & Consulta_Key)[];
}
```
### Using `ListPublicBusyConsultas`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPublicBusyConsultas, ListPublicBusyConsultasVariables } from '@dataconnect/generated';

// The `ListPublicBusyConsultas` query requires an argument of type `ListPublicBusyConsultasVariables`:
const listPublicBusyConsultasVars: ListPublicBusyConsultasVariables = {
  perfilId: ..., 
  from: ..., 
  to: ..., 
};

// Call the `listPublicBusyConsultas()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPublicBusyConsultas(listPublicBusyConsultasVars);
// Variables can be defined inline as well.
const { data } = await listPublicBusyConsultas({ perfilId: ..., from: ..., to: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPublicBusyConsultas(dataConnect, listPublicBusyConsultasVars);

console.log(data.consultas);

// Or, you can use the `Promise` API.
listPublicBusyConsultas(listPublicBusyConsultasVars).then((response) => {
  const data = response.data;
  console.log(data.consultas);
});
```

### Using `ListPublicBusyConsultas`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPublicBusyConsultasRef, ListPublicBusyConsultasVariables } from '@dataconnect/generated';

// The `ListPublicBusyConsultas` query requires an argument of type `ListPublicBusyConsultasVariables`:
const listPublicBusyConsultasVars: ListPublicBusyConsultasVariables = {
  perfilId: ..., 
  from: ..., 
  to: ..., 
};

// Call the `listPublicBusyConsultasRef()` function to get a reference to the query.
const ref = listPublicBusyConsultasRef(listPublicBusyConsultasVars);
// Variables can be defined inline as well.
const ref = listPublicBusyConsultasRef({ perfilId: ..., from: ..., to: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPublicBusyConsultasRef(dataConnect, listPublicBusyConsultasVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.consultas);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.consultas);
});
```

## GetMinhaConfiguracao
You can execute the `GetMinhaConfiguracao` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMinhaConfiguracao(options?: ExecuteQueryOptions): QueryPromise<GetMinhaConfiguracaoData, undefined>;

interface GetMinhaConfiguracaoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMinhaConfiguracaoData, undefined>;
}
export const getMinhaConfiguracaoRef: GetMinhaConfiguracaoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMinhaConfiguracao(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMinhaConfiguracaoData, undefined>;

interface GetMinhaConfiguracaoRef {
  ...
  (dc: DataConnect): QueryRef<GetMinhaConfiguracaoData, undefined>;
}
export const getMinhaConfiguracaoRef: GetMinhaConfiguracaoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMinhaConfiguracaoRef:
```typescript
const name = getMinhaConfiguracaoRef.operationName;
console.log(name);
```

### Variables
The `GetMinhaConfiguracao` query has no variables.
### Return Type
Recall that executing the `GetMinhaConfiguracao` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMinhaConfiguracaoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetMinhaConfiguracao`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMinhaConfiguracao } from '@dataconnect/generated';


// Call the `getMinhaConfiguracao()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMinhaConfiguracao();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMinhaConfiguracao(dataConnect);

console.log(data.configuracao);

// Or, you can use the `Promise` API.
getMinhaConfiguracao().then((response) => {
  const data = response.data;
  console.log(data.configuracao);
});
```

### Using `GetMinhaConfiguracao`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMinhaConfiguracaoRef } from '@dataconnect/generated';


// Call the `getMinhaConfiguracaoRef()` function to get a reference to the query.
const ref = getMinhaConfiguracaoRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMinhaConfiguracaoRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.configuracao);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.configuracao);
});
```

## ListMeusPacientes
You can execute the `ListMeusPacientes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMeusPacientes(options?: ExecuteQueryOptions): QueryPromise<ListMeusPacientesData, undefined>;

interface ListMeusPacientesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMeusPacientesData, undefined>;
}
export const listMeusPacientesRef: ListMeusPacientesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMeusPacientes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMeusPacientesData, undefined>;

interface ListMeusPacientesRef {
  ...
  (dc: DataConnect): QueryRef<ListMeusPacientesData, undefined>;
}
export const listMeusPacientesRef: ListMeusPacientesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMeusPacientesRef:
```typescript
const name = listMeusPacientesRef.operationName;
console.log(name);
```

### Variables
The `ListMeusPacientes` query has no variables.
### Return Type
Recall that executing the `ListMeusPacientes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMeusPacientesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListMeusPacientes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMeusPacientes } from '@dataconnect/generated';


// Call the `listMeusPacientes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMeusPacientes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMeusPacientes(dataConnect);

console.log(data.pacientes);

// Or, you can use the `Promise` API.
listMeusPacientes().then((response) => {
  const data = response.data;
  console.log(data.pacientes);
});
```

### Using `ListMeusPacientes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMeusPacientesRef } from '@dataconnect/generated';


// Call the `listMeusPacientesRef()` function to get a reference to the query.
const ref = listMeusPacientesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMeusPacientesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.pacientes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.pacientes);
});
```

## ListMinhasConsultas
You can execute the `ListMinhasConsultas` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMinhasConsultas(vars?: ListMinhasConsultasVariables, options?: ExecuteQueryOptions): QueryPromise<ListMinhasConsultasData, ListMinhasConsultasVariables>;

interface ListMinhasConsultasRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListMinhasConsultasVariables): QueryRef<ListMinhasConsultasData, ListMinhasConsultasVariables>;
}
export const listMinhasConsultasRef: ListMinhasConsultasRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMinhasConsultas(dc: DataConnect, vars?: ListMinhasConsultasVariables, options?: ExecuteQueryOptions): QueryPromise<ListMinhasConsultasData, ListMinhasConsultasVariables>;

interface ListMinhasConsultasRef {
  ...
  (dc: DataConnect, vars?: ListMinhasConsultasVariables): QueryRef<ListMinhasConsultasData, ListMinhasConsultasVariables>;
}
export const listMinhasConsultasRef: ListMinhasConsultasRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMinhasConsultasRef:
```typescript
const name = listMinhasConsultasRef.operationName;
console.log(name);
```

### Variables
The `ListMinhasConsultas` query has an optional argument of type `ListMinhasConsultasVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListMinhasConsultasVariables {
  from?: TimestampString | null;
  to?: TimestampString | null;
}
```
### Return Type
Recall that executing the `ListMinhasConsultas` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMinhasConsultasData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListMinhasConsultas`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMinhasConsultas, ListMinhasConsultasVariables } from '@dataconnect/generated';

// The `ListMinhasConsultas` query has an optional argument of type `ListMinhasConsultasVariables`:
const listMinhasConsultasVars: ListMinhasConsultasVariables = {
  from: ..., // optional
  to: ..., // optional
};

// Call the `listMinhasConsultas()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMinhasConsultas(listMinhasConsultasVars);
// Variables can be defined inline as well.
const { data } = await listMinhasConsultas({ from: ..., to: ..., });
// Since all variables are optional for this query, you can omit the `ListMinhasConsultasVariables` argument.
const { data } = await listMinhasConsultas();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMinhasConsultas(dataConnect, listMinhasConsultasVars);

console.log(data.consultas);

// Or, you can use the `Promise` API.
listMinhasConsultas(listMinhasConsultasVars).then((response) => {
  const data = response.data;
  console.log(data.consultas);
});
```

### Using `ListMinhasConsultas`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMinhasConsultasRef, ListMinhasConsultasVariables } from '@dataconnect/generated';

// The `ListMinhasConsultas` query has an optional argument of type `ListMinhasConsultasVariables`:
const listMinhasConsultasVars: ListMinhasConsultasVariables = {
  from: ..., // optional
  to: ..., // optional
};

// Call the `listMinhasConsultasRef()` function to get a reference to the query.
const ref = listMinhasConsultasRef(listMinhasConsultasVars);
// Variables can be defined inline as well.
const ref = listMinhasConsultasRef({ from: ..., to: ..., });
// Since all variables are optional for this query, you can omit the `ListMinhasConsultasVariables` argument.
const ref = listMinhasConsultasRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMinhasConsultasRef(dataConnect, listMinhasConsultasVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.consultas);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.consultas);
});
```

## ListMeusProfissionais
You can execute the `ListMeusProfissionais` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMeusProfissionais(options?: ExecuteQueryOptions): QueryPromise<ListMeusProfissionaisData, undefined>;

interface ListMeusProfissionaisRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMeusProfissionaisData, undefined>;
}
export const listMeusProfissionaisRef: ListMeusProfissionaisRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMeusProfissionais(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMeusProfissionaisData, undefined>;

interface ListMeusProfissionaisRef {
  ...
  (dc: DataConnect): QueryRef<ListMeusProfissionaisData, undefined>;
}
export const listMeusProfissionaisRef: ListMeusProfissionaisRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMeusProfissionaisRef:
```typescript
const name = listMeusProfissionaisRef.operationName;
console.log(name);
```

### Variables
The `ListMeusProfissionais` query has no variables.
### Return Type
Recall that executing the `ListMeusProfissionais` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMeusProfissionaisData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListMeusProfissionais`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMeusProfissionais } from '@dataconnect/generated';


// Call the `listMeusProfissionais()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMeusProfissionais();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMeusProfissionais(dataConnect);

console.log(data.profissionais);

// Or, you can use the `Promise` API.
listMeusProfissionais().then((response) => {
  const data = response.data;
  console.log(data.profissionais);
});
```

### Using `ListMeusProfissionais`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMeusProfissionaisRef } from '@dataconnect/generated';


// Call the `listMeusProfissionaisRef()` function to get a reference to the query.
const ref = listMeusProfissionaisRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMeusProfissionaisRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.profissionais);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.profissionais);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `reserve_clinic` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertMeuPerfil
You can execute the `UpsertMeuPerfil` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertMeuPerfil(vars: UpsertMeuPerfilVariables): MutationPromise<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;

interface UpsertMeuPerfilRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertMeuPerfilVariables): MutationRef<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;
}
export const upsertMeuPerfilRef: UpsertMeuPerfilRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertMeuPerfil(dc: DataConnect, vars: UpsertMeuPerfilVariables): MutationPromise<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;

interface UpsertMeuPerfilRef {
  ...
  (dc: DataConnect, vars: UpsertMeuPerfilVariables): MutationRef<UpsertMeuPerfilData, UpsertMeuPerfilVariables>;
}
export const upsertMeuPerfilRef: UpsertMeuPerfilRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertMeuPerfilRef:
```typescript
const name = upsertMeuPerfilRef.operationName;
console.log(name);
```

### Variables
The `UpsertMeuPerfil` mutation requires an argument of type `UpsertMeuPerfilVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertMeuPerfil` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertMeuPerfilData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertMeuPerfilData {
  perfil_upsert: Perfil_Key;
}
```
### Using `UpsertMeuPerfil`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertMeuPerfil, UpsertMeuPerfilVariables } from '@dataconnect/generated';

// The `UpsertMeuPerfil` mutation requires an argument of type `UpsertMeuPerfilVariables`:
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

// Call the `upsertMeuPerfil()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertMeuPerfil(upsertMeuPerfilVars);
// Variables can be defined inline as well.
const { data } = await upsertMeuPerfil({ nome: ..., slug: ..., tipo: ..., telefone: ..., emailContato: ..., logoUrl: ..., corPrimaria: ..., corSecundaria: ..., cpfCnpj: ..., enderecoCep: ..., enderecoRua: ..., enderecoNumero: ..., enderecoBairro: ..., enderecoCidade: ..., enderecoUf: ..., pixChave: ..., site: ..., instagram: ..., tiktok: ..., valorConsulta: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertMeuPerfil(dataConnect, upsertMeuPerfilVars);

console.log(data.perfil_upsert);

// Or, you can use the `Promise` API.
upsertMeuPerfil(upsertMeuPerfilVars).then((response) => {
  const data = response.data;
  console.log(data.perfil_upsert);
});
```

### Using `UpsertMeuPerfil`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertMeuPerfilRef, UpsertMeuPerfilVariables } from '@dataconnect/generated';

// The `UpsertMeuPerfil` mutation requires an argument of type `UpsertMeuPerfilVariables`:
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

// Call the `upsertMeuPerfilRef()` function to get a reference to the mutation.
const ref = upsertMeuPerfilRef(upsertMeuPerfilVars);
// Variables can be defined inline as well.
const ref = upsertMeuPerfilRef({ nome: ..., slug: ..., tipo: ..., telefone: ..., emailContato: ..., logoUrl: ..., corPrimaria: ..., corSecundaria: ..., cpfCnpj: ..., enderecoCep: ..., enderecoRua: ..., enderecoNumero: ..., enderecoBairro: ..., enderecoCidade: ..., enderecoUf: ..., pixChave: ..., site: ..., instagram: ..., tiktok: ..., valorConsulta: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertMeuPerfilRef(dataConnect, upsertMeuPerfilVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.perfil_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.perfil_upsert);
});
```

## UpsertMinhaConfiguracao
You can execute the `UpsertMinhaConfiguracao` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertMinhaConfiguracao(vars: UpsertMinhaConfiguracaoVariables): MutationPromise<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;

interface UpsertMinhaConfiguracaoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertMinhaConfiguracaoVariables): MutationRef<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;
}
export const upsertMinhaConfiguracaoRef: UpsertMinhaConfiguracaoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertMinhaConfiguracao(dc: DataConnect, vars: UpsertMinhaConfiguracaoVariables): MutationPromise<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;

interface UpsertMinhaConfiguracaoRef {
  ...
  (dc: DataConnect, vars: UpsertMinhaConfiguracaoVariables): MutationRef<UpsertMinhaConfiguracaoData, UpsertMinhaConfiguracaoVariables>;
}
export const upsertMinhaConfiguracaoRef: UpsertMinhaConfiguracaoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertMinhaConfiguracaoRef:
```typescript
const name = upsertMinhaConfiguracaoRef.operationName;
console.log(name);
```

### Variables
The `UpsertMinhaConfiguracao` mutation requires an argument of type `UpsertMinhaConfiguracaoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertMinhaConfiguracao` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertMinhaConfiguracaoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertMinhaConfiguracaoData {
  configuracao_upsert: Configuracao_Key;
}
```
### Using `UpsertMinhaConfiguracao`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertMinhaConfiguracao, UpsertMinhaConfiguracaoVariables } from '@dataconnect/generated';

// The `UpsertMinhaConfiguracao` mutation requires an argument of type `UpsertMinhaConfiguracaoVariables`:
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

// Call the `upsertMinhaConfiguracao()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertMinhaConfiguracao(upsertMinhaConfiguracaoVars);
// Variables can be defined inline as well.
const { data } = await upsertMinhaConfiguracao({ agendaConfig: ..., duracaoAtendimentoMin: ..., tipoPagamento: ..., valorAtendimento: ..., valorSinal: ..., antecedenciaMinimaHoras: ..., qrCodeManualUrl: ..., chavePixManual: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertMinhaConfiguracao(dataConnect, upsertMinhaConfiguracaoVars);

console.log(data.configuracao_upsert);

// Or, you can use the `Promise` API.
upsertMinhaConfiguracao(upsertMinhaConfiguracaoVars).then((response) => {
  const data = response.data;
  console.log(data.configuracao_upsert);
});
```

### Using `UpsertMinhaConfiguracao`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertMinhaConfiguracaoRef, UpsertMinhaConfiguracaoVariables } from '@dataconnect/generated';

// The `UpsertMinhaConfiguracao` mutation requires an argument of type `UpsertMinhaConfiguracaoVariables`:
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

// Call the `upsertMinhaConfiguracaoRef()` function to get a reference to the mutation.
const ref = upsertMinhaConfiguracaoRef(upsertMinhaConfiguracaoVars);
// Variables can be defined inline as well.
const ref = upsertMinhaConfiguracaoRef({ agendaConfig: ..., duracaoAtendimentoMin: ..., tipoPagamento: ..., valorAtendimento: ..., valorSinal: ..., antecedenciaMinimaHoras: ..., qrCodeManualUrl: ..., chavePixManual: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertMinhaConfiguracaoRef(dataConnect, upsertMinhaConfiguracaoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.configuracao_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.configuracao_upsert);
});
```

## CreatePaciente
You can execute the `CreatePaciente` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPaciente(vars: CreatePacienteVariables): MutationPromise<CreatePacienteData, CreatePacienteVariables>;

interface CreatePacienteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePacienteVariables): MutationRef<CreatePacienteData, CreatePacienteVariables>;
}
export const createPacienteRef: CreatePacienteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPaciente(dc: DataConnect, vars: CreatePacienteVariables): MutationPromise<CreatePacienteData, CreatePacienteVariables>;

interface CreatePacienteRef {
  ...
  (dc: DataConnect, vars: CreatePacienteVariables): MutationRef<CreatePacienteData, CreatePacienteVariables>;
}
export const createPacienteRef: CreatePacienteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPacienteRef:
```typescript
const name = createPacienteRef.operationName;
console.log(name);
```

### Variables
The `CreatePaciente` mutation requires an argument of type `CreatePacienteVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreatePaciente` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePacienteData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePacienteData {
  paciente_insert: Paciente_Key;
}
```
### Using `CreatePaciente`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPaciente, CreatePacienteVariables } from '@dataconnect/generated';

// The `CreatePaciente` mutation requires an argument of type `CreatePacienteVariables`:
const createPacienteVars: CreatePacienteVariables = {
  nome: ..., 
  telefone: ..., // optional
  email: ..., // optional
  cpf: ..., // optional
  dataNascimento: ..., // optional
  observacoes: ..., // optional
};

// Call the `createPaciente()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPaciente(createPacienteVars);
// Variables can be defined inline as well.
const { data } = await createPaciente({ nome: ..., telefone: ..., email: ..., cpf: ..., dataNascimento: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPaciente(dataConnect, createPacienteVars);

console.log(data.paciente_insert);

// Or, you can use the `Promise` API.
createPaciente(createPacienteVars).then((response) => {
  const data = response.data;
  console.log(data.paciente_insert);
});
```

### Using `CreatePaciente`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPacienteRef, CreatePacienteVariables } from '@dataconnect/generated';

// The `CreatePaciente` mutation requires an argument of type `CreatePacienteVariables`:
const createPacienteVars: CreatePacienteVariables = {
  nome: ..., 
  telefone: ..., // optional
  email: ..., // optional
  cpf: ..., // optional
  dataNascimento: ..., // optional
  observacoes: ..., // optional
};

// Call the `createPacienteRef()` function to get a reference to the mutation.
const ref = createPacienteRef(createPacienteVars);
// Variables can be defined inline as well.
const ref = createPacienteRef({ nome: ..., telefone: ..., email: ..., cpf: ..., dataNascimento: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPacienteRef(dataConnect, createPacienteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.paciente_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.paciente_insert);
});
```

## UpdatePaciente
You can execute the `UpdatePaciente` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updatePaciente(vars: UpdatePacienteVariables): MutationPromise<UpdatePacienteData, UpdatePacienteVariables>;

interface UpdatePacienteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePacienteVariables): MutationRef<UpdatePacienteData, UpdatePacienteVariables>;
}
export const updatePacienteRef: UpdatePacienteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePaciente(dc: DataConnect, vars: UpdatePacienteVariables): MutationPromise<UpdatePacienteData, UpdatePacienteVariables>;

interface UpdatePacienteRef {
  ...
  (dc: DataConnect, vars: UpdatePacienteVariables): MutationRef<UpdatePacienteData, UpdatePacienteVariables>;
}
export const updatePacienteRef: UpdatePacienteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePacienteRef:
```typescript
const name = updatePacienteRef.operationName;
console.log(name);
```

### Variables
The `UpdatePaciente` mutation requires an argument of type `UpdatePacienteVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdatePaciente` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePacienteData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePacienteData {
  paciente_update?: Paciente_Key | null;
}
```
### Using `UpdatePaciente`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePaciente, UpdatePacienteVariables } from '@dataconnect/generated';

// The `UpdatePaciente` mutation requires an argument of type `UpdatePacienteVariables`:
const updatePacienteVars: UpdatePacienteVariables = {
  id: ..., 
  nome: ..., 
  telefone: ..., // optional
  email: ..., // optional
  cpf: ..., // optional
  dataNascimento: ..., // optional
  observacoes: ..., // optional
};

// Call the `updatePaciente()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePaciente(updatePacienteVars);
// Variables can be defined inline as well.
const { data } = await updatePaciente({ id: ..., nome: ..., telefone: ..., email: ..., cpf: ..., dataNascimento: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePaciente(dataConnect, updatePacienteVars);

console.log(data.paciente_update);

// Or, you can use the `Promise` API.
updatePaciente(updatePacienteVars).then((response) => {
  const data = response.data;
  console.log(data.paciente_update);
});
```

### Using `UpdatePaciente`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePacienteRef, UpdatePacienteVariables } from '@dataconnect/generated';

// The `UpdatePaciente` mutation requires an argument of type `UpdatePacienteVariables`:
const updatePacienteVars: UpdatePacienteVariables = {
  id: ..., 
  nome: ..., 
  telefone: ..., // optional
  email: ..., // optional
  cpf: ..., // optional
  dataNascimento: ..., // optional
  observacoes: ..., // optional
};

// Call the `updatePacienteRef()` function to get a reference to the mutation.
const ref = updatePacienteRef(updatePacienteVars);
// Variables can be defined inline as well.
const ref = updatePacienteRef({ id: ..., nome: ..., telefone: ..., email: ..., cpf: ..., dataNascimento: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePacienteRef(dataConnect, updatePacienteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.paciente_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.paciente_update);
});
```

## SetPacienteStatus
You can execute the `SetPacienteStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setPacienteStatus(vars: SetPacienteStatusVariables): MutationPromise<SetPacienteStatusData, SetPacienteStatusVariables>;

interface SetPacienteStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPacienteStatusVariables): MutationRef<SetPacienteStatusData, SetPacienteStatusVariables>;
}
export const setPacienteStatusRef: SetPacienteStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setPacienteStatus(dc: DataConnect, vars: SetPacienteStatusVariables): MutationPromise<SetPacienteStatusData, SetPacienteStatusVariables>;

interface SetPacienteStatusRef {
  ...
  (dc: DataConnect, vars: SetPacienteStatusVariables): MutationRef<SetPacienteStatusData, SetPacienteStatusVariables>;
}
export const setPacienteStatusRef: SetPacienteStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setPacienteStatusRef:
```typescript
const name = setPacienteStatusRef.operationName;
console.log(name);
```

### Variables
The `SetPacienteStatus` mutation requires an argument of type `SetPacienteStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetPacienteStatusVariables {
  id: UUIDString;
  status: string;
}
```
### Return Type
Recall that executing the `SetPacienteStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetPacienteStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetPacienteStatusData {
  paciente_update?: Paciente_Key | null;
}
```
### Using `SetPacienteStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setPacienteStatus, SetPacienteStatusVariables } from '@dataconnect/generated';

// The `SetPacienteStatus` mutation requires an argument of type `SetPacienteStatusVariables`:
const setPacienteStatusVars: SetPacienteStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `setPacienteStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setPacienteStatus(setPacienteStatusVars);
// Variables can be defined inline as well.
const { data } = await setPacienteStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setPacienteStatus(dataConnect, setPacienteStatusVars);

console.log(data.paciente_update);

// Or, you can use the `Promise` API.
setPacienteStatus(setPacienteStatusVars).then((response) => {
  const data = response.data;
  console.log(data.paciente_update);
});
```

### Using `SetPacienteStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setPacienteStatusRef, SetPacienteStatusVariables } from '@dataconnect/generated';

// The `SetPacienteStatus` mutation requires an argument of type `SetPacienteStatusVariables`:
const setPacienteStatusVars: SetPacienteStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `setPacienteStatusRef()` function to get a reference to the mutation.
const ref = setPacienteStatusRef(setPacienteStatusVars);
// Variables can be defined inline as well.
const ref = setPacienteStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setPacienteStatusRef(dataConnect, setPacienteStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.paciente_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.paciente_update);
});
```

## DeletePaciente
You can execute the `DeletePaciente` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deletePaciente(vars: DeletePacienteVariables): MutationPromise<DeletePacienteData, DeletePacienteVariables>;

interface DeletePacienteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePacienteVariables): MutationRef<DeletePacienteData, DeletePacienteVariables>;
}
export const deletePacienteRef: DeletePacienteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deletePaciente(dc: DataConnect, vars: DeletePacienteVariables): MutationPromise<DeletePacienteData, DeletePacienteVariables>;

interface DeletePacienteRef {
  ...
  (dc: DataConnect, vars: DeletePacienteVariables): MutationRef<DeletePacienteData, DeletePacienteVariables>;
}
export const deletePacienteRef: DeletePacienteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deletePacienteRef:
```typescript
const name = deletePacienteRef.operationName;
console.log(name);
```

### Variables
The `DeletePaciente` mutation requires an argument of type `DeletePacienteVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeletePacienteVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeletePaciente` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeletePacienteData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeletePacienteData {
  paciente_delete?: Paciente_Key | null;
}
```
### Using `DeletePaciente`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deletePaciente, DeletePacienteVariables } from '@dataconnect/generated';

// The `DeletePaciente` mutation requires an argument of type `DeletePacienteVariables`:
const deletePacienteVars: DeletePacienteVariables = {
  id: ..., 
};

// Call the `deletePaciente()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deletePaciente(deletePacienteVars);
// Variables can be defined inline as well.
const { data } = await deletePaciente({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deletePaciente(dataConnect, deletePacienteVars);

console.log(data.paciente_delete);

// Or, you can use the `Promise` API.
deletePaciente(deletePacienteVars).then((response) => {
  const data = response.data;
  console.log(data.paciente_delete);
});
```

### Using `DeletePaciente`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deletePacienteRef, DeletePacienteVariables } from '@dataconnect/generated';

// The `DeletePaciente` mutation requires an argument of type `DeletePacienteVariables`:
const deletePacienteVars: DeletePacienteVariables = {
  id: ..., 
};

// Call the `deletePacienteRef()` function to get a reference to the mutation.
const ref = deletePacienteRef(deletePacienteVars);
// Variables can be defined inline as well.
const ref = deletePacienteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deletePacienteRef(dataConnect, deletePacienteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.paciente_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.paciente_delete);
});
```

## CreateProfissional
You can execute the `CreateProfissional` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createProfissional(vars: CreateProfissionalVariables): MutationPromise<CreateProfissionalData, CreateProfissionalVariables>;

interface CreateProfissionalRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProfissionalVariables): MutationRef<CreateProfissionalData, CreateProfissionalVariables>;
}
export const createProfissionalRef: CreateProfissionalRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createProfissional(dc: DataConnect, vars: CreateProfissionalVariables): MutationPromise<CreateProfissionalData, CreateProfissionalVariables>;

interface CreateProfissionalRef {
  ...
  (dc: DataConnect, vars: CreateProfissionalVariables): MutationRef<CreateProfissionalData, CreateProfissionalVariables>;
}
export const createProfissionalRef: CreateProfissionalRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createProfissionalRef:
```typescript
const name = createProfissionalRef.operationName;
console.log(name);
```

### Variables
The `CreateProfissional` mutation requires an argument of type `CreateProfissionalVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreateProfissional` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateProfissionalData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateProfissionalData {
  profissional_insert: Profissional_Key;
}
```
### Using `CreateProfissional`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createProfissional, CreateProfissionalVariables } from '@dataconnect/generated';

// The `CreateProfissional` mutation requires an argument of type `CreateProfissionalVariables`:
const createProfissionalVars: CreateProfissionalVariables = {
  nome: ..., 
  especialidade: ..., // optional
  whatsapp: ..., // optional
  cpf: ..., // optional
  anosExperiencia: ..., // optional
  fotoUrl: ..., // optional
  valorConsulta: ..., // optional
};

// Call the `createProfissional()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createProfissional(createProfissionalVars);
// Variables can be defined inline as well.
const { data } = await createProfissional({ nome: ..., especialidade: ..., whatsapp: ..., cpf: ..., anosExperiencia: ..., fotoUrl: ..., valorConsulta: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createProfissional(dataConnect, createProfissionalVars);

console.log(data.profissional_insert);

// Or, you can use the `Promise` API.
createProfissional(createProfissionalVars).then((response) => {
  const data = response.data;
  console.log(data.profissional_insert);
});
```

### Using `CreateProfissional`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createProfissionalRef, CreateProfissionalVariables } from '@dataconnect/generated';

// The `CreateProfissional` mutation requires an argument of type `CreateProfissionalVariables`:
const createProfissionalVars: CreateProfissionalVariables = {
  nome: ..., 
  especialidade: ..., // optional
  whatsapp: ..., // optional
  cpf: ..., // optional
  anosExperiencia: ..., // optional
  fotoUrl: ..., // optional
  valorConsulta: ..., // optional
};

// Call the `createProfissionalRef()` function to get a reference to the mutation.
const ref = createProfissionalRef(createProfissionalVars);
// Variables can be defined inline as well.
const ref = createProfissionalRef({ nome: ..., especialidade: ..., whatsapp: ..., cpf: ..., anosExperiencia: ..., fotoUrl: ..., valorConsulta: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createProfissionalRef(dataConnect, createProfissionalVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.profissional_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.profissional_insert);
});
```

## UpdateProfissional
You can execute the `UpdateProfissional` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateProfissional(vars: UpdateProfissionalVariables): MutationPromise<UpdateProfissionalData, UpdateProfissionalVariables>;

interface UpdateProfissionalRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProfissionalVariables): MutationRef<UpdateProfissionalData, UpdateProfissionalVariables>;
}
export const updateProfissionalRef: UpdateProfissionalRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateProfissional(dc: DataConnect, vars: UpdateProfissionalVariables): MutationPromise<UpdateProfissionalData, UpdateProfissionalVariables>;

interface UpdateProfissionalRef {
  ...
  (dc: DataConnect, vars: UpdateProfissionalVariables): MutationRef<UpdateProfissionalData, UpdateProfissionalVariables>;
}
export const updateProfissionalRef: UpdateProfissionalRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateProfissionalRef:
```typescript
const name = updateProfissionalRef.operationName;
console.log(name);
```

### Variables
The `UpdateProfissional` mutation requires an argument of type `UpdateProfissionalVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateProfissional` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateProfissionalData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateProfissionalData {
  profissional_update?: Profissional_Key | null;
}
```
### Using `UpdateProfissional`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateProfissional, UpdateProfissionalVariables } from '@dataconnect/generated';

// The `UpdateProfissional` mutation requires an argument of type `UpdateProfissionalVariables`:
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

// Call the `updateProfissional()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateProfissional(updateProfissionalVars);
// Variables can be defined inline as well.
const { data } = await updateProfissional({ id: ..., nome: ..., especialidade: ..., whatsapp: ..., cpf: ..., anosExperiencia: ..., fotoUrl: ..., valorConsulta: ..., ativo: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateProfissional(dataConnect, updateProfissionalVars);

console.log(data.profissional_update);

// Or, you can use the `Promise` API.
updateProfissional(updateProfissionalVars).then((response) => {
  const data = response.data;
  console.log(data.profissional_update);
});
```

### Using `UpdateProfissional`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateProfissionalRef, UpdateProfissionalVariables } from '@dataconnect/generated';

// The `UpdateProfissional` mutation requires an argument of type `UpdateProfissionalVariables`:
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

// Call the `updateProfissionalRef()` function to get a reference to the mutation.
const ref = updateProfissionalRef(updateProfissionalVars);
// Variables can be defined inline as well.
const ref = updateProfissionalRef({ id: ..., nome: ..., especialidade: ..., whatsapp: ..., cpf: ..., anosExperiencia: ..., fotoUrl: ..., valorConsulta: ..., ativo: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateProfissionalRef(dataConnect, updateProfissionalVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.profissional_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.profissional_update);
});
```

## DeleteProfissional
You can execute the `DeleteProfissional` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteProfissional(vars: DeleteProfissionalVariables): MutationPromise<DeleteProfissionalData, DeleteProfissionalVariables>;

interface DeleteProfissionalRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteProfissionalVariables): MutationRef<DeleteProfissionalData, DeleteProfissionalVariables>;
}
export const deleteProfissionalRef: DeleteProfissionalRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteProfissional(dc: DataConnect, vars: DeleteProfissionalVariables): MutationPromise<DeleteProfissionalData, DeleteProfissionalVariables>;

interface DeleteProfissionalRef {
  ...
  (dc: DataConnect, vars: DeleteProfissionalVariables): MutationRef<DeleteProfissionalData, DeleteProfissionalVariables>;
}
export const deleteProfissionalRef: DeleteProfissionalRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteProfissionalRef:
```typescript
const name = deleteProfissionalRef.operationName;
console.log(name);
```

### Variables
The `DeleteProfissional` mutation requires an argument of type `DeleteProfissionalVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteProfissionalVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteProfissional` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteProfissionalData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteProfissionalData {
  profissional_delete?: Profissional_Key | null;
}
```
### Using `DeleteProfissional`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteProfissional, DeleteProfissionalVariables } from '@dataconnect/generated';

// The `DeleteProfissional` mutation requires an argument of type `DeleteProfissionalVariables`:
const deleteProfissionalVars: DeleteProfissionalVariables = {
  id: ..., 
};

// Call the `deleteProfissional()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteProfissional(deleteProfissionalVars);
// Variables can be defined inline as well.
const { data } = await deleteProfissional({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteProfissional(dataConnect, deleteProfissionalVars);

console.log(data.profissional_delete);

// Or, you can use the `Promise` API.
deleteProfissional(deleteProfissionalVars).then((response) => {
  const data = response.data;
  console.log(data.profissional_delete);
});
```

### Using `DeleteProfissional`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteProfissionalRef, DeleteProfissionalVariables } from '@dataconnect/generated';

// The `DeleteProfissional` mutation requires an argument of type `DeleteProfissionalVariables`:
const deleteProfissionalVars: DeleteProfissionalVariables = {
  id: ..., 
};

// Call the `deleteProfissionalRef()` function to get a reference to the mutation.
const ref = deleteProfissionalRef(deleteProfissionalVars);
// Variables can be defined inline as well.
const ref = deleteProfissionalRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteProfissionalRef(dataConnect, deleteProfissionalVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.profissional_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.profissional_delete);
});
```

## CreateConsulta
You can execute the `CreateConsulta` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createConsulta(vars: CreateConsultaVariables): MutationPromise<CreateConsultaData, CreateConsultaVariables>;

interface CreateConsultaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateConsultaVariables): MutationRef<CreateConsultaData, CreateConsultaVariables>;
}
export const createConsultaRef: CreateConsultaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createConsulta(dc: DataConnect, vars: CreateConsultaVariables): MutationPromise<CreateConsultaData, CreateConsultaVariables>;

interface CreateConsultaRef {
  ...
  (dc: DataConnect, vars: CreateConsultaVariables): MutationRef<CreateConsultaData, CreateConsultaVariables>;
}
export const createConsultaRef: CreateConsultaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createConsultaRef:
```typescript
const name = createConsultaRef.operationName;
console.log(name);
```

### Variables
The `CreateConsulta` mutation requires an argument of type `CreateConsultaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreateConsulta` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateConsultaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateConsultaData {
  consulta_insert: Consulta_Key;
}
```
### Using `CreateConsulta`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createConsulta, CreateConsultaVariables } from '@dataconnect/generated';

// The `CreateConsulta` mutation requires an argument of type `CreateConsultaVariables`:
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

// Call the `createConsulta()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createConsulta(createConsultaVars);
// Variables can be defined inline as well.
const { data } = await createConsulta({ pacienteId: ..., pacienteNome: ..., pacienteTelefone: ..., pacienteEmail: ..., dataHora: ..., duracaoMin: ..., servico: ..., profissional: ..., profissionalId: ..., valor: ..., status: ..., pixId: ..., metodoPagamento: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createConsulta(dataConnect, createConsultaVars);

console.log(data.consulta_insert);

// Or, you can use the `Promise` API.
createConsulta(createConsultaVars).then((response) => {
  const data = response.data;
  console.log(data.consulta_insert);
});
```

### Using `CreateConsulta`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createConsultaRef, CreateConsultaVariables } from '@dataconnect/generated';

// The `CreateConsulta` mutation requires an argument of type `CreateConsultaVariables`:
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

// Call the `createConsultaRef()` function to get a reference to the mutation.
const ref = createConsultaRef(createConsultaVars);
// Variables can be defined inline as well.
const ref = createConsultaRef({ pacienteId: ..., pacienteNome: ..., pacienteTelefone: ..., pacienteEmail: ..., dataHora: ..., duracaoMin: ..., servico: ..., profissional: ..., profissionalId: ..., valor: ..., status: ..., pixId: ..., metodoPagamento: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createConsultaRef(dataConnect, createConsultaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.consulta_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.consulta_insert);
});
```

## UpdateConsulta
You can execute the `UpdateConsulta` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateConsulta(vars: UpdateConsultaVariables): MutationPromise<UpdateConsultaData, UpdateConsultaVariables>;

interface UpdateConsultaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateConsultaVariables): MutationRef<UpdateConsultaData, UpdateConsultaVariables>;
}
export const updateConsultaRef: UpdateConsultaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateConsulta(dc: DataConnect, vars: UpdateConsultaVariables): MutationPromise<UpdateConsultaData, UpdateConsultaVariables>;

interface UpdateConsultaRef {
  ...
  (dc: DataConnect, vars: UpdateConsultaVariables): MutationRef<UpdateConsultaData, UpdateConsultaVariables>;
}
export const updateConsultaRef: UpdateConsultaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateConsultaRef:
```typescript
const name = updateConsultaRef.operationName;
console.log(name);
```

### Variables
The `UpdateConsulta` mutation requires an argument of type `UpdateConsultaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateConsulta` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateConsultaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateConsultaData {
  consulta_update?: Consulta_Key | null;
}
```
### Using `UpdateConsulta`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateConsulta, UpdateConsultaVariables } from '@dataconnect/generated';

// The `UpdateConsulta` mutation requires an argument of type `UpdateConsultaVariables`:
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

// Call the `updateConsulta()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateConsulta(updateConsultaVars);
// Variables can be defined inline as well.
const { data } = await updateConsulta({ id: ..., pacienteId: ..., pacienteNome: ..., pacienteTelefone: ..., pacienteEmail: ..., dataHora: ..., duracaoMin: ..., servico: ..., profissional: ..., profissionalId: ..., valor: ..., status: ..., pixId: ..., metodoPagamento: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateConsulta(dataConnect, updateConsultaVars);

console.log(data.consulta_update);

// Or, you can use the `Promise` API.
updateConsulta(updateConsultaVars).then((response) => {
  const data = response.data;
  console.log(data.consulta_update);
});
```

### Using `UpdateConsulta`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateConsultaRef, UpdateConsultaVariables } from '@dataconnect/generated';

// The `UpdateConsulta` mutation requires an argument of type `UpdateConsultaVariables`:
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

// Call the `updateConsultaRef()` function to get a reference to the mutation.
const ref = updateConsultaRef(updateConsultaVars);
// Variables can be defined inline as well.
const ref = updateConsultaRef({ id: ..., pacienteId: ..., pacienteNome: ..., pacienteTelefone: ..., pacienteEmail: ..., dataHora: ..., duracaoMin: ..., servico: ..., profissional: ..., profissionalId: ..., valor: ..., status: ..., pixId: ..., metodoPagamento: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateConsultaRef(dataConnect, updateConsultaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.consulta_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.consulta_update);
});
```

## SetConsultaStatus
You can execute the `SetConsultaStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setConsultaStatus(vars: SetConsultaStatusVariables): MutationPromise<SetConsultaStatusData, SetConsultaStatusVariables>;

interface SetConsultaStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetConsultaStatusVariables): MutationRef<SetConsultaStatusData, SetConsultaStatusVariables>;
}
export const setConsultaStatusRef: SetConsultaStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setConsultaStatus(dc: DataConnect, vars: SetConsultaStatusVariables): MutationPromise<SetConsultaStatusData, SetConsultaStatusVariables>;

interface SetConsultaStatusRef {
  ...
  (dc: DataConnect, vars: SetConsultaStatusVariables): MutationRef<SetConsultaStatusData, SetConsultaStatusVariables>;
}
export const setConsultaStatusRef: SetConsultaStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setConsultaStatusRef:
```typescript
const name = setConsultaStatusRef.operationName;
console.log(name);
```

### Variables
The `SetConsultaStatus` mutation requires an argument of type `SetConsultaStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetConsultaStatusVariables {
  id: UUIDString;
  status: string;
  pacienteId?: UUIDString | null;
}
```
### Return Type
Recall that executing the `SetConsultaStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetConsultaStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetConsultaStatusData {
  consulta_update?: Consulta_Key | null;
}
```
### Using `SetConsultaStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setConsultaStatus, SetConsultaStatusVariables } from '@dataconnect/generated';

// The `SetConsultaStatus` mutation requires an argument of type `SetConsultaStatusVariables`:
const setConsultaStatusVars: SetConsultaStatusVariables = {
  id: ..., 
  status: ..., 
  pacienteId: ..., // optional
};

// Call the `setConsultaStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setConsultaStatus(setConsultaStatusVars);
// Variables can be defined inline as well.
const { data } = await setConsultaStatus({ id: ..., status: ..., pacienteId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setConsultaStatus(dataConnect, setConsultaStatusVars);

console.log(data.consulta_update);

// Or, you can use the `Promise` API.
setConsultaStatus(setConsultaStatusVars).then((response) => {
  const data = response.data;
  console.log(data.consulta_update);
});
```

### Using `SetConsultaStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setConsultaStatusRef, SetConsultaStatusVariables } from '@dataconnect/generated';

// The `SetConsultaStatus` mutation requires an argument of type `SetConsultaStatusVariables`:
const setConsultaStatusVars: SetConsultaStatusVariables = {
  id: ..., 
  status: ..., 
  pacienteId: ..., // optional
};

// Call the `setConsultaStatusRef()` function to get a reference to the mutation.
const ref = setConsultaStatusRef(setConsultaStatusVars);
// Variables can be defined inline as well.
const ref = setConsultaStatusRef({ id: ..., status: ..., pacienteId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setConsultaStatusRef(dataConnect, setConsultaStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.consulta_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.consulta_update);
});
```

## DeleteConsulta
You can execute the `DeleteConsulta` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteConsulta(vars: DeleteConsultaVariables): MutationPromise<DeleteConsultaData, DeleteConsultaVariables>;

interface DeleteConsultaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteConsultaVariables): MutationRef<DeleteConsultaData, DeleteConsultaVariables>;
}
export const deleteConsultaRef: DeleteConsultaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteConsulta(dc: DataConnect, vars: DeleteConsultaVariables): MutationPromise<DeleteConsultaData, DeleteConsultaVariables>;

interface DeleteConsultaRef {
  ...
  (dc: DataConnect, vars: DeleteConsultaVariables): MutationRef<DeleteConsultaData, DeleteConsultaVariables>;
}
export const deleteConsultaRef: DeleteConsultaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteConsultaRef:
```typescript
const name = deleteConsultaRef.operationName;
console.log(name);
```

### Variables
The `DeleteConsulta` mutation requires an argument of type `DeleteConsultaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteConsultaVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteConsulta` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteConsultaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteConsultaData {
  consulta_delete?: Consulta_Key | null;
}
```
### Using `DeleteConsulta`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteConsulta, DeleteConsultaVariables } from '@dataconnect/generated';

// The `DeleteConsulta` mutation requires an argument of type `DeleteConsultaVariables`:
const deleteConsultaVars: DeleteConsultaVariables = {
  id: ..., 
};

// Call the `deleteConsulta()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteConsulta(deleteConsultaVars);
// Variables can be defined inline as well.
const { data } = await deleteConsulta({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteConsulta(dataConnect, deleteConsultaVars);

console.log(data.consulta_delete);

// Or, you can use the `Promise` API.
deleteConsulta(deleteConsultaVars).then((response) => {
  const data = response.data;
  console.log(data.consulta_delete);
});
```

### Using `DeleteConsulta`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteConsultaRef, DeleteConsultaVariables } from '@dataconnect/generated';

// The `DeleteConsulta` mutation requires an argument of type `DeleteConsultaVariables`:
const deleteConsultaVars: DeleteConsultaVariables = {
  id: ..., 
};

// Call the `deleteConsultaRef()` function to get a reference to the mutation.
const ref = deleteConsultaRef(deleteConsultaVars);
// Variables can be defined inline as well.
const ref = deleteConsultaRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteConsultaRef(dataConnect, deleteConsultaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.consulta_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.consulta_delete);
});
```

## CreatePublicConsulta
You can execute the `CreatePublicConsulta` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPublicConsulta(vars: CreatePublicConsultaVariables): MutationPromise<CreatePublicConsultaData, CreatePublicConsultaVariables>;

interface CreatePublicConsultaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePublicConsultaVariables): MutationRef<CreatePublicConsultaData, CreatePublicConsultaVariables>;
}
export const createPublicConsultaRef: CreatePublicConsultaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPublicConsulta(dc: DataConnect, vars: CreatePublicConsultaVariables): MutationPromise<CreatePublicConsultaData, CreatePublicConsultaVariables>;

interface CreatePublicConsultaRef {
  ...
  (dc: DataConnect, vars: CreatePublicConsultaVariables): MutationRef<CreatePublicConsultaData, CreatePublicConsultaVariables>;
}
export const createPublicConsultaRef: CreatePublicConsultaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPublicConsultaRef:
```typescript
const name = createPublicConsultaRef.operationName;
console.log(name);
```

### Variables
The `CreatePublicConsulta` mutation requires an argument of type `CreatePublicConsultaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreatePublicConsulta` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePublicConsultaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePublicConsultaData {
  consulta_insert: Consulta_Key;
}
```
### Using `CreatePublicConsulta`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPublicConsulta, CreatePublicConsultaVariables } from '@dataconnect/generated';

// The `CreatePublicConsulta` mutation requires an argument of type `CreatePublicConsultaVariables`:
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

// Call the `createPublicConsulta()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPublicConsulta(createPublicConsultaVars);
// Variables can be defined inline as well.
const { data } = await createPublicConsulta({ perfilId: ..., clienteNome: ..., clienteTelefone: ..., clienteEmail: ..., dataHora: ..., duracaoMin: ..., servico: ..., profissional: ..., profissionalId: ..., valor: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPublicConsulta(dataConnect, createPublicConsultaVars);

console.log(data.consulta_insert);

// Or, you can use the `Promise` API.
createPublicConsulta(createPublicConsultaVars).then((response) => {
  const data = response.data;
  console.log(data.consulta_insert);
});
```

### Using `CreatePublicConsulta`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPublicConsultaRef, CreatePublicConsultaVariables } from '@dataconnect/generated';

// The `CreatePublicConsulta` mutation requires an argument of type `CreatePublicConsultaVariables`:
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

// Call the `createPublicConsultaRef()` function to get a reference to the mutation.
const ref = createPublicConsultaRef(createPublicConsultaVars);
// Variables can be defined inline as well.
const ref = createPublicConsultaRef({ perfilId: ..., clienteNome: ..., clienteTelefone: ..., clienteEmail: ..., dataHora: ..., duracaoMin: ..., servico: ..., profissional: ..., profissionalId: ..., valor: ..., observacoes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPublicConsultaRef(dataConnect, createPublicConsultaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.consulta_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.consulta_insert);
});
```

## SetConsultaPixId
You can execute the `SetConsultaPixId` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setConsultaPixId(vars: SetConsultaPixIdVariables): MutationPromise<SetConsultaPixIdData, SetConsultaPixIdVariables>;

interface SetConsultaPixIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetConsultaPixIdVariables): MutationRef<SetConsultaPixIdData, SetConsultaPixIdVariables>;
}
export const setConsultaPixIdRef: SetConsultaPixIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setConsultaPixId(dc: DataConnect, vars: SetConsultaPixIdVariables): MutationPromise<SetConsultaPixIdData, SetConsultaPixIdVariables>;

interface SetConsultaPixIdRef {
  ...
  (dc: DataConnect, vars: SetConsultaPixIdVariables): MutationRef<SetConsultaPixIdData, SetConsultaPixIdVariables>;
}
export const setConsultaPixIdRef: SetConsultaPixIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setConsultaPixIdRef:
```typescript
const name = setConsultaPixIdRef.operationName;
console.log(name);
```

### Variables
The `SetConsultaPixId` mutation requires an argument of type `SetConsultaPixIdVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetConsultaPixIdVariables {
  consultaId: UUIDString;
  pixId: string;
}
```
### Return Type
Recall that executing the `SetConsultaPixId` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetConsultaPixIdData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetConsultaPixIdData {
  consulta_update?: Consulta_Key | null;
}
```
### Using `SetConsultaPixId`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setConsultaPixId, SetConsultaPixIdVariables } from '@dataconnect/generated';

// The `SetConsultaPixId` mutation requires an argument of type `SetConsultaPixIdVariables`:
const setConsultaPixIdVars: SetConsultaPixIdVariables = {
  consultaId: ..., 
  pixId: ..., 
};

// Call the `setConsultaPixId()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setConsultaPixId(setConsultaPixIdVars);
// Variables can be defined inline as well.
const { data } = await setConsultaPixId({ consultaId: ..., pixId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setConsultaPixId(dataConnect, setConsultaPixIdVars);

console.log(data.consulta_update);

// Or, you can use the `Promise` API.
setConsultaPixId(setConsultaPixIdVars).then((response) => {
  const data = response.data;
  console.log(data.consulta_update);
});
```

### Using `SetConsultaPixId`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setConsultaPixIdRef, SetConsultaPixIdVariables } from '@dataconnect/generated';

// The `SetConsultaPixId` mutation requires an argument of type `SetConsultaPixIdVariables`:
const setConsultaPixIdVars: SetConsultaPixIdVariables = {
  consultaId: ..., 
  pixId: ..., 
};

// Call the `setConsultaPixIdRef()` function to get a reference to the mutation.
const ref = setConsultaPixIdRef(setConsultaPixIdVars);
// Variables can be defined inline as well.
const ref = setConsultaPixIdRef({ consultaId: ..., pixId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setConsultaPixIdRef(dataConnect, setConsultaPixIdVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.consulta_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.consulta_update);
});
```

## ConfirmarConsultaPaga
You can execute the `ConfirmarConsultaPaga` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
confirmarConsultaPaga(vars: ConfirmarConsultaPagaVariables): MutationPromise<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;

interface ConfirmarConsultaPagaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ConfirmarConsultaPagaVariables): MutationRef<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;
}
export const confirmarConsultaPagaRef: ConfirmarConsultaPagaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
confirmarConsultaPaga(dc: DataConnect, vars: ConfirmarConsultaPagaVariables): MutationPromise<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;

interface ConfirmarConsultaPagaRef {
  ...
  (dc: DataConnect, vars: ConfirmarConsultaPagaVariables): MutationRef<ConfirmarConsultaPagaData, ConfirmarConsultaPagaVariables>;
}
export const confirmarConsultaPagaRef: ConfirmarConsultaPagaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the confirmarConsultaPagaRef:
```typescript
const name = confirmarConsultaPagaRef.operationName;
console.log(name);
```

### Variables
The `ConfirmarConsultaPaga` mutation requires an argument of type `ConfirmarConsultaPagaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ConfirmarConsultaPagaVariables {
  consultaId: UUIDString;
  valorPago?: number | null;
}
```
### Return Type
Recall that executing the `ConfirmarConsultaPaga` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ConfirmarConsultaPagaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ConfirmarConsultaPagaData {
  consulta_update?: Consulta_Key | null;
}
```
### Using `ConfirmarConsultaPaga`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, confirmarConsultaPaga, ConfirmarConsultaPagaVariables } from '@dataconnect/generated';

// The `ConfirmarConsultaPaga` mutation requires an argument of type `ConfirmarConsultaPagaVariables`:
const confirmarConsultaPagaVars: ConfirmarConsultaPagaVariables = {
  consultaId: ..., 
  valorPago: ..., // optional
};

// Call the `confirmarConsultaPaga()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await confirmarConsultaPaga(confirmarConsultaPagaVars);
// Variables can be defined inline as well.
const { data } = await confirmarConsultaPaga({ consultaId: ..., valorPago: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await confirmarConsultaPaga(dataConnect, confirmarConsultaPagaVars);

console.log(data.consulta_update);

// Or, you can use the `Promise` API.
confirmarConsultaPaga(confirmarConsultaPagaVars).then((response) => {
  const data = response.data;
  console.log(data.consulta_update);
});
```

### Using `ConfirmarConsultaPaga`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, confirmarConsultaPagaRef, ConfirmarConsultaPagaVariables } from '@dataconnect/generated';

// The `ConfirmarConsultaPaga` mutation requires an argument of type `ConfirmarConsultaPagaVariables`:
const confirmarConsultaPagaVars: ConfirmarConsultaPagaVariables = {
  consultaId: ..., 
  valorPago: ..., // optional
};

// Call the `confirmarConsultaPagaRef()` function to get a reference to the mutation.
const ref = confirmarConsultaPagaRef(confirmarConsultaPagaVars);
// Variables can be defined inline as well.
const ref = confirmarConsultaPagaRef({ consultaId: ..., valorPago: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = confirmarConsultaPagaRef(dataConnect, confirmarConsultaPagaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.consulta_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.consulta_update);
});
```

