/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': '../jquery/jquery',
        'gstorage': '../gstorage'
    }
});

define(['gstorage', 'jquery'], function (GStorage, $) {
    console.log('Loading');
	var gs = new GStorage();
	// console.log(gs.has('test2'));
	
	gs.set('test2', 'something');
	// console.log(gs.has('test2'));
	// if(gs.has('test')) gs.get('test');
	gs.get('test2');
	window.gs = gs;
});