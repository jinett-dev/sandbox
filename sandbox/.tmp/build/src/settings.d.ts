import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { StatusColor } from "./visual";
import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
/**
 * Data Point Formatting Card
 */
declare class EnableAxisCardSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    fill: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class ColorSelectorCardSettings extends FormattingSettingsCard {
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
/**
* visual settings model class
*
*/
export declare class VisualFormattingSettingsModel extends FormattingSettingsModel {
    enableAxis: EnableAxisCardSettings;
    colorSelector: ColorSelectorCardSettings;
    cards: (EnableAxisCardSettings | ColorSelectorCardSettings)[];
    /**
   * populate colorSelector object categories formatting properties
   * @param dataPoints
   */
    populateColorSelector(dataPoints: StatusColor[]): void;
}
export {};
