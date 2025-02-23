import { MemoryBlock, Software } from "../classes/software";
import { Log } from "../classes/log";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Subject } from "rxjs";
import { ZipService } from "./zip.service";
import { Util } from "../classes/util";
import { forkJoin } from "rxjs";
import * as zip from "zip-js/WebContent/zip.js";
import Entry = zip.Entry;
import Reader = zip.Reader;

@Injectable()
export class ModuleService {
    constructor(httpClient: HttpClient, zipService: ZipService) {
        this.httpClient = httpClient;
        this.zipService = zipService;
    }

    private readonly httpClient: HttpClient;
    private readonly zipService: ZipService;

    private static hexArrayToByteArray(hexArray: string[]) {
        const binArray = [];
        let n = 0;
        for (let i = 0; i < hexArray.length; i++) {
            const row = hexArray[i];
            for (let j = 0; j < row.length; j += 2) {
                binArray[n++] = parseInt(row.substr(j, 2), 16);
            }
        }
        return new Uint8Array(binArray);
    }

    private static insertROM(
        romArray: number[],
        rom: Uint8Array,
        offset: number
    ) {
        if (romArray.length < offset) {
            for (let i = 0; i < offset; i++) {
                romArray[i] = 0;
            }
        }
        for (let i = 0; i < rom.length; i++) {
            romArray[offset + i] = rom[i];
        }
        const length = romArray.length;
        const paddedLength = Math.max(
            Math.pow(2, Math.ceil(Math.log2(length))),
            0x2000
        );
        for (let i = length; i < paddedLength; i++) {
            romArray[i] = 0;
        }
    }

    private static padROM(rom: Uint8Array): Uint8Array {
        const length = rom.length;
        const paddedLength = Math.max(
            Math.pow(2, Math.ceil(Math.log2(length))),
            0x2000
        );
        if (length !== paddedLength) {
            const paddedRom = new Uint8Array(paddedLength);
            for (let i = 0; i < length; i++) {
                paddedRom[i] = rom[i];
            }
            return paddedRom;
        } else {
            return rom;
        }
    }

    loadModuleFromFiles(files: FileList): Observable<Software> {
        if (files.length === 1) {
            return this.loadModuleFromFile(files[0]);
        } else {
            const observables: Observable<Software>[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const extension = this.getExtension(file.name);
                if (extension === "bin") {
                    observables.push(this.loadBinModuleFromFile(file, true));
                }
            }
            return this.combineSoftwareIntoModule(observables);
        }
    }

    loadModuleFromFile(file: File): Observable<Software> {
        const extension = this.getExtension(file.name);
        if (extension !== "rpk" && extension !== "zip" && extension !== "bin") {
            const subject = new Subject<Software>();
            subject.error(
                "File name extension '" + extension + "' not supported."
            );
            return subject.asObservable();
        }
        if (extension === "bin") {
            return this.loadBinModuleFromFile(file, false);
        } else {
            return this.loadRPKOrZipModuleFromFile(file);
        }
    }

    loadModuleFromURL(url: string): Observable<Software> {
        if (url.slice(url.length - 3).toLowerCase() === "rpk") {
            return this.loadRPKOrZipModuleFromURL("assets/" + url);
        } else if (url.slice(url.length - 3).toLowerCase() === "bin") {
            return this.loadBinModuleFromURL("assets/" + url);
        } else if (url.slice(url.length - 4).toLowerCase() === "json") {
            return this.loadJSONModuleFromURL("assets/" + url);
        } else {
            const subject = new Subject<Software>();
            subject.error("Invalid url: " + url);
            return subject.asObservable();
        }
    }

    loadRPKOrZipModuleFromFile(file: File): Observable<Software> {
        return this.loadRPKOrZipModule(this.zipService.createBlobReader(file));
    }

    loadRPKOrZipModuleFromURL(url: string): Observable<Software> {
        return this.loadRPKOrZipModule(this.zipService.createHttpReader(url));
    }

