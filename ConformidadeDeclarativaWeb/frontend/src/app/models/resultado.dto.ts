import { Time } from "@angular/common";

export interface ActivityStats {
  name: string;
  count: number;
}

export interface Violation {
  title: string;      
  description: string; 
  severity: 'high' | 'medium' | 'low'; 
  details: {
    trace: string;     
    message: string;   
    count: number;     
  }[];
}


export interface ReportDTO {
  overview: {
    successRate: number;      
    averageDuration: string;  
    totalTraces: number;
    violationCount: number;
  };
  activityDistribution: ActivityStats[];
  violations: Violation[];
}