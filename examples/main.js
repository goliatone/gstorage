/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': '../lib/jquery/jquery',
        'gstorage': '../src/gstorage'
    }
});

define(['gstorage', 'jquery'], function (GStorage, $) {
    console.log('Loading');
	var gs = new GStorage();
	gs.init();
	console.log(gs.has('test'));
	gs.set('test', 'something');
	console.log(gs.has('test'));
	window.gs = gs;
});