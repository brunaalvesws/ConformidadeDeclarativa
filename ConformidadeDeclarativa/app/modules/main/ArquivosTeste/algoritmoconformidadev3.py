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

import pandas as pd
from Declare4Py.ProcessModels.DeclareModel import DeclareModel
from Declare4Py.D4PyEventLog import D4PyEventLog
import pm4py
from pathlib import Path


from xml.etree import ElementTree as ET
from datetime import datetime
import re
from io import BytesIO


from xml.etree import ElementTree as ET
from datetime import datetime
import re
import tempfile
import os


def normalize_xes_timestamps_to_tempfile(xes_path: str) -> str:
    tree = ET.parse(xes_path)
    root = tree.getroot()

    ns = {"xes": "http://www.xes-standard.org/"}

    for date_elem in root.findall(".//xes:date", ns):
        value = date_elem.attrib.get("value")
        if not value:
            continue

        # remove timezone
        value = re.sub(r"(Z|[+-]\d{2}:\d{2})$", "", value)

        # remove fração de segundo
        value = re.sub(r"\.\d+", "", value)

        dt = datetime.strptime(value, "%Y-%m-%dT%H:%M:%S")
        date_elem.attrib["value"] = dt.strftime("%Y-%m-%dT%H:%M:%S")

    tmp = tempfile.NamedTemporaryFile(
        mode="wb",
        suffix=".xes",
        delete=False
    )

    tree.write(tmp, encoding="utf-8", xml_declaration=True)
    tmp.close()

    return tmp.name



def check_letters(cell, model, access, activity):
    """Checks which letters (c, r, u, d) are present in the cell, distinguishing between uppercase and lowercase."""

    letters = ['c', 'r', 'u', 'd']

    if activity == 'Tool':
        return model

    cell = str(cell)
    for letter in letters:
        uppercase_present = letter.upper() in cell

        if uppercase_present:
            if f'{access} {letter}\n' not in model:
                model += 'activity ' + f'{access} {letter}\n'
            model += f'Precedence[{access} {letter}, {activity} complete] | |same concept:instance and same concept:resource |\n'
            model += f'Response[{activity} begin, {access} {letter}] | |same concept:instance and same concept:resource |\n'

        if letter not in cell and not uppercase_present:
            if f'{access} {letter}\n' not in model:
                model += 'activity ' + f'{access} {letter}\n'
            model += f'NotPrecedence[{access} {letter}, {activity} complete] | |same concept:instance and same concept:resource |\n'
            model += f'NotResponse[{activity} begin, {access} {letter}] | |same concept:instance and same concept:resource |\n'


    return model


def convert_model_to_rules(access_model, process_model):
    declare_model_activities = process_model.activities

    new_model = ''

    for act in declare_model_activities:
            new_model += 'activity ' + act + ' begin' + '\n'
            new_model += 'activity ' + act + ' complete' +'\n'

    for col in access_model.columns:
        for index, value in access_model[col].items():
            new_model = check_letters(value, new_model, access_model.iloc[index,0], col)

    declare_model = DeclareModel().parse_from_string(new_model)
    declare_model.to_file('modelRegrasConjunto.decl')
    return declare_model

def pre_process_data(process_log_path, access_log_path, model_log_path, process_model_path, access_model_path):
    temp_xes_path = normalize_xes_timestamps_to_tempfile(access_log_path)
    access_log = pm4py.read_xes(temp_xes_path)
    processed_access_log = access_log.sort_values(['case:concept:name', 'concept:instance'])
    processed_process_model = pd.read_csv(model_log_path, sep=';')
    processed_access_model = pd.read_csv(access_model_path, sep=';')
    declare_model = DeclareModel().parse_from_file(process_model_path)
    event_log = D4PyEventLog(case_name="case:concept:name")
    temp_xes_path = normalize_xes_timestamps_to_tempfile(process_log_path)
    event_log.parse_xes_log(temp_xes_path)
    allowed_activities = extract_allowed_activities(process_model_path)
    return event_log, processed_access_log, processed_process_model, declare_model, processed_access_model, allowed_activities

import pm4py

def convert_logs(process_log, access_log):
    '''
    Merges process and access logs into a single log format suitable for conformance checking with Declare4Py.
    '''
    process_log_df = pm4py.convert_to_dataframe(process_log.get_log())
    process_log_df = process_log_df.sort_values(['case:concept:name', 'concept:instance'])
    for index, row in process_log_df.iterrows():
        process_log_df.at[index, 'concept:name'] = row['concept:name'] + ' ' + row['lifecycle:transition']
    process_log_df.drop('lifecycle:transition', axis=1, inplace=True)

    for index, row in access_log.iterrows():
        process_log_df.loc[len(process_log_df)] = [(row['concept:tool'] + ' ' + row['concept:operation'].lower()),row['time:timestamp'], row['concept:resource'], row['concept:instance'], len(process_log_df), row['@@case_index'], row['case:concept:name']]
    process_log_df = process_log_df.sort_values(['case:concept:name', 'concept:instance','time:timestamp'])
    process_log_df.to_csv('LogTesteConjunto.csv', index=False)
    pm4py.write_xes(process_log_df, "LogSinteticoConjuntoOFICIAL.xes")

