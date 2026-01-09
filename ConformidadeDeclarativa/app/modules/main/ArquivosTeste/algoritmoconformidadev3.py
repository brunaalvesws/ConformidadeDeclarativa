# -*- coding: utf-8 -*-
"""
Passo a passo:
1. Receber os logs e modelos como na v1
2. Converter o log de atividades para o novo formato, trocando a coluna lifecycle por start e end no nome da atividade
3. Converter o log de acesso para o mesmo formato do log de atividades, colocando a operação no nome
4. Adaptar o modelo declare para que todas as operações obrigatórias e proibidas do modelo de acesso virem regras declare

**Mudei o nome da atividade pra não ter traço e tentei usar Precendence e Response pra andar com a coisa, mas travei naquela questão do id da atividade, porque preciso saber de qual atividade é o acesso**

## INCONFORMIDADES

1.5: Atividade proibida no modelo com acessos obrigaatórios que foi observada no log e os acessos também

2.1: Atividade obrigatória com acesso obrigatório e o acesso não foi feito

2.2: Atividade obrigatória com acesso obrigatório e não foi feito nem atividade nem acesso

2.3: Atividade opcional com acesso obrigatório e não foi feito o acesso

2.5: Atividade proibida no modelo com acessos obrigatorios que foi observada no log sem acessos

3.5: Atividade proibida no modelo com acessos opcionais que foi observada no log com os acessos

4.2: Atividade obrigatória com acessos opcionais e não foi feita a atividade nem acessos

4.5: Atividade proibida no modelo com acessos opcionais que foi observada no log sem os acessos

5.1: Atividade obrigatória com acessos proibidos e que foi feita a atividade e os acessos proibidos

5.3: Atividade opcional com acessos proibidos e que foi feita a atividade e os acessos proibidos

5.5: Atividade proibida com acessos proibidos e que foi feita a atividade e os acessos proibidos

6.2: Atividade obrigatória com acessos proibidos e que não foi feita nem atividade nem acesso

6.5: Atividade proibida com acessos proibidos e que foi feita a atividade

7.7: Atividade e acesso não registrados no modelo mas observados no log


## Non-conformance pattern

Prohibited activity: 1.5, 2.5, 3.5, 4.5, 5.5, 6.5

Unexpected activity: 7.7

Illegal activity: Any process log event performed by someone outside the designated team

Ignored mandatory activity: 2.2, 4.2, 6.2

Prohibited data access: 5.1, 5.3, 5.5

Unexpected data access: 7.7

Illegal data access: Any data log access performed by someone outside the team or not assigned to the corresponding activity

Ignored mandatory data access: 2.1, 2.3, 2.5
"""

import sys
sys.path.insert(0, r"C:/Users/bruni/Documents/MestradoDocs/Projeto/Declare4Py")
import pandas as pd
from Declare4Py.ProcessModels.DeclareModel import DeclareModel
from Declare4Py.D4PyEventLog import D4PyEventLog
import pm4py

def check_letters(cell, modelo, acesso, atividade):
    """Verifica quais letras (c, r, u, d) estão presentes na célula, diferenciando maiúsculas e minúsculas."""
    # Letras a serem verificadas
    letters = ['c', 'r', 'u', 'd']

    if atividade == 'Ferramenta':
        return modelo

    cell = str(cell)  # Garantir que a célula é string
    for letter in letters:
        uppercase_present = letter.upper() in cell

        #atividades obrigatórias
        if uppercase_present:
            if f'{acesso} {letter}\n' not in modelo:
                modelo += 'activity ' + f'{acesso} {letter}\n'
            modelo += f'Precedence[{acesso} {letter}, {atividade} complete] | |same concept:instance and same concept:resource |\n'
            modelo += f'Response[{atividade} begin, {acesso} {letter}] | |same concept:instance and same concept:resource |\n'

        #atividades proibidas
        if letter not in cell and not uppercase_present:
            if f'{acesso} {letter}\n' not in modelo:
                modelo += 'activity ' + f'{acesso} {letter}\n'
            modelo += f'NotPrecedence[{acesso} {letter}, {atividade} complete] | |same concept:instance and same concept:resource |\n'
            modelo += f'NotResponse[{atividade} begin, {acesso} {letter}] | |same concept:instance and same concept:resource |\n'


    return modelo


