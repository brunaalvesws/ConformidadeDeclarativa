import pm4py
from Declare4Py.ProcessModels.DeclareModel import DeclareModel
from Declare4Py.D4PyEventLog import D4PyEventLog
from Declare4Py.ProcessMiningTasks.Discovery.DeclareMiner import DeclareMiner
from Declare4Py.ProcessMiningTasks.ConformanceChecking.MPDeclareAnalyzer import MPDeclareAnalyzer
from Declare4Py.ProcessMiningTasks.ConformanceChecking.MPDeclareResultsBrowser import MPDeclareResultsBrowser
class MainController:
    def index(self):
        declare_model = DeclareModel().parse_from_file('data/Modelo_Log_Sintetico.decl')
        #model_activities = declare_model.get_model_activities()
        model_constraints = declare_model.get_decl_model_constraints()
        event_log = D4PyEventLog(case_name="case:concept:name")
        event_log.parse_xes_log('data/LogSintetico.xes')
        # basic_checker = MPDeclareAnalyzer(log=event_log, declare_model=declare_model, consider_vacuity=False)
        # conf_check_res: MPDeclareResultsBrowser = basic_checker.run()
        # discovery = DeclareMiner(log=event_log, consider_vacuity=False, min_support=0.5, itemsets_support=0.9, max_declare_cardinality=3)
        # discovered_model: DeclareModel = discovery.run()
        #event_log2 = pm4py.read_xes('data/log_2022_Medio_piores.xes')
        #start_activities = pm4py.get_start_activities(event_log2)
        return {'message1': model_constraints, 'message2': event_log.get_start_activities()}