def format_violations(df_violations):
    '''
    Formats the violations detected by Declare4Py conformance checking.
    '''
    violations = []
    for index, row in df_violations.iterrows():
        for column in df_violations.columns:
            if row[column] != [] and row[column] != None:
                violations.append(f"Trace {index} violated {column} at instances {','.join([str(n) for n in row[column]])}")
    return violations

from Declare4Py.ProcessMiningTasks.ConformanceChecking.MPDeclareAnalyzer import MPDeclareAnalyzer
from Declare4Py.ProcessMiningTasks.ConformanceChecking.MPDeclareResultsBrowser import MPDeclareResultsBrowser

def check_process_conformance(process_model, process_log):
    '''
    Checks process conformance between the log and the DECLARE model using the Declare4Py library.
    Accepts a process log (EventLog) and a process model (DeclareModel).
    '''

    basic_checker = MPDeclareAnalyzer(log=process_log, declare_model=process_model, consider_vacuity=False, track_violations="concept:instance")
    conf_check_res: MPDeclareResultsBrowser = basic_checker.run()
    violations = format_violations(conf_check_res.get_metric(metric="events_violated"))
    return violations

def check_access_conformance(process_model):
    '''
    Checks access conformance between the log and the joint DECLARE model using Declare4Py.
    Accepts a joint access and activity log (EventLog) and a joint process model (DeclareModel).
    '''
    event_log = D4PyEventLog(case_name="case:concept:name")
    event_log.parse_xes_log("LogSinteticoConjuntoOFICIAL.xes")

    basic_checker = MPDeclareAnalyzer(log=event_log, declare_model=process_model, consider_vacuity=False, track_violations='concept:instance')
    conf_check_res: MPDeclareResultsBrowser = basic_checker.run()
    violations = format_violations(conf_check_res.get_metric(metric="events_violated"))
    return violations

def check_resource_conformance(process_log, access_log, resource_model):
    '''
    Checks conformance between the access log, process log, and the resource model.
    Accepts the resource model (DataFrame), process log (EventLog object), and access log (DataFrame).
    '''

    process_log_df = pm4py.convert_to_dataframe(process_log.get_log())
    process_log_df = process_log_df.sort_values(['case:concept:name', 'concept:instance'])
    processed_process_log = process_log_df[process_log_df["lifecycle:transition"] == "begin"]

    violations = {}
    violations["IllegalTeamAccess"] = []
    violations["IllegalResourceAccess"] = []
    violations["IllegalTeamActivity"] = []

    for index, row in resource_model.iterrows():
        case_id = row['case:concept:name']
        resources = row['concept:resources'].split(", ")
        activities = processed_process_log[processed_process_log['case:concept:name'] == case_id]
        accesses = access_log[access_log['case:concept:name'] == case_id]

        for i, activity in activities.iterrows():
            activity_resource = activity['concept:resource']
            if activity_resource not in resources:
                violations["IllegalTeamActivity"].append([activity['concept:name'], case_id, activity_resource, activity['concept:instance']])

            activity_access = accesses[accesses['concept:instance']== activity['concept:instance']]
            for j, acc in activity_access.iterrows():
                if activity_resource != acc['concept:resource']:
                    violations["IllegalResourceAccess"].append([acc['concept:tool'], case_id, acc['concept:resource'], activity_resource, acc['concept:instance']])
                if acc['concept:resource'] not in resources:
                    violations["IllegalTeamAccess"].append([acc['concept:tool'], case_id, acc['concept:resource'], acc['concept:instance']])

    return violations

def extract_allowed_activities(declare_filepath):
    allowed_activities = set()

    with open(declare_filepath, 'r', encoding='utf-8') as f:
        for line in f:
            clean_line = line.strip()
            if clean_line.startswith('activity '):
                activity_name = clean_line[len('activity '):].strip()
                if activity_name:
                    allowed_activities.add(activity_name)

    return allowed_activities