def convertModelToRules(modeloAcesso, modeloProcesso):
    declare_model_activities = modeloProcesso.activities

    novoModelo = ''

    for act in declare_model_activities:
            novoModelo += 'activity ' + act + ' begin' + '\n'
            novoModelo += 'activity ' + act + ' complete' +'\n'

    # Criar um novo DataFrame com os resultados
    for col in modeloAcesso.columns:
        for index, value in modeloAcesso[col].items():
            novoModelo = check_letters(value, novoModelo, modeloAcesso.iloc[index,0], col)

    declare_model = DeclareModel().parse_from_string(novoModelo)
    declare_model.to_file('modeloRegrasConjunto.decl')
    return declare_model

def PreProcessData(logProcessoPATH, logAcessoPATH, modeloRecursoPATH, modeloProcessoPATH, modeloAcessoPATH):
    logAcesso = D4PyEventLog(case_name="case:concept:name")
    logAcesso.parse_xes_log(logAcessoPATH)
    logAcessoProcessado = pm4py.convert_to_dataframe(logAcesso.get_log())
    logAcessoProcessado = logAcessoProcessado.sort_values(['case:concept:name', 'concept:instance'])
    modeloRecursoProcessado = pd.read_csv(modeloRecursoPATH, sep=';')
    modeloAcessoProcessado = pd.read_csv(modeloAcessoPATH, sep=';')
    declare_model = DeclareModel().parse_from_file(modeloProcessoPATH)
    event_log = D4PyEventLog(case_name="case:concept:name")
    event_log.parse_xes_log(logProcessoPATH)
    atv_permitidas = extrair_atividades_permitidas(modeloProcessoPATH)
    return event_log, logAcessoProcessado, modeloRecursoProcessado, declare_model, modeloAcessoProcessado, atv_permitidas

import pm4py

def convertLogs(logProcesso, logAcesso):
    '''
    Converte os logs de processo e acesso em um log único que pode ser submetido a verificação de conformidade
    por meio da biblioteca Declare4Py
    '''
    logProcessoCSV = pm4py.convert_to_dataframe(logProcesso.get_log())
    logProcessoCSV = logProcessoCSV.sort_values(['case:concept:name', 'concept:instance'])
    for index, row in logProcessoCSV.iterrows():
        logProcessoCSV.at[index, 'concept:name'] = row['concept:name'] + ' ' + row['lifecycle:transition']
    logProcessoCSV.drop('lifecycle:transition', axis=1, inplace=True)

    for index, row in logAcesso.iterrows():
        logProcessoCSV.loc[len(logProcessoCSV)] = [(row['concept:tool'] + ' ' + row['concept:operation'].lower()),row['time:timestamp'], row['concept:resource'], row['concept:instance'], len(logProcessoCSV), row['@@case_index'], row['case:concept:name']]
    logProcessoCSV = logProcessoCSV.sort_values(['case:concept:name', 'concept:instance','time:timestamp'])
    logProcessoCSV.to_csv('LogTesteConjunto.csv', index=False)
    pm4py.write_xes(logProcessoCSV, "LogSinteticoConjuntoOFICIAL.xes")

def formatViolations(df_violations):
    '''
    Formata as violações encontradas na verificação de conformidade do Declare4Py
    '''
    violacoes = []
    for index, row in df_violations.iterrows():
        for coluna in df_violations.columns:
            if row[coluna] != [] and row[coluna] != None:
                violacoes.append(f"Trace {index} violou {coluna} nas instâncias {",".join([str(n) for n in row[coluna]])}")
    return violacoes

from Declare4Py.ProcessMiningTasks.ConformanceChecking.MPDeclareAnalyzer import MPDeclareAnalyzer
from Declare4Py.ProcessMiningTasks.ConformanceChecking.MPDeclareResultsBrowser import MPDeclareResultsBrowser

def CheckProcessConformance(modeloProcesso, logProcesso):
    '''
    Checa conformidade de processo entre o log e o modelo DECLARE com a biblioteca Declare4Py
    Recebe um log de processo (em formato EventLog) e um modelo de processo (em DeclareModel)

    '''

    basic_checker = MPDeclareAnalyzer(log=logProcesso, declare_model=modeloProcesso, consider_vacuity=False, track_violations="concept:instance")
    conf_check_res: MPDeclareResultsBrowser = basic_checker.run()
    violacoes = formatViolations(conf_check_res.get_metric(metric="events_violated"))
    return violacoes

