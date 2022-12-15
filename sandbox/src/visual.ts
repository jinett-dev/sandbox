/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import {
    scaleBand, scaleLinear
} from "d3-scale";
import {
    select as d3Select
} from "d3-selection";

import { axisBottom } from "d3-axis";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewObjects = powerbi.DataViewObjects;
import DataView = powerbi.DataView;
import Fill = powerbi.Fill;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import IselectionManager = powerbi.extensibility.ISelectionManager;
import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import { VisualFormattingSettingsModel } from "./settings";

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

export class StatusColor {
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

export class Visual implements IVisual {
    private svg: Selection<any>;
    private target: HTMLElement;
    private host: IVisualHost;
    private barContainer: Selection<SVGElement>;
    private xAxis: Selection<SVGElement>;
    private updateCount: number;
    private textNode: Text;
    private dataView: DataView;
    private viewModel: BarChartDataPoint[];
    private selectionManager: IselectionManager;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private globalStatusColor: StatusColor[];

    static Config = {
        xScalePadding: 0.1,
        solidOpacity: 1,
        transparentOpacity: 1,
        margins: {
            top: 0,
            right: 0,
            bottom: 25,
            left: 30,
        },
        xAxisFontMultiplier: 0.04,
    };

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.updateCount = 0;
        this.globalStatusColor = [];
        if (document) {
            const new_p: HTMLElement = document.createElement("p");
            new_p.appendChild(document.createTextNode("Update count:"));
            const new_em: HTMLElement = document.createElement("em");
            this.textNode = document.createTextNode(this.updateCount.toString());
            new_em.appendChild(this.textNode);
            new_p.appendChild(new_em);
            this.target.appendChild(new_p);
        }
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews);

        this.dataView = options.dataViews[0];
        this.viewModel = this.visualTransform(options, this.host);

