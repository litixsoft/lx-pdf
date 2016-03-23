'use strict';
/*jshint -W083 */
var PDFDocument = require('pdfkit'),
    PDFImage = require('pdfkit/js/image'),
    lxHelpers = require('lx-helpers'),
    filestream = require('fs');

// How to render border lines
var borderRules = {
    left: {
        order: ['left', 'top', 'left', 'bottom'],
        width: {
            normal: 1,
            double: 1
        },
        double: [1, 0, 1, 0]
    },
    top: {
        order: ['left', 'top', 'right', 'top'],
        width: {
            normal: 1,
            double: 1
        },
        double: [0, 1, 0, 1]
    },
    right: {
        order: ['right', 'top', 'right', 'bottom'],
        width: {
            normal: 1,
            double: 1
        },
        double: [1, 0, 1, 0]
    },
    bottom: {
        order: ['left', 'bottom', 'right', 'bottom'],
        width: {
            normal: 1,
            double: 1
        },
        double: [0, 1, 0, 1]
    }
};

var cellOptions = {
    left: {
        x_offset: 1
    },
    right: {
        x_offset: -1
    },
    center: {
        x_offset: 1
    }
};

var defaultFont = {
    name: 'Helvetica',
    size: 10,
    color: '#000000'
};

// PDF Kit ignore that Symbols for calculation Width, then patch it manuelly
var symbolTable = {
    '€': 'E'
};