    loadRPKOrZipModule(reader: Reader): Observable<Software> {
        const subject = new Subject<Software>(),
            self = this;
        this.zipService.createReader(
            reader,
            (zipReader) => {
                zipReader.getEntries(function (entries) {
                    let layoutEntry = null;
                    entries.forEach(function (entry) {
                        // log.info(entry.filename);
                        if (entry.filename === "layout.xml") {
                            // log.info("Layout file found");
                            layoutEntry = entry;
                        }
                    });
                    if (layoutEntry != null) {
                        self.loadRPKModule(layoutEntry, entries, subject);
                    } else {
                        self.loadZipModule(entries, subject);
                    }
                });
            },
            (error) => {
                subject.error(error);
            }
        );
        return subject.asObservable();
    }

    loadRPKModule(
        layoutEntry: Entry,
        entries: Entry[],
        subject: Subject<Software>
    ) {
        const self = this,
            zipService = this.zipService,
            writer = zipService.createTextWriter("ISO-8859-1");
        layoutEntry.getData(
            writer,
            function (txt) {
                const parser = new DOMParser(),
                    xmlDoc = parser.parseFromString(txt, "text/xml"),
                    pcb = xmlDoc.getElementsByTagName("pcb")[0],
                    pcbType = pcb.getAttribute("type").toLowerCase(),
                    roms = xmlDoc.getElementsByTagName("rom"),
                    sockets = xmlDoc.getElementsByTagName("socket"),
                    module: Software = new Software(),
                    observables = [];
                module.inverted = pcbType === "paged379i";
                module.cruBankSwitched =
                    pcbType === "pagedcru" || pcbType === "super";
                for (let i = 0; i < roms.length; i++) {
                    const rom = roms[i];
                    const romId = rom.getAttribute("id");
                    const filename = rom.getAttribute("file");
                    let socketId = null;
                    for (let j = 0; j < sockets.length && !socketId; j++) {
                        if (sockets[j].getAttribute("uses") === romId) {
                            socketId = sockets[j].getAttribute("id");
                        }
                    }
                    let entry: Entry = null;
                    for (let j = 0; j < entries.length && entry == null; j++) {
                        if (entries[j].filename === filename) {
                            entry = entries[j];
                        }
                    }
                    observables.push(
                        self.loadRPKEntry(entry, filename, romId, socketId)
                    );
                }
                forkJoin(observables).subscribe((softwares: Software[]) => {
                    const romArray: number[] = [];
                    softwares.forEach((software: Software) => {
                        if (software.grom) {
                            module.grom = software.grom;
                        } else if (software.rom) {
                            const offset =
                                software.socketId === "rom2_socket"
                                    ? 0x2000
                                    : 0;
                            ModuleService.insertROM(
                                romArray,
                                software.rom,
                                offset
                            );
                        }
                    });
                    if (romArray.length) {
                        module.rom = new Uint8Array(romArray);
                    }
                    subject.next(module);
                    subject.complete();
                }, subject.error);
            },
            function (progress, total) {
                // On progress
            },
            function (error) {
                subject.error(error);
            }
        );
    }

    private loadRPKEntry(
        entry: Entry,
        filename: string,
        romId: string,
        socketId: string
    ): Observable<Software> {
        const subject = new Subject<Software>(),
            zipService = this.zipService,
            blobWriter = zipService.createBlobWriter(),
            log = Log.getLog();
        entry.getData(blobWriter, function (blob) {
            const reader = new FileReader();
            reader.onload = function () {
                // reader.result contains the contents of blob as a typed array
                const byteArray = new Uint8Array(reader.result as ArrayBuffer);
                const software = new Software();
                if (socketId.substr(0, 3).toLowerCase() === "rom") {
                    log.info(
                        "ROM " +
                            romId +
                            " (" +
                            socketId +
                            "): '" +
                            filename +
                            "', " +
                            byteArray.length +
                            " bytes"
                    );
                    software.rom = byteArray;
                    software.socketId = socketId;
                } else if (socketId.substr(0, 4).toLowerCase() === "grom") {
                    log.info(
                        "GROM " +
                            romId +
                            " (" +
                            socketId +
                            "): '" +
                            filename +
                            "', " +
                            byteArray.length +
                            " bytes"
                    );
                    software.grom = byteArray;
                }
                subject.next(software);
                subject.complete();
            };
            reader.readAsArrayBuffer(blob);
        });
        return subject.asObservable();
    }

