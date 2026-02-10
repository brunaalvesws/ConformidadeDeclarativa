from .Algorithm import MultiConformanceAlgorithm
class MainController:
    def index(self):
        inconformances = MultiConformanceAlgorithm.MultiperspectiveConformanceAlgorithm()
        return inconformances
    
    def check(self, event_log, access_log, resource_model, declare_model, access_model):
        inconformances = MultiConformanceAlgorithm.MultiperspectiveConformanceAlgorithm(event_log, access_log, resource_model, declare_model, access_model)
        return inconformances
