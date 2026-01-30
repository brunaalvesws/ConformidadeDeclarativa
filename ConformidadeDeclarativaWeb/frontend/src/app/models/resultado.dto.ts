import { Time } from "@angular/common";

export interface ReportDTO {
  Duration: Time;
  ActivityList: [Object];
  ProhibitedActivity: [Object];
  UnexpectedActivity: [Object];
  IllegalActivity: [Object];
  IgnoredMandatoryActivity: [Object];
  ProhibitedDataAccess: [Object];
  UnexpectedDataAccess: [Object];
  IllegalDataAccess: [Object];
  IgnoredMandatoryDataAccess: [Object];
}