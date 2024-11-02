import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Software } from "../../classes/software";
import { ModuleService } from "../../services/module.service";
import { CommandDispatcherService } from "../../services/command-dispatcher.service";
import { Log } from "../../classes/log";
import { MoreSoftwareComponent } from "../more-software/more-software.component";
import { MatDialog } from "@angular/material/dialog";
import { MoreSoftwareService } from "../../services/more-software.service";
import { faBars } from "@fortawesome/free-solid-svg-icons";

import { MenuItem } from "primeng/api";

@Component({
    selector: "app-software-menu",
    templateUrl: "./software-menu.component.html",
    styleUrls: ["./software-menu.component.css"],
})
export class SoftwareMenuComponent implements OnInit {
    primeMenuItems: MenuItem[] = [

        {
            label: "Games",

            items: [
                {
                    label: "TODO",
                },
            ],
        },
        {
            separator: true,
        },
        {
            label: "More Developing",
            items: [
                {
                    label: "Editor Assembler II",
                    command: () => {
                        this.openSoftware("software/ea2.json");
                    },
                },
                {
                    label: "RXB 2020",
                    command: () => {
                        this.openSoftware("software/rxb2020.rpk");
                    },
                },
                {
                    label: "Cortex Basic",
                    command: () => {
                        this.openSoftware("software/cortexbasic.rpk");
                    },
                },
                {
                    label: "Cortex Basic 80",
                    command: () => {
                        this.openSoftware("software/cortex_basic_80.rpk");
                    },
                },
                {
                    label: "TurboForth",
                    command: () => {
                        this.openSoftware("software/turboforth.rpk");
                    },
                },
                {
                    label: "fbForth",
                    command: () => {
                        this.openSoftware("software/fbForth200.rpk");
                    },
                },
                {
                    label: "XB 2.7 Suite",
                    command: () => {
                        this.openSoftware("software/xb27suite2.json");
                    },
                },
            ],
        },
        {
            label: "Programming Tools",
            items: [
                {
                    label: "Force Command",
                    command: () => {
                        this.openSoftware("software/forcecmd.rpk");
                    },
                },
                {
                    label: "4A DOS",
                    command: () => {
                        this.openSoftware("software/4ados.rpk");
                    },
                },
                {
                    label: "Mini Memory",
                    command: () => {
                        this.openSoftware("software/minimem.json");
                    },
                },
                {
                    label: "Supercart",
                    command: () => {
                        this.openSoftware("software/supercart.json");
                    },
                },
                {
                    label: "TI Workshop",
                    command: () => {
                        this.openSoftware("software/ti-workshop.json");
                    },
                },
                {
                    label: "SuperSpace II",
                    command: () => {
                        this.openSoftware("software/super-space-ii.json");
                    },
                },
                {
                    label: "Stevie editor (F18A)",
                    command: () => {
                        this.openSoftware("software/stevie8.bin");
                    },
                },
            ],
        },
        {
            label: "Management Tools",

            items: [
                {
                    label: "TODO",
                },
            ],
        },
        {
            label: "Office Apps",

            items: [
                {
                    label: "TODO",
                },
            ],
        },
        {
            label: "Educational Apps",

            items: [
                {
                    label: "TODO",
                },
            ],
        },
        { separator: true },
        {
            label: "Editor/Assembler",
            command: () => {
                this.openSoftware("software/editor-assembler.json");
            },
        },
        {
            label: "XB 2.9 G.E.M.",
            command: () => {
                this.openSoftware("software/xb29gem.rpk");
            },
        },
        {
            label: "TI Extended Basic",
            command: () => {
                this.openSoftware("software/xb.json");
            },
        },
        {
            label: "TI Basic",
            command: () => {
                this.openSoftware(null);
            },
        },
    ];

    menuData: any;
    menuIcon = faBars;

    private log: Log = Log.getLog();

    constructor(
        private httpClient: HttpClient,
        public dialog: MatDialog,
        private moduleService: ModuleService,
        private moreSoftwareService: MoreSoftwareService,
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnInit() {
        this.httpClient
            .get("assets/software/index.json", { responseType: "json" })
            .subscribe({
                next: (menuData) => {
                    this.menuData = menuData;
                },
                error: (err) => {
                    this.log.error(err);
                },
            });
    }

    openSoftware(url: string) {
        if (url) {
            this.moduleService.loadModuleFromURL(url).subscribe({
                next: (software: Software) => {
                    this.commandDispatcherService.loadSoftware(software);
                },
                error: (err) => {
                    this.log.error(err);
                },
            });
        } else {
            this.commandDispatcherService.unloadSoftware();
        }
    }

    openMoreDialog(): void {
        this.moreSoftwareService.getIndex().subscribe({
            next: (carts: Software[]) => {
                this.commandDispatcherService.stopKeyboard();
                const dialogRef = this.dialog.open(MoreSoftwareComponent, {
                    width: "400px",
                    data: carts,
                });
                dialogRef.afterClosed().subscribe((result) => {
                    this.commandDispatcherService.startKeyboard();
                    if (result instanceof Software) {
                        this.openSoftware(result.url);
                    }
                });
            },
            error: this.log.error.bind(this),
        });
    }
}
