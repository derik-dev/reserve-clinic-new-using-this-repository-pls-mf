const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'reserve_clinic',
  service: 'reserve-clinic',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider(),
    maxAgeSeconds: 5
  }
};
exports.dataConnectSettings = dataConnectSettings;

const upsertMeuPerfilRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertMeuPerfil', inputVars);
}
upsertMeuPerfilRef.operationName = 'UpsertMeuPerfil';
exports.upsertMeuPerfilRef = upsertMeuPerfilRef;

exports.upsertMeuPerfil = function upsertMeuPerfil(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertMeuPerfilRef(dcInstance, inputVars));
}
;

const upsertMinhaConfiguracaoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertMinhaConfiguracao', inputVars);
}
upsertMinhaConfiguracaoRef.operationName = 'UpsertMinhaConfiguracao';
exports.upsertMinhaConfiguracaoRef = upsertMinhaConfiguracaoRef;

exports.upsertMinhaConfiguracao = function upsertMinhaConfiguracao(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertMinhaConfiguracaoRef(dcInstance, inputVars));
}
;

const createPacienteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePaciente', inputVars);
}
createPacienteRef.operationName = 'CreatePaciente';
exports.createPacienteRef = createPacienteRef;

exports.createPaciente = function createPaciente(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createPacienteRef(dcInstance, inputVars));
}
;

const updatePacienteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdatePaciente', inputVars);
}
updatePacienteRef.operationName = 'UpdatePaciente';
exports.updatePacienteRef = updatePacienteRef;

exports.updatePaciente = function updatePaciente(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updatePacienteRef(dcInstance, inputVars));
}
;

const setPacienteStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetPacienteStatus', inputVars);
}
setPacienteStatusRef.operationName = 'SetPacienteStatus';
exports.setPacienteStatusRef = setPacienteStatusRef;

exports.setPacienteStatus = function setPacienteStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setPacienteStatusRef(dcInstance, inputVars));
}
;

const deletePacienteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeletePaciente', inputVars);
}
deletePacienteRef.operationName = 'DeletePaciente';
exports.deletePacienteRef = deletePacienteRef;

exports.deletePaciente = function deletePaciente(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deletePacienteRef(dcInstance, inputVars));
}
;

const createProfissionalRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateProfissional', inputVars);
}
createProfissionalRef.operationName = 'CreateProfissional';
exports.createProfissionalRef = createProfissionalRef;

exports.createProfissional = function createProfissional(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createProfissionalRef(dcInstance, inputVars));
}
;

const updateProfissionalRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateProfissional', inputVars);
}
updateProfissionalRef.operationName = 'UpdateProfissional';
exports.updateProfissionalRef = updateProfissionalRef;

exports.updateProfissional = function updateProfissional(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateProfissionalRef(dcInstance, inputVars));
}
;

const deleteProfissionalRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteProfissional', inputVars);
}
deleteProfissionalRef.operationName = 'DeleteProfissional';
exports.deleteProfissionalRef = deleteProfissionalRef;

exports.deleteProfissional = function deleteProfissional(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteProfissionalRef(dcInstance, inputVars));
}
;

const createConsultaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateConsulta', inputVars);
}
createConsultaRef.operationName = 'CreateConsulta';
exports.createConsultaRef = createConsultaRef;

exports.createConsulta = function createConsulta(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createConsultaRef(dcInstance, inputVars));
}
;

const updateConsultaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateConsulta', inputVars);
}
updateConsultaRef.operationName = 'UpdateConsulta';
exports.updateConsultaRef = updateConsultaRef;

exports.updateConsulta = function updateConsulta(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateConsultaRef(dcInstance, inputVars));
}
;

const setConsultaStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetConsultaStatus', inputVars);
}
setConsultaStatusRef.operationName = 'SetConsultaStatus';
exports.setConsultaStatusRef = setConsultaStatusRef;

exports.setConsultaStatus = function setConsultaStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setConsultaStatusRef(dcInstance, inputVars));
}
;

const deleteConsultaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteConsulta', inputVars);
}
deleteConsultaRef.operationName = 'DeleteConsulta';
exports.deleteConsultaRef = deleteConsultaRef;