def CheckAccessConformance(modeloProcesso):
    '''
    Checa conformidade de acesso entre o log e o modelo DECLARE conjunto com a biblioteca Declare4Py
    Recebe um log conjunto de acessos e atividades (em formato EventLog) e um modelo de processo conjunto (em DeclareModel)

    '''
    event_log = D4PyEventLog(case_name="case:concept:name")
    event_log.parse_xes_log("LogSinteticoConjuntoOFICIAL.xes")

    basic_checker = MPDeclareAnalyzer(log=event_log, declare_model=modeloProcesso, consider_vacuity=False, track_violations='concept:instance')
    conf_check_res: MPDeclareResultsBrowser = basic_checker.run()
    violacoes = formatViolations(conf_check_res.get_metric(metric="events_violated"))
    return violacoes

def CheckResourceConformance(logProcesso, logAcesso, modeloRecurso):
    '''
    Checa conformidade entre o log de acesso, log de processo e o modelo de recurso
    Recebe modelo de recurso e logs em csv
    '''

    logProcessoCSV = pm4py.convert_to_dataframe(logProcesso.get_log())
    logProcessoCSV = logProcessoCSV.sort_values(['case:concept:name', 'concept:instance'])
    logProcessoFiltrado = logProcessoCSV[logProcessoCSV["lifecycle:transition"] == "begin"]

    violacoes = {}
    violacoes["AcessoRecursoEquipe"] = []
    violacoes["AcessoRecursoErrado"] = []
    violacoes["Atividade"] = []
    violacoes["AtividadeNaoEsperada"] = []

    for index, row in modeloRecurso.iterrows():
        demanda = row['case:concept:name']
        recursos = row['concept:resources'].split(", ")
        atividades = logProcessoFiltrado[logProcessoFiltrado['case:concept:name'] == demanda]
        acessos = logAcesso[logAcesso['case:concept:name'] == demanda]

        for i, atv in atividades.iterrows():
            recursoAtv = atv['concept:resource']
            if recursoAtv not in recursos:
                violacoes["Atividade"].append([atv['concept:name'], demanda, recursoAtv, atv['concept:instance']])

            acessosAtv = acessos[acessos['concept:instance']== atv['concept:instance']]
            for j, acc in acessosAtv.iterrows():
                if recursoAtv != acc['concept:resource']:
                    violacoes["AcessoRecursoErrado"].append([acc['concept:tool'], demanda, acc['concept:resource'], recursoAtv, acc['concept:instance']])
                if acc['concept:resource'] not in recursos:
                    violacoes["AcessoRecursoEquipe"].append([acc['concept:tool'], demanda, acc['concept:resource'], acc['concept:instance']])

    return violacoes

def extrair_atividades_permitidas(declare_filepath):
    atividades_permitidas = set()

    with open(declare_filepath, 'r', encoding='utf-8') as f:
        for line in f:
            linha_limpa = line.strip()
            if linha_limpa.startswith('activity '):
                nome_atividade = linha_limpa[len('activity '):].strip()
                if nome_atividade:
                    atividades_permitidas.add(nome_atividade)

    return atividades_permitidas


def CheckAtividadesNaoEsperadas(logProcesso, logAcesso, atividades_permitidas_set):

    logProcessoCSV = pm4py.convert_to_dataframe(logProcesso.get_log())
    logProcessoFiltrado = logProcessoCSV[logProcessoCSV["lifecycle:transition"] == "begin"]
    violacoes_atividades = {}
    violacoes_atividades["acessoAtividadeProibida"] = []
    violacoes_atividades["AcessoRecursoErrado"] = []
    violacoes_atividades["AcessoRecursoEquipe"] = []

    for index, atv in logProcessoFiltrado.iterrows():
        nomeAtividade = atv['concept:name']
        if nomeAtividade not in atividades_permitidas_set:
            demanda = atv['case:concept:name']
            recursoAtv = atv.get('concept:resource', 'RecursoNaoDefinido')
            recursos = atv['concept:resource'].split(", ")
            acessos = logAcesso[logAcesso['case:concept:name'] == demanda]
            acessosAtv = acessos[acessos['concept:instance'] == atv['concept:instance']]

            for j, acc in acessosAtv.iterrows():
                violacoes_atividades['acessoAtividadeProibida'].append([acc['concept:tool'], demanda, acc['concept:resource'], nomeAtividade])
                if recursoAtv != acc['concept:resource']:
                    violacoes_atividades["AcessoRecursoErrado"].append([acc['concept:tool'], demanda, acc['concept:resource'], recursoAtv, nomeAtividade])
                if acc['concept:resource'] not in recursos:
                    violacoes_atividades["AcessoRecursoEquipe"].append([acc['concept:tool'], demanda, acc['concept:resource'], recursoAtv, nomeAtividade])



    return violacoes_atividades

