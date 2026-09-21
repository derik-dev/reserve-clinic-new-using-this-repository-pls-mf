# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useUpsertMeuPerfil, useUpsertMinhaConfiguracao, useCreatePaciente, useUpdatePaciente, useSetPacienteStatus, useDeletePaciente, useCreateProfissional, useUpdateProfissional, useDeleteProfissional, useCreateConsulta } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useUpsertMeuPerfil(upsertMeuPerfilVars);

const { data, isPending, isSuccess, isError, error } = useUpsertMinhaConfiguracao(upsertMinhaConfiguracaoVars);

const { data, isPending, isSuccess, isError, error } = useCreatePaciente(createPacienteVars);

const { data, isPending, isSuccess, isError, error } = useUpdatePaciente(updatePacienteVars);

const { data, isPending, isSuccess, isError, error } = useSetPacienteStatus(setPacienteStatusVars);

const { data, isPending, isSuccess, isError, error } = useDeletePaciente(deletePacienteVars);

const { data, isPending, isSuccess, isError, error } = useCreateProfissional(createProfissionalVars);

const { data, isPending, isSuccess, isError, error } = useUpdateProfissional(updateProfissionalVars);

const { data, isPending, isSuccess, isError, error } = useDeleteProfissional(deleteProfissionalVars);

const { data, isPending, isSuccess, isError, error } = useCreateConsulta(createConsultaVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { upsertMeuPerfil, upsertMinhaConfiguracao, createPaciente, updatePaciente, setPacienteStatus, deletePaciente, createProfissional, updateProfissional, deleteProfissional, createConsulta } from '@dataconnect/generated';


// Operation UpsertMeuPerfil:  For variables, look at type UpsertMeuPerfilVars in ../index.d.ts
const { data } = await UpsertMeuPerfil(dataConnect, upsertMeuPerfilVars);

// Operation UpsertMinhaConfiguracao:  For variables, look at type UpsertMinhaConfiguracaoVars in ../index.d.ts
const { data } = await UpsertMinhaConfiguracao(dataConnect, upsertMinhaConfiguracaoVars);

// Operation CreatePaciente:  For variables, look at type CreatePacienteVars in ../index.d.ts
const { data } = await CreatePaciente(dataConnect, createPacienteVars);

// Operation UpdatePaciente:  For variables, look at type UpdatePacienteVars in ../index.d.ts
const { data } = await UpdatePaciente(dataConnect, updatePacienteVars);

// Operation SetPacienteStatus:  For variables, look at type SetPacienteStatusVars in ../index.d.ts
const { data } = await SetPacienteStatus(dataConnect, setPacienteStatusVars);

// Operation DeletePaciente:  For variables, look at type DeletePacienteVars in ../index.d.ts
const { data } = await DeletePaciente(dataConnect, deletePacienteVars);

// Operation CreateProfissional:  For variables, look at type CreateProfissionalVars in ../index.d.ts
const { data } = await CreateProfissional(dataConnect, createProfissionalVars);

// Operation UpdateProfissional:  For variables, look at type UpdateProfissionalVars in ../index.d.ts
const { data } = await UpdateProfissional(dataConnect, updateProfissionalVars);

// Operation DeleteProfissional:  For variables, look at type DeleteProfissionalVars in ../index.d.ts
const { data } = await DeleteProfissional(dataConnect, deleteProfissionalVars);

// Operation CreateConsulta:  For variables, look at type CreateConsultaVars in ../index.d.ts
const { data } = await CreateConsulta(dataConnect, createConsultaVars);


```