exports.deleteConsulta = function deleteConsulta(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteConsultaRef(dcInstance, inputVars));
}
;

const createPublicConsultaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePublicConsulta', inputVars);
}
createPublicConsultaRef.operationName = 'CreatePublicConsulta';
exports.createPublicConsultaRef = createPublicConsultaRef;

exports.createPublicConsulta = function createPublicConsulta(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createPublicConsultaRef(dcInstance, inputVars));
}
;

const setConsultaPixIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetConsultaPixId', inputVars);
}
setConsultaPixIdRef.operationName = 'SetConsultaPixId';
exports.setConsultaPixIdRef = setConsultaPixIdRef;

exports.setConsultaPixId = function setConsultaPixId(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setConsultaPixIdRef(dcInstance, inputVars));
}
;

const confirmarConsultaPagaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ConfirmarConsultaPaga', inputVars);
}
confirmarConsultaPagaRef.operationName = 'ConfirmarConsultaPaga';
exports.confirmarConsultaPagaRef = confirmarConsultaPagaRef;

exports.confirmarConsultaPaga = function confirmarConsultaPaga(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(confirmarConsultaPagaRef(dcInstance, inputVars));
}
;

const getMeuPerfilRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMeuPerfil');
}
getMeuPerfilRef.operationName = 'GetMeuPerfil';
exports.getMeuPerfilRef = getMeuPerfilRef;

exports.getMeuPerfil = function getMeuPerfil(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMeuPerfilRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getPublicPerfilBySlugRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicPerfilBySlug', inputVars);
}
getPublicPerfilBySlugRef.operationName = 'GetPublicPerfilBySlug';
exports.getPublicPerfilBySlugRef = getPublicPerfilBySlugRef;

exports.getPublicPerfilBySlug = function getPublicPerfilBySlug(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getPublicPerfilBySlugRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getPublicConfiguracaoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicConfiguracao', inputVars);
}
getPublicConfiguracaoRef.operationName = 'GetPublicConfiguracao';
exports.getPublicConfiguracaoRef = getPublicConfiguracaoRef;

exports.getPublicConfiguracao = function getPublicConfiguracao(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getPublicConfiguracaoRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listPublicProfissionaisRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicProfissionais', inputVars);
}
listPublicProfissionaisRef.operationName = 'ListPublicProfissionais';
exports.listPublicProfissionaisRef = listPublicProfissionaisRef;

exports.listPublicProfissionais = function listPublicProfissionais(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listPublicProfissionaisRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listPublicBusyConsultasRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicBusyConsultas', inputVars);
}
listPublicBusyConsultasRef.operationName = 'ListPublicBusyConsultas';
exports.listPublicBusyConsultasRef = listPublicBusyConsultasRef;

exports.listPublicBusyConsultas = function listPublicBusyConsultas(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listPublicBusyConsultasRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getMinhaConfiguracaoRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMinhaConfiguracao');
}
getMinhaConfiguracaoRef.operationName = 'GetMinhaConfiguracao';
exports.getMinhaConfiguracaoRef = getMinhaConfiguracaoRef;

exports.getMinhaConfiguracao = function getMinhaConfiguracao(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMinhaConfiguracaoRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listMeusPacientesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMeusPacientes');
}
listMeusPacientesRef.operationName = 'ListMeusPacientes';
exports.listMeusPacientesRef = listMeusPacientesRef;

exports.listMeusPacientes = function listMeusPacientes(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listMeusPacientesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listMinhasConsultasRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMinhasConsultas', inputVars);
}
listMinhasConsultasRef.operationName = 'ListMinhasConsultas';
exports.listMinhasConsultasRef = listMinhasConsultasRef;

exports.listMinhasConsultas = function listMinhasConsultas(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listMinhasConsultasRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listMeusProfissionaisRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMeusProfissionais');
}
listMeusProfissionaisRef.operationName = 'ListMeusProfissionais';
exports.listMeusProfissionaisRef = listMeusProfissionaisRef;

exports.listMeusProfissionais = function listMeusProfissionais(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listMeusProfissionaisRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