def check_activity_conformance(process_log, access_log, allowed_activities_set):
    '''
    Identifies activities that are not in the allowed set (Unexpected Activities) and checks for specific access violations within those contexts.
    Accepts a process log (EventLog object), access log (DataFrame), and a set of allowed activities.
    '''

    process_log_df = pm4py.convert_to_dataframe(process_log.get_log())
    processed_process_log = process_log_df[process_log_df["lifecycle:transition"] == "begin"].drop_duplicates(subset=['concept:name'])


    activity_conformance = {}
    activity_conformance["UnexpectedActivity"] = []
    activity_conformance["IllegalDataAccess"] = []

    for index, activity in processed_process_log.iterrows():
        activity_name = activity['concept:name']
        if activity_name not in allowed_activities_set:
            case_id = activity['case:concept:name']
            activity_resource = activity.get('concept:resource', 'MissingResource')
            accesses = access_log[access_log['case:concept:name'] == case_id]
            activity_accesses = accesses[accesses['concept:instance'] == activity['concept:instance']]
            activity_conformance['UnexpectedActivity'].append([activity_name, case_id, activity_resource])
            for j, acc in activity_accesses.iterrows():
                activity_conformance['IllegalDataAccess'].append([acc['concept:tool'], case_id, acc['concept:resource'], activity_name])


    return activity_conformance

def format_inconformances(process_conformance, access_conformance, resource_conformance, activity_conformance):
    '''
    Formats the non-conformances found in each check.
    '''
    
    report = ''

    print('Process Flow Violations:')
    report += 'Process Flow Violations:\n'
    for violation in process_conformance:
        report += violation + '\n'
        print(violation)


    print('Prohibited Activity Violations:')
    report += 'Prohibited Activity Violations:\n'
    for key, violation in activity_conformance.items():

        if key == "UnexpectedActivity":
            for occur in violation:
                print(f'Unexpected activity {occur[0]} in trace {occur[1]} performed by resource {occur[2]}.')
                report += f'Unexpected activity {occur[0]} in trace {occur[1]} performed by resource {occur[2]}.\n'
        if key == "IllegalDataAccess":
            for occur in violation:
                print(f'Unexpected data access during unexpected activity "{occur[3]}" in access to {occur[0]} in trace {occur[1]} performed by resource {occur[2]}.')
                report += f'Unexpected data access during unexpected activity "{occur[3]}" in access to {occur[0]} in trace {occur[1]} performed by resource {occur[2]}.\n'


    print('Access Flow Violations:')
    report += 'Access Flow Violations:'
    for violation in access_conformance:
        report += violation + '\n'
        print(violation)


    print('Privacy Violations:')
    for key, violation in resource_conformance.items():
        if key == "IllegalTeamActivity":
            for occur in violation:
                print(f'Privacy Violation in activity {occur[0]} in trace {occur[1]} instance {occur[3]}, resource {occur[2]} is not part of the designated team to perform the demand')
                report += f'Privacy Violation in activity {occur[0]} in trace {occur[1]} instance {occur[3]}, resource {occur[2]} is not part of the designated team to perform the demand\n'

        if key == "IllegalTeamAccess":
            for occur in violation:
                print(f'Privacy Violation in access to {occur[0]} in trace {occur[1]} instance {occur[3]}, resource {occur[2]} is not part of the designated team to perform the demand')
                report += f'Privacy Violation in access to {occur[0]} in trace {occur[1]} instance {occur[3]}, resource {occur[2]} is not part of the designated team to perform the demand\n'

        if key == "IllegalResourceAccess":
            for occur in violation:
                print(f'Privacy Violation in access to {occur[0]} in trace {occur[1]} instance {occur[4]}, resource {occur[2]} was not the designated one for the linked activity, but {occur[3]} was')
                report += f'Privacy Violation in access to {occur[0]} in trace {occur[1]} instance {occur[4]}, resource {occur[2]} was not the designated one for the linked activity, but {occur[3]} was\n'

    return report

def MultiperspectiveConformanceAlgorithm():
  '''
  The algorithm accepts: a process log, a data access log, a resource model, a process DECLARE model, and a data access model.
  '''
  
  process_log, access_log, resource_model, process_model, access_model, allowed_activities = pre_process_data(str(Path(__file__).resolve().parent / 'LogSinteticoProcessoOFICIALv4.xes'), 
                                                                                                              str(Path(__file__).resolve().parent / 'LogSinteticoAcessoOFICIALv4.xes'), 
                                                                                                              str(Path(__file__).resolve().parent / 'ModeloRecursosOFICIALv4.csv'), 
                                                                                                              str(Path(__file__).resolve().parent / 'Modelo_Log_Sintetico_OFICIAL.decl'), 
                                                                                                              str(Path(__file__).resolve().parent / 'ModeloAcessoOFICIAL.csv'))
  processed_access_model = convert_model_to_rules(access_model, process_model)
  convert_logs(process_log, access_log)
  process_conformance = check_process_conformance(process_model, process_log)
  access_conformance = check_access_conformance(processed_access_model)
  resource_conformance = check_resource_conformance(process_log, access_log, resource_model)
  activity_conformance = check_activity_conformance(process_log, access_log, allowed_activities)
  return format_inconformances(process_conformance, access_conformance, resource_conformance, activity_conformance)
