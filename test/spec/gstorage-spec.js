/*global define:true, describe:true , it:true , expect:true, 
beforeEach:true, sinon:true, spyOn:true , expect:true */
/* jshint strict: false */
define(['gstorage', 'jquery'], function(GStorage, $) {

    describe('just checking', function() {

        it('GStorage should be loaded', function() {
            expect(GStorage).toBeTruthy();
            var gstorage = new GStorage();
            expect(gstorage).toBeTruthy();
            // throw new Error('fuck');
        });

        it('GStorage should initialize', function() {
            var gstorage = new GStorage();
            var output   = gstorage.init();
            var expected = 'This is just a stub!';
            expect(output).toEqual(expected);
        });
        
    });
});