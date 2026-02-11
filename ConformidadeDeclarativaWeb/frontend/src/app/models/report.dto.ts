import { Time } from "@angular/common";

export interface ActivityStats {
  name: string;
  count: number;
}

export interface Violation {
  case_id: string;      
  rule: string; 
  instance: number | number[];
  name: string;
  tool: string;
  resource: string;
  activity: string;
  designated_resource: string;
}


export interface ReportDTO {
  overview: {
    successRate: number;      
    averageDuration: string;  
    violationCount: number;
  };
  activityDistribution: ActivityStats[];
  violations: Violation[];
}