    loadZipModule(entries: Entry[], subject: Subject<Software>) {
        const self = this,
            log = Log.getLog(),
            observables: Observable<Software>[] = [];
        entries.forEach(function (entry) {
            log.info(entry.filename);
            observables.push(self.loadZipEntry(entry));
        });
        this.combineSoftwareIntoModule(observables).subscribe((module) => {
            subject.next(module);
            subject.complete();
        });
    }

    loadZipEntry(entry: Entry): Observable<Software> {
        const subject = new Subject<Software>(),
            software = new Software(),
            baseFileName: string = this.getBaseFilename(entry.filename),
            zipService = this.zipService;
        if (this.getExtension(entry.filename) === "bin") {
            const grom =
                baseFileName &&
                (baseFileName.endsWith("g") || baseFileName.endsWith("G"));
            software.inverted =
                baseFileName &&
                (baseFileName.endsWith("3") || baseFileName.endsWith("9"));
            const blobWriter = zipService.createBlobWriter();
            entry.getData(
                blobWriter,
                function (blob) {
                    const reader = new FileReader();
                    reader.onload = function () {
                        // reader.result contains the contents of blob as a typed array
                        const result: ArrayBuffer =
                            reader.result as ArrayBuffer;
                        const byteArray = new Uint8Array(result);
                        const ramFG99Paged = byteArray[3] === 0x52;
                        software.ramAt7000 = ramFG99Paged;
                        software.ramFG99Paged = ramFG99Paged;
                        if (grom) {
                            software.grom = byteArray;
                        } else {
                            software.rom = byteArray;
                        }
                        subject.next(software);
                        subject.complete();
                    };
                    reader.readAsArrayBuffer(blob);
                },
                function () {
                    // On progress
                },
                function (error) {
                    subject.error(error);
                }
            );
        }
        return subject.asObservable();
    }

    loadBinModuleFromFile(
        file: File,
        considerExtensionForSecondBank: boolean
    ): Observable<Software> {
        const subject = new Subject<Software>(),
            baseFileName = this.getBaseFilename(file.name),
            inverted =
                baseFileName &&
                (baseFileName.endsWith("3") || baseFileName.endsWith("9")),
            grom =
                baseFileName &&
                (baseFileName.endsWith("g") || baseFileName.endsWith("G")),
            secondBank =
                considerExtensionForSecondBank &&
                (baseFileName.endsWith("d") || baseFileName.endsWith("D")),
            reader = new FileReader();
        reader.onload = function () {
            const byteArray = new Uint8Array(reader.result as ArrayBuffer);
            const module: Software = new Software();
            const ramFG99Paged = byteArray[3] === 0x52;
            module.ramAt7000 = ramFG99Paged;
            module.ramFG99Paged = ramFG99Paged;
            if (grom) {
                module.grom = byteArray;
            } else {
                module.inverted = inverted;
                module.rom = ModuleService.padROM(byteArray);
                module.secondBank = secondBank;
            }
            subject.next(module);
            subject.complete();
        };
        reader.onerror = function () {
            subject.error(reader.error);
        };
        reader.readAsArrayBuffer(file);
        return subject.asObservable();
    }

    loadBinModuleFromURL(url: string): Observable<Software> {
        const subject = new Subject<Software>();
        const baseFileName = url.split(".")[0];
        const inverted =
            baseFileName &&
            (baseFileName.endsWith("3") || baseFileName.endsWith("9"));
        this.httpClient.get(url, { responseType: "arraybuffer" }).subscribe({
            next: (data: ArrayBuffer) => {
                const byteArray = new Uint8Array(data);
                const module = new Software();
                module.inverted = inverted;
                module.rom = ModuleService.padROM(byteArray);
                subject.next(module);
                subject.complete();
            },
            error: (error) => {
                subject.error(error);
            },
        });

        return subject.asObservable();
    }

