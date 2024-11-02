import { NgModule, ModuleWithProviders } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { CalendarModule } from "primeng/calendar";
import { CardModule } from "primeng/card";
import { CarouselModule } from "primeng/carousel";
import { ChipModule } from "primeng/chip";
import { CheckboxModule } from "primeng/checkbox";
import { GalleriaModule } from "primeng/galleria";
import { ImageModule } from "primeng/image";
import { InputNumberModule } from "primeng/inputnumber";
import { InputSwitchModule } from "primeng/inputswitch";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { RadioButtonModule } from "primeng/radiobutton";
import { RippleModule } from "primeng/ripple";
import { SidebarModule } from "primeng/sidebar";
import { SplitButtonModule } from "primeng/splitbutton";
import { StyleClassModule } from "primeng/styleclass";
import { TabViewModule } from "primeng/tabview";
import { TagModule } from "primeng/tag";
import { ToolbarModule } from "primeng/toolbar";
import { MenuModule } from "primeng/menu";
import { AvatarModule } from "primeng/avatar";
import { FileUploadModule } from "primeng/fileupload";
import { DropdownModule } from "primeng/dropdown";
import { TableModule } from "primeng/table";
import { PanelModule } from "primeng/panel";
import { ListboxModule } from "primeng/listbox";
import { AccordionModule } from "primeng/accordion";
import { ToastModule } from "primeng/toast";
import { DialogModule } from "primeng/dialog";
import { BadgeModule } from "primeng/badge";
import { TieredMenuModule } from "primeng/tieredmenu";
import { TooltipModule } from "primeng/tooltip";
import { VirtualScrollerModule } from "primeng/virtualscroller";

@NgModule({
    imports: [
        AccordionModule,
        AvatarModule,
        BadgeModule,
        ButtonModule,
        CalendarModule,
        CardModule,
        CarouselModule,
        CheckboxModule,
        ChipModule,
        DialogModule,
        DropdownModule,
        FileUploadModule,
        GalleriaModule,
        ImageModule,
        InputNumberModule,
        InputTextModule,
        InputTextareaModule,
        InputSwitchModule,
        ListboxModule,
        MenuModule,
        PanelModule,
        RadioButtonModule,
        RippleModule,
        SidebarModule,
        StyleClassModule,
        TableModule,
        TabViewModule,
        TagModule,
        ToolbarModule,
        TooltipModule,
        ToastModule,
        TieredMenuModule,
        VirtualScrollerModule
    ],
    exports: [
        AccordionModule,
        AvatarModule,
        BadgeModule,
        ButtonModule,
        CalendarModule,
        CardModule,
        CarouselModule,
        CheckboxModule,
        ChipModule,
        DialogModule,
        DropdownModule,
        FileUploadModule,
        GalleriaModule,
        ImageModule,
        InputNumberModule,
        InputTextModule,
        InputTextareaModule,
        InputSwitchModule,
        ListboxModule,
        MenuModule,
        PanelModule,
        RadioButtonModule,
        RippleModule,
        SidebarModule,
        SplitButtonModule,
        StyleClassModule,
        TableModule,
        TabViewModule,
        TagModule,
        ToolbarModule,
        TooltipModule,
        ToastModule,
        TieredMenuModule,
        VirtualScrollerModule
    ],
})
export class PrimeShareModule {
    static forRoot(): ModuleWithProviders<PrimeShareModule> {
        return {
            ngModule: PrimeShareModule,
            // providers: [ appService ]
        };
    }
}
