/*global describe, it, expect*/
'use strict';

var sut = require('../lib/lx-pdf.js');

describe('lx-pdf', function () {
    it('should be initialized correctly', function () {
        expect(sut).toBeDefined();
    });
});