def formatInconformances(conformanceProcess, conformanceAccess, conformanceResource, activityViolation):
    '''
    Formata as inconformidades encontradas em cada verificação (pode vir a combinar os padrões de anomalias no futuro)
    '''
    print('Violações de fluxo de processo:')
    for violation in conformanceProcess:
        print(violation)


    print('Prohibited activities:')
    for key, violation in activityViolation.items():

        if key == "acessoAtividadeProibida":
            for occur in violation:
                print(f'Prohibited activity na atividade {occur[3]} no trace {occur[1]}, o acesso a {occur[0]} foi realizado pelo recurso {occur[2]} durante uma atividade não permitida.')

        if key == "AcessoRecursoEquipe":
            for occur in violation:
                print(f'Prohibited activity no acesso a {occur[0]} no trace {occur[1]}, o recurso {occur[2]} não faz parte da equipe determinada para realizar a demanda.')

        if key == "AcessoRecursoErrado":
            for occur in violation:
                print(f'Prohibited activity no acesso a {occur[0]} no trace {occur[1]}, o recurso {occur[2]} não era o designado da atividade vinculada e sim o {occur[3]}.')




    print('Violações de fluxo de acessos:')
    for violation in conformanceAccess:
        print(violation)

    print('Violações de Privacidade:')
    for key, violation in conformanceResource.items():
        if key == "Atividade":
            for occur in violation:
                print(f'Violação de Privacidade na atividade {occur[0]} no trace {occur[1]} instância {occur[3]}, o recurso {occur[2]} não faz parte da equipe determinada para realizar a demanda')
        if key == "AcessoRecursoEquipe":
            for occur in violation:
                print(f'Violação de Privacidade no acesso a {occur[0]} no trace {occur[1]} instância {occur[3]}, o recurso {occur[2]} não faz parte da equipe determinada para realizar a demanda')
        if key == "AcessoRecursoErrado":
            for occur in violation:
                print(f'Violação de Privacidade no acesso a {occur[0]} no trace {occur[1]} instância {occur[4]}, o recurso {occur[2]} não era o designado da atividade vinculada e sim o {occur[3]}')

def MultiperspectiveConformanceAlgorithm():
  '''
  O algoritmo recebe: um log de processo, um log de acesso a dados, um modelo de recurso, um modelo DECLARE de processo e um modelo de acesso a dados
  '''
  logProcesso, logAcesso, modeloRecurso, modeloProcesso, modeloAcesso, atividades_permitidas = PreProcessData('./LogSinteticoProcessoOFICIALv4.xes', './LogSinteticoAcessoOFICIALv4.xes', './ModeloRecursosOFICIALv4.csv', './Modelo_Log_Sintetico_OFICIAL.decl', './ModeloAcessoOFICIAL.csv')
  modeloAcessoConvertido = convertModelToRules(modeloAcesso, modeloProcesso)
  convertLogs(logProcesso, logAcesso)
  conformanceProcess = CheckProcessConformance(modeloProcesso, logProcesso)
  conformanceAccess = CheckAccessConformance(modeloAcessoConvertido)
  conformanceResource = CheckResourceConformance(logProcesso, logAcesso, modeloRecurso)
  violacoes_atividades = CheckAtividadesNaoEsperadas(logProcesso, logAcesso, atividades_permitidas)
  return formatInconformances(conformanceProcess, conformanceAccess, conformanceResource, violacoes_atividades)

MultiperspectiveConformanceAlgorithm()