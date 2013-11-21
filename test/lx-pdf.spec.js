/*global describe, it, expect, waits*/
'use strict';

var sut = require('../lib/lx-pdf.js')('test/templates/template.json');

var bigTextNumberOne = 'Gerald Geisler wurde in eine im österreichischen Galopprennsport involvierte Familie geboren und kam dadurch schon früh in Kontakt mit Pferden. Seine erste Morgenarbeit ritt er fünfzehnjährig auf den Pferden des familieneigenen Rennstalles Hernstein an der Galopprennbahn Freudenau in Wien. Seine Karriere als Amateurrennreiter begann er im Alter von 17 Jahren siegreich auf Pink Floyd. Im Laufe der Zeit kamen Siege in Italien, Slowakei und der Schweiz hinzu. Den Höhepunkt seiner Amateurrennreiterkarriere bildet sicherlich sein Antreten für Österreich im Fegentri. Seine schulische Laufbahn beinhaltet die Matura am Wiedner Gymnasium, einige Semester Jus sowie den Abschluss eines kaufmännischen Kollegs.\n\nNach Ableisten seines Präsenzdienstes legte Gerald Geisler 2001 erfolgreich die Prüfung zum Erwerb einer Lizenz als Trainer für Galopprennpferde ab und nahm seine Tätigkeit als Trainer in der Wiener Freudenau auf. Einer zwischenzeitlichen Standortverlegung in die 2004 neu errichtete Anlage in Ebreichsdorf (Magna Racino) folgte mit Beginn der Saison 2005 der Wechsel an die Galopprennbahn Riem in München. Seit Februar 2010 hat er sein Trainingsquartier in Iffezheim. Von 2005 bis 2006 war er für den Fernsehsender Premiere Win, 2009 für Equi8 als Kommentator für nationale und internationale Pferderennen tätig.';
var bigTextNumberTwo = '\n1956 wechselte Gorton zum Fernsehen und entwarf für das Programm ABC Weekend Television die Szenenbilder zu der Reihe Armchair Theatre. Seit Mitte der 1960er Jahre designte Assheton Gorton primär für den Kinofilm. Seit er von Richard Lester für das moderne Zeitbild Der gewisse Kniff die architektonische Gestaltung vornahm, hat Gorton ein quantitativ schmales Œuvre vorgelegt, das jedoch nahezu durchgehend ambitioniert und hochklassig ist. Seine frühen Arbeiten wie der Fotografen-Krimi Blow Up oder die Popkultur-Spielerei Magic Christian machten ihn zu einem wichtigen Vertreter des Swinging Sixties-Kinos seines Landes. In späteren Jahren konzentrierte sich Assheton Gorton mehr und mehr auf die Ausstattung prunkvoller Bilderbögen und Ausstattungsepen wie das Historiendrama Revolution mit Al Pacino und der Fantasyfilm Legend mit dem jungen Tom Cruise.';
var bigTextNumberThree = '\n\nLorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet.\n';
var bigTextNumberFour = '\n\nThis section demonstrates how to sign code by creating digital signatures and associating them with files using Microsoft Authenticode technology. Creating a fully verifiable certificate might assume the existence of a complex hierarchy of certification authorities. A root certificate and a root private key are provided for testing purposes only. Independent software vendors (ISVs) must obtain a certificate from a certification authority that is trusted by default in Windows. (For a list of trusted certification authority (CA) see Microsoft Root Certificate Program Members.)';