    loadJSONModuleFromURL(url: string): Observable<Software> {
        const subject = new Subject<Software>();
        this.httpClient.get(url, { responseType: "json" }).subscribe({
            next: (data: any) => {
                const software = new Software();
                software.inverted = data.inverted;
                software.cruBankSwitched = data.cruBankSwitched;
                if (data.startAddress) {
                    software.startAddress = Util.parseNumber(data.startAddress);
                }
                if (data.rom != null) {
                    software.rom = ModuleService.hexArrayToByteArray(data.rom);
                }
                if (data.grom != null) {
                    software.grom = ModuleService.hexArrayToByteArray(
                        data.grom
                    );
                }
                if (data.groms != null) {
                    software.groms = [];
                    for (let g = 0; g < data.groms.length; g++) {
                        software.groms[g] = ModuleService.hexArrayToByteArray(
                            data.groms[g]
                        );
                    }
                }
                if (data.memoryBlocks != null) {
                    software.memoryBlocks = [];
                    for (let i = 0; i < data.memoryBlocks.length; i++) {
                        software.memoryBlocks[i] = new MemoryBlock(
                            Util.parseNumber(data.memoryBlocks[i].address),
                            ModuleService.hexArrayToByteArray(
                                data.memoryBlocks[i].data
                            )
                        );
                    }
                }
                software.ramAt6000 = data.ramAt6000;
                software.ramAt7000 = data.ramAt7000;
                subject.next(software);
                subject.complete();
            },
            error: (error) => {
                subject.error(error.error);
            },
        });

        return subject.asObservable();
    }

    combineSoftwareIntoModule(
        observables: Observable<Software>[]
    ): Observable<Software> {
        const subject = new Subject<Software>();
        const module: Software = new Software();
        forkJoin(observables).subscribe({
            next: (softwares: Software[]) => {
                softwares.forEach((software: Software) => {
                    if (software.grom) {
                        module.grom = software.grom;
                    } else if (software.rom) {
                        if (!software.secondBank) {
                            module.rom = ModuleService.padROM(software.rom);
                            module.inverted = software.inverted;
                        } else {
                            // 2nd bank
                            if (!module.rom) {
                                module.rom = new Uint8Array(0x4000);
                                this.copyArray(
                                    software.rom,
                                    module.rom,
                                    0,
                                    0x2000,
                                    0x2000
                                );
                            } else if (
                                module.rom &&
                                module.rom.length === 0x2000
                            ) {
                                const rom = new Uint8Array(0x4000);
                                this.copyArray(module.rom, rom, 0, 0, 0x2000);
                                this.copyArray(
                                    software.rom,
                                    rom,
                                    0,
                                    0x2000,
                                    0x2000
                                );
                                module.rom = rom;
                            } else if (
                                module.rom &&
                                module.rom.length === 0x4000
                            ) {
                                this.copyArray(
                                    software.rom,
                                    module.rom,
                                    0,
                                    0x2000,
                                    0x2000
                                );
                            }
                            module.inverted = false;
                        }
                    }
                    if (software.ramAt6000) {
                        module.ramAt6000 = true;
                    }
                    if (software.ramAt7000) {
                        module.ramAt7000 = true;
                    }
                    if (software.ramFG99Paged) {
                        module.ramFG99Paged = true;
                    }
                });
                subject.next(module);
                subject.complete();
            },
            error: (error) => {
                subject.error(error);
            },
        });

        return subject.asObservable();
    }

    copyArray(
        from: Uint8Array,
        to: Uint8Array,
        fromIndex: number,
        toIndex: number,
        length: number
    ) {
        for (let i = 0; i < length; i++) {
            to[toIndex + i] = from[fromIndex + i];
        }
    }

    getBaseFilename(filename: string): string {
        const parts = filename.split(".");
        const baseParts = parts.slice(0, parts.length - 1);
        return baseParts.join(".");
    }

    getExtension(filename: string): string {
        let extension = filename.split(".").pop();
        extension = extension ? extension.toLowerCase() : "";
        return extension;
    }
}
