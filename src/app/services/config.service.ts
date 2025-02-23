import { Injectable } from "@angular/core";
import { Settings } from "../classes/settings";

export interface ConfigObject {
    sidePanelVisible?: boolean;
    toolbarVisible?: boolean;
    settings?: Settings;
    cartName?: string;
}

@Injectable({
    providedIn: "root",
})
export class ConfigService {
    private _config: ConfigObject;

    get config(): any {
        return this._config;
    }

    set config(value: any) {
        this._config = value;
    }
}