describe('lx-pdf', function () {
    it('should be initialized correctly', function () {
        expect(sut).toBeDefined();
        expect(typeof sut.loadTemplate).toBe('function');
        expect(typeof sut.addContent).toBe('function');
        expect(typeof sut.addTable).toBe('function');
        expect(typeof sut.addImage).toBe('function');
        expect(typeof sut.addPageBreak).toBe('function');
        expect(typeof sut.save).toBe('function');
        expect(typeof sut.print).toBe('function');
        expect(typeof sut.clear).toBe('function');
        expect(typeof sut.resetDocumentIndices).toBe('function');
        expect(typeof sut.showTextboxframe).toBe('function');
    });

    it('should be loads a wrong template', function() {
        expect(sut.loadTemplate('nonexistfile.json')).toBeFalsy();
        expect(sut.loadTemplate('')).toBeFalsy();
    });

    it('add some content and save to file', function() {
        expect(sut.addContent('list', ['Entry A', 'Entry B', '', 'Entry D'])).toBeTruthy();
        expect(sut.addContent('linebreak', 'This text is too width. And should be automatic break.')).toBeTruthy();
        expect(sut.addContent('noneexits', 'This text will never display.')).toBeTruthy();

        expect(sut.addContent('date', '31.12.2013')).toBeTruthy();
        expect(sut.addContent('subject', 'Small Test')).toBeTruthy();
        expect(sut.addContent('content', 'Content for Page')).toBeTruthy();

        expect(sut.addContent('area51', bigTextNumberOne)).toBeTruthy();
        expect(sut.addContent('area51', bigTextNumberTwo)).toBeTruthy();
        expect(sut.addContent('area51', bigTextNumberThree)).toBeTruthy();

        // Table
        var tableHeader = [
            {text: 'Column 1', width: 120, align: 'left', font: {name : './test/fonts/arialbd.ttf', size : 12, color: '#000000'}},
            {text: 'Column 2', width: 180, align: 'left', font: {name : './test/fonts/arialbd.ttf', size : 12, color: '#000000'}},
            {text: 'Column 3', width: 100, align: 'center', font: {name : './test/fonts/arialbd.ttf', size : 12, color: '#000000'}},
            {text: 'Column 4', width:  80, align: 'right', font: {name : './test/fonts/arialbd.ttf', size : 12, color: '#000000'}}
        ];

        var tableData = [
            // Simple Row
            ['Cell A1', 'Cell B1', 'Cell C1', 'Cell D1'],
            // Simple Row with empty text
            ['Cell A2', '', '', 'Cell D2'],
            ['Cell A3', 'Cell B3', 'Cell C3', 'Cell D3'],
            ['Cell A4', 'Cell B4', 'Cell C4', 'Cell D3'],
            ['Cell A5', 'Cell B5', 'Cell C5', 'Cell D3'],
            // A Row with Styling in CELL B6
            ['Cell A6', {text: 'Cell B6', align: 'right', font: {color: '#FF00FF'}}, 'Cell C6', 'Cell D6'],
            ['Cell A7', 'Cell B7', 'Cell C7', 'Cell D7'],
            // Draw a row with cell lines. Option "linemode" says, use border for every next cell in this line
            [{text: 'Cell A8', border: {color: '#000000', style: 'normal', position: ['bottom', 'top'], linemode: true, linewidth: 2}}, 'Cell B8', 'Cell C8'],
            // A Cell with different font, the € Symbol is ignored by PDF Kit for text width calculation.
            [{text: 'Colspan over "2" Cells, thats cool', colspan: 2, align: 'center', font: {name : './test/fonts/arialbd.ttf'}, border: {color: '#000000', position: ['top', 'bottom', 'left', 'right']}}, '', {text: 'One Cell', align: 'right'}],
            ['', {text: 'Colspan over "3" Cells, thats cool', colspan: 3, align: 'center', font: {name : './test/fonts/arialbd.ttf'}, border: {color: '#000000', position: ['top', 'bottom', 'left', 'right']}}],
            [{text: 'Colspan over "4" Cells, thats cool', colspan: 4, align: 'center', font: {name : './test/fonts/arialbd.ttf'}, border: {color: '#000000', style: 'double', position: ['bottom']}}]
        ];

        // Enable Textboxes
        sut.showTextboxframe(true);

        sut.addTable('area51', tableData, tableHeader);
        sut.addContent('area51', bigTextNumberFour);

        // Add Table without Header
        sut.addTable('area51', ['Col A', 'Col B', 'Col C', 'Col D']);

        sut.addImage('area51', './test/images/litixlogo.png', {});

        sut.addContent('area51', 'A Image above');

        sut.save('Dummy.pdf', function(result) {
            expect(result).toBeNull();
        });

        waits(1000);
    });

    it('simple pdf', function() {
        var simpleTemplate = {
            name   : 'Dummy Template for Test',
            options: {
                pages: [
                    {
                        layout    : {
                            size   : 'A4',
                            layout : 'portrait',
                            margins: {
                                top   : 0,
                                left  : 0,
                                bottom: 0,
                                right : 0
                            }
                        },
                        sections: {
                            header: {
                                font  : {
                                    name : './test/fonts/arial.ttf',
                                    size : 12,
                                    color: '#000000'
                                },
                                format: {
                                    align : 'left',
                                    left  : 70,
                                    top   : 50,
                                    width : 481,
                                    height: 300
                                }
                            },
                            content: {
                                font  : {
                                    name : './test/fonts/arial.ttf',
                                    size : 12,
                                    color: '#000000'
                                },
                                format: {
                                    align : 'left',
                                    left  : 70,
                                    top   : 350,
                                    width : 481,
                                    height: 320
                                }
                            }
                        }
                    },
                    {
                        layout    : {
                            size   : 'A4',
                            layout : 'portrait',
                            margins: {
                                top   : 0,
                                left  : 0,
                                bottom: 0,
                                right : 0
                            }
                        },
                        sections: {
                            content: {
                                font  : {
                                    name : './test/fonts/arial.ttf',
                                    size : 12,
                                    color: '#000000'
                                },
                                format: {
                                    align : 'left',
                                    left  : 70,
                                    top   : 50,
                                    width : 481,
                                    height: 620
                                }
                            }
                        }
                    }
                ]
            }
        };

        sut.loadTemplate(simpleTemplate);

        sut.clear();

        expect(sut.addContent('header', 'Hello World!')).toBeTruthy();
        expect(sut.addContent('content', 'Hello World!')).toBeTruthy();

        sut.addPageBreak();

        expect(sut.addContent('header', 'Hello World!')).toBeTruthy();
        expect(sut.addContent('content', 'Hello World!')).toBeTruthy();

        sut.resetDocumentIndices();

        expect(sut.addContent('header', 'Hello World!')).toBeTruthy();
        expect(sut.addContent('content', 'Hello World!')).toBeTruthy();

        sut.print(function(result) {
            expect(result).toBeDefined();
        });
    });

});