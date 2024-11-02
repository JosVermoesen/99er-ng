import { Software } from "../../classes/software";
import { DiskDrive } from "../classes/diskdrive";
import { Memory } from "../classes/memory";
import { Speech } from "./speech";
import { PSG } from "./psg";
import { VDP } from "./vdp";
import { Tape } from "../classes/tape";
import { Keyboard } from "../classes/keyboard";
import { CPU } from "./cpu";
import { CRU } from "../classes/cru";
import { GoogleDrive } from "../classes/googledrive";
import { TIPI } from "../classes/tipi";

export interface Console {
    start(fast: boolean, skipBreakpoint?: boolean): any;
    reset(keepCart: boolean): any;
    frame(skipBreakpoint?: boolean): any;
    step(): any;
    stepOver(): any;
    stop(): any;
    loadSoftware(software: Software): any;
    getDiskDrives(): DiskDrive[];
    getCPU(): CPU;
    getVDP(): VDP;
    getPSG(): PSG;
    getSpeech(): Speech;
    getCRU(): CRU;
    getMemory(): Memory;
    getKeyboard(): Keyboard;
    getTape(): Tape;
    getDiskDrives(): DiskDrive[];
    getGoogleDrives(): GoogleDrive[];
    setGoogleDrive(): any;
    getTIPI(): TIPI;
    setTIPI(): any;
    setVDP(): any;
    isRunning(): any;
}
