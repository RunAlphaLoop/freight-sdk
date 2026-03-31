import { CarriersResource } from './resources/carriers';
import { ContactsResource } from './resources/contacts';
import { CrashesResource } from './resources/crashes';
import { FleetResource } from './resources/fleet';
import { InspectionsResource } from './resources/inspections';
export declare class AlphaLoops {
    private _http;
    private _carriers?;
    private _fleet?;
    private _inspections?;
    private _crashes?;
    private _contacts?;
    constructor(options: {
        apiKey: string;
        baseUrl?: string;
    });
    get carriers(): CarriersResource;
    get fleet(): FleetResource;
    get inspections(): InspectionsResource;
    get crashes(): CrashesResource;
    get contacts(): ContactsResource;
}
