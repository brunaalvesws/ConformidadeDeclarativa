import { Time } from "@angular/common";

export interface ActivityStats {
   [key: string]: number;
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
    averageDuration: number;  
    violationCount: number;
  };
  activityDistribution: ActivityStats[];
  violations: {
     [key: string]: Violation[];
  };
}