module.exports = function (template) {
    var pub = {},
        pageIndex = 0,
        documentData = {},
        documentTemplateData = {},
        showTextboxes = false,
        globalPageIndexCounter = 0,
        documentIndex = 0,
        pageOffset = 0;

    /*
     Returns the value from DATA with KEYNAME. If KEYNAME not exist in DATA, then returns DEFAULTVALUE.
     */
    function getValue(keyname, defaultvalue, data) {
        var keys = keyname.split('.');

        defaultvalue = (typeof defaultvalue === 'undefined' ? undefined : defaultvalue);
        data = data || documentTemplateData;

        for (var idxKey = 0; idxKey < keys.length; idxKey++) {
            // Has Key a Page Array, take the current Page from Page Index
            if (data.pages && lxHelpers.isArray(data.pages)) {
                data = data.pages;

                // Returns only the data field for the current Site
                // If pageIndex greater than available Items, take the last Entry
                if (data.length > pageIndex) {
                    data = data[pageIndex];
                } else {
                    data = data[data.length - 1];
                }
            }

            // Key does not exist, return defaultvalue
            if (!data[keys[idxKey]]) {
                return defaultvalue;
            }

            data = data[keys[idxKey]];
        }

        // Return data
        return data;
    }


    function getFontObject(data, defaultfont) {
        var result = {},
            fonts = documentTemplateData.fonts || {},
            deffnt = defaultfont || fonts.default || defaultFont;

        if (typeof data === 'string') {
            if (data in fonts) {
                result = fonts[data];
            }
        } else if (typeof data === 'object') {
            result = data;
        }

        return {
            name: result.name || deffnt.name,
            size: result.size || deffnt.size,
            color: result.color || deffnt.color
        };
    }

    /**
     * Returns if KEYNAME in DATA exists.
     *
     * @param keyname
     * @param data
     * @returns {boolean}
     */
    function getKeyExist(keyname, data) {
        data = data || undefined;
        return getValue(keyname, undefined, data) !== undefined;
    }

    /**
     * Returns the maximal height of TEXT with the current font
     *
     * @param document
     * @param text
     * @returns {number}
     */
    function getTextHeight(document, text) {
        if (!text) {
            return 0;
        }

        return text.split('\n').length * document.currentLineHeight(true);
    }

    /**
     *
     *
     * @param document
     * @param name
     * @param data
     */
    function addContentToDocument(document, name, data) {
        if (typeof data === 'string') {
            return addTextToDocument(document, name, {data: data});
        }

        if (typeof data === 'object') {
            return addTableToDocument(document, name, {data: data}, function () {
                // No new Page allowed
                return false;
            });
        }

        return {done: false};
    }

    /**
     * Setup the current Page
     *
     * @param document
     * @param [layout]
     *
     */
    function setUpPage(document, layout) {
        var pageBackgroundOptions = getValue('options.background'),
            pageSections = getValue('options.sections', {}),
            pageHeader = getValue('header'),
            pageFooter = getValue('footer'),
            showHeader = !(layout && layout.header === false), // Get enabled Header
            showFooter = !(layout && layout.footer === false); // Get enabled Footer

        // sets the background image
        if (pageBackgroundOptions && getKeyExist('filename', pageBackgroundOptions)) {
            document.image(getValue('filename', undefined, pageBackgroundOptions), 0, 0, getValue('imageformat', {}, pageBackgroundOptions));
        }

        // render header
        if (showHeader === true && pageHeader && pageHeader.data) {
            var pageHeaderHeight = getValue('format.height', 60, pageHeader),
                pageHeaderData = pageHeader.data || '',
                pageHeaderFormat = {};

            pageHeaderFormat.font = pageHeader.font || {};
            pageHeaderFormat.format = pageHeader.format || {};
            pageHeaderFormat.format.left = 0;
            pageHeaderFormat.format.top = 0;
            pageHeaderFormat.format.width = document.page.width;
            pageHeaderFormat.format.height = pageHeaderHeight;

            addContentToDocument(document, pageHeaderFormat, pageHeaderData);
        }

        // render footer
        if (showFooter === true && pageFooter && pageFooter.data) {
            var pageFooterHeight = getValue('format.height', 60, pageFooter),
                pageFooterData = pageFooter.data || '',
                pageFooterFormat = {};

            pageFooterFormat.font = pageFooter.font || {};
            pageFooterFormat.format = pageFooter.format || {};
            pageFooterFormat.format.left = 0;
            pageFooterFormat.format.top = document.page.height - pageFooterHeight;
            pageFooterFormat.format.width = document.page.width;
            pageFooterFormat.format.height = pageFooterHeight;

            addContentToDocument(document, pageFooterFormat, pageFooterData);
        }

        // Setup section with default text when no user section exists ?
        lxHelpers.forEach(pageSections, function (sectionName, sectionData) {
            // If not default text or user have set a section, abort.
            if (!sectionData.text || sectionName in documentData) {
                return;
            }

            addContentToDocument(document, sectionName, sectionData.text);
        });
    }

    /**
     * Set the page at INDEX as the actually page. If page doesent exits the creates it.
     *
     * @param document
     * @param index
     */
    function setPage(document, index) {
        // if page doesent exits then create all page includes the required page
        if (index >= (document.pages.length - pageOffset)) {
            while (true) {
                pageIndex = (document.pages.length - pageOffset);
                var currentPageLayout = getValue('options.layout', {});

                // create page
                document.addPage(currentPageLayout);
                setUpPage(document, currentPageLayout);

                // No comment
                if ((document.pages.length - pageOffset) > index) {
                    break;
                }
            }
        }

        // Set Page
        pageIndex = index;
        document.page = document.pages[index + pageOffset];
    }

    function isSectionExists(sectionName) {
        return !!getValue('options.sections.' + sectionName, undefined);
    }

    /**
     * Get the Dimension for a Section of the current Page, returns empty object if section doesent exits
     *
     * @param sectionName
     * @returns {{left: *, top: *, height: *, width: *}}
     */
    function getSectionDimension(sectionName) {
        var pageDimension = getValue('options.sections.' + sectionName, undefined);

        if (!pageDimension) {
            return {};
        }

        return {
            left: getValue('format.left', 0, pageDimension),
            top: getValue('format.top', 0, pageDimension),
            height: getValue('format.height', 0, pageDimension),
            width: getValue('format.width', 0, pageDimension)
        };
    }

    /**
     *
     *
     * @param rect
     * @param margin
     * @returns {*}
     */
    function getDeflateRect(rect, margin) {
        if (margin) {
            if (margin.left) {
                rect.left += margin.left;
                rect.width -= margin.left;
            }

            if (margin.top) {
                rect.top += margin.top;
                rect.height -= margin.top;
            }

            if (margin.right) {
                rect.width -= margin.right;
            }

            if (margin.bottom) {
                rect.height -= margin.bottom;
            }
        }

        return rect;
    }

    /**
     *
     *
     * @param document
     * @param text
     * @param left
     * @param top
     * @param format
     */
    function writeText(document, text, left, top, format) {
        // HINT: PDF Kit fix. €uro Symbol
        if (format.align === 'right') {
            for (var charIndex = 0; charIndex < text.length; charIndex++) {
                if (text.charAt(charIndex) in symbolTable) {
                    left -= document.widthOfString(symbolTable[text.charAt(charIndex)]);
                }
            }
        }

        return document.text(text, left, top, format);
    }

    /*
     Adds content TEXT to SECTIONNAME on the current page
     */
    function addTextToDocument(document, sectionData, sectionInfo) {
        var contentFormat = {},
            sectionDimension = {},
            sectionName = 'Unknow';

        if (typeof sectionData === 'string') {
            // Get some informations
            contentFormat = getValue('options.sections.' + sectionData, undefined); // Returns undefined, if section not exits

            if (!contentFormat) {
                return {done: true, error: {message: 'WARNING: Section "' + sectionData + '" not found.'}};
            }

            // If section not defined then exit

            sectionDimension = getSectionDimension(sectionData);
            sectionName = sectionData;
        }

        if (typeof sectionData === 'object') {
            contentFormat = sectionData;
            sectionDimension = {
                left: getValue('format.left', 0, sectionData),
                top: getValue('format.top', 0, sectionData),
                height: getValue('format.height', 0, sectionData),
                width: getValue('format.width', 0, sectionData)
            };
        }

        if (!contentFormat || !sectionDimension) {
            return {done: true, error: {message: 'No content Format/Dimension.'}};
        }

        var text = sectionInfo.data,
            format = getValue('format', {}, contentFormat),
            font = getFontObject(getValue('font', {}, contentFormat)),
            textmargin = getValue('textmargin', {}, format),
            pixelWidth = sectionDimension.width * 2.0,
            result = {
                done: true,
                data: text,
                topIndex: sectionInfo.topIndex || 0,
                pageIndex: pageIndex
            };

        // Fill Background color
        if (format.background) {
            document.rect(sectionDimension.left, sectionDimension.top, sectionDimension.width, sectionDimension.height).fill(format.background);
        }

        if (showTextboxes) {
            document.rect(sectionDimension.left, sectionDimension.top, sectionDimension.width, sectionDimension.height).stroke('lightsteelblue');
        }

        // Has text margin?
        sectionDimension = getDeflateRect(sectionDimension, textmargin);

        // Setup Font, Size and Color
        document.font(font.name).fontSize(font.size).fillColor(font.color);

        if (typeof text === 'string') {
            var currentLineWidth = 0,
                currentLineHeight = document.currentLineHeight(true),
                currentLineIndex = 1; // Minimal required height of the area to print 1 text line

            var maxAvailableLines = Math.floor(sectionDimension.height / currentLineHeight); // Maximal available Lines in the current area

            // HINT: lineHeight * 2 is the minimum Height for a textline
            if (sectionDimension.height < currentLineHeight) {
                throw new Error('The height of the content area (' + sectionName + ') is too small. Minmium ' + currentLineHeight + '. Given ' + sectionDimension.height + '.');
            }

            // Variables to fit text on page
            var lastLineBreakIndex = 0, // last possible line break in the text
                lineStartIndex = 0, // a new line starts from that position
                splitIndex = -1, // The index with the end of the text for the current page. There is cut on the new page.
                lines = []; // An array containing all text lines which, adapted to the current page size

            // Calculate text thats displays correct on the current Page
            for (var charIndex = 0; charIndex < text.length; charIndex++) {
                switch (text.charAt(charIndex)) {

                // Conditional line breaks.
                case '\n':
                    lastLineBreakIndex = charIndex;
                    currentLineWidth = 0;
                    lines.push(text.slice(lineStartIndex, charIndex).trim());
                    lineStartIndex = charIndex + 1;
                    currentLineIndex++;
                    break;

                // A space is a possible line break. We check now.
                case ' ':
                    var currentWord = text.slice(lastLineBreakIndex, charIndex),
                        currentWordWidth = Math.ceil(document.widthOfString(currentWord) * 2);

                    if ((currentLineWidth + currentWordWidth) >= pixelWidth) {
                        currentLineWidth = currentWordWidth;
                        currentLineIndex++;
                        lines.push(text.slice(lineStartIndex, lastLineBreakIndex).trim());
                        lineStartIndex = ++lastLineBreakIndex;
                    } else {
                        currentLineWidth += currentWordWidth;
                    }

                    if (currentLineIndex > maxAvailableLines) {
                        splitIndex = lastLineBreakIndex;
                        break;
                    }

                    lastLineBreakIndex = charIndex;
                    break;

                default:
                // Nothing
                }

                // New line is needed, but not enough space.
                if (currentLineIndex > maxAvailableLines) {
                    splitIndex = lastLineBreakIndex;
                    break;
                }
            }

            if (splitIndex === -1) {
                // There is text thats have been not added.
                lines.push(text.slice(lineStartIndex, charIndex).trim());
            } else {
                // Cut required. Cut text and return the rest for a new page.
                result.done = false;
                result.data = text.slice(splitIndex); // Text to display on the next Page
            }

            // Add line per line to the document
            var linePositionY = sectionDimension.top + result.topIndex;
            lxHelpers.forEach(lines, function (text) {
                writeText(document, text, sectionDimension.left, linePositionY, format);
                linePositionY += currentLineHeight;
            });

            // Last Line with Content? ;)
            result.topIndex += (currentLineHeight * currentLineIndex);
        }

        // Show list
        if (typeof text === 'object') {
            document.list(text, sectionDimension.left, sectionDimension.top, format);
        }

        return result;
    }

    /**
     * Draws a table to document
     *
     * @param document
     * @param sectionData
     * @param sectionInfo
     * @param newPageCallback
     * @returns {*}
     */
    function addTableToDocument(document, sectionData, sectionInfo, newPageCallback) {
        var contentFormat = {},
            sectionDimension = {},
            sectionName = 'Unknow';

        if (typeof sectionData === 'string') {
            // Get some informations
            contentFormat = getValue('options.sections.' + sectionData, undefined); // Returns undefined, if section not exits

            if (!contentFormat) {
                return {done: true, error: {message: 'WARNING: Section "' + sectionData + '" not found.'}};
            }

            // If section not defined then exit

            sectionDimension = getSectionDimension(sectionData);
            sectionName = sectionData;
        }

        if (typeof sectionData === 'object') {
            contentFormat = sectionData;
            sectionDimension = {
                left: getValue('format.left', 0, sectionData),
                top: getValue('format.top', 0, sectionData),
                height: getValue('format.height', 0, sectionData),
                width: getValue('format.width', 0, sectionData)
            };
        }

        if (!contentFormat || !sectionDimension) {
            return {done: true, error: {message: 'No content Format/Dimension.'}};
        }

        var tableData = sectionInfo.data || [],
            format = getValue('format', {}, contentFormat),
            font = getFontObject(getValue('font', {}, contentFormat)),
            textmargin = getValue('textmargin', {}, format),
            result = {
                done: true,
                topIndex: sectionInfo.topIndex || 0,
                pageIndex: pageIndex
            };

        // Fill Background color
        if (format.background) {
            document.rect(sectionDimension.left, sectionDimension.top, sectionDimension.width, sectionDimension.height).fill(format.background);
        }

        if (showTextboxes) {
            document.rect(sectionDimension.left, sectionDimension.top, sectionDimension.width, sectionDimension.height).stroke('lightsteelblue');
        }

        // Has text margin?
        sectionDimension = getDeflateRect(sectionDimension, textmargin);

        // If is a single row, then push this line into a array?
        if (tableData.length > 0) {
            if (!lxHelpers.isArray(tableData[0])) {
                tableData = [tableData];
            }
        }

        // Setup Font, Size and Color
        document.font(font.name).fontSize(font.size).fillColor(font.color);

        // Find out, how many columns we are need
        var numColumns = 0,
            maxTableWidth = sectionDimension.width;

        if (sectionInfo.columns) {
            numColumns = sectionInfo.columns.length;
        }

        for (var idxcol1 = 0; idxcol1 < tableData.length; idxcol1++) {
            numColumns = (tableData[idxcol1].length > numColumns) ? tableData[idxcol1].length : numColumns;
        }

        // We required the table width
        var numAutoCalcCells = numColumns,
            tableInfo = new Array(numColumns);

        for (var k = 0; k < numColumns; k++) {
            if (sectionInfo.columns && sectionInfo.columns[k]) {
                tableInfo[k] = sectionInfo.columns[k];
            } else {
                tableInfo[k] = {
                    'align': 'left',
                    'width': 0 // required Autocalculation for Cell Width
                };
            }
        }

        for (var idxrow1 = 0; idxrow1 < tableData.length; idxrow1++) {
            // Check if a width definied
            for (var idxcol2 = 0; idxcol2 < tableData[idxrow1].length; idxcol2++) {
                if (tableData[idxrow1][idxcol2].width && tableData[idxrow1][idxcol2].width > 0) {
                    tableInfo[idxcol2] = Math.max(tableInfo[idxcol2], tableData[idxrow1][idxcol2].width);
                }
            }
        }

        lxHelpers.arrayForEach(tableInfo, function (cell) {
            if (cell.width > 0) {
                maxTableWidth -= cell.width;
                numAutoCalcCells--;
            }
        });

        if (maxTableWidth <= 0) {
            return {done: true, error: {message: 'ERROR: Cellwidths are greater than tablewidth.'}};
        }

        if (tableInfo.length === 0 || tableInfo.length < numColumns) {
            return {done: true, error: {message: 'ERROR: Missing or wrong table description.'}};
        }

        var defaultCellWidth = (numAutoCalcCells > 0) ? maxTableWidth / numAutoCalcCells : 0,
            tableWidth = 0;

        // Required auto calculation for cells?
        for (var j = 0; j < tableInfo.length; j++) {
            if (!tableInfo[j].width || tableInfo[j].width === 0) {
                tableInfo[j].width = defaultCellWidth;
            }

            tableWidth += tableInfo[j].width;
        }

        // Check whether there is enough in width
        if (tableWidth > sectionDimension.width) {
            return {
                done: true,
                error: {message: 'Table width is greater then section. Given "' + tableWidth + '", Width "' + sectionDimension.width + '".'}
            };
        }

        // some variables
        var tableContentData = [], // Holds all data
            tableTotalHeight = 0,
            tableTotalWidth = 0,
            tableHasHeader = false, // If table has header?
            tableCurrentRow = [], // Holds the temporary data for a row
            tableCurrentRowHeight = 0; // The height of one row

        // Build Header Row
        for (var idxTableHdr = 0; idxTableHdr < tableInfo.length; idxTableHdr++) {
            var headerEntry = {
                text: tableInfo[idxTableHdr].text || '',
                format: {
                    width: tableInfo[idxTableHdr].width || 0,
                    align: tableInfo[idxTableHdr].align || 'left'
                },
                font: getFontObject(tableInfo[idxTableHdr].font, font),
                height: 0,
                header: true
            };

            // Has Table header?
            if (headerEntry.text) {
                tableHasHeader = true;
            }

            headerEntry.height = getTextHeight(document, headerEntry.text);
            tableTotalWidth += headerEntry.format.width; // Total width of table
            tableCurrentRowHeight = Math.max(tableCurrentRowHeight, headerEntry.height);
            tableCurrentRow.push(headerEntry);
        }

        // Add Row to Grid, only if header has text
        if (tableHasHeader) {
            tableTotalHeight += tableCurrentRowHeight;
            tableContentData.push(tableCurrentRow);
        }

        // Build Content Row
        for (var idxTableRow = 0; idxTableRow < tableData.length; idxTableRow++) {
            var currentRowData = tableData[idxTableRow],
                colSpanOffset = 0; // Offset for Columns, used for colspan option
            tableCurrentRow = [];
            tableCurrentRowHeight = 0;

            // Sets Data and Information for every Cell
            for (var idxTableCol = 0; idxTableCol < currentRowData.length; idxTableCol++) {
                var rowEntry = {
                    format: {
                        width: tableInfo[idxTableCol + colSpanOffset].width || 0,
                        align: tableInfo[idxTableCol + colSpanOffset].align || 'left'
                    },
                    height: 0,
                    header: false
                };

                // Treat the entry on its format
                if (typeof currentRowData[idxTableCol] === 'string') {
                    // Only text
                    rowEntry.text = currentRowData[idxTableCol];
                    rowEntry.font = font;
                } else if (typeof currentRowData[idxTableCol] === 'object') {
                    // Its an Object an contain more information, style, color ...
                    rowEntry.text = currentRowData[idxTableCol].text || '';
                    rowEntry.font = getFontObject(currentRowData[idxTableCol].font, font);

                    rowEntry.format.align = currentRowData[idxTableCol].align || rowEntry.format.align;
                    rowEntry.border = currentRowData[idxTableCol].border || undefined;
                    rowEntry.colspan = currentRowData[idxTableCol].colspan || 0;
                }

                // Colspan, calculate cells and add dummy cell informations.
                if (rowEntry.colspan && rowEntry.colspan > 1) {
                    var colSpan = 1,
                        idxTableColumn = idxTableCol + colSpanOffset;
                    while (colSpan < rowEntry.colspan && idxTableColumn + colSpan < tableInfo.length) {
                        rowEntry.format.width += tableInfo[idxTableColumn + colSpan].width || 0;
                        tableCurrentRow.push(null); // Add a dummy cell, this will be ignored.
                        colSpan++;
                    }
                    colSpanOffset += (rowEntry.colspan - 1);
                }

                rowEntry.height = getTextHeight(document, rowEntry.text);
                tableCurrentRowHeight = Math.max(tableCurrentRowHeight, rowEntry.height);

                // Push Cell to Row
                tableCurrentRow.push(rowEntry);
            }

            // Add row to table
            tableTotalHeight += tableCurrentRowHeight; // Calc the total table height
            tableContentData.push(tableCurrentRow); // Push Row with Cells to table
        }

        // NOW RENDER THE TABLE
        var topIndex = result.topIndex,
            currentCellPositionLeft = sectionDimension.left,
            currentCellPositionTop = sectionDimension.top + topIndex,
            currentContentHeight = sectionDimension.height - topIndex,
            drawHeader = tableHasHeader;

        for (var idxRow = 0; idxRow < tableContentData.length; idxRow++) {
            var cellHeight = 0;

            // Render each Cell with text
            lxHelpers.forEach(tableContentData[idxRow], function (cellData) {
                // No data, than ignore
                if (!cellData) {
                    return;
                }

                // Set the correct to display the cell
                document.font(cellData.font.name || font.name)
                    .fontSize(cellData.font.size || font.size)
                    .fillColor(cellData.font.color || font.color);

                // For justify
                var x_offset = 0;
                if (cellData.format.align in cellOptions) {
                    x_offset = cellOptions[cellData.format.align].x_offset;
                }

                // Render cell
                var currentCellHeight = (writeText(document, cellData.text, currentCellPositionLeft + x_offset, currentCellPositionTop + 1, cellData.format).y - currentCellPositionTop) + 0.75;
                cellHeight = Math.max(currentCellHeight, cellHeight);
                currentCellPositionLeft += cellData.format.width;
            });


            // Reset to start position for left site, to render border lines.
            currentCellPositionLeft = sectionDimension.left;

            var usePrevBorder = false,
                cfgPrevBorder = {};

            // Render border, after draw the content. We need the finally cell height.
            lxHelpers.forEach(tableContentData[idxRow], function (cellData) {
                // No data, than ignore
                if (!cellData) {
                    return;
                }

                // Render border
                if (cellData.border || (usePrevBorder && cfgPrevBorder)) {
                    usePrevBorder = (cellData.border && cellData.border.linemode) || usePrevBorder;
                    cfgPrevBorder = cellData.border || cfgPrevBorder;

                    var cellSize = {
                        left: currentCellPositionLeft,
                        top: currentCellPositionTop,
                        right: currentCellPositionLeft + cellData.format.width,
                        bottom: currentCellPositionTop + cellHeight
                    };

                    lxHelpers.forEach(cfgPrevBorder.position || [], function (borderposition) {
                        //
                        if (borderRules[borderposition]) {
                            var borderRenderOrder = borderRules[borderposition].order,
                                borderRenderOffsets = borderRules[borderposition].double,
                                borderStyle = cfgPrevBorder.style || 'normal',
                                borderLineWidth = borderRules[borderposition].width[borderStyle] || 1;

                            if (borderStyle === 'normal') {
                                document.moveTo(cellSize[borderRenderOrder[0]], cellSize[borderRenderOrder[1]]).
                                    lineTo(cellSize[borderRenderOrder[2]], cellSize[borderRenderOrder[3]]).
                                    lineWidth(cfgPrevBorder.linewidth || borderLineWidth).
                                    stroke(cfgPrevBorder.color || '#000000');
                            } else if (borderStyle === 'double') {
                                document.moveTo(cellSize[borderRenderOrder[0]] - borderRenderOffsets[0], cellSize[borderRenderOrder[1]] - borderRenderOffsets[1]).
                                    lineTo(cellSize[borderRenderOrder[2]] - borderRenderOffsets[2], cellSize[borderRenderOrder[3]] - borderRenderOffsets[3]).
                                    lineWidth(borderLineWidth).
                                    stroke(cfgPrevBorder.color || '#000000');

                                document.moveTo(cellSize[borderRenderOrder[0]] + borderRenderOffsets[0], cellSize[borderRenderOrder[1]] + borderRenderOffsets[1]).
                                    lineTo(cellSize[borderRenderOrder[2]] + borderRenderOffsets[2], cellSize[borderRenderOrder[3]] + borderRenderOffsets[3]).
                                    lineWidth(borderLineWidth).
                                    stroke(cfgPrevBorder.color || '#000000');
                            }
                        }
                    });
                }

                //
                currentCellPositionLeft += cellData.format.width;
            });


            currentCellPositionLeft = sectionDimension.left;
            currentCellPositionTop += cellHeight;
            currentContentHeight -= cellHeight; // Calculate the rest height
            topIndex += cellHeight;

            // If table contains a Header. Then draw a nice line. Sweet!
            if (drawHeader) {
                document.moveTo(sectionDimension.left, currentCellPositionTop)
                    .lineTo(sectionDimension.left + tableTotalWidth, currentCellPositionTop)
                    .stroke('#000000');

                // Reset flag
                drawHeader = false;
            }

            // Enough Height for next row, or required a new Page?
            if (currentContentHeight < 0.5) {
                topIndex = 0;

                // Call to a new Page, if returns false. A new page cannot be created.
                if (!newPageCallback()) {
                    result = {done: true, error: {message: 'ERROR: Missing or wrong table description.'}};
                    break;
                }

                // Does the new page may be other dimensions?
                if (typeof sectionData === 'string') {
                    sectionDimension = getSectionDimension(sectionName);
                }

                // New Dimension
                if (!sectionDimension) {
                    result = {
                        done: true,
                        error: {message: 'WARNING: Section "' + sectionName + '" not found for Page ' + pageIndex + '.'}
                    };
                    break;
                }

                // Show Debug
                if (showTextboxes) {
                    document.rect(sectionDimension.left, sectionDimension.top, sectionDimension.width, sectionDimension.height).stroke('lightsteelblue');
                }

                // Reset Positions
                currentCellPositionTop = sectionDimension.top;
                currentContentHeight = sectionDimension.height - topIndex;
            }
        }

        result.pageIndex = pageIndex;
        result.topIndex = topIndex;
        return result;
    }

    /**
     * Add Data to Section
     *
     * @param sectionName
     * @param sectionData
     * @returns {boolean}
     */
    function addSectionData(sectionName, sectionData) {
        if (!documentData.hasOwnProperty(sectionName)) {
            documentData[sectionName] = [];
        }

        if (!sectionData) {
            return false;
        }

        // Force a page break
        sectionData.pagebreak = false;

        // Set the document index
        sectionData.documentindex = documentIndex;

        // Add Section Data
        documentData[sectionName].push(sectionData);
        return true;
    }

    /**
     * Renders the Document
     *
     * @params callback
     */
    function renderDocument(callback) {
        pageIndex = 0;
        pageOffset = 0;

        // Get the page setting for page 0 and create the pdf document
        var currentPageSettings = getValue('options.layout', {}),
            currentPDFDocument = new PDFDocument(currentPageSettings),
            errors = [];

        // Error Helper Function
        var addError = function (error) {
            if (error && error.message) {
                console.log(error.message);
                errors.push(error.message);
            }
        };

        for (var currentDocumentIndex = 0; currentDocumentIndex <= documentIndex; currentDocumentIndex++) {
            var pageAdded = false;

            // Fill document with content
            lxHelpers.forEach(documentData, function (sectionName, sectionData) {
                var sectionInfo = {lineIndex: 0, pageIndex: 0};

                lxHelpers.forEach(sectionData, function (entry) {
                    var contentPageIndex = 0;

                    // Content for Document?
                    if (entry.hasOwnProperty('documentindex') && entry.documentindex !== currentDocumentIndex) {
                        return;
                    }

                    // Only create Page if needed (documentindex)
                    if (!pageAdded) {
                        // For a new Document we need a new CLEAR page
                        if (currentDocumentIndex > 0) {
                            pageOffset = currentPDFDocument.pages.length;
                            pageIndex = 0;

                            setPage(currentPDFDocument, 0);
                        }

                        // Set background an other things for page 1
                        setUpPage(currentPDFDocument);
                        pageAdded = true;
                    }

                    // If content for a special Page?
                    if (entry.hasOwnProperty('page')) {
                        contentPageIndex = entry.page;
                    }

                    // Has the current Section already content AND a new page may be created, then use them
                    if (sectionInfo.pageIndex > contentPageIndex) {
                        contentPageIndex = sectionInfo.pageIndex;
                    }

                    // Force a page break?
                    if (entry.hasOwnProperty('pagebreak') && entry.pagebreak === true) {
                        contentPageIndex++;
                    }

                    // New Page. Reset Position.
                    if (contentPageIndex > sectionInfo.pageIndex) {
                        sectionInfo.topIndex = 0;
                    }

                    // First, get the Page for the Content. Is Page not exists, then create the Pages.
                    setPage(currentPDFDocument, contentPageIndex);

                    // Add text or list content
                    if (entry.text) {
                        sectionInfo.data = entry.text;

                        // Add content to page
                        while (true) {
                            sectionInfo = addTextToDocument(currentPDFDocument, sectionName, sectionInfo);

                            // All content a added to document from this section, then break
                            if (sectionInfo.error) {
                                addError(sectionInfo.error);
                            }

                            if (sectionInfo.done === true) {
                                break;
                            }

                            // Create a new Page to add the rest of the content
                            setPage(currentPDFDocument, ++contentPageIndex);
                            sectionInfo.topIndex = 0; // New Page, reset Line
                        }
                    } else if (entry.data) {
                        // Add table content
                        sectionInfo.data = entry.data;
                        sectionInfo.columns = entry.columns;

                        sectionInfo = addTableToDocument(currentPDFDocument, sectionName, sectionInfo, function () {
                            setPage(currentPDFDocument, ++contentPageIndex);
                            return true;
                        });

                        if (sectionInfo.error) {
                            addError(sectionInfo.error);
                        }
                    } else if (entry.image && entry.image.filename) {
                        if (!isSectionExists(sectionName)) {
                            addError({message: 'WARNING: Image could not be added. Section "' + sectionName + '" not found on Page ' + contentPageIndex + '.'});
                            return;
                        }

                        if (!filestream.existsSync(entry.image.filename) || !filestream.statSync(entry.image.filename).isFile()) {
                            addError({message: 'ERROR: Image "' + entry.image.filename + '" not found.'});
                            return;
                        }

                        var sectionDimension = getSectionDimension(sectionName),
                            options = entry.image.options || {};

                        var imgData = PDFImage.open(entry.image.filename),
                            imgHeight = options.height || imgData.height,
                            reqPageBreak = (sectionInfo.topIndex + imgHeight > sectionDimension.height),
                            imageTop = reqPageBreak ? sectionDimension.top || 0 : null;

                        if (!sectionInfo.topIndex && !imageTop) {
                            imageTop = sectionDimension.top;
                        }

                        // New Page if picture to big
                        if (reqPageBreak) {
                            setPage(currentPDFDocument, ++contentPageIndex);
                            sectionInfo.topIndex = 0; // New Page, reset Line
                            sectionInfo.pageIndex++;
                        }

                        currentPDFDocument.image(entry.image.filename, sectionDimension.left || 0, imageTop, {
                            width: options.width,
                            height: options.height
                        });

                        if (imgData) {
                            if (options.width && !options.height) {
                                imgHeight = (options.width / imgData.width) * imgData.height;
                            } else {
                                imgHeight = options.height || imgData.height;
                            }

                            sectionInfo.topIndex += imgHeight;
                        }

                        // Show Debug
                        if (showTextboxes) {
                            currentPDFDocument.rect(sectionDimension.left, sectionDimension.top, sectionDimension.width, sectionDimension.height).stroke('lightsteelblue');
                        }
                    }

                    sectionInfo = {
                        topIndex: sectionInfo.topIndex,
                        pageIndex: sectionInfo.pageIndex
                    };
                });

            });
        }

        if (errors && errors.length !== 0) {
            callback(currentPDFDocument, errors);
        } else {
            callback(currentPDFDocument);
        }
    }

    /**
     * Convert data
     *
     * @param source
     * @returns {*}
     */
    function convertData(source) {

        // Walk array
        if (lxHelpers.isArray(source)) {
            for (var index = 0; index < source.length; index++) {
                source[index] = convertData(source[index]);
            }

            return source;
        }

        if (lxHelpers.isObject(source)) {
            if (source.hasOwnProperty('text')) {
                source.text = convertData(source.text);
            }
        }

        // Convert number to string
        if (typeof source === 'number') {
            return source.toString();
        }

        // Convert null or empty objects to single empty string
        if (!source) {
            return '';
        }

        return source;
    }

    function clearSettings() {
        pageOffset = 0;
        pageIndex = 0;
        documentData = {};
        documentIndex = 0;
        globalPageIndexCounter = 0;
    }

    //
    // public
    //

    /**
     * Loads a JSON Template file from disc or a Object. Returns false if fail
     *
     * @param {String|Object} filenameOrData
     * @return Boolean
     */
    pub.loadTemplate = function (filenameOrData) {
        if (!filenameOrData) {
            return false;
        }

        if (typeof filenameOrData === 'string') {
            try {
                var data = filestream.readFileSync(filenameOrData, 'utf8').toString();
                documentTemplateData = JSON.parse(data.trim());
                clearSettings();
            } catch (error) {
                console.log(error);
                return false;
            }
        } else if (typeof filenameOrData === 'object') {
            documentTemplateData = filenameOrData;
            clearSettings();
        }

        showTextboxes = getValue('debug', false);
        return true;
    };

    /**
     * Add content to the current page
     *
     * @param {String} name
     * @param {String|Array} data
     * @param {int} [pageindex]
     * @return Boolean|String|Array
     */
    pub.addContent = function (name, data, pageindex) {
        var sectionData = {
            text: convertData(data),
            page: pageindex || globalPageIndexCounter
        };

        return addSectionData(name, sectionData);
    };

    /**
     * Add table to the current page
     *
     * @param {String} name
     * @param {Array} data
     * @param {Array} [columns]
     * @param {int} [pageindex]
     * @returns {boolean}
     */
    pub.addTable = function (name, data, columns, pageindex) {
        var sectionData = {
            data: convertData(data),
            columns: columns || [],
            page: pageindex || globalPageIndexCounter
        };

        return addSectionData(name, sectionData);
    };

    /**
     * Force a page break
     *
     */
    pub.addPageBreak = function () {
        globalPageIndexCounter++;
    };

    /**
     * Reset all Indices
     */
    pub.resetDocumentIndices = function () {
        documentIndex++;
        globalPageIndexCounter = 0;
    };

    /**
     * Add a Image
     *
     * @param name
     * @param fileName
     * @param options
     * @param [pageindex]
     * @returns {boolean}
     */
    pub.addImage = function (name, fileName, options, pageindex) {
        var sectionData = {
            image: {
                filename: fileName,
                options: options
            },
            page: pageindex || globalPageIndexCounter
        };

        return addSectionData(name, sectionData);
    };

    /**
     * Clears a document
     *
     */
    pub.clear = function () {
        clearSettings();
    };

    /**
     * Save PDF Document to file
     *
     * @param {String} filename
     * @param {Function} next
     */
    pub.save = function (filename, next) {
        renderDocument(function (myPDFDocument, errors) {
            if (errors) {
                return next(errors);
            }

            myPDFDocument.write(filename, next);
        });
    };

    /**
     * Returns RAW PDF Document
     *
     * @param {Function} next
     */
    pub.print = function (next) {
        renderDocument(function (myPDFDocument, errors) {
            if (errors) {
                return next(null, errors);
            }

            myPDFDocument.output(next);
        });
    };

    /**
     * Enable/Disable the Textboxframe (for Debugging)
     *
     * @param {Boolean} value
     */
    pub.showTextboxframe = function (value) {
        showTextboxes = value;
    };

    pub.loadTemplate(template);
    return pub;
};