        const new_table: HTMLTableElement = document.createElement("table");
        const table_header = document.createElement("thead");
        let td = document.createElement("td");
        td.appendChild(document.createTextNode("Category"));
        table_header.appendChild(td);
        td = document.createElement("td");
        td.appendChild(document.createTextNode("Value"));
        table_header.appendChild(td);
        td = document.createElement("td");
        td.appendChild(document.createTextNode("Status"));
        table_header.appendChild(td);
        td = document.createElement("td");
        td.appendChild(document.createTextNode("color"));
        table_header.appendChild(td);
        td = document.createElement("td");
        td.appendChild(document.createTextNode("SelectionID"));
        table_header.appendChild(td);
        new_table.appendChild(table_header);
        this.viewModel.forEach(value => {
            let table_row = document.createElement("tr");
            td = document.createElement("td");
            td.appendChild(document.createTextNode(value.category));
            table_row.appendChild(td);
            td = document.createElement("td");
            td.appendChild(document.createTextNode(value.value as string));
            table_row.appendChild(td);
            td = document.createElement("td");
            td.appendChild(document.createTextNode(value.status));
            table_row.appendChild(td);
            td = document.createElement("td");
            td.setAttribute("style", "color:" + value.color);
            td.appendChild(document.createTextNode(value.color));
            table_row.appendChild(td);
            td = document.createElement("td");
            td.appendChild(document.createTextNode(value.selectionId.getKey()));
            table_row.appendChild(td);
            new_table.appendChild(table_row);
        });
        this.target.appendChild(new_table);
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private visualTransform(options: VisualUpdateOptions, host: IVisualHost): BarChartDataPoint[] {
        let barChartDataPoints: BarChartDataPoint[] = []
        this.target.innerHTML = "";

        let viewModel: BarChartDataPoint = {
            value: null,
            category: "",
            status: "",
            color: "",
            selectionId: null,
        };

        if (!this.dataView ||
            !this.dataView.categorical ||
            !this.dataView.categorical.categories[0] ||
            !this.dataView.categorical.values[0]
        ) {
            return barChartDataPoints;
        }

        let metadata = this.dataView.metadata;
        let categorical = this.dataView.categorical;
        let category = categorical.categories[0];
        let values = categorical.values;

        let statusList: StatusColor[] = [];    
    
        let colorPalette: ISandboxExtendedColorPalette = host.colorPalette;
    
        for (let i = 0; i < category.values.length; i++) {
            let color: string = "";
            let dataValue: string = "";
            let selectionId: ISelectionId;
            let selectionIDMeasureQuery: string;
            let status: PrimitiveValue;
            
            for ( let j = 0; j < values.length; j++  ) {
                let value = values[j];

                if (value.source.roles.measure)
                    dataValue = value.values[i] as string;

                if (value.source.roles.status)
                {
                    status = value.values[i] as string;
                    selectionIDMeasureQuery = value.source.queryName;
                    let statusFound = this.globalStatusColor.find(element => {return element.name == status});
                    let statusFoundIndex = this.globalStatusColor.indexOf(statusFound);
                    selectionId = this.host.createSelectionIdBuilder()
                                    .withCategory(category, i)
                                    .withMeasure(selectionIDMeasureQuery)
                                    .createSelectionId();
                    if (value.objects && value.objects[i] != null)
                    {
                        let object = value.objects[i];
                        color = this.getColumnColorByObject(object, colorPalette, 
                            colorPalette.getColor(status).value);
                        if (statusFoundIndex >= 0) {
                            this.globalStatusColor[statusFoundIndex].color = color;
                        }
                        else
                        {
                            this.globalStatusColor.push({
                                name: status,
                                color: color,
                                selectionId: null
                            });
                        }
                    }
                    else 
                    {
                        if (statusFoundIndex >= 0) {
                            color = this.globalStatusColor[statusFoundIndex].color;
                        }
                        else
                        {
                            color = this.getColumnColorByIndex(category, i, colorPalette.getColor(status).value);
                            this.globalStatusColor.push({
                                name: status,
                                color: color,
                                selectionId: null
                            });
                        }
                    }
                    
                    let statusFind = statusList.find(element => {return element.name == status});
                    if (!statusList.includes(statusFind))
                    statusList.push({
                        name: status,
                        color: color,
                        selectionId: selectionId
                    });
                }    
            }

            if (selectionIDMeasureQuery == null)
            {
                selectionId = this.host.createSelectionIdBuilder()
                                .withCategory(category, i)
                                .createSelectionId();
            }

            let dataPoint: BarChartDataPoint = {
                color: color,
                selectionId: selectionId,
                status: status as string,
                value: dataValue,
                category: `${category.values[i]}`,
            }

            barChartDataPoints.push(dataPoint);
        }

        this.formattingSettings.populateColorSelector(statusList)
    
        return barChartDataPoints;
    }

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
private getCategoricalObjectValue<T>(category: DataViewCategoryColumn, index: number, objectName: string, propertyName: string, defaultValue: T): T {
    let categoryObjects = category.objects;

    if (categoryObjects) {
        let categoryObject: powerbi.DataViewObject = categoryObjects[index];
        if (categoryObject) {
            let object = categoryObject[objectName];
            if (object) {
                let property: T = <T>object[propertyName];
                if (property !== undefined) {
                    return property;
                }
            }
        }
    }
    return defaultValue;
}

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
     private getValue<T>(objects: powerbi.DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
        if (objects) {
            let object = objects[objectName];
            if (object) {
                let property: T = <T>object[propertyName];
                if (property !== undefined) {
                    return property;
                }
            }
        }
        return defaultValue;
    }

    private getColumnColorByIndex(
        category: DataViewCategoryColumn,
        index: number,
        defaultColor: string
    ): string {
    
        return this.getCategoricalObjectValue<Fill>(
            category,
            index,
            'colorSelector',
            'fill',
            {
                solid: {
                    color: defaultColor,
                }
            }
        ).solid.color;
    }

    private getColumnColorByObject(
        objects: powerbi.DataViewObjects,
        colorPalette: ISandboxExtendedColorPalette,
        defaultColor: string
    ): string {
        if (colorPalette.isHighContrast) {
            return colorPalette.background.value;
        }

        return this.getValue<Fill>(
            objects,
            'colorSelector',
            'fill',
            {
                solid: {
                    color: defaultColor,
                }
            }
        ).solid.color;
    }
}