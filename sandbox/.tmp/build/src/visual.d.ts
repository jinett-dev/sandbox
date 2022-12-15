import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import ISelectionId = powerbi.visuals.ISelectionId;
import IVisual = powerbi.extensibility.IVisual;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
export declare class StatusColor {
    name: string;
    color: string;
    selectionId?: ISelectionId;
}
export interface BarChartDataPoint {
    value: PrimitiveValue;
    category: string;
    status: string;
    color: string;
    selectionId: ISelectionId;
}
export declare class Visual implements IVisual {
    private svg;
    private target;
    private host;
    private barContainer;
    private xAxis;
    private updateCount;
    private textNode;
    private dataView;
    private viewModel;
    private selectionManager;
    private formattingSettings;
    private formattingSettingsService;
    private globalStatusColor;
    static Config: {
        xScalePadding: number;
        solidOpacity: number;
        transparentOpacity: number;
        margins: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        xAxisFontMultiplier: number;
    };
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    getFormattingModel(): powerbi.visuals.FormattingModel;
    private visualTransform;
    /**
 * Gets property value for a particular object in a category.
 *
 * @function
 * @param {DataViewCategoryColumn} category - List of category objects.
 * @param {number} index                    - Index of category object.
 * @param {string} objectName               - Name of desired object.
 * @param {string} propertyName             - Name of desired property.
 * @param {T} defaultValue                  - Default value of desired property.
 */
    private getCategoricalObjectValue;
    /**
     * Gets property value for a particular object in a category.
     *
     * @function
     * @param {DataViewCategoryColumn} category - List of category objects.
     * @param {number} index                    - Index of category object.
     * @param {string} objectName               - Name of desired object.
     * @param {string} propertyName             - Name of desired property.
     * @param {T} defaultValue                  - Default value of desired property.
     */
    private getValue;
    private getColumnColorByIndex;
    private getColumnColorByObject;
}
