import pm4py
from Declare4Py.D4PyEventLog import D4PyEventLog

class MainController:
    def index(self):
        event_log: D4PyEventLog = D4PyEventLog(case_name="case:concept:name")
        event_log.parse_xes_log('data/log_2022_Medio_piores.xes')
        event_log2 = pm4py.read_xes('data/log_2022_Medio_piores.xes')
        start_activities = pm4py.get_start_activities(event_log2)
        return {'message1': event_log.get_length(),
                'message2': start_activities}
