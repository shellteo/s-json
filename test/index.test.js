'use strict';

require('should');
const fs = require('fs');
const Json = require('../lib/index').default;

const arrayData = fs.readFileSync(__dirname + '/data/array.txt', 'utf-8');
const objectData = fs.readFileSync(__dirname + '/data/object.txt', 'utf-8');
const escapeData = `{\r\n  \"_id\": \"\u8D22\u5927101nb\",\r\n  \"index\": 0\r\n}`;

describe('JSON', function() {
  it('parse object', function() {
    let parseData = Json.Parse(objectData);
    parseData._id.should.eql('5e205303aaaddc66d08653c4')
  });
  it('parse array', function() {
    let parseData = Json.Parse(arrayData);
    parseData[0]._id.should.eql('5e205356f7637b61100c3aed')
  });
  it('parse escape Data', function() {
    Json.SetEscapeString(true);
    let parseData = Json.Parse(escapeData);
    parseData._id.should.eql('财大101nb')
  });
})