export type IotDeviceStatus="ONLINE"|"OFFLINE"|"WARNING"|"MAINTENANCE"|"DISABLED";
export type IotAlertSeverity="INFO"|"WARNING"|"CRITICAL";
export type IotAlertStatus="OPEN"|"ACKNOWLEDGED"|"RESOLVED";
export interface IotReading{id:string;sensorType:string;value:string;unit:string;recordedAt:string}
export interface IotAlert{id:string;title:string;message:string|null;severity:IotAlertSeverity;status:IotAlertStatus;createdAt:string;device?:{deviceCode:string;name:string}}
export interface IotDevice{id:string;deviceCode:string;name:string;deviceType:string;machineId:string|null;workCenterId:string|null;location:string|null;status:IotDeviceStatus;firmware:string|null;lastSeenAt:string|null;readings:IotReading[];alerts:IotAlert[]}
export interface ManagementDashboard{iot:{devices:number;online:number;offline:number;openAlerts:number;critical:number};business:{production:number;inventory:number;customers:number;projects:number;employees:number;pendingLeaves:number;draftExpenses:number;openInvoices:number};recentAlerts:IotAlert[]}
