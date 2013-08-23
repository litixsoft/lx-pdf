/*global describe, it, expect, waits*/
'use strict';

var sut = require('../lib/lx-pdf.js')('');

var bigTextNumberOne = 'Gerald Geisler wurde in eine im österreichischen Galopprennsport involvierte Familie geboren und kam dadurch schon früh in Kontakt mit Pferden. Seine erste Morgenarbeit ritt er fünfzehnjährig auf den Pferden des familieneigenen Rennstalles Hernstein an der Galopprennbahn Freudenau in Wien. Seine Karriere als Amateurrennreiter begann er im Alter von 17 Jahren siegreich auf Pink Floyd. Im Laufe der Zeit kamen Siege in Italien, Slowakei und der Schweiz hinzu. Den Höhepunkt seiner Amateurrennreiterkarriere bildet sicherlich sein Antreten für Österreich im Fegentri. Seine schulische Laufbahn beinhaltet die Matura am Wiedner Gymnasium, einige Semester Jus sowie den Abschluss eines kaufmännischen Kollegs.\n\nNach Ableisten seines Präsenzdienstes legte Gerald Geisler 2001 erfolgreich die Prüfung zum Erwerb einer Lizenz als Trainer für Galopprennpferde ab und nahm seine Tätigkeit als Trainer in der Wiener Freudenau auf. Einer zwischenzeitlichen Standortverlegung in die 2004 neu errichtete Anlage in Ebreichsdorf (Magna Racino) folgte mit Beginn der Saison 2005 der Wechsel an die Galopprennbahn Riem in München. Seit Februar 2010 hat er sein Trainingsquartier in Iffezheim. Von 2005 bis 2006 war er für den Fernsehsender Premiere Win, 2009 für Equi8 als Kommentator für nationale und internationale Pferderennen tätig.';
var bigTextNumberTwo = '\n1956 wechselte Gorton zum Fernsehen und entwarf für das Programm ABC Weekend Television die Szenenbilder zu der Reihe Armchair Theatre. Seit Mitte der 1960er Jahre designte Assheton Gorton primär für den Kinofilm. Seit er von Richard Lester für das moderne Zeitbild Der gewisse Kniff die architektonische Gestaltung vornahm, hat Gorton ein quantitativ schmales Œuvre vorgelegt, das jedoch nahezu durchgehend ambitioniert und hochklassig ist. Seine frühen Arbeiten wie der Fotografen-Krimi Blow Up oder die Popkultur-Spielerei Magic Christian machten ihn zu einem wichtigen Vertreter des Swinging Sixties-Kinos seines Landes. In späteren Jahren konzentrierte sich Assheton Gorton mehr und mehr auf die Ausstattung prunkvoller Bilderbögen und Ausstattungsepen wie das Historiendrama Revolution mit Al Pacino und der Fantasyfilm Legend mit dem jungen Tom Cruise.';
var bigTextNumberThree = '\n\nLorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet.';

describe('lx-pdf', function () {
    it('should be initialized correctly', function () {
        expect(sut).toBeDefined();
        expect(typeof sut.loadTemplate).toBe('function');
        expect(typeof sut.addContent).toBe('function');
//        expect(typeof sut.addTable).toBe('function');
//        expect(typeof sut.addPage).toBe('function');
//        expect(typeof sut.getPageIndex).toBe('function');
//        expect(typeof sut.save).toBe('function');
//        expect(typeof sut.print).toBe('function');
        expect(typeof sut.addImage).toBe('function');
    });

    it('should be loads a template', function() {
        expect(sut.loadTemplate('nonexistfile.json')).toBeFalsy();
        expect(sut.loadTemplate('test/templates/template.json')).toBeTruthy();
    });

    it('add some content', function() {
        expect(sut.addContent('list', ['Entry A', 'Entry B', '', 'Entry D'])).toBeTruthy();
        expect(sut.addContent('linebreak', 'This text is too width. And should be automatic break.')).toBeTruthy();

        expect(sut.addContent('date', '31.12.1234')).toBeTruthy();
        expect(sut.addContent('subject', 'Small Test')).toBeTruthy();
        expect(sut.addContent('content', 'Content for Page')).toBeTruthy();

        expect(sut.addContent('area51', bigTextNumberOne)).toBeTruthy();
        expect(sut.addContent('area51', bigTextNumberTwo)).toBeTruthy();
        expect(sut.addContent('area51', bigTextNumberThree)).toBeTruthy();

        sut.render('Dummy.pdf', function(result) {
            console.log('New Result is ' + (result === null) );
            expect(result).toBeNull();
        });

        waits(1000);
    });

//    it('add some content', function() {
//        expect(sut.getPageIndex()).toBe(1);
//        expect(sut.addContent('list', ['Entry A', 'Entry B', '', 'Entry D'])).toBeTruthy();
//        expect(sut.addContent('linebreak', 'This text is too width. And should be automatic break.')).toBeTruthy();
//
////        expect(function() {
////            sut.addContent('toosmall', 'Height is too small!');
////        }).toThrow();
//
//        expect(sut.addContent('date', '31.12.1234')).toBeTruthy();
//        expect(sut.addContent('subject', 'Small Test')).toBeTruthy();
//
//
//        // add Table Data
//        expect(sut.addTable('tablecontent', [0, 1, 2, 3])).toBeFalsy();
//        expect(function() {
//            sut.addTable('content', [0, 1, 2, 3]);
//        }).toThrow();
//        expect(sut.addTable('table', [0, 1, 2, 3])).toBeTruthy();
//
//        sut.addPage();
//        expect(sut.getPageIndex()).toBe(2);
//        expect(sut.addContent('address', 'There is no Address Section for Page 2')).toBeFalsy();
//        expect(sut.addContent('content', 'Content for Page 2')).toBeTruthy();
//
//        // Add Image
//        expect(function() {
//            sut.addImage('./test/images/litixlogo.png', 70, 120, 'Litixsoft Logo', {});
//        }).not.toThrow();
//
//
//        expect(sut.addContent('area51', bigText, true)).toBeTruthy();
//
//        sut.save('Dummy.pdf', function(result) {
//            expect(result).toBeNull();
//        });
//
//        sut.render('DummyNEW.pdf', function(result) {
//            console.log('New Result is ' + (result === null) );
//        });
//
//        waits(1000);
//    });
});