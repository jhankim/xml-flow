/*global describe, it */

var flow = require('../lib/xml-flow')
  , fs = require('fs')
  , should = require('chai').should()
;

function getFlow(fileName, options) {
    return flow(fs.createReadStream(fileName), options);
}

describe('xml-flow', function(){
    describe('invoke', function(){
        it('should create an emitter when invoked with a stream and options', function(){
            var inStream = fs.createReadStream('./test/simple.xml'), simpleStream;
            inStream.pause();
            simpleStream = flow(inStream);

            simpleStream.on.should.be.a('function');
            simpleStream.pause();
            simpleStream.resume();
        });
    });

    describe(".on('end')", function(){
        it('should emit after the file has been read', function(done){
            var simpleStream = getFlow('./test/simple.xml');
            simpleStream.on('end', function(){
                done();
            });
        });
    });

    describe(".on('tag:...')", function(){
        it('should emit the right number of nodes', function(done){
            var simpleStream = getFlow('./test/simple.xml')
              , count = 0
            ;

            simpleStream.on('tag:item', function(){
                count++;
            });

            simpleStream.on('end', function(){
                count.should.equal(3);
                done();
            });
        });

        it('should make non-attributed data look really simple', function(done){
            var simpleStream = getFlow('./test/test.xml')
              , output = {
                    $name: 'no-attrs',
                    person: [
                        {name: 'Bill', id: '1', age:'27'},
                        {name: 'Joe', id: '2', age:'29'},
                        {name: 'Smitty', id: '3', age:'37'}
                    ]
              }
            ;

            simpleStream.on('tag:no-attrs', function(node){
                node.should.deep.equal(output);
                done();
            });
        });

        it('should make all-attributed data look really simple', function(done){
            var simpleStream = getFlow('./test/test.xml')
              , output = {
                    $name: 'all-attrs',
                    person: [
                        {name: 'Bill', id: '1', age:'27'},
                        {name: 'Joe', id: '2', age:'29'},
                        {name: 'Smitty', id: '3', age:'37'}
                    ]
              }
            ;

            simpleStream.on('tag:all-attrs', function(node){
                node.should.deep.equal(output);
                done();
            });
        });

        it('should handle tags with both attributes and other stuff', function(done){
            var simpleStream = getFlow('./test/test.xml')
              , output = {
                    $name: 'mixed',
                    person: [
                        {$attrs:{name: 'Bill', id: '1', age:'27'}, $text: 'some text'},
                        {$attrs: {name: 'Joe', id: '2', age:'29'}, p: 'some paragraph'},
                        {$attrs: {name: 'Smitty', id: '3', age:'37'}, thing: {id:'999', ref:'blah'}}
                    ]
              }
            ;

            simpleStream.on('tag:mixed', function(node){
                node.should.deep.equal(output);
                done();
            });
        });

        it('should preserve markup when things get more complex', function(done) {
            var simpleStream = getFlow('./test/test.xml')
              , output = {
                    $name: 'markup',
                    $markup: [
                        'Some unwrapped text',
                        {$name: 'person', $attrs:{name: 'Bill', id: '1', age:'27'}, $text: 'some text'},
                        'Some more unwrapped text',
                        {$name: 'person', $attrs: {name: 'Joe', id: '2', age:'29'}, p: 'some paragraph'},
                        {$name: 'person', $attrs: {name: 'Smitty', id: '3', age:'37'}, thing: {id:'999', ref:'blah'}}
                    ]
                }
            ;

            simpleStream.on('tag:markup', function(node){
                node.should.deep.equal(output);
                done();
            });
        });

        it('should handle scripts', function(done){
            var simpleStream = getFlow('./test/test.xml')
              , output = {
                    $name: 'has-scripts',
                    script: [
                        'var x = 3;',
                        {$attrs: {type: 'text/javascript'}, $script: '//this is a comment'}
                    ]
              }
            ;

            simpleStream.on('tag:has-scripts', function(node){
                node.should.deep.equal(output);
                done();
            });
        });
    });

    describe('options', function(){
        it('should normalize whitespace by default', function(done) {
            var simpleStream = getFlow('./test/test.xml')
              , output = 'This is some text with extra whitespace.'
            ;

            simpleStream.on('tag:extra-whitespace', function(node){
                node.$text.should.equal(output);
                done();
            });
        });

        it('should not normalize whitespace when asked not to', function(done) {
            var simpleStream = getFlow('./test/test.xml', {normalize: false})
              , output = 'This is some text with extra    whitespace.'
            ;

            simpleStream.on('tag:extra-whitespace', function(node){
                node.$text.should.equal(output);
                done();
            });
        });

        it('should trim by default', function(done) {
            var simpleStream = getFlow('./test/test.xml')
              , output = 'This is some text with extra whitespace.'
            ;

            simpleStream.on('tag:extra-whitespace', function(node){
                node.$text.should.equal(output);
                done();
            });
        });

        it('should not trim when asked not to', function(done) {
            var simpleStream = getFlow('./test/test.xml', {trim: false})
              , output = 'This is some text with extra whitespace. '
            ;

            simpleStream.on('tag:extra-whitespace', function(node){
                node.$text.should.equal(output);
                done();
            });
        });

        it('should not preserve markup when told to never do so', function(done) {
            var simpleStream = getFlow('./test/test.xml', {preserveMarkup: flow.NEVER})
              , output = {
                    $name: 'markup',
                    $text: [
                        'Some unwrapped text',
                        'Some more unwrapped text'
                    ],
                    person: [
                        {$attrs:{name: 'Bill', id: '1', age:'27'}, $text: 'some text'},
                        {$attrs: {name: 'Joe', id: '2', age:'29'}, p: 'some paragraph'},
                        {$attrs: {name: 'Smitty', id: '3', age:'37'}, thing: {id:'999', ref:'blah'}}
                    ]
              }
            ;

            simpleStream.on('tag:markup', function(node){
                node.should.deep.equal(output);
                done();
            });
        });

        it('should always preserve markup when told to do so', function(done) {
            var simpleStream = getFlow('./test/test.xml', {preserveMarkup: flow.ALWAYS})
              , output = {
                    $name: 'mixed',
                    $markup: [
                        {
                            $name: 'person',
                            $attrs:{name: 'Bill', id: '1', age:'27'},
                            $markup: ['some text']
                        },
                        {
                            $name: 'person',
                            $attrs: {name: 'Joe', id: '2', age:'29'},
                            $markup: [{$name:'p', $markup: ['some paragraph']}]
                        },
                        {
                            $name: 'person',
                            $attrs: {name: 'Smitty', id: '3', age:'37'},
                            $markup: [{$name: 'thing', id:'999', ref:'blah'}]
                        }
                    ]
                }
            ;

            simpleStream.on('tag:mixed', function(node){
                node.should.deep.equal(output);
                done();
            });
        });
    });

    describe("toXml()", function(){
        it('should convert $attrs as expected', function(){
            var input = {$name: 'tag', $attrs:{id: 3}}
              , output = '<tag id="3"></tag>';

            flow.toXml(input).should.equal(output);
        });

        it('should convert $text as expected', function(){
            var input = {$name: 'tag', $attrs:{id: 3}, $text:'some text'}
              , output = '<tag id="3">some text</tag>';

            flow.toXml(input).should.equal(output);
        });

        it('should convert random fields as expected', function(){
            var input = {$name: 'tag', $attrs:{id: 3}, $text:'some text', p:'other text', j:['text1', 'text2']}
              , output = '<tag id="3">some text<p>other text</p><j>text1</j><j>text2</j></tag>';

            flow.toXml(input).should.equal(output);
        });

        it('should convert $markup', function(){
            var input = {$name: 'tag', $markup: ['text', {$name: 'j', $text: 'stuff'}]}
              , output = '<tag>text<j>stuff</j></tag>';

            flow.toXml(input).should.equal(output);
        });

        it('should convert $script', function(){
            var input = {$name: 'tag', $script:'console.log("stuff");'}
              , output = '<tag><script>console.log("stuff");</script></tag>';

            flow.toXml(input).should.equal(output);
        });
    });
});
